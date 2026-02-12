/** Model */
import LabelsCollection from "../../Models/PrimaryCollections/Labels.Collection.js";

/** Find Many */
export const find_many_labels = async (filter, project = {}, sort_by = { _id: 1 }) => {
    const response = await LabelsCollection.find(filter, project).sort(sort_by).lean();
    return response;
};

/** Update One */
export const UpdateOneLabel = async (Query, Update, Options = {}) => {
    try {
        let Response = await LabelsCollection.findOneAndUpdate(
            Query,
            Update,
            Options
        ).lean();
        return Response;
    } catch (e) {
        console.error("Error in UpdateOneLabel", e);
        throw e;
    }
};
