import { runCitizensAudit } from "../rpa/citizens/citizensBot.js";
import { CreateRPALog } from "../Database/Services/SecondaryDB/RPALogCollection.Services.js";
import { getPoliciesForRenewalAutomation } from "../Database/Services/PrimaryDB/DealboardCardsCollection.Services.js"; // Import new service

/** Maps a single policy audit result to the process API success_enum. */
function mapResultToSuccessEnum(result) {
    if (!result) return "reschedule";
    const status = (result.status || "").toUpperCase();
    if (result.isAssumed || status === "ASSUMED") return "assumed";
    if (["LOST", "CANCELLED"].includes(status) || (result.integrity || "").includes("NON-RENEWAL")) return "lost";
    if (result.isPaid && (status.includes("IN FORCE") || status === "ACTIVE")) return "paid";
    return "reschedule";
}

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
        
        // Handle error case: bot returns { error: string, report: array }
        // Handle success case: bot returns array directly
        const isSuccess = !auditResults.error;
        const resultsArray = Array.isArray(auditResults) ? auditResults : (auditResults.report || []);
        
        const isAnyAssumed = resultsArray.some(r => r.isAssumed === true);
        const areAllPaid = !isAnyAssumed && resultsArray.every(r => r.isPaid === true);

        // 3. Save to Secondary DB
        const logEntry = await CreateRPALog({
            dealcard_id,
            carrier: "Citizens",
            status: isSuccess ? "SUCCESS" : "FAILED",
            dealcard_is_paid: areAllPaid,
            dealcard_is_assumed: isAnyAssumed,
            execution_time_ms: executionTime,
            policies_audited: resultsArray,
            raw_data: auditResults
        });

        // 4. Send Response
        return res.status(200).json({
            success: isSuccess,
            message: isSuccess ? "Audit process completed." : (auditResults.error || "Audit process failed."),
            log_id: logEntry._id,
            dealcard_status: {
                isPaid: areAllPaid,
                isAssumed: isAnyAssumed
            },
            dealcard_id: dealcard_id,
            policies_fetched: fetchedPolicyObjects || null,
            policies_audited: policies.length,
            execution_time_ms: executionTime,
            results: resultsArray,
            error: auditResults.error || null
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

/**
 * Process API: accepts either:
 * - Single object: { policy_id, policy_number, agency_id, carrier_name, dealcard_id? }
 * - Array of those objects (e.g. entire del.js): runs one audit for all, returns results per item.
 */
export const citizensProcess = async (req, res) => {
    const body = req.body;

    // --- Batch: body is array (entire del.js) ---
    if (Array.isArray(body)) {
        if (body.length === 0) {
            return res.status(400).json({ status: "error", message: "Request body array cannot be empty." });
        }
        const policyNumbers = [];
        const items = [];
        for (let i = 0; i < body.length; i++) {
            const p = body[i] && body[i].policy_number;
            if (!p || !String(p).trim()) {
                return res.status(400).json({
                    status: "error",
                    message: `Item at index ${i} is missing policy_number.`
                });
            }
            policyNumbers.push(String(p).trim());
            items.push({ policy_id: body[i].policy_id, policy_number: p, agency_id: body[i].agency_id, carrier_name: body[i].carrier_name, dealcard_id: body[i].dealcard_id });
        }

        try {
            const auditResults = await runCitizensAudit(policyNumbers);

            if (auditResults && auditResults.error) {
                return res.status(200).json({
                    status: "error",
                    message: auditResults.error
                });
            }

            const report = Array.isArray(auditResults) ? auditResults : (auditResults?.report || []);
            const results = items.map((item, idx) => {
                const r = report[idx];
                const success_enum = r ? mapResultToSuccessEnum(r) : "reschedule";
                const isError = r && r.status && String(r.status).toUpperCase().includes("ERROR");
                return {
                    policy_id: item.policy_id,
                    policy_number: item.policy_number,
                    dealcard_id: item.dealcard_id,
                    success_enum: isError ? "reschedule" : success_enum,
                    ...(r && r.notes ? { notes: r.notes } : {})
                };
            });

            return res.status(200).json({
                status: "success",
                message: "",
                results
            });
        } catch (error) {
            console.error("[API] Citizens process (batch) error:", error);
            return res.status(200).json({
                status: "error",
                message: error.message || "Internal error during RPA execution."
            });
        }
    }

    // --- Single: body is one object ---
    const { policy_id, policy_number, agency_id, carrier_name, dealcard_id } = body || {};

    if (!policy_number) {
        return res.status(400).json({
            status: "error",
            message: "policy_number is required."
        });
    }

    const policiesToAudit = [String(policy_number).trim()];
    if (!policiesToAudit[0]) {
        return res.status(400).json({
            status: "error",
            message: "policy_number cannot be empty."
        });
    }

    try {
        const auditResults = await runCitizensAudit(policiesToAudit);

        if (auditResults && auditResults.error) {
            return res.status(200).json({
                status: "error",
                message: auditResults.error
            });
        }

        const resultsArray = Array.isArray(auditResults) ? auditResults : (auditResults?.report || []);
        const singleResult = resultsArray[0];

        if (!singleResult || (singleResult.status && String(singleResult.status).toUpperCase().includes("ERROR"))) {
            return res.status(200).json({
                status: "error",
                message: singleResult?.notes || singleResult?.status || "Policy could not be audited."
            });
        }

        const successEnum = mapResultToSuccessEnum(singleResult);

        return res.status(200).json({
            status: "success",
            message: "",
            success_enum: successEnum,
            ...(dealcard_id != null ? { dealcard_id } : {})
        });
    } catch (error) {
        console.error("[API] Citizens process error:", error);
        return res.status(200).json({
            status: "error",
            message: error.message || "Internal error during RPA execution."
        });
    }
};