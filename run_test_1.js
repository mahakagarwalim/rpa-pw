import { runCitizensAudit } from "./rpa/citizens/citizensBot.js";
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

// Initialize database connection (optional, but good to have)
import "./Database/Config.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Read test_1.js file (it's a JSON array)
const testDataFile = await fs.readFile(path.join(__dirname, "test_1.js"), "utf-8");
const testData = JSON.parse(testDataFile);

/**
 * Script to run RPA audit for all policies in test_1.js
 */
async function runTest1() {
    try {
        // Extract all policy numbers from test_1.js
        const policyNumbers = testData
            .map(item => item.policy_number)
            .filter(policy => policy); // Remove any null/undefined values

        console.log(`\n📋 Found ${policyNumbers.length} policies in test_1.js`);
        console.log(`📋 Policy numbers: ${policyNumbers.join(', ')}\n`);

        if (policyNumbers.length === 0) {
            console.error("❌ No policy numbers found in test_1.js");
            return;
        }

        // Run the audit
        console.log("🚀 Starting RPA Audit...\n");
        const results = await runCitizensAudit(policyNumbers);

        // Display results
        if (results.error) {
            console.error("\n❌ Audit failed:", results.error);
        } else {
            console.log("\n✅ Audit completed successfully!");
            console.log(`📊 Total policies audited: ${results.length}`);
            
            // Summary
            const completed = results.filter(r => r.status === 'ACTIVE' || r.status === 'Active (Found)').length;
            const errored = results.filter(r => r.status === 'ERROR' || r.status === 'Error/Not Found').length;
            const excluded = results.filter(r => r.status === 'CARRIER_LEFT').length;
            const secure = results.filter(r => r.integrity && r.integrity.includes('SECURE')).length;
            const assumed = results.filter(r => r.isAssumed === true).length;
            const paid = results.filter(r => r.isPaid === true).length;

            console.log("\n📈 Summary:");
            console.log(`   ✅ Completed: ${completed}`);
            console.log(`   ❌ Errored: ${errored}`);
            console.log(`   🚫 Excluded (Carrier Left): ${excluded}`);
            console.log(`   🔒 Secure: ${secure}`);
            console.log(`   ⚠️  Assumed/Depopulated: ${assumed}`);
            console.log(`   💰 Paid (No Balance): ${paid}`);
        }

    } catch (error) {
        console.error("\n❌ Fatal error:", error);
        process.exit(1);
    }
}

// Run the script
runTest1();
