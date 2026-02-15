import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { intakeSchema, registerSchema, loginSchema } from "@shared/schema";
import { runMonteCarloSimulation } from "./simulation";
import { z } from "zod";
import bcrypt from "bcrypt";
import { appendAssessmentToSheet } from "./googleSheets";
import { addSubscriber, tagSubscriber } from "./kit";

function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (!req.session.userId) {
    return res.status(401).json({ message: "Please log in to continue" });
  }
  next();
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {

  app.post("/api/auth/register", async (req, res) => {
    try {
      const { email, password } = registerSchema.parse(req.body);

      const existing = await storage.getUserAccountByEmail(email);
      if (existing) {
        return res.status(400).json({ message: "An account with this email already exists" });
      }

      const passwordHash = await bcrypt.hash(password, 12);
      const account = await storage.createUserAccount({ email, passwordHash });

      req.session.userId = account.id;

      addSubscriber(email).catch(err => console.error('[Kit] Background subscriber add failed:', err));

      await new Promise<void>((resolve, reject) => {
        req.session.save((err) => {
          if (err) reject(err);
          else resolve();
        });
      });

      res.json({ id: account.id, email: account.email });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors[0].message });
      }
      console.error("Error registering:", error);
      res.status(500).json({ message: "Registration failed" });
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    try {
      const { email, password } = loginSchema.parse(req.body);

      const account = await storage.getUserAccountByEmail(email);
      if (!account) {
        return res.status(401).json({ message: "Invalid email or password" });
      }

      const valid = await bcrypt.compare(password, account.passwordHash);
      if (!valid) {
        return res.status(401).json({ message: "Invalid email or password" });
      }

      req.session.userId = account.id;

      await new Promise<void>((resolve, reject) => {
        req.session.save((err) => {
          if (err) reject(err);
          else resolve();
        });
      });

      res.json({ id: account.id, email: account.email });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors[0].message });
      }
      console.error("Error logging in:", error);
      res.status(500).json({ message: "Login failed" });
    }
  });

  app.get("/api/auth/me", async (req, res) => {
    if (!req.session.userId) {
      return res.status(401).json({ message: "Not logged in" });
    }

    const account = await storage.getUserAccountById(req.session.userId);
    if (!account) {
      req.session.destroy(() => {});
      return res.status(401).json({ message: "Account not found" });
    }

    res.json({ id: account.id, email: account.email });
  });

  app.post("/api/auth/logout", (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ message: "Logout failed" });
      }
      res.clearCookie("connect.sid");
      res.json({ success: true });
    });
  });

  app.post("/api/assessments", requireAuth, async (req, res) => {
    try {
      const userId = req.session.userId!;
      const account = await storage.getUserAccountById(userId);

      const assessment = await storage.createAssessment({
        status: 'draft',
        currentStep: 1,
        userId,
        customerEmail: account?.email || null
      });

      res.json({ assessmentId: assessment.id });
    } catch (error) {
      console.error("Error creating assessment:", error);
      res.status(500).json({ message: "Failed to create assessment" });
    }
  });

  app.get("/api/assessments", requireAuth, async (req, res) => {
    try {
      const userId = req.session.userId!;
      const userAssessments = await storage.getAssessmentsByUserId(userId);
      res.json(userAssessments);
    } catch (error) {
      console.error("Error fetching assessments:", error);
      res.status(500).json({ message: "Failed to fetch assessments" });
    }
  });

  app.get("/api/assessments/:id", requireAuth, async (req, res) => {
    try {
      const { id } = req.params;
      const assessment = await storage.getAssessment(id);

      if (!assessment) {
        return res.status(404).json({ message: "Assessment not found" });
      }

      if (assessment.userId !== req.session.userId) {
        return res.status(403).json({ message: "Access denied" });
      }

      res.json(assessment);
    } catch (error) {
      console.error("Error fetching assessment:", error);
      res.status(500).json({ message: "Failed to fetch assessment" });
    }
  });

  app.patch("/api/assessments/:id", requireAuth, async (req, res) => {
    try {
      const { id } = req.params;
      const { intakeJson, currentStep } = req.body;

      const assessment = await storage.getAssessment(id);
      if (!assessment) {
        return res.status(404).json({ message: "Assessment not found" });
      }

      if (assessment.userId !== req.session.userId) {
        return res.status(403).json({ message: "Access denied" });
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

  app.post("/api/assessments/:id/submit", requireAuth, async (req, res) => {
    try {
      const { id } = req.params;
      const { intakeData } = req.body;

      const assessment = await storage.getAssessment(id);
      if (!assessment) {
        return res.status(404).json({ message: "Assessment not found" });
      }

      if (assessment.userId !== req.session.userId) {
        return res.status(403).json({ message: "Access denied" });
      }

      const validatedIntake = intakeSchema.parse(intakeData);
      const results = runMonteCarloSimulation(validatedIntake);

      await storage.updateAssessment(id, {
        status: 'submitted',
        intakeJson: validatedIntake,
        resultsJson: results
      });

      const email = assessment.customerEmail || '';
      if (email) {
        appendAssessmentToSheet({
          email,
          intakeJson: validatedIntake,
          resultsJson: results
        }).catch(err => console.error('[GoogleSheets] Background append failed:', err));

        const kitTagId = process.env.KIT_TAG_ID;
        if (kitTagId) {
          tagSubscriber(email, kitTagId).catch(err => console.error('[Kit] Background tag failed:', err));
        }
      }

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

  return httpServer;
}
