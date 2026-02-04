/** modules */
import express from "express";
import { auditPolicies, carrierProcess, citizensSessionStart, citizensSessionBatch, citizensSessionClose } from "../controllers/rpaController.js";


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