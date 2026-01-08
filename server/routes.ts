import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { intakeSchema } from "@shared/schema";
import { runMonteCarloSimulation } from "./simulation";
import { z } from "zod";
import { getUncachableStripeClient, getStripePublishableKey } from "./stripeClient";
import { db } from "./db";
import { sql } from "drizzle-orm";
import { generateMagicToken, hashToken, isTokenExpired } from "./magic-token";
import { sendMagicLinkEmail } from "./email";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  
  // Get Stripe publishable key for frontend
  app.get("/api/stripe/config", async (req, res) => {
    try {
      const publishableKey = await getStripePublishableKey();
      res.json({ publishableKey });
    } catch (error) {
      console.error("Error getting Stripe config:", error);
      res.status(500).json({ message: "Failed to get Stripe config" });
    }
  });
  
  // Create Stripe Checkout session for $97 one-time payment
  app.post("/api/checkout/create-session", async (req, res) => {
    try {
      const stripe = await getUncachableStripeClient();
      
      // Get the assessment price from Stripe
      const pricesResult = await db.execute(
        sql`SELECT p.id as price_id, pr.id as product_id, pr.name
            FROM stripe.prices p
            JOIN stripe.products pr ON p.product = pr.id
            WHERE pr.name = 'Retirement Readiness Assessment'
            AND p.active = true
            LIMIT 1`
      );
      
      let priceId: string;
      
      if (pricesResult.rows.length > 0) {
        priceId = pricesResult.rows[0].price_id as string;
      } else {
        // Fallback: create product and price if not found
        const product = await stripe.products.create({
          name: 'Retirement Readiness Assessment',
          description: 'CFP®-designed retirement readiness self-assessment with Monte Carlo simulation and personalized Retirement Readiness Brief.',
        });
        
        const price = await stripe.prices.create({
          product: product.id,
          unit_amount: 100,
          currency: 'usd',
        });
        
        priceId = price.id;
      }
      
      // Create the assessment first (pending payment)
      const assessment = await storage.createAssessment({
        status: 'pending',
        currentStep: 1
      });
      
      // Get the base URL
      const protocol = req.headers['x-forwarded-proto'] || req.protocol || 'https';
      const host = req.headers.host || req.get('host');
      const baseUrl = `${protocol}://${host}`;
      
      // Create Stripe Checkout session
      const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: [
          {
            price: priceId,
            quantity: 1,
          },
        ],
        mode: 'payment',
        success_url: `${baseUrl}/checkout/success?session_id={CHECKOUT_SESSION_ID}&assessment_id=${assessment.id}`,
        cancel_url: `${baseUrl}/checkout`,
        metadata: {
          assessmentId: assessment.id,
        },
      });
      
      // Update assessment with Stripe session ID
      await storage.updateAssessment(assessment.id, {
        stripeCheckoutSessionId: session.id,
      });
      
      res.json({ url: session.url });
    } catch (error) {
      console.error("Error creating checkout session:", error);
      res.status(500).json({ message: "Failed to create checkout session" });
    }
  });
  
  // Verify payment and redirect to intake
  app.get("/api/checkout/verify", async (req, res) => {
    try {
      const { session_id, assessment_id } = req.query;
      
      if (!session_id || !assessment_id) {
        return res.status(400).json({ message: "Missing session_id or assessment_id" });
      }
      
      // First, verify the assessment exists and has matching session ID
      const assessment = await storage.getAssessment(assessment_id as string);
      if (!assessment) {
        return res.status(404).json({ message: "Assessment not found" });
      }
      
      // Verify the session ID matches what we stored (prevent tampering)
      if (assessment.stripeCheckoutSessionId !== session_id) {
        console.error(`Session ID mismatch: expected ${assessment.stripeCheckoutSessionId}, got ${session_id}`);
        return res.status(400).json({ message: "Invalid session" });
      }
      
      const stripe = await getUncachableStripeClient();
      const session = await stripe.checkout.sessions.retrieve(session_id as string);
      
      // Verify the session's metadata matches our assessment ID
      if (session.metadata?.assessmentId !== assessment_id) {
        console.error(`Assessment ID mismatch in session metadata: expected ${assessment_id}, got ${session.metadata?.assessmentId}`);
        return res.status(400).json({ message: "Invalid session" });
      }
      
      if (session.payment_status === 'paid') {
        const customerEmail = session.customer_details?.email || undefined;
        
        // Generate magic token for re-access
        const { token, hash, expiresAt } = generateMagicToken();
        
        // Update assessment to paid status with token
        await storage.updateAssessment(assessment_id as string, {
          status: 'paid',
          paidAt: new Date(),
          customerEmail,
          magicTokenHash: hash,
          magicTokenExpiresAt: expiresAt,
        });
        
        // Send magic link email if we have an email
        if (customerEmail) {
          const protocol = req.headers['x-forwarded-proto'] || req.protocol || 'https';
          const host = req.headers.host || req.get('host');
          const magicLink = `${protocol}://${host}/access/${token}`;
          
          await sendMagicLinkEmail(customerEmail, magicLink, true);
        }
        
        res.json({ success: true, assessmentId: assessment_id });
      } else {
        res.status(400).json({ message: "Payment not completed" });
      }
    } catch (error) {
      console.error("Error verifying payment:", error);
      res.status(500).json({ message: "Failed to verify payment" });
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
  
  // Magic link access - verify token and redirect to assessment
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
      
      // Return the assessment ID for redirect
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
  
  // Request new magic link by email
  app.post("/api/access/request", async (req, res) => {
    try {
      const { email } = req.body;
      
      if (!email) {
        return res.status(400).json({ message: "Email is required" });
      }
      
      // Find assessment by email
      const assessment = await storage.getAssessmentByEmail(email);
      
      if (!assessment) {
        // Don't reveal if email exists or not for security
        return res.json({ success: true, message: "If an assessment exists for this email, a link has been sent." });
      }
      
      // Generate new magic token
      const { token, hash, expiresAt } = generateMagicToken();
      
      // Update assessment with new token
      await storage.updateAssessment(assessment.id, {
        magicTokenHash: hash,
        magicTokenExpiresAt: expiresAt,
      });
      
      // Send email
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
