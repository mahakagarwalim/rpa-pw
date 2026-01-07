import axios from 'axios';

/**
 * Sends an email notification using the IM API endpoint
 * Matches the logic in Functions/SendEmail.Function.js
 */
export const sendEmailReport = async (data) => {
  try {
    let options = {
      method: "post",
      url: "https://demo.insuredmine.com/api/qqcats/send-email-notifications",
      data,
    };

    const response = await axios(options);
    console.log(`   [Email] Report sent successfully. Status: ${response.status}`);
    return response;
  } catch (error) {
    console.error("   [Email Error]", error.response?.data || error.message);
    return error.response?.data;
  }
};