import RPALogCollection from "../../Models/SecondaryCollections/RPALog.Collection.js";

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