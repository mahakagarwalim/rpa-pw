'use strict';

import CPWRunLogCollection from '../../Models/SecondaryCollections/CPWRunLog.Collection.js';

/** Create one CPW run log (Mongo only) */
export const create_one_cpw_run_log = async (doc) => {
    const log = await CPWRunLogCollection.create(doc);
    return log;
};

/** Find many CPW run logs (Mongo only) */
export const find_many_cpw_run_logs = async (filter = {}, sort = { report_date: -1, run_started_at: -1 }) => {
    const logs = await CPWRunLogCollection.find(filter).sort(sort).lean();
    return logs;
};
