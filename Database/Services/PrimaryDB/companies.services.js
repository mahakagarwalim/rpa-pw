/** collection */
import { companies_collection } from "../../Models/PrimaryCollections/companies.collection.js";

export const find_all_companies = async (filter, project = {}, sort_by = { "_id": -1 }) => {
    const response = await companies_collection.find(filter, project).sort(sort_by).lean();
    return response;
}

/** find one */
export const find_one_companies = async (filter, project = {}, sort_by = { "_id": -1 }) => {
    const response = await companies_collection.findOne(filter, project).sort(sort_by).lean();
    return response;
}

export const update_one_company = async (filter, update = {}, options = {}) => {
    const response = await companies_collection.findOneAndUpdate(filter, update, options).lean();
    return response;
};

export const create_one_company = async (data) => {
    const response = await companies_collection.create(data);
    return response.toObject();
};

export const distinct_companies = async (filter) => {
    const response = await companies_collection.distinct(filter);
    return response;
};

/** distinct _id for companies matching filter (e.g. agency_id, archived, company_name regex) */
export const distinct_company_ids = async (filter = {}) => {
    return companies_collection.distinct("_id", filter);
};