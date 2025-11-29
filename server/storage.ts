import { 
  users, 
  encryptedData,
  creditScores,
  loans,
  auditLogs,
  coprocessorStatus,
  documents,
  type User, 
  type InsertUser,
  type EncryptedData,
  type InsertEncryptedData,
  type CreditScore,
  type InsertCreditScore,
  type Loan,
  type InsertLoan,
  type AuditLog,
  type InsertAuditLog,
  type CoprocessorStatus,
  type Document,
  type InsertDocument,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc } from "drizzle-orm";

export interface IStorage {
  // Users
  getUser(id: string): Promise<User | undefined>;
  getUserByWallet(walletAddress: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUserRole(id: string, role: string): Promise<User>;

  // Encrypted Data
  submitEncryptedData(data: InsertEncryptedData): Promise<EncryptedData>;
  getEncryptedDataByUser(userId: string): Promise<EncryptedData[]>;

  // Credit Scores
  createCreditScore(score: InsertCreditScore): Promise<CreditScore>;
  getCreditScoreByUser(userId: string): Promise<CreditScore | undefined>;

  // Loans
  createLoan(loan: InsertLoan): Promise<Loan>;
  getLoan(id: string): Promise<Loan | undefined>;
  getLoansByBorrower(borrowerId: string): Promise<Loan[]>;
  getLoansByLender(lenderId: string): Promise<Loan[]>;
  getPendingLoans(): Promise<Loan[]>;
  updateLoanStatus(id: string, status: string, lenderId?: string): Promise<Loan | undefined>;

  // Audit Logs
  createAuditLog(log: InsertAuditLog): Promise<AuditLog>;
  getAuditLogs(limit?: number): Promise<AuditLog[]>;

  // Coprocessor Status
  getCoprocessorStatus(): Promise<CoprocessorStatus | undefined>;
  updateCoprocessorStatus(status: Partial<CoprocessorStatus>): Promise<CoprocessorStatus | undefined>;

  // Documents
  createDocument(doc: InsertDocument): Promise<Document>;
  getDocumentsByUser(userId: string): Promise<Document[]>;
}

export class DatabaseStorage implements IStorage {
  // Users
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByWallet(walletAddress: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.walletAddress, walletAddress));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }

  async updateUserRole(id: string, role: string): Promise<User> {
    const [user] = await db
      .update(users)
      .set({ role })
      .where(eq(users.id, id))
      .returning();
    return user;
  }

  // Encrypted Data
  async submitEncryptedData(data: InsertEncryptedData): Promise<EncryptedData> {
    const [result] = await db
      .insert(encryptedData)
      .values(data)
      .returning();
    return result;
  }

  async getEncryptedDataByUser(userId: string): Promise<EncryptedData[]> {
    return await db
      .select()
      .from(encryptedData)
      .where(eq(encryptedData.userId, userId))
      .orderBy(desc(encryptedData.submittedAt));
  }

  // Credit Scores
  async createCreditScore(score: InsertCreditScore): Promise<CreditScore> {
    const [result] = await db
      .insert(creditScores)
      .values(score)
      .returning();
    return result;
  }

  async getCreditScoreByUser(userId: string): Promise<CreditScore | undefined> {
    const [score] = await db
      .select()
      .from(creditScores)
      .where(eq(creditScores.userId, userId))
      .orderBy(desc(creditScores.computedAt))
      .limit(1);
    return score || undefined;
  }

  // Loans
  async createLoan(loan: InsertLoan): Promise<Loan> {
    const [result] = await db
      .insert(loans)
      .values(loan)
      .returning();
    return result;
  }

  async getLoan(id: string): Promise<Loan | undefined> {
    const [loan] = await db.select().from(loans).where(eq(loans.id, id));
    return loan || undefined;
  }

  async getLoansByBorrower(borrowerId: string): Promise<Loan[]> {
    return await db
      .select()
      .from(loans)
      .where(eq(loans.borrowerId, borrowerId))
      .orderBy(desc(loans.createdAt));
  }

  async getLoansByLender(lenderId: string): Promise<Loan[]> {
    return await db
      .select()
      .from(loans)
      .where(eq(loans.lenderId, lenderId))
      .orderBy(desc(loans.createdAt));
  }

  async getPendingLoans(): Promise<Loan[]> {
    return await db
      .select()
      .from(loans)
      .where(eq(loans.status, "pending"))
      .orderBy(desc(loans.createdAt));
  }

  async updateLoanStatus(id: string, status: string, lenderId?: string): Promise<Loan | undefined> {
    const updateData: any = { status, updatedAt: new Date() };
    if (lenderId) {
      updateData.lenderId = lenderId;
    }

    const [loan] = await db
      .update(loans)
      .set(updateData)
      .where(eq(loans.id, id))
      .returning();
    return loan || undefined;
  }

  // Audit Logs
  async createAuditLog(log: InsertAuditLog): Promise<AuditLog> {
    const [result] = await db
      .insert(auditLogs)
      .values(log)
      .returning();
    return result;
  }

  async getAuditLogs(limit: number = 100): Promise<AuditLog[]> {
    return await db
      .select()
      .from(auditLogs)
      .orderBy(desc(auditLogs.timestamp))
      .limit(limit);
  }

  // Coprocessor Status
  async getCoprocessorStatus(): Promise<CoprocessorStatus | undefined> {
    const [status] = await db
      .select()
      .from(coprocessorStatus)
      .orderBy(desc(coprocessorStatus.updatedAt))
      .limit(1);
    return status || undefined;
  }

  async updateCoprocessorStatus(statusUpdate: Partial<CoprocessorStatus>): Promise<CoprocessorStatus | undefined> {
    // Check if status exists
    const existing = await this.getCoprocessorStatus();
    
    if (existing) {
      const [updated] = await db
        .update(coprocessorStatus)
        .set({ ...statusUpdate, updatedAt: new Date() })
        .where(eq(coprocessorStatus.id, existing.id))
        .returning();
      return updated || undefined;
    } else {
      // Create initial status
      const [created] = await db
        .insert(coprocessorStatus)
        .values({
          status: "active",
          totalComputations: 0,
          ...statusUpdate,
        })
        .returning();
      return created;
    }
  }

  // Documents
  async createDocument(doc: InsertDocument): Promise<Document> {
    const [result] = await db
      .insert(documents)
      .values(doc)
      .returning();
    return result;
  }

  async getDocumentsByUser(userId: string): Promise<Document[]> {
    return await db
      .select()
      .from(documents)
      .where(eq(documents.userId, userId))
      .orderBy(desc(documents.uploadedAt));
  }
}

export const storage = new DatabaseStorage();
