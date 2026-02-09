/** APIs */
export const APIS_STORE = {
    "CARRIER_PAYMENTS": {
        "URL": "https://example.com/api/carrier-payments",
        "METHOD": "post"
    }
};
export const BATCH_SIZE = 100;
/** Number of documents per batch when processing policies */
export const PROCESS_BATCH_SIZE = 50;

/** RPA result status enums */
export const RPA_RESULT_STATUS_SUCCESS = ["paid", "unpaid", "lost", "assumed", "check_by_agent"];
export const RPA_RESULT_STATUS_ERROR = "error";