import dotenv from 'dotenv';
dotenv.config();

export default {
    // CITIZENS CREDENTIALS
    USERNAME: process.env.CITIZENS_USER || 'arogers50', 
    USERNAME2: process.env.CITIZENS_USER || 'aubrey.rogers@weinsuregroup.com', 
    PASSWORD: process.env.CITIZENS_PASS || 'WeRocks1234567!',
    LOGIN_URL: 'https://cag.citizensfla.com/cag/login',

    // DATA TO TEST
    TEST_POLICIES: [
        '08586014', 
        '11532428',
        '15523289',
        '15532064'
    ],

    // SETTINGS
    HEADLESS: false, // Keep false for the demo so you can see it
};