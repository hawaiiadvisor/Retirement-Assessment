import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { intakeSchema } from "@shared/schema";
import { runMonteCarloSimulation } from "./simulation";
import { z } from "zod";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  
  // Create a new assessment (checkout flow simulation for MVP)
  app.post("/api/checkout/create-session", async (req, res) => {
    try {
      const assessment = await storage.createAssessment({
        status: 'paid', // For MVP, skip actual Stripe integration
        currentStep: 1
      });
      
      res.json({ assessmentId: assessment.id });
    } catch (error) {
      console.error("Error creating assessment:", error);
      res.status(500).json({ message: "Failed to create assessment" });
    }
  });
  
  // Get assessment by ID
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
  
  // Update assessment (save progress)
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
  
  // Submit assessment and run simulation
  app.post("/api/assessments/:id/submit", async (req, res) => {
    try {
      const { id } = req.params;
      const { intakeData } = req.body;
      
      const assessment = await storage.getAssessment(id);
      if (!assessment) {
        return res.status(404).json({ message: "Assessment not found" });
      }
      
      // Validate intake data
      const validatedIntake = intakeSchema.parse(intakeData);
      
      // Run Monte Carlo simulation
      const results = runMonteCarloSimulation(validatedIntake);
      
      // Save results
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
  
  return httpServer;
}
