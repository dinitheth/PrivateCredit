import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { z } from "zod";
import { insertEncryptedDataSchema, insertLoanSchema, insertAuditLogSchema } from "@shared/schema";

// Extend Express Request type
declare global {
  namespace Express {
    interface Request {
      walletAddress: string;
      user?: any;
    }
  }
}

// Helper function to create audit log
async function logAudit(action: string, userId?: string, entityType?: string, entityId?: string, metadata?: any) {
  await storage.createAuditLog({
    userId,
    action,
    entityType,
    entityId,
    metadata,
  });
}

// Simulate encryption/decryption helpers for MVP
function simulateEncryption(data: number): string {
  // In production, this would use TFHE-rs WASM for client-side encryption
  // For MVP, we create a simulated encrypted handle
  return `enc_${Buffer.from(String(data)).toString('base64')}_${Date.now()}`;
}

function simulateDecryption(handle: string): number {
  // In production, this would use TFHE-rs WASM for client-side decryption
  // For MVP, we return a simulated decrypted value
  try {
    const parts = handle.split('_');
    if (parts.length >= 2) {
      return parseInt(Buffer.from(parts[1], 'base64').toString());
    }
  } catch (e) {
    // Return default if decryption fails
  }
  return 0;
}

// Simulate FHE credit score computation
function computeEncryptedCreditScore(salaryHandle: string, debtsHandle: string, expensesHandle: string): string {
  // In production, this would trigger Zama coprocessor for FHE computation
  // For MVP, we simulate the encrypted score computation
  const salary = simulateDecryption(salaryHandle);
  const debts = simulateDecryption(debtsHandle);
  const expenses = simulateDecryption(expensesHandle);
  
  // Simple credit score algorithm (300-850 range)
  const debtToIncomeRatio = salary > 0 ? debts / salary : 1;
  const expenseRatio = salary > 0 ? expenses / salary : 1;
  
  let baseScore = 600;
  
  // Adjust based on debt-to-income ratio
  if (debtToIncomeRatio < 0.2) baseScore += 150;
  else if (debtToIncomeRatio < 0.4) baseScore += 100;
  else if (debtToIncomeRatio < 0.6) baseScore += 50;
  else baseScore -= 50;
  
  // Adjust based on expense ratio
  if (expenseRatio < 0.3) baseScore += 100;
  else if (expenseRatio < 0.5) baseScore += 50;
  else if (expenseRatio > 0.7) baseScore -= 50;
  
  const finalScore = Math.max(300, Math.min(850, baseScore));
  
  // Return encrypted score handle
  return simulateEncryption(finalScore);
}

function getRiskTierFromScore(encryptedScoreHandle: string): string {
  const score = simulateDecryption(encryptedScoreHandle);
  if (score >= 700) return "low";
  if (score >= 600) return "medium";
  return "high";
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Middleware to simulate wallet authentication
  // In production, this would verify wallet signatures
  const authenticateWallet = async (req: any, res: any, next: any) => {
    const walletAddress = req.headers['x-wallet-address'] || "0x742d35Cc6634C0532925a3b844Bc9e7595f89ab";
    req.walletAddress = walletAddress;
    
    // Get user - do NOT auto-create anymore, require explicit connection
    const user = await storage.getUserByWallet(walletAddress);
    req.user = user;
    
    next();
  };

  app.use(authenticateWallet);

  // ============ User Management ============
  
  app.post("/api/auth/connect", async (req, res) => {
    try {
      const { walletAddress, role = "borrower" } = req.body;
      
      if (!walletAddress) {
        return res.status(400).json({ error: "Wallet address required" });
      }

      // Check if user exists
      let user = await storage.getUserByWallet(walletAddress);
      
      if (!user) {
        // Create new user
        user = await storage.createUser({ walletAddress, role });
        await logAudit("USER_CREATED", user.id, "user", user.id);
      } else if (user.role !== role) {
        // Update existing user's role if different
        user = await storage.updateUserRole(user.id, role);
        await logAudit("ROLE_CHANGED", user.id, "user", user.id, { oldRole: user.role, newRole: role });
      }

      res.json({ user });
    } catch (error) {
      console.error("Error connecting wallet:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.get("/api/users/me", async (req, res) => {
    try {
      const walletAddress = req.walletAddress;
      const user = await storage.getUserByWallet(walletAddress);
      
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      res.json({ user });
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // ============ Encrypted Data Submission ============
  
  app.post("/api/encrypted-data", async (req, res) => {
    try {
      const walletAddress = req.walletAddress;
      const user = await storage.getUserByWallet(walletAddress);
      
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      console.log("Received data:", req.body);
      console.log("User ID:", user.id);

      // Validate request body
      const validatedData = insertEncryptedDataSchema.parse({
        userId: user.id,
        salaryHandle: req.body.salaryHandle,
        debtsHandle: req.body.debtsHandle,
        expensesHandle: req.body.expensesHandle,
      });

      console.log("Validated data:", validatedData);

      // Submit encrypted data
      const encryptedData = await storage.submitEncryptedData(validatedData);
      
      // Create audit log
      await logAudit("DATA_SUBMITTED", user.id, "encrypted_data", encryptedData.id);

      // Trigger FHE credit score computation (simulated)
      const encryptedScoreHandle = computeEncryptedCreditScore(
        encryptedData.salaryHandle,
        encryptedData.debtsHandle,
        encryptedData.expensesHandle
      );

      // Store encrypted credit score
      const creditScore = await storage.createCreditScore({
        userId: user.id,
        encryptedScoreHandle,
        status: "computed",
      });

      await logAudit("SCORE_COMPUTED", user.id, "credit_score", creditScore.id);

      // Update coprocessor stats
      const coprocessorStatus = await storage.getCoprocessorStatus();
      const currentComputations = coprocessorStatus?.totalComputations || 0;
      await storage.updateCoprocessorStatus({
        totalComputations: currentComputations + 1,
        averageLatencyMs: 92, // Simulated
      });

      res.json({ 
        encryptedData,
        creditScore,
      });
    } catch (error) {
      console.error("Error submitting encrypted data:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid data format", details: error.errors });
      }
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.get("/api/encrypted-data", async (req, res) => {
    try {
      const walletAddress = req.walletAddress;
      const user = await storage.getUserByWallet(walletAddress);
      
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      const data = await storage.getEncryptedDataByUser(user.id);
      res.json({ data });
    } catch (error) {
      console.error("Error fetching encrypted data:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // ============ Credit Scores ============
  
  app.get("/api/credit-score", async (req, res) => {
    try {
      const walletAddress = req.walletAddress;
      const user = await storage.getUserByWallet(walletAddress);
      
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      const creditScore = await storage.getCreditScoreByUser(user.id);
      res.json({ creditScore });
    } catch (error) {
      console.error("Error fetching credit score:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.post("/api/credit-score/decrypt", async (req, res) => {
    try {
      const walletAddress = req.walletAddress;
      const user = await storage.getUserByWallet(walletAddress);
      
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      const creditScore = await storage.getCreditScoreByUser(user.id);
      
      if (!creditScore) {
        return res.status(404).json({ error: "No credit score found" });
      }

      // Simulate decryption (in production, this would be done client-side)
      const decryptedScore = simulateDecryption(creditScore.encryptedScoreHandle);

      res.json({ 
        creditScore,
        decryptedScore,
      });
    } catch (error) {
      console.error("Error decrypting credit score:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // ============ Loans ============
  
  app.post("/api/loans", async (req, res) => {
    try {
      const walletAddress = req.walletAddress;
      const user = await storage.getUserByWallet(walletAddress);
      
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      // Get user's credit score to determine risk tier
      const creditScore = await storage.getCreditScoreByUser(user.id);
      
      if (!creditScore) {
        return res.status(400).json({ error: "Submit financial data first to get credit score" });
      }

      const riskTier = getRiskTierFromScore(creditScore.encryptedScoreHandle);

      const validatedData = insertLoanSchema.parse({
        borrowerId: user.id,
        requestedAmount: req.body.requestedAmount,
        riskTier,
      });

      const loan = await storage.createLoan(validatedData);
      
      await logAudit("LOAN_REQUESTED", user.id, "loan", loan.id, { amount: req.body.requestedAmount });

      res.json({ loan });
    } catch (error) {
      console.error("Error creating loan:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid loan data", details: error.errors });
      }
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.get("/api/loans", async (req, res) => {
    try {
      const walletAddress = req.walletAddress;
      const user = await storage.getUserByWallet(walletAddress);
      
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      const loans = await storage.getLoansByBorrower(user.id);
      res.json({ loans });
    } catch (error) {
      console.error("Error fetching loans:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.get("/api/loans/pending", async (req, res) => {
    try {
      const loans = await storage.getPendingLoans();
      res.json({ loans });
    } catch (error) {
      console.error("Error fetching pending loans:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.put("/api/loans/:id/approve", async (req, res) => {
    try {
      const walletAddress = req.walletAddress;
      const user = await storage.getUserByWallet(walletAddress);
      
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      if (user.role !== "lender") {
        return res.status(403).json({ error: "Only lenders can approve loans" });
      }

      const loan = await storage.updateLoanStatus(req.params.id, "approved", user.id);
      
      if (!loan) {
        return res.status(404).json({ error: "Loan not found" });
      }

      await logAudit("LOAN_APPROVED", user.id, "loan", loan.id);

      res.json({ loan });
    } catch (error) {
      console.error("Error approving loan:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.put("/api/loans/:id/deny", async (req, res) => {
    try {
      const walletAddress = req.walletAddress;
      const user = await storage.getUserByWallet(walletAddress);
      
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      if (user.role !== "lender") {
        return res.status(403).json({ error: "Only lenders can deny loans" });
      }

      const loan = await storage.updateLoanStatus(req.params.id, "denied");
      
      if (!loan) {
        return res.status(404).json({ error: "Loan not found" });
      }

      await logAudit("LOAN_DENIED", user.id, "loan", loan.id);

      res.json({ loan });
    } catch (error) {
      console.error("Error denying loan:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Get funded/active loans for lenders
  app.get("/api/loans/funded", async (req, res) => {
    try {
      const walletAddress = req.walletAddress;
      const user = await storage.getUserByWallet(walletAddress);
      
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      if (user.role !== "lender") {
        return res.status(403).json({ error: "Only lenders can view funded loans" });
      }

      const loans = await storage.getFundedLoans(user.id);
      res.json({ loans });
    } catch (error) {
      console.error("Error fetching funded loans:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Get lender portfolio stats
  app.get("/api/lender/stats", async (req, res) => {
    try {
      const walletAddress = req.walletAddress;
      const user = await storage.getUserByWallet(walletAddress);
      
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      if (user.role !== "lender") {
        return res.status(403).json({ error: "Only lenders can view portfolio stats" });
      }

      const stats = await storage.getLenderStats(user.id);
      res.json({ stats });
    } catch (error) {
      console.error("Error fetching lender stats:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // ============ Admin Endpoints ============
  
  app.get("/api/admin/audit-logs", async (req, res) => {
    try {
      const walletAddress = req.walletAddress;
      const user = await storage.getUserByWallet(walletAddress);
      
      if (!user || user.role !== "admin") {
        return res.status(403).json({ error: "Admin access required" });
      }

      const limit = req.query.limit ? parseInt(req.query.limit as string) : 100;
      const logs = await storage.getAuditLogs(limit);
      
      res.json({ logs });
    } catch (error) {
      console.error("Error fetching audit logs:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.get("/api/admin/coprocessor-status", async (req, res) => {
    try {
      const walletAddress = req.walletAddress;
      const user = await storage.getUserByWallet(walletAddress);
      
      if (!user || user.role !== "admin") {
        return res.status(403).json({ error: "Admin access required" });
      }

      const status = await storage.getCoprocessorStatus();
      
      res.json({ status });
    } catch (error) {
      console.error("Error fetching coprocessor status:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.post("/api/admin/rotate-keys", async (req, res) => {
    try {
      const walletAddress = req.walletAddress;
      const user = await storage.getUserByWallet(walletAddress);
      
      if (!user || user.role !== "admin") {
        return res.status(403).json({ error: "Admin access required" });
      }

      // Simulate key rotation
      const status = await storage.updateCoprocessorStatus({
        lastKeyRotation: new Date(),
      });

      await logAudit("KEY_ROTATION", user.id, "coprocessor", "system");

      res.json({ status, message: "Keys rotated successfully" });
    } catch (error) {
      console.error("Error rotating keys:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
