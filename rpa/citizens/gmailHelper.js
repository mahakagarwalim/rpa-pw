import fs from 'fs';
import path from 'path';
import { google } from 'googleapis';
// import { authenticate } from '@google-cloud/local-auth';

const SCOPES = ['https://www.googleapis.com/auth/gmail.readonly'];
const TOKEN_PATH = path.resolve('token.json');
const CREDENTIALS_PATH = path.resolve('credentials.json');

// --- AUTHENTICATION ---
async function loadSavedCredentialsIfExist() {
  try {
    const content = await fs.promises.readFile(TOKEN_PATH);
    const credentials = JSON.parse(content);
    return google.auth.fromJSON(credentials);
  } catch (err) {
    return null;
  }
}

async function saveCredentials(client) {
  const content = await fs.promises.readFile(CREDENTIALS_PATH);
  const keys = JSON.parse(content);
  const key = keys.installed || keys.web;
  const payload = JSON.stringify({
    type: 'authorized_user',
    client_id: key.client_id,
    client_secret: key.client_secret,
    refresh_token: client.credentials.refresh_token,
  });
  await fs.promises.writeFile(TOKEN_PATH, payload);
}

export async function getLatestCitizensCode() {
  let client = await loadSavedCredentialsIfExist();
  
  // If no token, we skip auth to allow manual fallback in the main script
  if (!client) {
      console.log("   [Gmail API] No token found. Manual entry required.");
      return null;
  }

  const gmail = google.gmail({ version: 'v1', auth: client });
  const query = 'from:donotreply@citizensfla.com subject:"verification code" newer_than:2m';
  
  try {
      const res = await gmail.users.messages.list({ userId: 'me', q: query });
      const messages = res.data.messages;
      
      if (!messages || messages.length === 0) return null;

      const message = await gmail.users.messages.get({ userId: 'me', id: messages[0].id });
      const snippet = message.data.snippet;
      const match = snippet.match(/\b\d{6}\b/);
      
      return match ? match[0] : null;
  } catch (error) {
      console.error("Gmail API Error:", error.message);
      return null;
  }
}