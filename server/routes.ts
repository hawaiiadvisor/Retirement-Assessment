import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { intakeSchema } from "@shared/schema";
import { runMonteCarloSimulation } from "./simulation";
import { z } from "zod";
import { generateMagicToken, hashToken, isTokenExpired } from "./magic-token";
import { sendMagicLinkEmail } from "./email";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {

  app.post("/api/assessments", async (req, res) => {
    try {
      const { email } = req.body;

      const assessment = await storage.createAssessment({
        status: 'draft',
        currentStep: 1,
        customerEmail: email || null
      });

      const { token, hash, expiresAt } = generateMagicToken();

      await storage.updateAssessment(assessment.id, {
        magicTokenHash: hash,
        magicTokenExpiresAt: expiresAt,
      });

      const protocol = req.headers['x-forwarded-proto'] || req.protocol || 'https';
      const host = req.headers.host || req.get('host');
      const magicLink = `${protocol}://${host}/access/${token}`;

      if (email) {
        await sendMagicLinkEmail(email, magicLink, true);
      }

      res.json({ assessmentId: assessment.id, magicLink });
    } catch (error) {
      console.error("Error creating assessment:", error);
      res.status(500).json({ message: "Failed to create assessment" });
    }
  });

  app.get("/api/assessments/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const assessment = await storage.getAssessment(id);

      if (!assessment) {
        return res.status(404).json({ message: "Assessment not found" });
      }

      res.json(assessment);
    } catch (error) {
      console.error("Error fetching assessment:", error);
      res.status(500).json({ message: "Failed to fetch assessment" });
    }
  });

  app.patch("/api/assessments/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const { intakeJson, currentStep } = req.body;

      const assessment = await storage.getAssessment(id);
      if (!assessment) {
        return res.status(404).json({ message: "Assessment not found" });
      }

      const updated = await storage.updateAssessment(id, {
        intakeJson,
        currentStep
      });

      res.json(updated);
    } catch (error) {
      console.error("Error updating assessment:", error);
      res.status(500).json({ message: "Failed to update assessment" });
    }
  });

  app.post("/api/assessments/:id/submit", async (req, res) => {
    try {
      const { id } = req.params;
      const { intakeData } = req.body;

      const assessment = await storage.getAssessment(id);
      if (!assessment) {
        return res.status(404).json({ message: "Assessment not found" });
      }

      const validatedIntake = intakeSchema.parse(intakeData);

      const results = runMonteCarloSimulation(validatedIntake);

      await storage.updateAssessment(id, {
        status: 'submitted',
        intakeJson: validatedIntake,
        resultsJson: results
      });

      res.json({ success: true });
    } catch (error) {
      console.error("Error submitting assessment:", error);

      if (error instanceof z.ZodError) {
        return res.status(400).json({
          message: "Invalid intake data",
          errors: error.errors
        });
      }

      res.status(500).json({ message: "Failed to submit assessment" });
    }
  });

  app.get("/api/access/:token", async (req, res) => {
    try {
      const { token } = req.params;
      const tokenHash = hashToken(token);

      const assessment = await storage.getAssessmentByToken(tokenHash);

      if (!assessment) {
        return res.status(404).json({ message: "Invalid or expired link" });
      }

      if (isTokenExpired(assessment.magicTokenExpiresAt)) {
        return res.status(400).json({ message: "Link has expired. Please request a new one." });
      }

      res.json({
        assessmentId: assessment.id,
        status: assessment.status,
        hasResults: !!assessment.resultsJson
      });
    } catch (error) {
      console.error("Error verifying magic link:", error);
      res.status(500).json({ message: "Failed to verify link" });
    }
  });

  app.post("/api/access/request", async (req, res) => {
    try {
      const { email } = req.body;

      if (!email) {
        return res.status(400).json({ message: "Email is required" });
      }

      const assessment = await storage.getAssessmentByEmail(email);

      if (!assessment) {
        return res.json({ success: true, message: "If an assessment exists for this email, a link has been sent." });
      }

      const { token, hash, expiresAt } = generateMagicToken();

      await storage.updateAssessment(assessment.id, {
        magicTokenHash: hash,
        magicTokenExpiresAt: expiresAt,
      });

      const protocol = req.headers['x-forwarded-proto'] || req.protocol || 'https';
      const host = req.headers.host || req.get('host');
      const magicLink = `${protocol}://${host}/access/${token}`;

      await sendMagicLinkEmail(email, magicLink, false);

      res.json({ success: true, message: "If an assessment exists for this email, a link has been sent." });
    } catch (error) {
      console.error("Error requesting magic link:", error);
      res.status(500).json({ message: "Failed to send access link" });
    }
  });

  return httpServer;
}
