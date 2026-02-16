import dotenv from 'dotenv';
dotenv.config();

export default {
    // CITIZENS CREDENTIALS
    USERNAME: process.env.CITIZENS_USER,
    PASSWORD: process.env.CITIZENS_PASS,
    LOGIN_URL: 'https://www.citizensfla.com/group/agents',


    // SETTINGS
    HEADLESS: true, // false= visible, true = browser not visible
};
