// Vercel serverless function: POST /api/log-lead
// Appends assessment lead data to the Google Sheet.
// Mirrors the Express route in server/routes.ts (used for local dev).
import { z } from "zod";

// Minimal request/response types (avoids needing the @vercel/node package).
interface VercelRequest {
  method?: string;
  body?: unknown;
}
interface VercelResponse {
  status(code: number): VercelResponse;
  json(body: unknown): VercelResponse;
}
import { resultsSchema } from "../shared/schema";
import { appendLeadRow } from "../server/sheets";

const logLeadRequestSchema = z.object({
  firstName: z.string().min(1).max(100),
  email: z.string().email(),
  results: resultsSchema,
  intake: z
    .object({
      userAge: z.number().optional(),
      retirementAge: z.number().optional(),
      planningFor: z.string().optional(),
      assetsBucket: z.string().optional(),
      monthlySpending: z.number().optional(),
    })
    .optional(),
});

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const parsed = logLeadRequestSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        error: "Invalid request data",
        details: parsed.error.flatten(),
      });
    }

    const { firstName, email, results, intake } = parsed.data;

    await appendLeadRow(firstName, email, results, intake);

    return res.status(200).json({ success: true });
  } catch (error: any) {
    console.error("Error logging lead to Google Sheets:", error);
    return res.status(500).json({
      error: "Failed to log lead",
      message: error?.message || "An unexpected error occurred.",
    });
  }
}
