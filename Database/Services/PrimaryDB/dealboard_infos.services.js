/** collection */
import { dealboard_info_collection } from "../../Models/PrimaryCollections/dealboards_infos.collection.js";


/** find one */
export const find_one_dealboard_info = async (filter, project = {}, sort_by = { "_id": -1 }) => {
    const response = await dealboard_info_collection.findOne(filter, project).sort(sort_by).lean();
    return response;
}

export const update_one_dealboard_info = async (filter, update = {}, options = {}) => {
    const response = await dealboard_info_collection.findOneAndUpdate(filter, update, options).lean();
    return response;
};

export const get_distinct_dealboard_info = async (key, filter = {}) => {
    const response = await dealboard_info_collection.distinct(key, filter).lean();
    return response;
}