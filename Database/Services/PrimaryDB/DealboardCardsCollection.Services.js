/** Modules */
import mongoose from 'mongoose';
import DealBoardCardsCollection from "../../Services/PrimaryDB/DealBoardCardsCollection.Services.js"; // Ensure correct model import
import RPALogCollection from "../../Models/SecondaryCollections/RPALog.Collection.js";

const ObjectId = mongoose.Types.ObjectId;


/** Create One Log */
export const CreateRPALog = async (data) => {
    try {
        const newLog = await RPALogCollection.create(data);
        return newLog;
    } catch (error) {
        console.error('Error in CreateRPALog:', error);
        throw error;
    }
};

/** Find One Log */
export const FindOneRPALog = async (query, select = {}) => {
    try {
        const log = await RPALogCollection.findOne(query, select).lean();
        return log;
    } catch (error) {
        console.error('Error in FindOneRPALog:', error);
        throw error;
    }
};

export const getPoliciesForRenewalAutomation = async (dealcardId) => {
    try {
        const pipeline = [
            {
                $match: {
                    _id: new ObjectId(dealcardId), // Match the dealcard ID passed from frontend
                    archived: false,
                    createdFor: "renewal_automation" // Uncomment if this filter is strictly required
                }
            },
            { $unwind: "$quotes" },
            {
                $match: {
                    "quotes.insurance.company_id": new ObjectId("667435529edb96faebdf45d7") // Filter for specific carrier (Citizens?)
                }
            },
            {
                $project: {
                    _id: 1,
                    "policy_number": "$quotes.insurance.policy_number", // Flattening for easier access
                    "policyRenewalStatus": "$quotes.insurance.policyRenewalStatus"
                }
            }
        ];

        const results = await DealBoardCardsCollection.aggregate(pipeline);

        // Return cleaned array of objects: [{ policy_number: "123", status: "active" }, ...]
        return results.map(item => ({
            policy_number: item.policy_number,
            policyRenewalStatus: item.policyRenewalStatus
        })).filter(p => p.policy_number); // Filter out empty policy numbers

    } catch (e) {
        console.error("Error in getPoliciesForRenewalAutomation", e);
        throw e;
    }
};