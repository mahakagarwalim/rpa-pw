import { runCitizensAudit } from "../rpa/citizens/citizensBot.js";
import { CreateRPALog } from "../Database/Services/SecondaryDB/RPALogCollection.Services.js";
import { getPoliciesForRenewalAutomation } from "../Database/Services/PrimaryDB/DealboardCardsCollection.Services.js"; // Import new service

export const auditPolicies = async (req, res) => {
    let { dealcard_id, policies } = req.body;

    // 1. Validation
    if (!dealcard_id) {
        return res.status(400).json({ success: false, message: "dealcard_id is required." });
    }

    // IF policies are missing, fetch them from the DB using the new aggregation logic
    let fetchedPolicyObjects = null;
    if (!policies || policies.length === 0) {
        try {
            console.log(`[API] Fetching policies for DealCard: ${dealcard_id}`);
            fetchedPolicyObjects = await getPoliciesForRenewalAutomation(dealcard_id);

            if (!fetchedPolicyObjects || fetchedPolicyObjects.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: "No relevant Citizens policies found in this DealCard."
                });
            }

            // Log the fetched policies in test.js format
            console.log(`[API] Found ${fetchedPolicyObjects.length} policies to audit:`);
            console.log(JSON.stringify(fetchedPolicyObjects, null, 2));

            // Extract just the numbers for the bot
            policies = fetchedPolicyObjects.map(p => p.policy_number);
            console.log(`[API] Policy numbers extracted:`, policies);

        } catch (dbErr) {
            console.error("[API] Database error:", dbErr);
            return res.status(500).json({ 
                success: false, 
                message: "Database error fetching policies.",
                error: dbErr.message 
            });
        }
    }

    console.log(`[API] Starting Audit for ${policies.length} policies...`);
    const startTime = Date.now();

    try {
        // 2. Trigger Bot
        const auditResults = await runCitizensAudit(policies);
        const executionTime = Date.now() - startTime;
        const isSuccess = !auditResults.error;
        const isAnyAssumed = auditResults.some(r => r.isAssumed === true);
        const areAllPaid = !isAnyAssumed && auditResults.every(r => r.isPaid === true);

        // 3. Save to Secondary DB
        const logEntry = await CreateRPALog({
            dealcard_id,
            carrier: "Citizens",
            status: isSuccess ? "SUCCESS" : "FAILED",
            dealcard_is_paid: areAllPaid,
            dealcard_is_assumed: isAnyAssumed,
            execution_time_ms: executionTime,
            policies_audited: auditResults,
            raw_data: auditResults
        });

        // 4. Send Response
        return res.status(200).json({
            success: isSuccess,
            message: "Audit process completed.",
            log_id: logEntry._id,
            dealcard_status: {
                isPaid: areAllPaid,
                isAssumed: isAnyAssumed
            },
            dealcard_id: dealcard_id,
            policies_fetched: fetchedPolicyObjects || null,
            policies_audited: policies.length,
            execution_time_ms: executionTime,
            results: auditResults
        });

    } catch (error) {
        console.error("[API] Controller Error:", error);

        // Try to log failure
        try {
            await CreateRPALog({
                dealcard_id,
                status: "FAILED",
                execution_time_ms: Date.now() - startTime,
                raw_data: { error: error.message }
            });
        } catch (e) { }

        return res.status(500).json({
            success: false,
            message: "Internal Server Error during RPA execution.",
            error: error.message
        });
    }
};