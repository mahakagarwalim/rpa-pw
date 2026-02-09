/** modules */
import mongoose from "mongoose";
import axios from "axios";

/** constants */
import { RPA_RESULT_STATUS_SUCCESS, RPA_RESULT_STATUS_ERROR } from "./cpw.constants.js";

/** collection services */
import { aggregate_dealboard_cards, update_one_dealboard_cards, bulk_write_dealboard_cards } from "../../Database/Services/PrimaryDB/DealboardCardsCollection.Services.js";

/** constants */
import { APIS_STORE, BATCH_SIZE, PROCESS_BATCH_SIZE } from "./cpw.constants.js";

export const ObjectId = mongoose.Types.ObjectId;

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
    const now = new Date();
    const today = start_of_day_utc(now);
    const d_minus_15 = new Date(today);
    d_minus_15.setUTCDate(d_minus_15.getUTCDate() - 15);
    const d_plus_5 = new Date(today);
    d_plus_5.setUTCDate(d_plus_5.getUTCDate() + 5);
    const policy_end_date_in_allowed_days = {
        $or: [
            { "quotes.insurance.policy_end_date": { $gte: d_minus_15, $lt: end_of_day_utc(d_minus_15) } },
            { "quotes.insurance.policy_end_date": { $gte: today, $lt: end_of_day_utc(today) } },
            { "quotes.insurance.policy_end_date": { $gte: d_plus_5, $lt: end_of_day_utc(d_plus_5) } }
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
            "quotes.insurance.carrier_id": { $in: db_match_any_id(carrier_ids) },
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
export const get_dealcards_for_carrier_payments = async (agency_id, carrier_ids, skip = 0, limit = BATCH_SIZE, dealboard_ids = []) => {
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