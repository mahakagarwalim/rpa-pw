/** modules */
import express from "express";
import { auditPolicies, citizensProcess } from "../controllers/rpaController.js";


/** initialization */
export const router = express.Router();

// /** route */
// import { epic_im_router } from "../src/data_sync/data_sync.index.js"

// /** epic <> im */
// router.use('/epic_im', epic_im_router);

// RPA Routes
router.post('/rpa/audit', auditPolicies);
router.post('/rpa/citizens/process', citizensProcess);
