import { chromium } from 'playwright';
import { createInterface } from 'node:readline/promises';
import { stdin as input, stdout as output } from 'node:process';
import fs from 'fs/promises';
import path from 'path';
import config from './demoConfig.js';
import { getLatestCitizensCode } from './gmailHelper.js'
// import { getLatestCitizensCodeIMAP } from './imapHelper.js'; // Ensure using the correct helper

async function runDemo() {
    console.log("🚀 Starting Citizens Feasibility Demo");
    console.log("-------------------------------------");

    const rl = createInterface({ input, output });
    const browser = await chromium.launch({ headless: config.HEADLESS, slowMo: 100 });
    const context = await browser.newContext();
    const page = await context.newPage();

    try {
        // --- 1. LOGIN PHASE 1: INITIAL PORTAL ---
        console.log(`\n🔹 Navigating to Portal: ${config.LOGIN_URL}...`);
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

            try {
                await page.waitForSelector(`${sendBtnSelector}, ${inputSelector}`, { timeout: 2000 });
            } catch (e) {}

            if (await page.isVisible(sendBtnSelector)) {
                console.log("   - Clicking 'Send verification code'...");
                await page.click(sendBtnSelector);
                await page.waitForSelector(inputSelector, { timeout: 10000 });
            } 

            if (await page.isVisible(inputSelector)) {
                console.log("\n⚠️  MFA REQUIRED");
                
                // Try IMAP Helper First
                let code = await getLatestCitizensCode();
                
                if (!code) {
                    code = await rl.question('👉 Enter code from email: ');
                } else {
                    console.log(`   - Auto-detected code: ${code}`);
                }
                
                await page.fill(inputSelector, code.trim());
                console.log("   - Verifying Code...");
                await page.click('button:has-text("Verify code")'); 
                
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
        }

        // --- 4. PROCESS POLICIES ---
        const report = [];
        
        for (const policyNum of config.TEST_POLICIES) {
            console.log(`\n🔎 Checking Policy: ${policyNum}...`);
            const result = { policy: policyNum, status: 'Unknown', integrity: 'N/A', balance: 'N/A' };

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
                    result.integrity = '⚠️ MOVED/GONE';
                    console.log("   -> Alert: Policy carrier changed.");
                    report.push(result);
                    continue; 
                }

                const depopWarning = await page.getByRole('cell').filter({ hasText: 'Policyholder Choice details' }).isVisible();
                result.integrity = depopWarning ? '⚠️ ASSUMED/ DEPOPULATED' : '✅ SECURE';
                result.status = 'Active (Found)';

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
                            const latestValue = optionValues[optionValues.length - 1]; 
                            await periodDropdown.selectOption(latestValue);
                            await page.waitForTimeout(2000); 
                        }
                    }

                    // --- SCRAPE TOTAL CHARGES (TARGETED) ---
                    console.log("   - Looking for 'Total Charges' phrase...");
                    
                    // Regex logic:
                    // /Total Charges   -> Matches the literal text
                    // \s* -> Matches 0 or more spaces (Handles "Total Charges2,492.00")
                    // [\d,]+\.\d{2}    -> Matches number format like 2,492.00
                    const totalChargesLocator = page.getByText(/Total Charges\s*[\d,]+\.\d{2}/i).first();
                    
                    try {
                        await totalChargesLocator.waitFor({ state: 'visible', timeout: 5000 });
                        const fullText = await totalChargesLocator.innerText();
                        
                        // Clean the text to get just the number
                        // Example: "Total Charges2,492.00" -> 2492.00
                        const amount = parseFloat(fullText.replace(/Total Charges/i, '').replace(/[^0-9.]/g, '')) || 0;
                        
                        result.balance = `$${amount.toFixed(2)}`;
                        console.log(`   -> Total Charges Found: ${result.balance}`);
                        
                    } catch (e) {
                        console.log("   -> 'Total Charges' phrase not found.");
                        
                        // Fallback: Scrape ONLY Past Due as requested
                        console.log("   -> Fallback: Checking Past Due Only...");
                        const pastDue = await page.locator('#PolicyFile_Billing-Policy_BillingScreen-BilledOutstandingInputGroup-PastDue .gw-value-readonly-wrapper').innerText().catch(() => '0');
                        const pastDueVal = parseFloat(pastDue.replace(/[^0-9.]/g, '')) || 0;
                        
                        result.balance = `$${pastDueVal.toFixed(2)}`;
                        console.log(`   -> Past Due Balance: ${result.balance}`);
                    }
                }

            } catch (err) {
                console.log(`   ❌ Error: ${err.message}`);
                result.status = 'Error/Not Found';
            }
            report.push(result);
        }

        // --- STEP 5: SAVE REPORT TO JSON FILE ---
        console.log("\n📝 Generating Report...");
        
        const reportDir = path.join(process.cwd(), 'reports');
        try {
            await fs.mkdir(reportDir, { recursive: true });
        } catch (e) { /* ignore */ }

        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const filename = `citizens_feasibility_${timestamp}.json`;
        const filepath = path.join(reportDir, filename);

        await fs.writeFile(filepath, JSON.stringify(report, null, 4));

        console.log(`✅ Report saved to: ${filepath}`);
        
        // Still print to console for your debugging, but user can open the file
        console.table(report);

    } catch (err) {
        console.error("Runtime Error:", err);
    } finally {
        rl.close();
        console.log("\n✅ Demo Complete. Browser closing in 30 seconds...");
        await page.waitForTimeout(30000);
        await browser.close();
    }
}

runDemo();