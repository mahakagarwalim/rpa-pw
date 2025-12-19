/** Modules */
import Mongoose from "mongoose";

/** Constants */
import { PRIMARY_DB_URL, SECONDARY_DB_URL, } from "../Constants.js";

/** Establishing DB Connections */
if (!PRIMARY_DB_URL || !SECONDARY_DB_URL) throw { Message: "Error in DB Connection, No DBURLs found" };
export let PrimaryConnection = Mongoose.createConnection(PRIMARY_DB_URL);
export let SecondaryConnection = Mongoose.createConnection(SECONDARY_DB_URL);

/** DB Connection Status Logs */
PrimaryConnection.on("connected", async function () {
    console.info(`\nPrimaryDB is Connected!`);
});
SecondaryConnection.on("connected", function () {
    console.info(`\nSecondaryDB is Connected!`);
});
PrimaryConnection.on('error', (err) => {
    console.error('\nError in PrimaryDB connection:', err);
});
SecondaryConnection.on('error', (err) => {
    console.error('\nError in SecondaryDB connection:', err);
});


