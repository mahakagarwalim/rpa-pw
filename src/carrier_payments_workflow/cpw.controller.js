/** modules */
import { v4 } from "uuid";

/** collection services */
import { find_one_agencies, distinct_agencies } from "../../Database/Services/PrimaryDB/agencies.services.js";
import { distinct_company_ids } from "../../Database/Services/PrimaryDB/companies.services.js";
import { find_one_dealboard_info } from "../../Database/Services/PrimaryDB/dealboard_infos.services.js";
import { find_one_renewal_automation_settings } from "../../Database/Services/PrimaryDB/renewal_automation_settings.services.js";

/** constants */
import { PROCESS_BATCH_SIZE } from "./cpw.constants.js";

/** functions */
import {
    get_dealcards_count_for_carrier_payments,
    get_dealcards_for_carrier_payments,
    build_policy_details_from_batch,
    build_batch_payload,
    update_dealcard_quotes_rpa_bulk,
    total_batches,
    get_rpa_creds_for_carrier,
    get_dealboard_id_for_cpw,
    normalize_dealboard_ids,
    create_cpw_run_log,
    ObjectId
} from "./cpw.functions.js";
import { startCitizensSession, closeCitizensSession, processCitizensPolicyBatch } from "../../rpa/citizens/citizensBot.js";


export const cpw_api_controller = async (req, res) => {
    try {

        const { agency_id, carrier_name, dealboard_id: dealboard_id_from_body } = req.body ?? {};

        if (!agency_id || !carrier_name) {
            return res.status(400).json({ success: false, message: "agency_id and carrier_name are required" });
        }

        const agency_doc = await find_one_agencies(
            { _id: new ObjectId(agency_id), archived: false },
            { rpa_creds: 1, isParentGroupAgency: 1, default_Renewal_board: 1, default_Renewal_stage: 1 }
        );
        if (!agency_doc) {
            return res.status(404).json({ success: false, message: "Agency not found" });
        }

        const rpa_creds = get_rpa_creds_for_carrier(agency_doc, carrier_name);

        if (!rpa_creds?.username || !rpa_creds?.password) {
            return res.status(400).json({
                success: false,
                message: `rpa_creds not found for carrier_name: ${carrier_name}. Ensure agency has rpa_creds.${String(carrier_name).toLowerCase()} with username and password.`
            });
        };

        if (rpa_creds?.is_enabled !== true) {
            return res.status(400).json({
                success: false,
                message: `rpa_creds is not enabled for carrier_name: ${carrier_name}. Ensure agency has rpa_creds.${String(carrier_name).toLowerCase()}.is_enabled set to true.`
            });
        };

        let agency_ids_for_carriers = [new ObjectId(agency_id)];

        if (agency_doc.isParentGroupAgency === true) {
            const child_agency_ids = await distinct_agencies("_id", {
                parentGroupAgencyId: new ObjectId(agency_id),
                archived: false
            });

            if (child_agency_ids?.length) {
                agency_ids_for_carriers = child_agency_ids;
            }
        }

        const carrier_filter = {
            agency_id: agency_ids_for_carriers.length === 1 ? agency_ids_for_carriers[0] : { $in: agency_ids_for_carriers },
            archived: false,
            company_name: new RegExp(String(carrier_name).replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i")
        };

        const carrier_ids = await distinct_company_ids(carrier_filter);

        const carrier_ids_normalized = (carrier_ids ?? []).map((id) => (id?.toString ? id.toString() : id)).filter(Boolean);

        if (carrier_ids_normalized.length === 0) {
            return res.status(404).json({ success: false, message: "No carriers found for the given agency and carrier_name" });
        }

        let dealboard_ids = normalize_dealboard_ids(dealboard_id_from_body);

        if (!dealboard_ids?.length) {
            const renewal_settings = await find_one_renewal_automation_settings({ agency_id: new ObjectId(agency_id), isRenewalAutomationEnabled: true });

            if (!renewal_settings) {
                return res.status(400).json({
                    success: false,
                    message: "renewal_settings not found for the given agency. Ensure renewal automation is enabled for the agency."
                });
            }

            dealboard_ids = get_dealboard_id_for_cpw(agency_doc, renewal_settings);
            if (!dealboard_ids?.length) {
                return res.status(400).json({
                    success: false,
                    message: "dealboard_id could not be resolved from renewal automation settings. Provide dealboard_id in body or configure default_Renewal_board / renewal automation settings for the agency."
                });
            }
        }

        const run_result = await cpw_controller(
            agency_id,
            carrier_ids_normalized,
            dealboard_ids,
            { username: rpa_creds.username, password: rpa_creds.password },
            carrier_name
        );

        if (run_result.session_id && run_result.agency_id) {
            try {                
                if (!run_result.run_ended_at) run_result.run_ended_at = new Date().toISOString();
                await create_cpw_run_log(run_result, new Date(run_result.run_ended_at));
            } catch (e) {
                console.error('[CPW] Failed to save run log:', e);
            }
        };

        return res.status(200).json(run_result);
    } catch (error) {
        console.error("[CPW] cpw_api_controller error:", error);
        res.status(500).json({ success: false, message: "Internal server error", error: error?.message });
    }
};


export const cpw_controller = async (agency_id, carrier_ids, dealboard_id, rpa_creds, carrier_name) => {
    const dealboard_ids = normalize_dealboard_ids(dealboard_id);

    const run_started_at = new Date().toISOString();
    let batch_id = v4();

    const run_result = {
        batch_id,
        run_started_at,
        agency_id: agency_id ?? null,
        carrier_ids: carrier_ids ?? null,
        dealboard_id: dealboard_ids?.[0] ?? null,
        dealboard_ids: dealboard_ids ?? [],
        agency_name: null,
        carrier_name: carrier_name,
        dealboard_name: null,
        dealboard_names: [],
        policies_processed_count: 0,
        errors: [],
        success: false,
        total_count: 0,
        dealcards: [],
        analysis: {},
        session_id: null,
        start_session_response: null,
        end_session_response: null
    };

    const add_error = (at, message, details = null) => {
        run_result.errors.push({ at, message, details });
    };

    try {
        if (!agency_id) {
            add_error("validation", "agency_id is required");
            console.warn("[CPW] Validation failed: agency_id is missing");
            run_result.run_ended_at = new Date().toISOString();
            return run_result;
        }
        if (!carrier_ids) {
            add_error("validation", "carrier_ids is required");
            console.warn("[CPW] Validation failed: carrier_ids is missing");
            run_result.run_ended_at = new Date().toISOString();
            return run_result;
        }
        if (!dealboard_ids?.length) {
            add_error("validation", "dealboard_id is required (single id or array of ids)");
            console.warn("[CPW] Validation failed: dealboard_id is missing");
            run_result.run_ended_at = new Date().toISOString();
            return run_result;
        }

        const [agency_details, ...dealboard_details_list] = await Promise.all([
            find_one_agencies({ _id: agency_id }, { _id: 1, agency_name: 1 }),
            ...dealboard_ids.map((id) => find_one_dealboard_info({ _id: id }, { _id: 1, dealboard_name: 1 }))
        ]);

        if (!agency_details) add_error("validation", "agency not found", { field: "agency_id" });
        const valid_boards = dealboard_details_list.filter(Boolean);
        if (valid_boards.length === 0) {
            add_error("validation", "no valid dealboard found for given dealboard_id(s)", { field: "dealboard_id" });
        }
        if (valid_boards.length < dealboard_ids.length) {
            add_error("validation", "some dealboard_id(s) not found", { field: "dealboard_id", requested: dealboard_ids });
        }

        if (run_result.errors.length > 0) {
            run_result.errors.forEach(({ message }) => console.warn("[CPW] Validation failed:", message));
            run_result.run_ended_at = new Date().toISOString();
            return run_result;
        }

        const valid_dealboard_ids = valid_boards.map((d) => d?._id?.toString?.() ?? d?._id).filter(Boolean);

        run_result.agency_name = agency_details?.agency_name ?? null;
        run_result.dealboard_name = valid_boards[0]?.dealboard_name ?? null;
        run_result.dealboard_names = valid_boards.map((d) => d?.dealboard_name ?? null);

        let total_count;

        try {
            total_count = await get_dealcards_count_for_carrier_payments(agency_id, carrier_ids, valid_dealboard_ids);
        } catch (e) {
            add_error("count", "Failed to get dealcards count", e?.message ?? String(e));
            console.error("[CPW] get_dealcards_count error:", e);
            run_result.run_ended_at = new Date().toISOString();
            return run_result;
        }

        run_result.total_count = total_count;

        if (total_count === 0) {
            run_result.success = true;
            run_result.run_ended_at = new Date().toISOString();
            console.log("[CPW] No documents to process.");
            return run_result;
        }

        const start_result = await startCitizensSession(agency_id, carrier_name, rpa_creds);

        run_result.start_session_response = start_result;
        if (start_result.status !== "success" || !start_result.session_id) {
            add_error("session", "start_session did not return success or session_id");
            run_result.run_ended_at = new Date().toISOString();
            return run_result;
        }
        const session_id = start_result.session_id;
        run_result.session_id = session_id;
        console.log("[CPW] Session started | session_id:", session_id);

        const num_batches = total_batches(total_count, PROCESS_BATCH_SIZE);
        console.log("[CPW] Total dealcards to process:", total_count, "| batches:", num_batches, "| batch_size:", PROCESS_BATCH_SIZE);

        const all_dealcards = [];
        let batch_index = 0;

        for (let skip = 0; skip < total_count; skip += PROCESS_BATCH_SIZE) {
            const batch_num = batch_index + 1;
            try {
                const batch = await get_dealcards_for_carrier_payments(agency_id, carrier_ids, skip, PROCESS_BATCH_SIZE, valid_dealboard_ids);
                all_dealcards.push(...batch);
                const policy_details = build_policy_details_from_batch(batch);
                const payload = build_batch_payload(agency_id, session_id, policy_details);
                console.log("[CPW] Batch", batch_num, "of", num_batches, "| skip:", skip, "| count:", payload.policies.length);

                const batch_result = await processCitizensPolicyBatch(agency_id, session_id, start_result, payload.policies);

                run_result.analysis[batch_index] = batch_result;

                await update_dealcard_quotes_rpa_bulk(batch_result?.policies ?? batch_result ?? []);
            } catch (e) {
                add_error("batch", `Error processing batch ${batch_index} (skip ${skip})`, e?.message ?? String(e));
                console.error("[CPW] Batch error:", e);
            }
            batch_index += 1;        
        }

        const end_result = await closeCitizensSession(start_result, session_id, agency_id);
        run_result.end_session_response = end_result;

        if (end_result.status !== "success") {
            add_error("session", "end_session did not return success");
        }
        console.log("[CPW] Session ended | session_id:", session_id);

        run_result.policies_processed_count = all_dealcards.length;
        run_result.dealcards = all_dealcards;
        run_result.success = run_result.errors.length === 0;
        run_result.run_ended_at = new Date().toISOString();
        console.log("[CPW] Run complete | policies_processed_count:", run_result.policies_processed_count, "| success:", run_result.success);

        console.log("[CPW] Entire batch run details:", JSON.stringify(run_result, null, 2));

        return run_result;



    } catch (error) {
        add_error("run", "Internal server error", error?.message ?? String(error));
        run_result.run_ended_at = new Date().toISOString();
        console.error("[CPW] cpw_controller error:", error);
        return run_result;
    }
};

