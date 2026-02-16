// import fs from 'fs/promises';
// import path from 'path';
import { google } from 'googleapis';


// SCOPES: Read-only access to Gmail
// const SCOPES = ['https://www.googleapis.com/auth/gmail.readonly'];

// PATHS: Keys stored in root
// const TOKEN_PATH = path.join(process.cwd(), 'token.json');
// const CREDENTIALS_PATH = path.join(process.cwd(), 'credentials.json');

// async function loadSavedCredentialsIfExist() {
//   try {
//     const content = await fs.readFile(TOKEN_PATH);
//     const credentials = JSON.parse(content);
//     return google.auth.fromJSON(credentials);
//   } catch (err) {
//     return null;
//   }
// }

// async function saveCredentials(client) {
//   const content = await fs.readFile(CREDENTIALS_PATH);
//   const keys = JSON.parse(content);
//   const key = keys.installed || keys.web;
//   const payload = JSON.stringify({
//     type: 'authorized_user',
//     client_id: key.client_id,
//     client_secret: key.client_secret,
//     refresh_token: client.credentials.refresh_token,
//   });
//   await fs.writeFile(TOKEN_PATH, payload);
// }

// async function authorize() {
//   let client = await loadSavedCredentialsIfExist();
//   if (client) return client;

//   console.log("⚠️  FIRST TIME AUTH: Opening browser to login to Google...");
//   client = await authenticate({
//     scopes: SCOPES,
//     keyfilePath: CREDENTIALS_PATH,
//   });

//   if (client.credentials) {
//     await saveCredentials(client);
//     console.log("✅ Token saved to token.json");
//   }
//   return client;
// }

async function getAuthClient() {
  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET
  );

  oauth2Client.setCredentials({
    refresh_token: process.env.GOOGLE_REFRESH_TOKEN,
  });

  return oauth2Client;
}


export async function getLatestCitizensCode() {
  try {
    const auth = await getAuthClient();
    const gmail = google.gmail({ version: 'v1', auth });
    const query = 'subject:"verification code" newer_than:1m';

    console.log(`   [Gmail] Waiting 20s for email propagation...`);
    await new Promise(resolve => setTimeout(resolve, 20000));
    console.log(`   [Gmail] Searching: ${query}`);

    const res = await gmail.users.messages.list({ userId: 'me', q: query, maxResults: 1 });
    const messages = res.data.messages;
    
    if (!messages || messages.length === 0) {
      console.log("   [Gmail] No recent emails found.");
      return null;
    }

    const message = await gmail.users.messages.get({ userId: 'me', id: messages[0].id });
    
    // Try Snippet
    let match = message.data.snippet.match(/\b\d{6}\b/);
    if (match) return match[0];

    // Try Body
    let encodedBody = '';
    if (message.data.payload.parts) {
        for (const part of message.data.payload.parts) {
            if (part.mimeType === 'text/plain' && part.body.data) {
                encodedBody = part.body.data; break;
            }
        }
    } else {
        encodedBody = message.data.payload.body.data;
    }
    
    if (encodedBody) {
        const body = Buffer.from(encodedBody, 'base64').toString('utf-8');
        match = body.match(/\b\d{6}\b/);
        if (match) return match[0];
    }
    
    return null;

  } catch (error) {
    console.error("   [Gmail Error]", error.message);
    return null;
  }
}