/** collection */
import CategoriesCollection from '../../Models/PrimaryCollections/categories.collection.js';

/** find one */
export const find_one_categories = async (filter, project = {}, sort_by = { _id: -1 }) => {
    const response = await CategoriesCollection.findOne(filter, project).sort(sort_by).lean();
    return response;
};

/** find many */
export const find_many_categories = async (filter, project = {}, sort_by = { _id: -1 }, skip = 0, limit = 0) => {
    const response = await CategoriesCollection.find(filter, project).sort(sort_by).skip(skip).limit(limit).lean();
    return response;
};

/** distinct _id for categories matching filter */
export const distinct_category_ids = async (filter = {}) => {
    const response = await CategoriesCollection.distinct('_id', filter);
    return response;
};
