import { chromium } from 'playwright';
import config from './config.js';
import { getLatestProgressiveCode } from './gmailHelper.js';
import fs from 'fs/promises';
import path from 'path';

/** Turn report array into CSV string (headers + rows, proper escaping). */
function reportToCSV(report) {
    if (!report || report.length === 0) return '';
    const headers = ['policy_number', 'status', 'integrity', 'balance', 'isPaid', 'isAssumed'];
    const escape = (v) => {
        const s = String(v ?? '');
        if (/[,"\r\n]/.test(s)) return '"' + s.replace(/"/g, '""') + '"';
        return s;
    };
    const rows = report.map(r => headers.map(h => escape(r[h])).join(','));
    return [headers.join(','), ...rows].join('\n');
}

export async function runProgressiveAudit(policiesToAudit) {
    console.log(`[Bot] Starting Progressive Audit for ${policiesToAudit.length} policies...`);

    const browser = await chromium.launch({
        headless: config.HEADLESS,
        slowMo: 100,
        args: ['--disable-blink-features=AutomationControlled', '--start-maximized']
    });

    const context = await browser.newContext({
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        viewport: { width: 1920, height: 1080 },
        deviceScaleFactor: 1,
        locale: 'en-US',
        timezoneId: 'America/New_York'
    });

    const page = await context.newPage();
    const report = [];

    try {
        // --- 1. LOGIN ---
        console.log(`[Bot] Navigating to ${config.LOGIN_URL}...`);
        await page.goto(config.LOGIN_URL, { waitUntil: 'domcontentloaded' });

        // Check for "Log In" link if not on direct login page
        try {
            const loginLink = page.getByRole('link', { name: 'ForAgentsOnly.com: Log In' });
            if (await loginLink.isVisible({ timeout: 3000 })) {
                await loginLink.click();
            }
        } catch (e) { }

        // Credentials
        console.log("   - Entering Credentials...");
        await page.getByRole('textbox', { name: 'User ID' }).fill(config.USERNAME);
        await page.getByRole('textbox', { name: 'User Password' }).fill(config.PASSWORD);
        await page.getByRole('button', { name: 'Log In' }).click();

        // MFA Handling
        console.log("   - Checking for MFA...");
        const mfaInput = page.getByRole('textbox', { name: 'One-time passcode' });

        try {
            await mfaInput.waitFor({ state: 'visible', timeout: 5000 });
        } catch (e) { }

        if (await mfaInput.isVisible()) {
            console.log("   ⚠️ MFA Required.");
            let mfaSuccess = false;
            let retries = 0;

            while (!mfaSuccess && retries < 3) {
                const code = await getLatestProgressiveCode();
                if (!code) { retries++; continue; }

                console.log(`   - Entering code: ${code}`);
                await mfaInput.fill(code);
                await page.getByRole('button', { name: 'Continue' }).click();

                await page.waitForTimeout(2000);
                const inputStillVisible = await mfaInput.isVisible().catch(() => false);
                if (!inputStillVisible) {
                    mfaSuccess = true;
                } else {
                    console.log("   - MFA input still visible after Continue, retrying...");
                    await mfaInput.clear().catch(() => {});
                    await page.waitForTimeout(2000);
                    retries++;
                }
            }
            if (!mfaSuccess) throw new Error("MFA Failed");
        }

        // Handle Welcome Screen/Splash
        try {
            // Example selector from snippet: #loginFormDiv div ... Welcome
            await page.waitForLoadState('networkidle');
            // Sometimes a "Skip" or click-through is needed. 
            // The snippet showed clicking on "Welcome to ForAgentsOnly.com". 
            // We'll wait for the dashboard to settle.
        } catch (e) { }

        console.log("✅ Login Complete.");
        await page.waitForTimeout(2000); // wait for dashboard to load

        // --- 2. PROCESS POLICIES ---
        for (let i = 0; i < policiesToAudit.length; i++) {
            const policyNum = policiesToAudit[i];
            const isFirst = i === 0;
            console.log(`\n🔎 Checking Policy: ${policyNum}...`);
            const result = {
                policy_number: policyNum,
                status: 'Unknown',
                integrity: 'N/A',
                balance: 'N/A',
                isPaid: false,
                isAssumed: false
            };

            try {
                if (isFirst) {
                    // First policy: Policy Search (radio) + Policy Number textbox + Search (no deep link)
                    console.log("   - Using Policy Search...");
                    await page.getByText('Policy Search', { exact: true }).click();
                    await page.waitForTimeout(500);
                    await page.getByRole('textbox', { name: 'Policy Number' }).click();
                    await page.getByRole('textbox', { name: 'Policy Number' }).fill(policyNum);
                    await page.getByRole('button', { name: 'Search' }).click();
                    await page.waitForTimeout(3000); // cooldown for page to load after Search
                } else {
                    // Later policies: Find policy textbox + Find Policy button
                    console.log("   - Using Find policy...");
                    await page.getByRole('textbox', { name: 'Find policy' }).click();
                    await page.getByRole('textbox', { name: 'Find policy' }).fill(policyNum);
                    await page.getByRole('button', { name: 'Find Policy' }).click();
                    await page.waitForTimeout(3000); // cooldown for page to load after Find Policy
                }

                // Check for Non-Renewal
                const nonRenewText = await page.getByText(/policy is being non-renewed/i).isVisible().catch(() => false);
                if (nonRenewText) {
                    result.status = 'LOST';
                    result.integrity = 'NON-RENEWAL';
                    result.isPaid = false;
                    console.log("   -> Non-renewal");
                } else {
                    // Billing status: "Billing status Paid in full" or "Paid to date"
                    const paidInFull = await page.getByText('Billing status Paid in full').isVisible().catch(() => false);
                    const paidToDate = await page.getByText('Paid to date').isVisible().catch(() => false);
                    const paidStatus = paidInFull || paidToDate;

                    if (paidStatus) {
                        result.status = 'ACTIVE';
                        result.integrity = 'SECURE';
                        result.balance = '$0.00';
                        result.isPaid = true;
                        console.log("   -> Billing status: Paid in full / Paid to date");
                    } else {
                        result.status = 'ACTIVE';
                        result.integrity = 'SECURE';
                        result.isPaid = false;
                        result.balance = 'Balance Due';
                        console.log("   -> Balance Due");
                    }
                }

            } catch (err) {
                console.log(`   ❌ Error: ${err.message}`);
                result.status = 'Error/Not Found';
            }
            report.push(result);
        }

        // Save Report (CSV)
        const reportDir = path.join(process.cwd(), 'reports');
        try { await fs.mkdir(reportDir, { recursive: true }); } catch (e) { }
        const filename = `progressive_audit_${new Date().toISOString().replace(/[:.]/g, '-')}.csv`;
        await fs.writeFile(path.join(reportDir, filename), reportToCSV(report));

        console.log(`✅ Report saved to: ${filename}`);

    } catch (err) {
        console.error("[Bot] Critical Error:", err);
        return { error: err.message, report };
    } finally {
        await browser.close();
    }
    return report;
}