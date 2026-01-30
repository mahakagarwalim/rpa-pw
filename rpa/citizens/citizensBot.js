import { chromium } from 'playwright';
import config from './demoConfig.js';
import { getLatestCitizensCode } from './gmailHelper.js';
import fs from 'fs/promises';
import path from 'path';
import { sendEmailReport } from './emailHelper.js';
import { generateEmailHTML, generateErrorHTML } from './emailTemplate.js';

/**
 * Main Entry Point for API Trigger
 * @param {Array<string>} policiesToAudit - List of policy numbers from the request
 * @returns {Promise<Array>} - The audit report
 */
export async function runCitizensAudit(policiesToAudit) {
    console.log(`[Bot] Starting Audit for ${policiesToAudit.length} policies...`);
    const startTime = Date.now();

    // 1. LAUNCH BROWSER
    const browser = await chromium.launch({
        headless: config.HEADLESS,
        slowMo: 100,
        args: ['--disable-blink-features=AutomationControlled', '--start-maximized']
    });

    const context = await browser.newContext();
    // This page is for the Initial Portal Login
    let portalPage = await context.newPage();

    // This variable will hold the PolicyCenter popup once opened
    let policyPage = null;

    const report = [];

    try {
        // --- 1. LOGIN TO PORTAL ---
        console.log(`[Bot] Navigating to Portal: ${config.LOGIN_URL}...`);
        await portalPage.goto(config.LOGIN_URL);

        // Click "Login" if on the landing page
        try {
            const loginBtn = portalPage.getByRole('button', { name: 'Login' });
            if (await loginBtn.isVisible({ timeout: 5000 })) {
                await loginBtn.click();
            }
        } catch (e) { }

        // Handle Credentials - Wait for either login form to appear
        console.log("   - Waiting for Login Form...");
        try {
            await Promise.race([
                portalPage.waitForSelector('input[name="Email Address"]', { state: 'visible', timeout: 20000 }),
                portalPage.waitForSelector('#j_username', { state: 'visible', timeout: 20000 })
            ]);
        } catch (e) {
            console.log("   - Login form wait timed out, checking if already logged in...");
        }

        // The new flow uses "Email Address" label usually
        if (await portalPage.isVisible('input[name="Email Address"]')) {
            console.log("   - Entering Credentials (New Flow)...");
            await portalPage.getByRole('textbox', { name: 'Email Address' }).click(); // Focus
            await portalPage.getByRole('textbox', { name: 'Email Address' }).fill(config.USERNAME2);
            await portalPage.getByRole('textbox', { name: 'Password' }).click();
            await portalPage.getByRole('textbox', { name: 'Password' }).fill(config.PASSWORD);
            await portalPage.getByRole('button', { name: 'Sign in' }).click();
        } else if (await portalPage.isVisible('#j_username')) {
            // Fallback for old portal just in case
            console.log("   - Entering Credentials (Old Flow)...");
            await portalPage.locator('#j_username').fill(config.USERNAME);
            await portalPage.locator('#j_password').fill(config.PASSWORD);
            await portalPage.getByRole('button', { name: 'Submit' }).click();
        }

        // --- 2. MFA HANDLING ---
        console.log("   - Checking for MFA...");
        const sendBtn = portalPage.getByRole('button', { name: 'Send verification code' });
        const verifyInput = portalPage.getByRole('textbox', { name: 'Verification code' });

        try {
            await Promise.race([
                sendBtn.waitFor({ state: 'visible', timeout: 10000 }),
                verifyInput.waitFor({ state: 'visible', timeout: 10000 })
            ]);
        } catch (e) { }

        if (await sendBtn.isVisible()) {
            console.log("   - Clicking Send Code...");
            await sendBtn.click();
            await verifyInput.waitFor({ state: 'visible', timeout: 10000 });
        }

        if (await verifyInput.isVisible()) {
            console.log("   - MFA Required. Fetching code...");
            let mfaSuccess = false;
            let retries = 0;

            while (!mfaSuccess && retries < 3) {
                let code = await getLatestCitizensCode();
                if (!code) { retries++; continue; }

                await verifyInput.fill(code);
                await portalPage.getByRole('button', { name: 'Verify code' }).click();

                // Check if verification worked or failed
                try {
                    // Success usually leads to "Continue" button or dashboard
                    await Promise.race([
                        portalPage.getByRole('button', { name: 'Continue' }).waitFor({ state: 'visible', timeout: 5000 }),
                        portalPage.getByRole('button', { name: config.AGENT_BUTTON_NAME }).waitFor({ state: 'visible', timeout: 5000 })
                    ]);
                    mfaSuccess = true;
                } catch (e) {
                    // Check for error
                    if (await portalPage.getByText('That code is incorrect').isVisible()) {
                        console.log("   - Incorrect code. Retrying...");
                        retries++;
                    } else {
                        // Assuming success if error didn't appear and we didn't timeout hard
                        mfaSuccess = true;
                    }
                }
            }

            if (!mfaSuccess) throw new Error("MFA Failed.");
        }

        // Click "Continue" if it exists
        try {
            const continueBtn = portalPage.getByRole('button', { name: 'Continue' });
            if (await continueBtn.isVisible({ timeout: 5000 })) {
                await continueBtn.click();
                // Wait for navigation after clicking Continue
                await portalPage.waitForLoadState('networkidle');
            }
        } catch (e) { }


        // --- 3. NAVIGATE TO POLICY CENTER (POPUP) ---
        console.log(`   - Looking for Agent Button: '${config.AGENT_BUTTON_NAME}'...`);

        // Handle Modal (.cpic-modal-close) if it appears before/after interactions
        const closeModal = async () => {
            try {
                const closeBtn = portalPage.locator('.cpic-modal-close.ml-3 > .fas');
                if (await closeBtn.isVisible({ timeout: 3000 })) {
                    await closeBtn.click();
                    console.log("   - Closed Popup Modal.");
                }
            } catch (e) { }
        };
        await closeModal();

        // 1. Click Agent Initials Button to open menu
        const agentBtn = portalPage.getByRole('button', { name: 'AR' });
        await agentBtn.waitFor({ state: 'visible', timeout: 30000 });
        await agentBtn.click();

        // 2. Wait for popup event BEFORE clicking link
        const popupPromise = context.waitForEvent('page'); // Changed to context.waitForEvent('page')

        // 3. Click "PolicyCenter" link
        console.log("   - Clicking PolicyCenter...");
        await portalPage.getByRole('link', { name: 'PolicyCenter' }).click();

        // 4. Assign the new page
        policyPage = await popupPromise;
        await policyPage.waitForLoadState('domcontentloaded');
        console.log("   - PolicyCenter Popup Opened.");

        await portalPage.waitForLoadState('networkidle');
        console.log("   - Pausing 5s for Dashboard Hydration...");
        await portalPage.waitForTimeout(5000);

        // --- 4. PROCESS POLICIES (Using policyPage) ---
        for (const policyNum of policiesToAudit) {
            console.log(`\n🔎 Checking Policy: ${policyNum}...`);
            const result = {
                policy_number: policyNum,
                status: 'Unknown',
                integrity: 'N/A',
                balance: 'N/A',
                isPaid: false,
                isAssumed: false,
                notes: ''
            };

            try {
                // Ensure we are working on the popup page 'policyPage'
                const searchTab = policyPage.locator('#TabBar-PolicyTab > .gw-action--expand-button');
                const searchInput = policyPage.locator('input[name*="PolicyRetrievalItem"]');

                // Expand search if hidden
                if (!(await searchInput.isVisible())) {
                    if (await searchTab.isVisible()) {
                        await searchTab.click();
                        try { await searchInput.waitFor({ state: 'visible', timeout: 5000 }); }
                        catch (e) { await searchTab.click(); await searchInput.waitFor({ state: 'visible', timeout: 5000 }); }
                    }
                }

                await searchInput.fill(policyNum);
                await policyPage.keyboard.press('Enter');

                await policyPage.waitForLoadState('networkidle');
                await policyPage.waitForTimeout(3000);

                // --- 4A. INTEGRITY CHECKS ---
                const bodyText = await policyPage.innerText('body');

                // Check 1: Assumed Policy - FIRST CHECK (if assumed, no further checks needed)
                const isAssumedPhrase = bodyText.includes('This policy was assumed on');
                if (isAssumedPhrase) {
                    result.status = 'ASSUMED';
                    result.integrity = 'ASSUMED';
                    result.isAssumed = true;
                    console.log("   -> Alert: Policy assumed detected. Skipping all further checks.");
                    report.push(result);
                    continue;
                }

                // Check 2: Cancelled - "Policy not taken" (no billing check needed)
                const canceledReasonLocator = policyPage.locator('#PolicyFile_Summary_Ext-Policy_SummaryExtScreen-Policy_Summary_DatesExtDV-CanceledReason').getByText('Policy not taken');
                if (await canceledReasonLocator.isVisible().catch(() => false)) {
                    result.status = 'CANCELLED';
                    result.integrity = 'CANCELLED - Policy not taken';
                    console.log("   -> Alert: Policy not taken (cancelled) detected. Skipping billing.");
                    report.push(result);
                    continue;
                }

                // Check 3: Non-Renewal (Requirement B) — "Policy {number} has been Scheduled for Nonrenewal- Underwriting."
                const nonRenewalLocator = policyPage.locator('div').filter({
                    hasText: new RegExp(`^Policy ${policyNum} has been Scheduled for Nonrenewal- Underwriting\\.$`)
                }).nth(2);
                if (await nonRenewalLocator.isVisible().catch(() => false)) {
                    result.status = 'LOST';
                    result.integrity = 'NON-RENEWAL SCHEDULED';
                    console.log("   -> Alert: Policy scheduled for Non-renewal detected.");
                    report.push(result);
                    continue; // Skip billing check for lost policies
                }

                // Check 4: "No selection has yet been" - Check billing and set status accordingly
                const noSelection = await policyPage.getByRole('cell').filter({ hasText: 'No selection has yet been' }).isVisible();
                let isNoSelectionCase = false;
                if (noSelection) {
                    isNoSelectionCase = true;
                    console.log("   -> Alert: 'No selection has yet been' detected. Checking billing...");
                    // Will check billing below and set status based on balance
                } else {
                    // If not "No selection", mark as IN FORCE/ACTIVE (will check billing below)
                    result.integrity = 'IN FORCE';
                    result.status = 'ACTIVE';
                }

                // --- 4B. BILLING CHECKS ---
                // Check billing for policies that are not assumed (assumed policies already skipped above)
                console.log("   - Checking Billing...");
                await policyPage.getByRole('menuitem', { name: 'Billing' }).click();
                await policyPage.waitForLoadState('domcontentloaded');
                await policyPage.waitForTimeout(2000);

                // Dynamic Policy Period Selection (Requirement D)
                // Select the last option which is the latest/future renewal term
                const periodDropdown = policyPage.getByLabel('Policy Period');
                if (await periodDropdown.isVisible()) {
                    const optionValues = await periodDropdown.locator('option').evaluateAll(opts => opts.map(o => o.value));
                    if (optionValues.length > 0) {
                        // Select last option (latest/future renewal term)
                        await periodDropdown.selectOption(optionValues[optionValues.length - 1]);
                        await policyPage.waitForTimeout(2000);
                        console.log(`   -> Selected renewal term: ${optionValues.length} (latest option)`);
                    }
                }

                // --- BILLED OUTSTANDING: Past Due or Current (whichever is present) ---
                console.log("   - Checking Billed Outstanding (Past Due or Current)...");
                try {
                    // Focus the Billed Outstanding group
                    await policyPage.getByRole('group', { name: 'Billed Outstanding' }).click();
                    await policyPage.waitForTimeout(500);

                    let outstandingVal = null;
                    const pastDueLocator = policyPage.locator('#PolicyFile_Billing-Policy_BillingScreen-BilledOutstandingInputGroup-PastDue .gw-value-readonly-wrapper');
                    const currentLocator = policyPage.locator('#PolicyFile_Billing-Policy_BillingScreen-BilledOutstandingInputGroup-Current .gw-value-readonly-wrapper');

                    if (await pastDueLocator.isVisible().catch(() => false)) {
                        const pastDueText = await pastDueLocator.innerText();
                        outstandingVal = parseFloat(pastDueText.replace(/[^0-9.]/g, '')) || 0;
                        console.log(`   -> Past Due Found: $${outstandingVal.toFixed(2)}`);
                    } else {
                        // Past Due not present — use Current: click "Current-" then read value
                        await policyPage.getByText('Current-').click().catch(() => { });
                        await policyPage.waitForTimeout(300);
                        if (await currentLocator.isVisible().catch(() => false)) {
                            const currentText = await currentLocator.innerText();
                            outstandingVal = parseFloat(currentText.replace(/[^0-9.]/g, '')) || 0;
                            console.log(`   -> Current Found: $${outstandingVal.toFixed(2)}`);
                        }
                    }

                    const pastDueVal = outstandingVal !== null ? outstandingVal : 0;
                    result.balance = `$${pastDueVal.toFixed(2)}`;

                    // Handle "No selection has yet been" case
                    if (isNoSelectionCase) {
                        if (pastDueVal === 0) {
                            // No dues - mark as IN FORCE
                            result.status = 'IN FORCE';
                            result.integrity = 'IN FORCE';
                            result.isPaid = true;
                            console.log("   -> No dues found. Status set to IN FORCE.");
                        } else {
                            // Has dues - mark as "Payment pending carrier selection pending"
                            result.status = 'Payment pending carrier selection pending';
                            result.integrity = 'Payment pending carrier selection pending';
                            result.isPaid = false;
                            console.log("   -> Dues found. Status set to 'Payment pending carrier selection pending'.");
                        }
                    } else {
                        // Normal case - check if paid or not
                        if (pastDueVal === 0) {
                            result.status = 'IN FORCE';
                            result.isPaid = true;
                            console.log("   -> Policy is paid. Status: IN FORCE, isPaid: true");
                        } else {
                            result.status = 'IN FORCE';
                            result.isPaid = false;
                            console.log("   -> Policy has dues. Status: IN FORCE, isPaid: false");
                        }
                    }

                } catch (e) {
                    console.log("   -> Past Due element not found (likely $0.00 or hidden).");
                    result.balance = "$0.00";

                    // Handle "No selection has yet been" case - assume no dues
                    if (isNoSelectionCase) {
                        result.status = 'IN FORCE (RECHECK)';
                        result.integrity = 'IN FORCE';
                        result.isPaid = true;
                        console.log("   -> Balance check failed, assuming no dues. Status set to IN FORCE.");
                    } else {
                        // Normal case - assume paid
                        result.status = 'IN FORCE (RECHECK)';
                        result.isPaid = true;
                        console.log("   -> Balance check failed, assuming paid. Status: IN FORCE, isPaid: true");
                    }
                }

            } catch (err) {
                console.log(`   ❌ Error: ${err.message}`);
                result.status = 'Error/Not Found';
                result.notes = err.message;
            }
            report.push(result);
        }

        // --- STEP 5: SAVE REPORT TO JSON FILE ---
        console.log("\n📝 Generating Report...");

        const reportDir = path.join(process.cwd(), 'reports');
        try {
            await fs.mkdir(reportDir, { recursive: true });
        } catch (e) { }

        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const filename = `citizens_audit_${timestamp}.json`;
        const filepath = path.join(reportDir, filename);

        await fs.writeFile(filepath, JSON.stringify(report, null, 4));

        console.log(`✅ Report saved to: ${filepath}`);

        // --- STEP 6: SEND EMAIL (New Logic) ---
        console.log("📧 Sending Report via Email...");

        const executionTime = Date.now() - startTime;
        const emailHTML = generateEmailHTML(report, executionTime);

        const mailBody = {
            "to": ["satyam@insuredmine.com"],
            "subject": `RPA Audit Report - Citizens - ${new Date().toLocaleDateString()}`,
            "mailData": emailHTML // Sending HTML formatted email
        };

        await sendEmailReport(mailBody);

    } catch (err) {
        console.error("[Bot] Runtime Error:", err);
        const errorHTML = generateErrorHTML(`Bot encountered a critical error: ${err.message}`);
        await sendEmailReport({
            "to": ["satyam@insuredmine.com"],
            "subject": `RPA Audit FAILED - Citizens`,
            "mailData": errorHTML
        });
        return { error: err.message, report };
    } finally {
        console.log("\n✅ Audit Complete. Closing Browser...");
        await browser.close();
    }

    return report;
}