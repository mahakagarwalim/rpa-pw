import dotenv from 'dotenv';
dotenv.config();

export default {
    // CITIZENS CREDENTIALS
    USERNAME: process.env.PROGRESSIVE_USER,
    PASSWORD: process.env.PROGRESSIVE_PASS,
    LOGIN_URL: 'https://www.foragentsonly.com/',


    // SETTINGS
    HEADLESS: false, // flase= visible, true = browser not visible
};
