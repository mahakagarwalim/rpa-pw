import fs from 'fs/promises';
import path from 'path';
import { google } from 'googleapis';
import { authenticate } from '@google-cloud/local-auth';

// SCOPES: Read-only access to Gmail to find the code
const SCOPES = ['https://www.googleapis.com/auth/gmail.readonly'];

// PATHS: Where to store keys. 
// Using process.cwd() ensures it looks in the root of your project 'rpa-pw'.
const TOKEN_PATH = path.join(process.cwd(), 'token.json');
const CREDENTIALS_PATH = path.join(process.cwd(), 'credentials.json');

/**
 * Reads previously authorized credentials from the save file.
 */
async function loadSavedCredentialsIfExist() {
  try {
    const content = await fs.readFile(TOKEN_PATH);
    const credentials = JSON.parse(content);
    return google.auth.fromJSON(credentials);
  } catch (err) {
    return null;
  }
}

/**
 * Serializes credentials to a file compatible with GoogleAuth.fromJSON.
 */
async function saveCredentials(client) {
  const content = await fs.readFile(CREDENTIALS_PATH);
  const keys = JSON.parse(content);
  const key = keys.installed || keys.web;
  const payload = JSON.stringify({
    type: 'authorized_user',
    client_id: key.client_id,
    client_secret: key.client_secret,
    refresh_token: client.credentials.refresh_token,
  });
  await fs.writeFile(TOKEN_PATH, payload);
}

/**
 * Main Authorization Function
 */
async function authorize() {
  let client = await loadSavedCredentialsIfExist();
  if (client) {
    return client;
  }
  
  console.log("⚠️  FIRST TIME AUTH: Opening browser to login to Google...");
  
  // This opens the local browser for OAuth2
  client = await authenticate({
    scopes: SCOPES,
    keyfilePath: CREDENTIALS_PATH,
  });
  
  if (client.credentials) {
    await saveCredentials(client);
    console.log("✅ Token saved to token.json");
  }
  return client;
}

/**
 * Helper to decode Gmail body
 */
function getBody(payload) {
  let encodedBody = '';
  
  // Gmail API returns parts for multipart emails (Text/HTML)
  if (payload.parts) {
    for (const part of payload.parts) {
      if (part.mimeType === 'text/plain' && part.body && part.body.data) {
        encodedBody = part.body.data;
        break; // Prefer plain text
      }
    }
    // Fallback to HTML if plain text not found
    if (!encodedBody) {
        for (const part of payload.parts) {
            if (part.mimeType === 'text/html' && part.body && part.body.data) {
                encodedBody = part.body.data;
                break;
            }
        }
    }
  } else {
    encodedBody = payload.body.data;
  }
  
  if (encodedBody) {
    return Buffer.from(encodedBody, 'base64').toString('utf-8');
  }
  return '';
}

/**
 * EXPORTED FUNCTION: Get the latest code
 */
export async function getLatestCitizensCode() {
  try {
    // 1. Authenticate
    const auth = await authorize();
    const gmail = google.gmail({ version: 'v1', auth });

    // 2. Define Search Query
    const query = 'subject:"verification code" newer_than:5m';
    
    // --- DELAY: Wait for email to arrive ---
    console.log("   [Gmail] Waiting 10s for email propagation...");
    await new Promise(resolve => setTimeout(resolve, 15000));

    console.log(`   [Gmail] Searching: ${query}`);

    // 3. List Messages
    const res = await gmail.users.messages.list({
      userId: 'me',
      q: query,
      maxResults: 1
    });

    const messages = res.data.messages;
    
    if (!messages || messages.length === 0) {
      console.log("   [Gmail] No recent emails found.");
      return null;
    }

    // 4. Get Content of Latest Message
    const message = await gmail.users.messages.get({
      userId: 'me',
      id: messages[0].id,
    });

    // Try Snippet First (Fastest)
    let match = message.data.snippet.match(/\b\d{6}\b/);
    if (match) return match[0];

    // Fallback: Parse Full Body (Robust)
    console.log("   [Gmail] Snippet failed. Parsing full body...");
    const body = getBody(message.data.payload);
    match = body.match(/\b\d{6}\b/);
    
    if (match) {
      return match[0];
    } else {
      console.log("   [Gmail] Email found, but no 6-digit code detected in body.");
      return null;
    }

  } catch (error) {
    console.error("   [Gmail Error]", error.message);
    if (error.code === 'ENOENT') {
      console.error("   ❌ MISSING credentials.json! Please download it from Google Cloud.");
    }
    return null;
  }
}