import type { Express } from "express";
import { createServer, type Server } from "http";
import { z } from "zod";
import { resultsSchema } from "@shared/schema";
import { appendLeadRow } from "./sheets";

const logLeadRequestSchema = z.object({
  firstName: z.string().min(1).max(100),
  email: z.string().email(),
  results: resultsSchema,
  intake: z.object({
    userAge: z.number().optional(),
    retirementAge: z.number().optional(),
    planningFor: z.string().optional(),
    assetsBucket: z.string().optional(),
    monthlySpending: z.number().optional(),
  }).optional(),
});

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  app.post("/api/log-lead", async (req, res) => {
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

      return res.json({ success: true });
    } catch (error: any) {
      console.error("Error logging lead to Google Sheets:", error);
      return res.status(500).json({
        error: "Failed to log lead",
        message: error.message || "An unexpected error occurred.",
      });
    }
  });

  return httpServer;
}
