/** collection */
import { agencies_collection } from "../../models/primary_collections/agencies.collection.js";


/** find one */
export const find_one_agencies = async (filter, project = {}, sort_by = { "_id": -1 }) => {
    const response = await agencies_collection.findOne(filter, project).sort(sort_by).lean();
    return response;
}

/** find many */
export const find_many_agencies = async (filter, project = {}, sort_by = { "_id": -1 }, skip = 0, limit = 0) => {
    const response = await agencies_collection.find(filter, project).sort(sort_by).skip(skip).limit(limit).lean();
    return response;
}

/** update one */
export const update_one_agencies = async (filter, update = {}, options = {}) => {
    const response = await agencies_collection.findOneAndUpdate(filter, update, options).lean();
    return response;
};

/** update many */
export const update_many_agencies = async (filter, update = {}, options = {}) => {
    const response = await agencies_collection.updateMany(filter, update, options).lean();
    return response;
};

/** distinct - returns array of distinct values for key matching filter */
export const distinct_agencies = async (key, filter = {}) => {
    return agencies_collection.distinct(key, filter);
};