/** collection */
import { renewal_automation_settings_collection } from "../../Models/PrimaryCollections/renewal_automation_settings.collection.js";

/** find one by filter (e.g. { agency_id }) */
export const find_one_renewal_automation_settings = async (filter, project = {}, sort_by = { _id: -1 }) => {
    const response = await renewal_automation_settings_collection
        .findOne(filter, project)
        .sort(sort_by)
        .lean();
    return response;
};
