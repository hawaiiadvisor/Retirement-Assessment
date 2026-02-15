// Google Sheets integration via Replit connector
import { google } from 'googleapis';

let connectionSettings: any;

async function getAccessToken() {
  if (connectionSettings && connectionSettings.settings.expires_at && new Date(connectionSettings.settings.expires_at).getTime() > Date.now()) {
    return connectionSettings.settings.access_token;
  }
  
  const hostname = process.env.REPLIT_CONNECTORS_HOSTNAME;
  const xReplitToken = process.env.REPL_IDENTITY 
    ? 'repl ' + process.env.REPL_IDENTITY 
    : process.env.WEB_REPL_RENEWAL 
    ? 'depl ' + process.env.WEB_REPL_RENEWAL 
    : null;

  if (!xReplitToken) {
    throw new Error('X_REPLIT_TOKEN not found for repl/depl');
  }

  connectionSettings = await fetch(
    'https://' + hostname + '/api/v2/connection?include_secrets=true&connector_names=google-sheet',
    {
      headers: {
        'Accept': 'application/json',
        'X_REPLIT_TOKEN': xReplitToken
      }
    }
  ).then(res => res.json()).then(data => data.items?.[0]);

  const accessToken = connectionSettings?.settings?.access_token || connectionSettings.settings?.oauth?.credentials?.access_token;

  if (!connectionSettings || !accessToken) {
    throw new Error('Google Sheet not connected');
  }
  return accessToken;
}

function getOAuth2Client(accessToken: string) {
  const oauth2Client = new google.auth.OAuth2();
  oauth2Client.setCredentials({ access_token: accessToken });
  return oauth2Client;
}

async function getUncachableGoogleSheetClient() {
  const accessToken = await getAccessToken();
  return google.sheets({ version: 'v4', auth: getOAuth2Client(accessToken) });
}

let cachedSpreadsheetId: string | null = null;

const HEADERS = [
  'Email',
  'Date Completed',
  'Age',
  'Retirement Age',
  'Planning For',
  'Marital Status',
  'Total Assets',
  'Annual Income',
  'Monthly Spending',
  'Success Probability',
  'Verdict',
  'Top Risks'
];

async function getOrCreateSpreadsheet(): Promise<string> {
  if (process.env.GOOGLE_SHEET_ID) {
    return process.env.GOOGLE_SHEET_ID;
  }

  if (cachedSpreadsheetId) {
    return cachedSpreadsheetId;
  }

  const sheets = await getUncachableGoogleSheetClient();

  const createRes = await sheets.spreadsheets.create({
    requestBody: {
      properties: { title: 'Retirement Assessment Responses' },
      sheets: [{ properties: { title: 'Responses' } }]
    }
  });

  cachedSpreadsheetId = createRes.data.spreadsheetId!;
  console.log(`[GoogleSheets] Created new spreadsheet: ${cachedSpreadsheetId}`);
  console.log(`[GoogleSheets] Set GOOGLE_SHEET_ID=${cachedSpreadsheetId} to reuse this sheet across restarts`);

  await sheets.spreadsheets.values.update({
    spreadsheetId: cachedSpreadsheetId,
    range: 'Responses!A1',
    valueInputOption: 'RAW',
    requestBody: {
      values: [HEADERS]
    }
  });

  return cachedSpreadsheetId;
}

async function getFirstSheetName(sheets: any, spreadsheetId: string): Promise<string> {
  try {
    const meta = await sheets.spreadsheets.get({
      spreadsheetId,
      fields: 'sheets.properties.title'
    });
    const firstSheet = meta.data.sheets?.[0]?.properties?.title;
    return firstSheet || 'Sheet1';
  } catch {
    return 'Sheet1';
  }
}

async function ensureHeaders(sheets: any, spreadsheetId: string, sheetName: string) {
  try {
    const res = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: `${sheetName}!A1:L1`,
    });
    if (!res.data.values || res.data.values.length === 0) {
      await sheets.spreadsheets.values.update({
        spreadsheetId,
        range: `${sheetName}!A1`,
        valueInputOption: 'RAW',
        requestBody: {
          values: [HEADERS]
        }
      });
    }
  } catch (err) {
    console.error('[GoogleSheets] Error ensuring headers:', err);
  }
}

export async function appendAssessmentToSheet(data: {
  email: string;
  intakeJson: any;
  resultsJson: any;
}) {
  try {
    const spreadsheetId = await getOrCreateSpreadsheet();
    const sheets = await getUncachableGoogleSheetClient();

    const isAutoCreated = !process.env.GOOGLE_SHEET_ID;
    let sheetName: string;

    if (isAutoCreated) {
      sheetName = 'Responses';
    } else {
      sheetName = await getFirstSheetName(sheets, spreadsheetId);
      await ensureHeaders(sheets, spreadsheetId, sheetName);
    }

    const intake = data.intakeJson || {};
    const results = data.resultsJson || {};

    const topRisks = (results.risks || [])
      .slice(0, 3)
      .map((r: any) => r.title || r.label || r)
      .join('; ');

    const row = [
      data.email || '',
      new Date().toISOString(),
      intake.user_age || intake.age || '',
      intake.retirement_age || '',
      intake.planning_for || '',
      intake.marital_status || '',
      intake.total_investable_assets || intake.total_assets || '',
      intake.annual_income || intake.gross_income || '',
      intake.monthly_spending || intake.estimated_monthly_spending || '',
      results.successProbability || results.probability || '',
      results.verdict || '',
      topRisks
    ];

    await sheets.spreadsheets.values.append({
      spreadsheetId,
      range: `${sheetName}!A:L`,
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values: [row]
      }
    });

    console.log(`[GoogleSheets] Appended row for ${data.email}`);
  } catch (err) {
    console.error('[GoogleSheets] Error appending to sheet:', err);
  }
}
