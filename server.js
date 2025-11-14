/** modules */
import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import morgan from "morgan";
// import Redis from 'ioredis';


/** constants */
import {
    ENV, PORT, ENABLE_CRONS, LOCAL,
    SQS_PRODUCER, SQS_CONSUMER, SERVER_ENV
} from "./Constants.js";

/** routes */
import { router } from "./router/router.js";

/** intialization */
const app = express();
// export const redis = new Redis({
//   host: '127.0.0.1',
//   port: 6379,
// });

app.use(express.json());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cors());
app.use("/epic/api", router);
app.use(morgan("tiny"));

/** database */
// import "./database/database.config.js";


/** server */
app.listen(PORT, () => {
    console.info(`\nApplication started in ENV : [ ${ENV} | ${LOCAL && "LOCAL" || "SERVER"} ]`);
    console.info(`\nDatabase connection : [ ${SERVER_ENV} ]`);
    console.info(`\nCrons Enabled : [ ${ENABLE_CRONS} ] | Producers Enabled : [ ${SQS_PRODUCER} ] |  Consumer Enabled : [ ${SQS_CONSUMER} ] `)
    console.info(`\nEPIC <> IM MS : Running on port : [ ${PORT} ]`);
})
