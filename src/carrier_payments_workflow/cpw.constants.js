export const PROCESS_BATCH_SIZE = 50;

/** RPA result status enums */
export const RPA_RESULT_STATUS_SUCCESS = ["paid", "unpaid", "assumed", "check_by_agent"];
export const RPA_RESULT_STATUS_ERROR = "error";

/** Carriers supported for CPW cron (must match rpa_creds keys) */
export const CPW_CRON_CARRIERS = ["citizens"];

/** RPA enum -> label_name mapping for adding labels to dealcards */
export const RPA_LABEL_NAME_MAPPING = {
    paid: "Paid",
    assumed: "Assumed RPA",
    unpaid: "Unpaid",
    check_by_agent: "Check by Agent"
};

/** Agency IDs that have RPA labels enabled (only add labels for these) */
export const RPA_LABEL_AGENCY_IDS = ["665f24cd0588157c9f9cd663"];