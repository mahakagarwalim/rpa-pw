/** modules */
import mongoose from "mongoose";
import axios from "axios";
import moment from "moment";

/** constants */
import { RPA_RESULT_STATUS_SUCCESS, RPA_RESULT_STATUS_ERROR } from "./cpw.constants.js";

/** collection services */
import { aggregate_dealboard_cards, update_one_dealboard_cards, bulk_write_dealboard_cards } from "../../Database/Services/PrimaryDB/DealboardCardsCollection.Services.js";
import { find_many_agencies } from "../../Database/Services/PrimaryDB/agencies.services.js";
import { create_one_cpw_run_log, find_many_cpw_run_logs } from "../../Database/Services/SecondaryDB/CPWRunLogCollection.Services.js";

/** constants */
import { PROCESS_BATCH_SIZE, CPW_CRON_CARRIERS } from "./cpw.constants.js";

export const ObjectId = mongoose.Types.ObjectId;

/**
 * Get agencies that have valid rpa_creds for at least one CPW carrier.
 * Returns { agency_id, agency_name, carriers: [{ carrier_name, rpa_creds }] }.
 */
export const get_agencies_with_rpa_creds = async () => {
    const agencies = await find_many_agencies(
        { archived: false, rpa_creds: { $exists: true, $ne: null, $type: "object" } },
        { _id: 1, agency_name: 1, rpa_creds: 1, isParentGroupAgency: 1, default_Renewal_board: 1, default_Renewal_stage: 1 },
        {},
        0,
        0
    );
    const result = [];
    for (const a of agencies) {
        const carriers = [];
        for (const carrier_name of CPW_CRON_CARRIERS) {
            const creds = get_rpa_creds_for_carrier(a, carrier_name);
            if (creds?.is_enabled === true && creds?.username && creds?.password) {
                carriers.push({ carrier_name, rpa_creds: creds });
            }
        }
        if (carriers.length > 0) {
            result.push({
                agency_id: a._id?.toString?.() ?? a._id,
                agency_name: a.agency_name ?? null,
                agency_doc: a,
                carriers
            });
        }
    }
    return result;
};

/**
 * Resolve rpa_creds from agency document: rpa_creds = { "citizen": { username, password }, "progressive": {}, ... }.
 * Picks the object key that matches carrier_name (case-insensitive).
 */
export const get_rpa_creds_for_carrier = (agency_doc, carrier_name) => {
    const rpa_creds = agency_doc?.rpa_creds;
    if (!rpa_creds || typeof rpa_creds !== "object" || !carrier_name) return null;
    const key = Object.keys(rpa_creds).find((k) => k.toLowerCase() === String(carrier_name).toLowerCase());
    return key ? rpa_creds[key] : null;
};

/** Normalize DB value when reading (quotes.insurance._id etc can be string or ObjectId in DB) */
const db_value_to_string = (v) => (v == null ? "" : typeof v === "string" ? v : (v.toString?.() ?? String(v)));

/** For $match on a field that may be stored as ObjectId or string in DB */
const db_match_any_id = (ids) => {
    if (!Array.isArray(ids) || ids.length === 0) return [];
    const out = new Set();
    ids.forEach((id) => {
        if (id == null) return;
        try { out.add(new ObjectId(id)); } catch (_) {}
        out.add(db_value_to_string(id));
    });
    return [...out];
};

/**
 * Normalize dealboard_id to a unique array of string ids.
 * Accepts single ObjectId/string or array of ObjectIds/strings.
 * @param {string|ObjectId|Array<string|ObjectId>} dealboard_id
 * @returns {string[]}
 */
export const normalize_dealboard_ids = (dealboard_id) => {
    if (dealboard_id == null) return [];
    const raw = Array.isArray(dealboard_id) ? dealboard_id : [dealboard_id];
    const ids = new Set();
    raw.forEach((id) => {
        if (id == null) return;
        const s = id?.toString?.() ?? String(id);
        if (s) ids.add(s);
    });
    return [...ids];
};

/** Start of day UTC for a date */
const start_of_day_utc = (d) => {
    const x = new Date(d);
    x.setUTCHours(0, 0, 0, 0);
    return x;
};

/** End of day UTC = start of next day */
const end_of_day_utc = (d) => {
    const x = new Date(d);
    x.setUTCDate(x.getUTCDate() + 1);
    x.setUTCHours(0, 0, 0, 0);
    return x;
};

/**
 * Build the $match conditions used after $unwind for carrier payments:
 * - carrier_id in list
 * - quotes.quoteStatus: "inProcess"
 * - quotes.insurance.policy_end_date in [today-15, today, today+5] (any time on those days)
 * - (carrier_payment_rpa_status != true) OR (carrier_payment_rpa_status == true AND rpa_result.result == "unpaid")
 */
const cpw_quotes_match = (carrier_ids) => {
    const today = moment.utc().startOf("day");
    const d_minus_15_start = today.clone().subtract(15, "days");
    const d_minus_15_end = today.clone().subtract(14, "days");
    const today_end = today.clone().add(1, "day");
    const d_plus_5_start = today.clone().add(5, "days");
    const d_plus_5_end = today.clone().add(6, "days");
    const policy_end_date_in_allowed_days = {
        $or: [
            { "quotes.insurance.policy_end_date": { $gte: d_minus_15_start.toDate(), $lt: d_minus_15_end.toDate() } },
            { "quotes.insurance.policy_end_date": { $gte: today.toDate(), $lt: today_end.toDate() } },
            { "quotes.insurance.policy_end_date": { $gte: d_plus_5_start.toDate(), $lt: d_plus_5_end.toDate() } }
        ]
    };
    const re_fetch_if_unpaid = {
        $or: [
            { "quotes.insurance.carrier_payment_rpa_status": { $ne: true } },
            { $and: [{ "quotes.insurance.carrier_payment_rpa_status": true }, { "quotes.insurance.rpa_result.result": "unpaid" }] }
        ]
    };
    return {
        $match: {
            "quotes.insurance.company_id": { $in: db_match_any_id(carrier_ids) },
            "quotes.quoteStatus": "inProcess",
            $and: [ policy_end_date_in_allowed_days, re_fetch_if_unpaid ]
        }
    };
};

/**
 * Get total count of dealcards matching carrier payments criteria.
 * @param {string|ObjectId} agency_id
 * @param {Array<string|ObjectId>} carrier_ids
 * @param {Array<string|ObjectId>} [dealboard_ids] - optional; filter by dealboard_info (board ids)
 * @returns {Promise<number>}
 */
export const get_dealcards_count_for_carrier_payments = async (agency_id, carrier_ids, dealboard_ids = []) => {
    try {
        const match = { agency_id: new ObjectId(agency_id), archived: false, createdFor: "renewal_automation" };
        if (Array.isArray(dealboard_ids) && dealboard_ids.length > 0) {
            match.dealboard_info = { $in: db_match_any_id(dealboard_ids) };
        }
        const pipeline = [
            { $match: match },
            { $unwind: "$quotes" },
            cpw_quotes_match(carrier_ids),
            { $count: "total" }
        ];
        const result = await aggregate_dealboard_cards(pipeline);
        return result?.[0]?.total ?? 0;
    } catch (e) {
        console.error("[CPW] Error in get_dealcards_count_for_carrier_payments:", e);
        throw e;
    }
};

/**
 * Fetch one batch of dealcards for carrier payments workflow.
 * @param {string|ObjectId} agency_id
 * @param {Array<string|ObjectId>} carrier_ids
 * @param {number} skip
 * @param {number} limit
 * @param {Array<string|ObjectId>} [dealboard_ids] - optional; filter by dealboard_info (board ids)
 * @returns {Promise<Array>}
 */
export const get_dealcards_for_carrier_payments = async (agency_id, carrier_ids, skip = 0, limit = PROCESS_BATCH_SIZE, dealboard_ids = []) => {
    try {
        const match = { agency_id: new ObjectId(agency_id), archived: false, createdFor: "renewal_automation" };
        if (Array.isArray(dealboard_ids) && dealboard_ids.length > 0) {
            match.dealboard_info = { $in: db_match_any_id(dealboard_ids) };
        }
        const pipeline = [
            { $match: match },
            { $unwind: "$quotes" },
            cpw_quotes_match(carrier_ids),
            { $skip: skip },
            { $limit: limit },
            { $project: { _id: 1, "quotes.insurance.policy_number": 1, "quotes.insurance._id": 1, "quotes.insurance.policyRenewalStatus": 1, "quotes.insurance.policy_end_date": 1 } }
        ];
        return aggregate_dealboard_cards(pipeline);
    } catch (e) {
        console.error("[CPW] Error in get_dealcards_for_carrier_payments:", e);
        throw e;
    }
};

/**
 * Update one dealcard quote: set quotes.insurance.rpa_result and carrier_payment_rpa_status = true.
 * @param {string} dealcard_id
 * @param {string} insurance_id - quotes.insurance._id (string or ObjectId in DB)
 * @param {object} rpa_result
 */
export const update_dealcard_quote_rpa = async (dealcard_id, insurance_id, rpa_result) => {
    if (!dealcard_id || (insurance_id !== 0 && !insurance_id)) return;
    try {
        const oid = (() => { try { return new ObjectId(insurance_id); } catch (_) { return null; } })();
        const str = db_value_to_string(insurance_id);
        const array_filter = oid != null ? { $or: [ { "q.insurance._id": oid }, { "q.insurance._id": str } ] } : { "q.insurance._id": str };
        const filter = { _id: new ObjectId(dealcard_id) };
        const update = { $set: { "quotes.$[q].insurance.rpa_result": rpa_result, "quotes.$[q].insurance.carrier_payment_rpa_status": true } };
        const options = { arrayFilters: [ array_filter ] };
        await update_one_dealboard_cards(filter, update, options);
    } catch (e) {
        console.error("[CPW] update_dealcard_quote_rpa error:", dealcard_id, insurance_id, e);
        throw e;
    }
};

/**
 * Bulk update: set rpa_result and carrier_payment_rpa_status for many policies in one DB round trip.
 * @param {Array<{ dealcard_id: string, insurance_id: string, rpa_result: object }>} policies
 */
export const update_dealcard_quotes_rpa_bulk = async (policies) => {
    if (!Array.isArray(policies) || policies.length === 0) return;
    const ops = [];
    for (const p of policies) {
        if (!p.dealcard_id || (p.insurance_id !== 0 && !p.insurance_id)) continue;
        const oid = (() => { try { return new ObjectId(p.insurance_id); } catch (_) { return null; } })();
        const str = db_value_to_string(p.insurance_id);
        const array_filter = oid != null ? { $or: [ { "q.insurance._id": oid }, { "q.insurance._id": str } ] } : { "q.insurance._id": str };
        ops.push({
            updateOne: {
                filter: { _id: new ObjectId(p.dealcard_id) },
                update: { $set: { "quotes.$[q].insurance.rpa_result": p.rpa_result, "quotes.$[q].insurance.carrier_payment_rpa_status": true } },
                arrayFilters: [ array_filter ]
            }
        });
    }
    if (ops.length === 0) return;
    try {
        await bulk_write_dealboard_cards(ops);
    } catch (e) {
        console.error("[CPW] update_dealcard_quotes_rpa_bulk error:", e);
        throw e;
    }
};

/**
 * Build policy_details array from a batch of dealcard docs (projected).
 * @param {Array} batch - batch from get_dealcards_for_carrier_payments
 * @returns {Array<{ insurance_id: string, policy_number: string, dealcard_id: string }>}
 */
export const build_policy_details_from_batch = (batch) => {
    return (batch || []).map((doc) => ({
        insurance_id: db_value_to_string(doc.quotes?.insurance?._id),
        policy_number: db_value_to_string(doc.quotes?.insurance?.policy_number),
        dealcard_id: db_value_to_string(doc._id)
    }));
};



/**
 * Build full payload for carrier payments API.
 * @param {string} agency_id
 * @param {string} carrier_name
 * @param {{ user_name: string, password: string }} creds
 * @param {Array} batch - batch from get_dealcards_for_carrier_payments
 * @param {boolean} [last_page=false] - set true on the last batch of the run
 * @returns {{ agency_id, carrier_name, creds, policy_details, last_page? }}
 */
export const build_carrier_payments_payload = (agency_id, carrier_name, creds, batch, last_page = false) => {
    const policy_details = build_policy_details_from_batch(batch);
    const payload = {
        agency_id,
        carrier_name,
        creds: {
            user_name: creds?.user_name ?? creds?.username ?? "",
            password: creds?.password ?? ""
        },
        policy_details
    };
    if (last_page) payload.last_page = true;
    return payload;
};

/**
 * Call carrier payments API with payload. Returns response data; store in your own object.
 * @param {object} payload - from build_carrier_payments_payload
 * @returns {Promise<object>} API response (parsed JSON or error object)
 */
export const call_carrier_payments_api = async (payload) => {
    try {
       
        const options = {
            url: APIS_STORE.CARRIER_PAYMENTS.URL,
            method: APIS_STORE.CARRIER_PAYMENTS.METHOD,
            data: payload
        };
        const response = await axios(options);
        return response;
    } catch (e) {
        console.error("[CPW] Error calling carrier payments API:", e);
        throw e;
    }
};

export const total_batches = (total, batch_size) => Math.ceil(total / batch_size);



/**
 * Process a batch of policies. Returns success or error shape with rpa_result per policy.
 * @param {object} payload - { agency_id, session_id, policies: [{ insurance_id, policy_number, dealcard_id }] }
 * @returns {Promise<{ status: "success"|"error", session_id, agency_id, policies: Array }>}
 */
export const process_batch_policies = async (payload) => {
    const { agency_id, session_id, policies } = payload;
    const list = (policies || []).map((item) => {
        const hash = (item.policy_number || "").split("").reduce((acc, c) => acc + c.charCodeAt(0), 0);
        const is_error = hash % 10 === 0;
        const result_enum = is_error
            ? RPA_RESULT_STATUS_ERROR
            : RPA_RESULT_STATUS_SUCCESS[hash % RPA_RESULT_STATUS_SUCCESS.length];
        return {
            insurance_id: item.insurance_id ?? "",
            policy_number: item.policy_number ?? "",
            dealcard_id: item.dealcard_id ?? "",
            rpa_result: {
                status: is_error ? "error" : "success",
                result: result_enum,
                message: is_error ? "Simulated error" : "OK"
            }
        };
    });
    const has_error = list.some((p) => p.rpa_result.status === "error");
    return {
        status: has_error ? "error" : "success",
        session_id,
        agency_id: agency_id ?? "",
        policies: list
    };
};

/**
 * Build payload for processing a batch: agency_id, session_id, policies (insurance_id, policy_number, dealcard_id).
 * @param {string} agency_id
 * @param {string} session_id
 * @param {Array<{ insurance_id: string, policy_number: string, dealcard_id: string }>} policy_details
 * @returns {{ agency_id: string, session_id: string, policies: Array }}
 */
export const build_batch_payload = (agency_id, session_id, policy_details) => ({
    agency_id,
    session_id,
    policies: (policy_details ?? []).map((p) => ({
        insurance_id: p.insurance_id ?? "",
        policy_number: p.policy_number ?? "",
        dealcard_id: p.dealcard_id ?? ""
    }))
});

/**
 * Start a processing session. Call when count is known and we are about to process documents.
 * @param {string} agency_id
 * @param {string} carrier_name
 * @param {{ user_name: string, password: string }} creds
 * @returns {Promise<{ status: "success", session_id: string }>}
 */
export const start_session = async (agency_id, carrier_name, creds) => {
    const { v4 } = await import("uuid");
    const session_id = v4();
    console.log("[CPW] start_session | agency_id:", agency_id, "| carrier_name:", carrier_name, "| session_id:", session_id);
    return { status: "success", session_id };
};

/**
 * Process one batch of policies. Payload: agency_id, session_id, policies (insurance_id, policy_number, dealcard_id).
 * Returns { status, session_id, agency_id, policies } with rpa_result on each policy.
 * @param {string} agency_id
 * @param {string} session_id
 * @param {Array<{ insurance_id: string, policy_number: string, dealcard_id: string }>} policies
 * @returns {Promise<{ status: "success"|"error", session_id, agency_id, policies: Array }>}
 */
export const process_batch = async (agency_id, session_id, policies) => {
    const payload = { agency_id, session_id, policies };
    return process_batch_policies(payload);
};

/**
 * End the processing session. Call once all batches are processed.
 * @param {string} session_id
 * @param {string} agency_id
 * @returns {Promise<{ status: "success" }>}
 */
export const end_session = async (session_id, agency_id) => {
    console.log("[CPW] end_session | session_id:", session_id, "| agency_id:", agency_id);
    return { status: "success" };
};


/** Map automationBasedOn to the settings array key on renewal_automation_settings */
const AUTOMATION_BASED_ON_TO_ARRAY = {
    default: "defaultSettings",
    policytype: "policyTypeSettings",
    category: "categorySettings",
    department: "departmentSettings",
    branch: "branchSettings",
    division: "divisionSettings"
};

/**
 * Resolve dealboard_ids for CPW from agency and renewal_automation_settings.
 * 1. Check if enabled (isRenewalAutomationEnabled).
 * 2. Use automationBasedOn to pick the right settings array.
 * 3. Loop each object: if isCustomizedBoard use customRenewalBoard, else use agency default_Renewal_board.
 * 4. Dedupe and return clean list.
 * @param {object} agency_doc - agency with default_Renewal_board
 * @param {object|null} renewal_settings - renewal_automation_settings document
 * @returns {string[]} - unique dealboard_ids
 */
export const get_dealboard_id_for_cpw = (agency_doc, renewal_settings) => {
    const ids = new Set();

    if (!agency_doc || !renewal_settings) return [];

    if (renewal_settings.isRenewalAutomationEnabled !== true) return [];

    const based_on = renewal_settings.automationBasedOn ?? "default";
    const array_key = AUTOMATION_BASED_ON_TO_ARRAY[based_on] ?? "defaultSettings";
    const arr = renewal_settings[array_key];

    if (!Array.isArray(arr) || arr.length === 0) return [];

    for (const entry of arr) {
        const id =
            entry?.isCustomizedBoard === true
                ? entry.customRenewalBoard
                : agency_doc.default_Renewal_board;

        const id_str = id?.toString?.() ?? (id ?? null);
        if (id_str) ids.add(id_str);
    }

    return [...ids];
};

/** ========== CPW Run Log (functions only; services do Mongo) ========== */

/**
 * Flatten analysis object into policy_details array.
 * analysis = { "0": [...], "1": [...] }
 */
const flatten_analysis_to_policy_details = (analysis) => {
    if (!analysis || typeof analysis !== 'object') return [];
    const details = [];
    const keys = Object.keys(analysis).sort((a, b) => Number(a) - Number(b));
    for (const k of keys) {
        const batch = analysis[k];
        const arr = Array.isArray(batch) ? batch : batch?.policies;
        if (!Array.isArray(arr)) continue;
        for (const p of arr) {
            const rpa = p?.rpa_result ?? {};
            details.push({
                dealcard_id: p?.dealcard_id ?? '',
                insurance_id: p?.insurance_id ?? '',
                policy_number: p?.policy_number ?? rpa?.policy_number ?? '',
                status: rpa?.status ?? '',
                integrity: rpa?.integrity ?? '',
                balance: rpa?.balance ?? '',
                notes: rpa?.notes ?? '',
                isPaid: rpa?.isPaid ?? false,
                isAssumed: rpa?.isAssumed ?? false,
                assuming_agency: rpa?.assuming_agency ?? '',
                enum: rpa?.enum ?? ''
            });
        }
    }
    return details;
};

/**
 * Build CPW Run Log document from run_result.
 * @param {object} run_result - From cpw_controller
 * @param {Date} run_ended_at - When the run finished
 * @returns {object} Document to save
 */
export const build_cpw_run_log_doc = (run_result, run_ended_at) => {
    const run_started_at = run_result.run_started_at ? new Date(run_result.run_started_at) : new Date();
    const ended = run_ended_at ? new Date(run_ended_at) : new Date();
    const duration_ms = ended.getTime() - run_started_at.getTime();

    let duration_formatted = '';
    if (duration_ms >= 60000) {
        const mins = Math.floor(duration_ms / 60000);
        const secs = Math.floor((duration_ms % 60000) / 1000);
        duration_formatted = `${mins}m ${secs}s`;
    } else {
        duration_formatted = `${Math.floor(duration_ms / 1000)}s`;
    }

    const report_date = start_of_day_utc(run_started_at);
    const policy_details = flatten_analysis_to_policy_details(run_result.analysis);

    return {
        session_id: run_result.session_id ?? '',
        agency_id: String(run_result.agency_id ?? ''),
        report_date,
        run_started_at,
        run_ended_at: ended,
        duration_ms,
        duration_formatted,
        agency_name: run_result.agency_name ?? null,
        carrier_name: run_result.carrier_name ?? null,
        total_dealcards: run_result.dealcards?.length ?? run_result.total_count ?? 0,
        total_policies: run_result.policies_processed_count ?? run_result.total_count ?? 0,
        success: run_result.success ?? false,
        policy_details,
        raw_run_result: run_result
    };
};

/**
 * Save a CPW run log. Builds doc and calls service.
 * @param {object} run_result - From cpw_controller
 * @param {Date} [run_ended_at] - When run ended (default: now)
 */
export const create_cpw_run_log = async (run_result, run_ended_at = new Date()) => {
    const doc = build_cpw_run_log_doc(run_result, run_ended_at);
    const log = await create_one_cpw_run_log(doc);
    return log;
};

/**
 * Get Mongo filter for date range.
 * @param {Date} start_date - Start of range (UTC)
 * @param {Date} end_date - End of range (UTC) - inclusive
 */
export const get_cpw_run_log_date_filter = (start_date, end_date) => {
    const start = start_of_day_utc(start_date);
    const end = new Date(end_date);
    end.setUTCHours(23, 59, 59, 999);
    return { report_date: { $gte: start, $lte: end } };
};

/**
 * Find logs for a date range (inclusive of start of day).
 * @param {Date} start_date - Start of range (UTC)
 * @param {Date} end_date - End of range (UTC) - inclusive
 */
export const find_cpw_run_logs_by_date_range = async (start_date, end_date) => {
    const filter = get_cpw_run_log_date_filter(start_date, end_date);
    const logs = await find_many_cpw_run_logs(filter, { report_date: -1, run_started_at: -1 });
    return logs;
};

/**
 * Find logs for today (UTC).
 */
export const find_cpw_run_logs_today = async () => {
    const today = new Date();
    const logs = await find_cpw_run_logs_by_date_range(today, today);
    return logs;
};