import { chromium } from 'playwright';
import { createInterface } from 'node:readline/promises';
import { stdin as input, stdout as output } from 'node:process';
import config from './demoConfig.js';
import { getLatestCitizensCode } from './gmailHelper.js';

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
            // Click the PolicyCenter link (nth(1) based on your codegen)
            await page.getByText('PolicyCenter®').nth(1).click();
            
            console.log("   - Waiting for SSO Page...");
            // Wait for the SSO login form to appear
            await page.waitForSelector('input[name="Email Address"], [placeholder="Email Address"]', { timeout: 15000 });
            
            console.log("   - [Login 2/2] Entering SSO Credentials...");
            // Use USERNAME2 here
            await page.getByRole('textbox', { name: 'Email Address' }).fill(config.USERNAME2);
            await page.getByRole('textbox', { name: 'Password' }).fill(config.PASSWORD);
            
            // Click Sign In and WAIT for navigation
            await page.getByRole('button', { name: 'Sign in' }).click();
            await page.waitForLoadState('networkidle'); // Wait for network to quiet down
            await page.waitForTimeout(2000); // Small buffer for animations

        } catch (e) {
            console.log("   ⚠️ Note: PolicyCenter SSO step skipped or already active.");
        }

        // --- 3. MFA HANDLING (FIXED) ---
        try {
            console.log("   - Checking for MFA Challenge...");

            // Define selectors
            const sendBtnSelector = 'button:has-text("Send verification code")';
            const inputSelector = 'input[name="Verification code"], [placeholder="Verification code"]';

            // Wait for EITHER the button OR the input to appear
            try {
                await page.waitForSelector(`${sendBtnSelector}, ${inputSelector}`, { timeout: 10000 });
            } catch (e) {
                console.log("   - Neither 'Send' button nor 'Input' found immediately. Checking frames...");
            }

            // Scenario A: "Send verification code" button is visible
            if (await page.isVisible(sendBtnSelector)) {
                console.log("   - Found 'Send verification code' button. Clicking...");
                await page.click(sendBtnSelector);
                // After clicking, wait for the input to appear
                await page.waitForSelector(inputSelector, { timeout: 10000 });
            } 
            // Scenario B: Input is already visible (Auto-sent)
            else if (await page.isVisible(inputSelector)) {
                console.log("   - Verification input already visible.");
            }

            // Now perform the Code Entry
            if (await page.isVisible(inputSelector)) {
                console.log("\n⚠️  MFA REQUIRED");
                
                // Try Gmail API First
                let code = await getLatestCitizensCode();
                
                // Fallback to Manual
                if (!code) {
                    code = await rl.question('👉 Enter code from email: ');
                } else {
                    console.log(`   - Auto-detected code: ${code}`);
                }
                
                await page.fill(inputSelector, code.trim());
                console.log("   - Verifying Code...");
                await page.click('button:has-text("Verify code")'); 
                
                // Explicitly wait for and click Continue
                console.log("   - Waiting for Continue button...");
                await page.waitForSelector('button:has-text("Continue")', { timeout: 15000 });
                await page.click('button:has-text("Continue")');
                
                console.log("   - Waiting for Dashboard...");
                await page.waitForLoadState('networkidle');
                
                // ADDED DELAY HERE to prevent skipping the first policy
                console.log("   - Pausing 5s for Dashboard Hydration...");
                await page.waitForTimeout(5000); 
                
                console.log("✅ Authentication Complete.");
            } else {
                console.log("   - No MFA Input found. Assuming login success.");
            }

        } catch (e) {
            console.log("   - Error in MFA flow (or login proceeded automatically): " + e.message);
        }

        // --- 4. PROCESS POLICIES (The Loop) ---
        const report = [];
        
        for (const policyNum of config.TEST_POLICIES) {
            console.log(`\n🔎 Checking Policy: ${policyNum}...`);
            const result = { policy: policyNum, status: 'Unknown', integrity: 'N/A', balance: 'N/A' };

            try {
                // Expand Search Tab
                const searchTab = page.locator('#TabBar-PolicyTab > .gw-action--expand-button');
                // Use safe click if visible
                if (await searchTab.count() > 0 && await searchTab.isVisible()) {
                    await searchTab.click();
                }

                // Search Policy
                console.log("   - Searching...");
                // Use a more generic selector that matches your codegen input name
                const searchInput = page.locator('input[name*="PolicyRetrievalItem"]');
                await searchInput.waitFor({ state: 'visible', timeout: 5000 });
                await searchInput.fill(policyNum);
                await page.keyboard.press('Enter');
                
                await page.waitForLoadState('networkidle');
                await page.waitForTimeout(3000); // Wait for search results

                // --- 4A. INTEGRITY CHECKS ---
                // Check 1: Carrier Changed/Gone
                const noSelection = await page.getByRole('cell').filter({ hasText: 'No selection has yet been' }).isVisible();
                if (noSelection) {
                    result.status = 'CARRIER_LEFT';
                    result.integrity = '⚠️ MOVED/GONE';
                    console.log("   -> Alert: Policy carrier changed.");
                    report.push(result);
                    continue; 
                }

                // Check 2: Depopulation Warning
                const depopWarning = await page.getByRole('cell').filter({ hasText: 'Policyholder Choice details' }).isVisible();
                if (depopWarning) {
                    result.integrity = '⚠️ DEPOPULATION RISK';
                    console.log("   -> Alert: Depopulation status found.");
                } else {
                    result.integrity = '✅ SECURE';
                }

                result.status = 'Active (Found)';

                // --- 4B. BILLING CHECKS ---
                console.log("   - Checking Billing...");
                await page.getByRole('menuitem', { name: 'Billing' }).click();
                await page.waitForLoadState('domcontentloaded');
                await page.waitForTimeout(2000);

                // --- DYNAMIC POLICY PERIOD SELECTION ---
                console.log("   - Checking Policy Periods...");
                const periodDropdown = page.getByLabel('Policy Period');
                
                if (await periodDropdown.isVisible()) {
                    // 1. Get all options from the dropdown
                    const optionValues = await periodDropdown.locator('option').evaluateAll(opts => opts.map(o => o.value));
                    
                    if (optionValues.length > 0) {
                        // 2. Select the LAST item in the list (Assuming it's the latest term)
                        const latestValue = optionValues[optionValues.length - 1]; 
                        console.log(`     -> Selecting latest period: ${latestValue}`);
                        
                        await periodDropdown.selectOption(latestValue);
                        
                        // 3. Wait for the page to refresh after selection
                        await page.waitForLoadState('networkidle');
                        await page.waitForTimeout(2000); 
                    }
                } else {
                    console.log("     -> 'Policy Period' dropdown not found (Single term only?)");
                }

                // We use a Regex to match "Total Charges" followed by any amount
                // This handles "Total Charges2,492.00" or "Total Charges: $2,492.00"
                const totalChargesEl = page.locator('body').getByText(/Total Charges/i).first();
                
                if (await totalChargesEl.isVisible()) {
                    const fullText = await totalChargesEl.innerText();
                    // Clean and extract the number (remove "Total Charges", $, commas)
                    const amount = parseFloat(fullText.replace(/[^0-9.]/g, '')) || 0;
                    
                    result.balance = `$${amount.toFixed(2)}`;
                    console.log(`   -> Total Charges Found: ${result.balance}`);
                } else {
                    result.balance = 'Not Found';
                    console.log("   -> Total Charges element not found.");
                }

            } catch (err) {
                console.log(`   ❌ Error: ${err.message}`);
                result.status = 'Error/Not Found';
            }
            report.push(result);
        }

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