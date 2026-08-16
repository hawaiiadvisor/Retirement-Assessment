import { google } from "googleapis";
import type { ResultsData } from "../shared/schema";

/**
 * Google Sheets client authenticated with a service account.
 * Required environment variables:
 *   GOOGLE_SERVICE_ACCOUNT_EMAIL - the service account's email address
 *   GOOGLE_PRIVATE_KEY           - the service account's private key (the full
 *                                  "-----BEGIN PRIVATE KEY-----..." string)
 *   GOOGLE_SHEET_ID              - the spreadsheet to append lead rows to
 * The spreadsheet must be shared (Editor) with the service account email.
 */
function getGoogleSheetClient() {
  const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const key = process.env.GOOGLE_PRIVATE_KEY;

  if (!email || !key) {
    throw new Error(
      "Google Sheets is not configured. Set GOOGLE_SERVICE_ACCOUNT_EMAIL and GOOGLE_PRIVATE_KEY."
    );
  }

  const auth = new google.auth.JWT({
    email,
    // Env var UIs often store newlines as literal \n - convert them back.
    key: key.replace(/\\n/g, "\n"),
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });

  return google.sheets({ version: "v4", auth });
}

function getVerdictLabel(verdict: string): string {
  if (verdict === "on_track") return "On Track";
  if (verdict === "at_risk") return "At Risk";
  return "Borderline";
}

function getPlanningForLabel(value: string | undefined): string {
  if (value === "couple") return "Couple";
  if (value === "self") return "Individual";
  return value ?? "";
}

function getMaritalStatusLabel(value: string | undefined): string {
  if (value === "couple") return "Married";
  if (value === "self") return "Single";
  return value ?? "";
}

function getAssetsBucketLabel(value: string | undefined): string {
  switch (value) {
    case "less_500k": return "Under $500K";
    case "500k_1m":  return "$500K–$1M";
    case "1m_2m":    return "$1M–$2M";
    case "2m_3m":    return "$2M–$3M";
    case "3m_plus":  return "$3M+";
    case "not_sure": return "Not sure";
    default:         return value ?? "";
  }
}

function formatDateCompleted(): string {
  return new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export interface IntakeSummary {
  userAge?: number;
  retirementAge?: number;
  planningFor?: string;
  assetsBucket?: string;
  monthlySpending?: number;
}

const HEADERS = [
  "Name",
  "Email",
  "Date Completed",
  "Age",
  "Retirement Age",
  "Planning For",
  "Marital Status",
  "Total Assets",
  "Annual Income",
  "Monthly Spending",
  "Success Probability",
  "Verdict",
  "Top Risks",
];

export async function appendLeadRow(
  firstName: string,
  email: string,
  results: ResultsData,
  intake?: IntakeSummary
): Promise<void> {
  const sheetId = process.env.GOOGLE_SHEET_ID;
  if (!sheetId) {
    throw new Error("GOOGLE_SHEET_ID environment variable is not set");
  }

  console.log("[Sheets] Starting appendLeadRow for", email);

  const sheets = getGoogleSheetClient();
  const range = "A:M";

  const existing = await sheets.spreadsheets.values.get({
    spreadsheetId: sheetId,
    range: "A1",
  });

  const firstCell = existing.data.values?.[0]?.[0];
  if (!firstCell) {
    await sheets.spreadsheets.values.append({
      spreadsheetId: sheetId,
      range,
      valueInputOption: "USER_ENTERED",
      requestBody: { values: [HEADERS] },
    });
    console.log("[Sheets] Header row written");
  }

  const annualIncome = results.simulation_details.guaranteed_income_at_start;
  const topRisks = results.top_3_risks.map((r) => r.title).join("; ");

  const row = [
    firstName,
    email,
    formatDateCompleted(),
    intake?.userAge ?? "",
    intake?.retirementAge ?? "",
    getPlanningForLabel(intake?.planningFor),
    getMaritalStatusLabel(intake?.planningFor),
    getAssetsBucketLabel(intake?.assetsBucket),
    annualIncome,
    intake?.monthlySpending ?? "",
    results.success_probability,
    getVerdictLabel(results.verdict),
    topRisks,
  ];

  await sheets.spreadsheets.values.append({
    spreadsheetId: sheetId,
    range,
    valueInputOption: "USER_ENTERED",
    requestBody: { values: [row] },
  });

  console.log("[Sheets] Lead row written for", email);
}
