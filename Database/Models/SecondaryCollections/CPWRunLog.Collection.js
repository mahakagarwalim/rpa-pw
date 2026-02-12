'use strict';

import mongoose from 'mongoose';
import { SecondaryConnection } from '../../Config.js';

const Schema = mongoose.Schema;

/**
 * CPW Run Log - Stores run_result from carrier payments workflow.
 * Indexed by session_id and agency_id for quick lookups.
 * Used for daily cron logs and email reports.
 */
const cpwRunLogSchema = new Schema(
    {
        /** Unique session identifier */
        session_id: {
            type: String,
            required: true,
            index: true
        },
        agency_id: {
            type: String,
            required: true,
            index: true
        },
        /** Date when the run was executed (UTC start of day) - for email cron date range queries */
        report_date: {
            type: Date,
            required: true,
            index: true
        },
        /** When the run started */
        run_started_at: {
            type: Date,
            required: true
        },
        /** When the run ended */
        run_ended_at: {
            type: Date,
            required: true
        },
        /** Duration in milliseconds */
        duration_ms: {
            type: Number,
            default: 0
        },
        /** Human-readable duration */
        duration_formatted: {
            type: String,
            default: ''
        },
        agency_name: {
            type: String,
            default: null
        },
        carrier_name: {
            type: String,
            default: null
        },
        /** Total dealcards processed */
        total_dealcards: {
            type: Number,
            default: 0
        },
        /** Total policies completed */
        total_policies: {
            type: Number,
            default: 0
        },
        success: {
            type: Boolean,
            default: false
        },
        /** Policy-level details from analysis (Overall + Agency Wise : Carrier Report) */
        policy_details: [{
            dealcard_id: String,
            insurance_id: String,
            policy_number: String,
            status: String,
            integrity: String,
            balance: String,
            notes: String,
            isPaid: Boolean,
            isAssumed: Boolean,
            assuming_agency: String,
            enum: String
        }],
        /** Raw run_result for full audit trail */
        raw_run_result: {
            type: Schema.Types.Mixed
        }
    },
    {
        timestamps: true
    }
);

/** Compound index for date range + agency queries */
cpwRunLogSchema.index({ report_date: 1, agency_id: 1 });

const CPWRunLogCollection = SecondaryConnection.model('CPWRunLog', cpwRunLogSchema);
export default CPWRunLogCollection;
