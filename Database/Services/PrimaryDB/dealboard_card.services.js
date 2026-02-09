/** collection */
import { dealboard_card_collection } from "../../models/primary_collections/dealboard_card.collection.js";


/** find one */
export const find_one_dealboard_card = async (filter, project = {}, sort_by = { "_id": -1 }) => {
    const response = await dealboard_card_collection.findOne(filter, project).sort(sort_by).lean();
    return response;
}

export const update_one_dealboard_card = async (filter, update = {}, options = {}) => {
    const response = await dealboard_card_collection.findOneAndUpdate(filter, update, options).lean();
    return response;
};

export const get_distinct_dealboard_cards = async (key, filter = {}) => {
    const response = await dealboard_card_collection.distinct(key, filter).lean();
    return response;
}