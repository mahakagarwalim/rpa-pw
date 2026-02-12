/** modules */
import express from "express";
import { auditPolicies, carrierProcess, citizensSessionStart, citizensSessionBatch, citizensSessionClose } from "../controllers/rpaController.js";
import { cpw_api_controller } from "../src/carrier_payments_workflow/cpw.controller.js";
import { run_cpw_daily_cron, run_cpw_email_cron } from "../src/carrier_payments_workflow/cpw.cron.js";
import {
    cpw_report_test_json,
    cpw_report_test_html,
    cpw_report_test_send
} from "../src/carrier_payments_workflow/cpw.reportController.js";


/** initialization */
export const router = express.Router();

// /** route */
// import { epic_im_router } from "../src/data_sync/data_sync.index.js"

// /** epic <> im */
// router.use('/epic_im', epic_im_router);

// RPA Routes
router.post('/rpa/audit', auditPolicies);
router.post('/rpa/process', carrierProcess);

// Test API: Citizens session (3 steps — use from Postman in order)
router.post('/rpa/citizens/session/start', citizensSessionStart);
router.post('/rpa/citizens/session/batch', citizensSessionBatch);
router.post('/rpa/citizens/session/close', citizensSessionClose);


/** RPA : Carrier Payments Workflow */
router.post('/rpa/carrier-payments/workflow', cpw_api_controller);

/** CPW Report Test APIs */
router.get('/rpa/carrier-payments/report/test', cpw_report_test_json);
router.get('/rpa/carrier-payments/report/test/html', cpw_report_test_html);
router.post('/rpa/carrier-payments/report/test/send', cpw_report_test_send);

/** CPW Cron triggers (call from external scheduler e.g. cron, AWS EventBridge) */
router.post('/rpa/carrier-payments/cron/daily', async (req, res) => {
    try {
        const result = await run_cpw_daily_cron();
        res.status(200).json({ success: true, ...result });
    } catch (error) {
        console.error('[CPW Cron] Error:', error);
        res.status(500).json({ success: false, message: error?.message ?? 'Cron failed' });
    }
});

router.post('/rpa/carrier-payments/cron/email', async (req, res) => {
    try {
        const result = await run_cpw_email_cron();
        res.status(200).json({ success: true, ...result });
    } catch (error) {
        console.error('[CPW Email Cron] Error:', error);
        res.status(500).json({ success: false, message: error?.message ?? 'Email cron failed' });
    }
});