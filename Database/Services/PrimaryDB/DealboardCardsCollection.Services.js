/** Modules */
import mongoose from 'mongoose';
import { DealBoardCardsCollection } from "../../Models/PrimaryCollections/DealBoardCards.Collection.js";

const ObjectId = mongoose.Types.ObjectId;

/**
 * Fetch policies for renewal automation from DealBoardCards
 * Returns data in the format matching test.js file structure
 * @param {string} dealcardId - The dealcard ID to fetch policies for (optional if agencyId is provided)
 * @param {string} agencyId - The agency ID to fetch policies for (optional if dealcardId is provided)
 * @returns {Promise<Array>} Array of policy objects with dealboard_id, policy_number, and policyRenewalStatus
 */
export const getPoliciesForRenewalAutomation = async (dealcardId, agencyId) => {
    try {
        // Build match condition: use _id if present, otherwise use agency_id
        const matchCondition = {
            archived: false,
            createdFor: "renewal_automation"
        };

        if (dealcardId) {
            matchCondition._id = new ObjectId(dealcardId);
        } else if (agencyId) {
            matchCondition.agency_id = new ObjectId(agencyId);
        } else {
            throw new Error("Either dealcardId or agencyId must be provided");
        }

        // Match user's exact aggregation pipeline requirements
        const pipeline = [
            {
                $match: matchCondition
            },
            { $unwind: "$quotes" },
            {
                $match: {
                    "quotes.insurance.company_id": new ObjectId("678df11677c70c40f4c449b5") // Citizens carrier ID
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

/** aggregate - caller builds pipeline */
export const aggregate_dealboard_cards = async (pipeline) => {
    return DealBoardCardsCollection.aggregate(pipeline).exec();
};

/** updateOne - caller builds filter, update, options (e.g. arrayFilters) */
export const update_one_dealboard_cards = async (filter, update = {}, options = {}) => {
    return DealBoardCardsCollection.updateOne(filter, update, options);
};

/** bulkWrite - caller builds operations array (e.g. [{ updateOne: { filter, update, arrayFilters } }, ...]) */
export const bulk_write_dealboard_cards = async (operations) => {
    if (!Array.isArray(operations) || operations.length === 0) return { ok: 1, nModified: 0 };
    return DealBoardCardsCollection.bulkWrite(operations);
};