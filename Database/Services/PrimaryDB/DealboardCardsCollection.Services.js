/** Modules */
import mongoose from 'mongoose';
import DealBoardCardsCollection from "../../Models/PrimaryCollections/DealBoardCards.Collection.js";

const ObjectId = mongoose.Types.ObjectId;

/**
 * Fetch policies for renewal automation from DealBoardCards
 * Returns data in the format matching test.js file structure
 * @param {string} dealcardId - The dealcard ID to fetch policies for
 * @returns {Promise<Array>} Array of policy objects with dealboard_id, policy_number, and policyRenewalStatus
 */
export const getPoliciesForRenewalAutomation = async (dealcardId) => {
    try {
        // Match user's exact aggregation pipeline requirements
        const pipeline = [
            {
                $match: {
                    // _id: new ObjectId(dealcardId),
                    agency_id: new ObjectId(),
                    archived: false,
                    createdFor: "renewal_automation"
                }
            },
            { $unwind: "$quotes" },
            {
                $match: {
                    "quotes.insurance.company_id": new ObjectId("667435529edb96faebdf45d7") // Citizens carrier ID
                }
            },
            {
                $project: {
                    _id: 1,
                    "quotes.insurance.policy_number": 1,
                    "quotes.insurance.policyRenewalStatus": 1
                }
            }
        ];

        const results = await DealBoardCardsCollection.aggregate(pipeline);

        // Transform to match test.js format: [{ dealboard_id, policy_number, policyRenewalStatus? }]
        return results.map(item => {
            const policyObj = {
                dealboard_id: item._id.toString(),
                policy_number: item.quotes?.insurance?.policy_number
            };
            
            // Only add policyRenewalStatus if it exists
            if (item.quotes?.insurance?.policyRenewalStatus) {
                policyObj.policyRenewalStatus = item.quotes.insurance.policyRenewalStatus;
            }
            
            return policyObj;
        }).filter(p => p.policy_number); // Filter out entries without policy numbers

    } catch (e) {
        console.error("Error in getPoliciesForRenewalAutomation:", e);
        throw e;
    }
};