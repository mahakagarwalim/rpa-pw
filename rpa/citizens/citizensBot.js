// import { chromium } from 'playwright';
// import config from './demoConfig.js';
// import { getLatestCitizensCode } from './gmailHelper.js';

// /**
//  * Main Entry Point for API Trigger
//  * @param {Array<string>} policiesToAudit - List of policy numbers from the request
//  * @returns {Promise<Array>} - The audit report
//  */
// export async function runCitizensAudit(policiesToAudit) {
//     console.log(`[Bot] Starting Audit for ${policiesToAudit.length} policies...`);

//     // HEADLESS: FALSE for debugging/demo
//     const browser = await chromium.launch({ headless: false, slowMo: 100 }); 
//     const context = await browser.newContext();
//     const page = await context.newPage();
//     const report = [];

//     try {
//         // --- 1. LOGIN ---
//         console.log(`[Bot] Navigating to ${config.LOGIN_URL}...`);
//         await page.goto(config.LOGIN_URL);

//         if (await page.isVisible('#j_username')) {
//             await page.locator('#j_username').fill(config.USERNAME);
//             await page.locator('#j_password').fill(config.PASSWORD);
//             await page.getByRole('button', { name: 'Submit' }).click();
//             await page.waitForLoadState('domcontentloaded');
//         }

//         // --- 2. SSO & MFA ---
//         try {
//             console.log("[Bot] Checking for PolicyCenter SSO...");
//             await page.getByText('PolicyCenter®').nth(1).click();

//             // Wait for SSO page to load
//             await page.waitForSelector('input[name="Email Address"], [placeholder="Email Address"]', { timeout: 15000 });

//             console.log("[Bot] Entering SSO Credentials...");
//             await page.getByRole('textbox', { name: 'Email Address' }).fill(config.USERNAME2);
//             await page.getByRole('textbox', { name: 'Password' }).fill(config.PASSWORD);
//             await page.getByRole('button', { name: 'Sign in' }).click();

//             // Wait for next screen (MFA Button OR Input)
//             console.log("[Bot] Waiting for MFA Screen...");

//             // Define Selectors
//             const sendBtnSelector = 'button:has-text("Send verification code")';
//             const inputSelector = 'input[name="Verification code"], [placeholder="Verification code"]';

//             // Wait for EITHER the button OR the input to become visible
//             try {
//                 await Promise.race([
//                     page.waitForSelector(sendBtnSelector, { timeout: 10000 }),
//                     page.waitForSelector(inputSelector, { timeout: 10000 })
//                 ]);
//             } catch (e) {
//                 console.log("[Bot] No specific MFA element found in 10s. Checking if already logged in...");
//             }

//             // Case A: "Send verification code" button needs clicking
//             if (await page.isVisible(sendBtnSelector)) {
//                 console.log("[Bot] Found 'Send verification code' button. Clicking...");
//                 await page.click(sendBtnSelector);
//                 // After clicking, strictly wait for input
//                 await page.waitForSelector(inputSelector, { timeout: 15000 });
//             }

//             // Case B: Code Input is present
//             if (await page.isVisible(inputSelector)) {
//                 console.log("[Bot] MFA Input Detected. Fetching code from Gmail API...");

//                 // API MODE: No manual fallback. Must use Gmail API.
//                 const code = await getLatestCitizensCode();
//                 if (!code) throw new Error("Could not retrieve MFA code from Gmail API.");

//                 console.log(`[Bot] Entering code: ${code}`);
//                 await page.fill(inputSelector, code);
//                 await page.click('button:has-text("Verify code")');

//                 // Handle "Continue" button if it appears
//                 console.log("   - Waiting for Continue button...");
//                 try {
//                     await page.waitForSelector('button:has-text("Continue")', { timeout: 10000 });
//                     await page.click('button:has-text("Continue")');
//                 } catch (e) {
//                     console.log("   - 'Continue' button not found, checking dashboard...");
//                 }
//             }

//             await page.waitForLoadState('networkidle');
//             // Hard wait to ensure Dashboard hydration (Critical for first search)
//             console.log("[Bot] Waiting 5s for Dashboard...");
//             await page.waitForTimeout(5000); 
//             console.log("[Bot] Login Sequence Finished.");

//         } catch (e) {
//             console.error("[Bot] Login/MFA Flow Error:", e.message);
//             // If login fails, we cannot proceed. Throw error to exit.
//             throw e; 
//         }

//         // --- 3. AUDIT LOOP ---
//         for (const policyNum of policiesToAudit) {
//             const result = { policy_number: policyNum, status: 'Unknown', integrity: 'N/A', balance: 'N/A' };

//             try {
//                 console.log(`[Bot] Checking Policy: ${policyNum}...`);

//                 const searchTab = page.locator('#TabBar-PolicyTab > .gw-action--expand-button');
//                 const searchInput = page.locator('input[name*="PolicyRetrievalItem"]');

//                 // Ensure Search Input is Visible
//                 if (!(await searchInput.isVisible())) {
//                     if (await searchTab.isVisible()) {
//                         console.log("[Bot] Expanding Search Tab...");
//                         await searchTab.click();
//                         // Wait specifically for input to appear after click
//                         try {
//                             await searchInput.waitFor({ state: 'visible', timeout: 5000 });
//                         } catch (e) {
//                             console.log("[Bot] Retry clicking Search Tab...");
//                             await searchTab.click(); // Retry click if failed
//                             await searchInput.waitFor({ state: 'visible', timeout: 5000 });
//                         }
//                     } else {
//                         throw new Error("Search Tab not found. Login might have failed.");
//                     }
//                 }

//                 // Search
//                 await searchInput.fill(policyNum);
//                 await page.keyboard.press('Enter');

//                 await page.waitForLoadState('networkidle');
//                 await page.waitForTimeout(3000);

//                 // Checks
//                 const noSelection = await page.getByRole('cell').filter({ hasText: 'No selection has yet been' }).isVisible();
//                 if (noSelection) {
//                     result.status = 'CARRIER_LEFT';
//                     result.integrity = 'CARRIER CHANGED';
//                     report.push(result);
//                     continue; 
//                 }

//                 const depopWarning = await page.getByRole('cell').filter({ hasText: 'Policyholder Choice details' }).isVisible();
//                 result.integrity = depopWarning ? 'DEPOPULATION RISK' : 'SECURE';
//                 result.status = 'ACTIVE';

//                 // Billing
//                 if (result.integrity === 'SECURE') {
//                     await page.getByRole('menuitem', { name: 'Billing' }).click();
//                     await page.waitForLoadState('domcontentloaded');
//                     await page.waitForTimeout(2000);

//                     // Dynamic Period Selection
//                     const periodDropdown = page.getByLabel('Policy Period');
//                     if (await periodDropdown.isVisible()) {
//                         const optionValues = await periodDropdown.locator('option').evaluateAll(opts => opts.map(o => o.value));
//                         if (optionValues.length > 0) {
//                             await periodDropdown.selectOption(optionValues[optionValues.length - 1]);
//                             await page.waitForTimeout(2000); 
//                         }
//                     }

//                     // Scrape "Total Charges"
//                     try {
//                         const totalChargesLocator = page.getByText(/Total Charges\s*[\d,]+\.\d{2}/i).first();
//                         await totalChargesLocator.waitFor({ state: 'visible', timeout: 5000 });
//                         const fullText = await totalChargesLocator.innerText();
//                         const amount = parseFloat(fullText.replace(/Total Charges/i, '').replace(/[^0-9.]/g, '')) || 0;
//                         result.balance = `$${amount.toFixed(2)}`;
//                     } catch (e) {
//                         // Fallback: Scrape ONLY Past Due
//                         const pastDue = await page.locator('#PolicyFile_Billing-Policy_BillingScreen-BilledOutstandingInputGroup-PastDue .gw-value-readonly-wrapper').innerText().catch(() => '0');
//                         const pastDueVal = parseFloat(pastDue.replace(/[^0-9.]/g, '')) || 0;
//                         result.balance = `$${pastDueVal.toFixed(2)}`;
//                     }
//                 }
//             } catch (err) {
//                 console.error(`[Bot] Error auditing ${policyNum}:`, err.message);
//                 result.status = 'ERROR';
//                 result.notes = err.message;
//             }
//             report.push(result);
//         }

//     } catch (error) {
//         console.error("[Bot] Critical Error:", error);
//         return { error: error.message, report };
//     } finally {
//         await browser.close();
//     }

//     return report;
// }
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

    // 1. LAUNCH BROWSER (Same config as your script)
    const browser = await chromium.launch({
        headless: config.HEADLESS, // Using config or default false
        slowMo: 100
    });

    const context = await browser.newContext();
    const page = await context.newPage();
    const report = [];

    try {
        // --- 1. LOGIN PHASE 1: INITIAL PORTAL ---
        console.log(`[Bot] Navigating to Portal: ${config.LOGIN_URL}...`);
        await page.goto(config.LOGIN_URL);

        if (await page.isVisible('#j_username')) {
            console.log("   - [Login 1/2] Entering Portal Credentials...");
            await page.locator('#j_username').fill(config.USERNAME);
            await page.locator('#j_password').fill(config.PASSWORD);
            await page.getByRole('button', { name: 'Submit' }).click();
            await page.waitForLoadState('domcontentloaded');
        }

        // --- 2. LOGIN PHASE 2: POLICY CENTER SSO ---
        try {
            console.log("   - Clicking PolicyCenter...");
            await page.getByText('PolicyCenter®').nth(1).click();

            console.log("   - Waiting for SSO Page...");
            await page.waitForSelector('input[name="Email Address"], [placeholder="Email Address"]', { timeout: 15000 });

            console.log("   - [Login 2/2] Entering SSO Credentials...");
            await page.getByRole('textbox', { name: 'Email Address' }).fill(config.USERNAME2);
            await page.getByRole('textbox', { name: 'Password' }).fill(config.PASSWORD);

            await page.getByRole('button', { name: 'Sign in' }).click();
            await page.waitForLoadState('networkidle');
            await page.waitForTimeout(2000);

        } catch (e) {
            console.log("   ⚠️ Note: PolicyCenter SSO step skipped or already active.");
        }

        // --- 3. MFA HANDLING ---
        try {
            console.log("   - Checking for MFA Challenge...");

            const sendBtnSelector = 'button:has-text("Send verification code")';
            const inputSelector = 'input[name="Verification code"], [placeholder="Verification code"]';

            // Check if any MFA element exists quickly
            try {
                await page.waitForSelector(`${sendBtnSelector}, ${inputSelector}`, { timeout: 2000 });
            } catch (e) { }

            if (await page.isVisible(sendBtnSelector)) {
                console.log("   - Clicking 'Send verification code'...");
                await page.click(sendBtnSelector);
                await page.waitForSelector(inputSelector, { timeout: 10000 });
            }

            if (await page.isVisible(inputSelector)) {
                console.log("\n⚠️  MFA REQUIRED");

                // API MODE: No manual fallback. Must use Gmail API.
                let mfaSuccess = false;
                let retries = 0;
                const maxRetries = 3;

                while (!mfaSuccess && retries < maxRetries) {
                    // API MODE: No manual fallback. Must use Gmail API.
                    let code = await getLatestCitizensCode();

                    if (!code) {
                        if (retries === maxRetries - 1) {
                            throw new Error("MFA Code not found via Gmail API. Cannot proceed in API mode.");
                        }
                        console.log("   - Code not found, retrying...");
                        retries++;
                        continue;
                    } else {
                        console.log(`   - Auto-detected code: ${code}`);
                    }

                    await page.fill(inputSelector, code.trim());
                    console.log("   - Verifying Code...");
                    await page.click('button:has-text("Verify code")');

                    // Check for "Incorrect Code" error message
                    try {
                        const errorLocator = page.getByText('That code is incorrect. Please try again.');
                        await errorLocator.waitFor({ state: 'visible', timeout: 3000 });
                        console.log("   ❌ Incorrect code detected. Retrying in 5s...");
                        await page.waitForTimeout(5000);
                        retries++;
                        // Loop continues to fetch code again
                    } catch (e) {
                        // Error message did not appear -> Success
                        console.log("   - Code accepted.");
                        mfaSuccess = true;
                    }
                }

                if (!mfaSuccess) {
                    throw new Error("Failed to authenticate MFA after multiple attempts.");
                }

                console.log("   - Waiting for Continue button...");
                try {
                    await page.waitForSelector('button:has-text("Continue")', { timeout: 10000 });
                    await page.click('button:has-text("Continue")');
                } catch (e) {
                    console.log("   - 'Continue' button not found, checking dashboard...");
                }

                await page.waitForLoadState('networkidle');
                console.log("   - Pausing 5s for Dashboard Hydration...");
                await page.waitForTimeout(5000);

                console.log("✅ Authentication Complete.");
            } else {
                console.log("   - No MFA Input found. Assuming login success.");
            }

        } catch (e) {
            console.log("   - Error in MFA flow: " + e.message);
            // Critical failure if MFA fails
            throw e;
        }

        // --- 4. PROCESS POLICIES ---
        for (const policyNum of policiesToAudit) {
            console.log(`\n🔎 Checking Policy: ${policyNum}...`);
            const result = { 
                policy_number: policyNum, 
                status: 'Unknown', 
                integrity: 'N/A', 
                balance: 'N/A',
                isPaid: false,    // Default false
                isAssumed: false  // Default false
            };

            try {
                // Ensure the Policy Tab Search Input is visible
                const searchInput = page.locator('input[name*="PolicyRetrievalItem"]');
                const expandButton = page.locator('#TabBar-PolicyTab > .gw-action--expand-button');

                if (!(await searchInput.isVisible())) {
                    console.log("   - Expanding Search Tab...");
                    await expandButton.click();
                    // Wait for the animation to finish and input to become visible
                    await searchInput.waitFor({ state: 'visible', timeout: 5000 });
                }

                console.log("   - Searching...");

                await searchInput.fill(policyNum);
                await page.keyboard.press('Enter');

                await page.waitForLoadState('networkidle');
                await page.waitForTimeout(3000);

                // --- 4A. INTEGRITY CHECKS ---
                const noSelection = await page.getByRole('cell').filter({ hasText: 'No selection has yet been' }).isVisible();
                if (noSelection) {
                    result.status = 'CARRIER_LEFT';
                    result.integrity = 'CARRIER CHANGED';
                    result.isAssumed = true; // Mark as assumed/moved
                    report.push(result);
                    continue; 
                }

                // Check 2: Depopulation / Assumed Logic
                const choiceDetailsVisible = await page.getByRole('cell').filter({ hasText: 'Policyholder Choice details' }).isVisible();
                const bodyText = await page.innerText('body');

                // Specific phrase check
                const isAssumedPhrase = bodyText.includes('This policy was assumed on');
                const isAssumedKeyword = bodyText.toUpperCase().includes('ASSUMED') || bodyText.toUpperCase().includes('TAKEOUT');

                if (choiceDetailsVisible || isAssumedPhrase || isAssumedKeyword) {
                    result.integrity = 'ASSUMED ';
                    console.log("   -> Alert: Depopulation/Assumption detected.");
                    result.isAssumed = true; // Mark as assumed
                } else {
                    result.integrity = 'ENFORCED';
                    result.status = 'ACTIVE';
                }

                // --- 4B. BILLING CHECKS ---
                if (result.integrity.includes('SECURE')) {
                    console.log("   - Checking Billing...");
                    await page.getByRole('menuitem', { name: 'Billing' }).click();
                    await page.waitForLoadState('domcontentloaded');
                    await page.waitForTimeout(2000);

                    // Dynamic Policy Period Selection
                    const periodDropdown = page.getByLabel('Policy Period');
                    if (await periodDropdown.isVisible()) {
                        const optionValues = await periodDropdown.locator('option').evaluateAll(opts => opts.map(o => o.value));
                        if (optionValues.length > 0) {
                            await periodDropdown.selectOption(optionValues[optionValues.length - 1]);
                            await page.waitForTimeout(2000);
                        }
                    }

                    // --- SCRAPE PAST DUE ONLY ---
                    console.log("   - Checking Past Due Amount...");
                    try {
                        // Selector from your previous codegen/logs
                        const pastDueLocator = page.locator('#PolicyFile_Billing-Policy_BillingScreen-BilledOutstandingInputGroup-PastDue .gw-value-readonly-wrapper');
                        await pastDueLocator.waitFor({ state: 'visible', timeout: 5000 });
                        const pastDueText = await pastDueLocator.innerText();
                        const pastDueVal = parseFloat(pastDueText.replace(/[^0-9.]/g, '')) || 0;

                        result.balance = `$${pastDueVal.toFixed(2)}`;
                        console.log(`   -> Past Due Found: ${result.balance}`);
                        if (pastDueVal === 0) {
                            result.isPaid = true;
                        }

                    } catch (e) {
                        console.log("   -> Past Due element not found (likely $0.00 or hidden).");
                        result.balance = "$0.00";
                        result.isPaid = true;
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
        } catch (e) {}

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

