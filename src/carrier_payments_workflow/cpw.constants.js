export const PROCESS_BATCH_SIZE = 50;

/** RPA result status enums */
export const RPA_RESULT_STATUS_SUCCESS = ["paid", "unpaid", "assumed", "check_by_agent"];
export const RPA_RESULT_STATUS_ERROR = "error";

/** Carriers supported for CPW cron (must match rpa_creds keys) */
export const CPW_CRON_CARRIERS = ["citizens"];