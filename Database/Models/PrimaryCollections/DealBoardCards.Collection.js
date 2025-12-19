import mongoose from 'mongoose';
import { PrimaryConnection } from "../../Config.js";

const Schema = mongoose.Schema;

// DealBoardCards Schema - matches your aggregation structure
const dealBoardCardsSchema = new Schema({
    _id: Schema.Types.ObjectId,
    archived: { type: Boolean, default: false },
    createdFor: String,
    quotes: [{
        insurance: {
            company_id: Schema.Types.ObjectId,
            policy_number: String,
            policyRenewalStatus: String
        }
    }]
}, {
    collection: 'dealboardcards', // MongoDB collection name
    timestamps: true
});

const DealBoardCardsCollection = PrimaryConnection.model('DealBoardCards', dealBoardCardsSchema);
export default DealBoardCardsCollection;

