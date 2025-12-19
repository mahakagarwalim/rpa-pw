import mongoose from "mongoose";
import { SECONDARY_DB_URI } from "../../Constants.js";

// Connect to the Secondary DB specifically for logs
const secondaryConnection = mongoose.createConnection(SECONDARY_DB_URI);

const rpaLogSchema = new mongoose.Schema({
    dealcard_id: { type: String, required: true },
    carrier: { type: String, default: "Citizens" },
    status: { 
        type: String, 
        enum: ["SUCCESS", "PARTIAL_SUCCESS", "FAILED"], 
        default: "SUCCESS" 
    },
    executed_by: { type: String, default: "SYSTEM_API" },
    execution_time_ms: { type: Number },
    
    // Detailed results for every policy checked
    policies_audited: [{
        policy_number: String,
        status: String,      // e.g. "Active", "Not Found"
        integrity: String,   // e.g. "SECURE", "CARRIER CHANGED"
        balance: String,     // e.g. "$450.00"
        notes: String
    }],
    
    // Store raw JSON report for debugging
    raw_data: { type: mongoose.Schema.Types.Mixed }, 
}, { 
    timestamps: { createdAt: "created_at", updatedAt: "updated_at" } 
});

export const RPALog = secondaryConnection.model("RPALog", rpaLogSchema);