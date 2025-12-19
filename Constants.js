/** modules */
import dotenv from "dotenv";
import mongoose from "mongoose";

/** intialization */
dotenv.config({ quiet: true });

const {

    /** DB */
    TEST_PRIMARY_DB_URI,
    TEST_SECONDARY_DB_URI,
    PROD_PRIMARY_DB_URI,
    PROD_SECONDARY_DB_URI,

    /** AWS */
    AWS_ACCESS_KEY_ID,
    AWS_SECRET_ACCESS_KEY_ID,
    AWS_REGION,
    EPIC_IM_QUEUE_DEV,
    EPIC_IM_QUEUE_REGION

} = process.env;

/** SETUP */
export const PORT = process.env.PORT || 5000;
export const ENV = process.env.ENV || "DEVELOPMENT";
export const SERVER_ENV = process.env.SERVER_ENV || "DEVELOPMENT";
export const LOCAL = process.env.LOCAL && process.env.LOCAL === "TRUE" && true || false;
export const ENABLE_CRONS = process.env.ENABLE_CRONS && process.env.ENABLE_CRONS === "TRUE" && true || false;
export const SQS_PRODUCER = process.env.SQS_PRODUCER && process.env.SQS_PRODUCER === "TRUE" && true || false;
export const SQS_CONSUMER = process.env.SQS_CONSUMER && process.env.SQS_CONSUMER === "TRUE" && true || false;

/** DB URI */
export const PRIMARY_DB_URI = PROD_PRIMARY_DB_URI;
export const SECONDARY_DB_URI = PROD_SECONDARY_DB_URI;


/** AWS CONFIG */
export const AWS_CONFIG = {
    accessKeyId: AWS_ACCESS_KEY_ID,
    secretAccessKey: AWS_SECRET_ACCESS_KEY_ID,
    region: AWS_REGION
};
