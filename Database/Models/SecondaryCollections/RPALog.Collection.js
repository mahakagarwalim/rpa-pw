import mongoose from 'mongoose';
import { SecondaryConnection } from "../Config.js"; // Using your existing Config

const Schema = mongoose.Schema;

const rpaLogSchema = new Schema({
    dealcard_id: {
        type: ObjectID,
        required: true
    },
    carrier: {
        type: String,
        default: "Citizens"
    },
    status: {
        type: String,
        enum: ["SUCCESS", "PARTIAL_SUCCESS", "FAILED"],
        default: "SUCCESS"
    },
    executed_by: {
        type: String,
        default: "SYSTEM_API"
    },
    execution_time_ms: {
        type: Number
    },
    policies_audited: [{
        policy_number: String,
        status: String,
        integrity: String,
        balance: String,
        notes: String
    }],
    raw_data: {
        type: Schema.Types.Mixed
    },
}, {
    timestamps: true
});

const RPALogCollection = SecondaryConnection.model('RPALog', rpaLogSchema);
export default RPALogCollection;