import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, integer, jsonb, boolean } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Users table - stores wallet addresses and roles
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  walletAddress: text("wallet_address").notNull().unique(),
  role: text("role").notNull().default("borrower"), // borrower, lender, admin
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Encrypted financial data submissions
export const encryptedData = pgTable("encrypted_data", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  salaryHandle: text("salary_handle").notNull(), // Encrypted ciphertext handle
  debtsHandle: text("debts_handle").notNull(), // Encrypted ciphertext handle
  expensesHandle: text("expenses_handle").notNull(), // Encrypted ciphertext handle
  submittedAt: timestamp("submitted_at").defaultNow().notNull(),
});

// Credit scores (encrypted)
export const creditScores = pgTable("credit_scores", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  encryptedScoreHandle: text("encrypted_score_handle").notNull(), // FHE encrypted score
  computedAt: timestamp("computed_at").defaultNow().notNull(),
  status: text("status").notNull().default("pending"), // pending, computed, decrypted
});

// Loan applications
export const loans = pgTable("loans", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  borrowerId: varchar("borrower_id").notNull().references(() => users.id),
  lenderId: varchar("lender_id").references(() => users.id),
  requestedAmount: integer("requested_amount").notNull(), // in cents
  approvedAmount: integer("approved_amount"),
  riskTier: text("risk_tier").notNull(), // low, medium, high
  status: text("status").notNull().default("pending"), // pending, approved, denied, active, repaid
  encryptedDecisionHandle: text("encrypted_decision_handle"), // Encrypted approval decision
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Audit logs for compliance
export const auditLogs = pgTable("audit_logs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id),
  action: text("action").notNull(), // e.g., "DATA_SUBMITTED", "SCORE_COMPUTED", "LOAN_APPROVED"
  entityType: text("entity_type"), // e.g., "loan", "encrypted_data", "credit_score"
  entityId: varchar("entity_id"),
  metadata: jsonb("metadata"), // Additional context
  timestamp: timestamp("timestamp").defaultNow().notNull(),
});

// Coprocessor status tracking
export const coprocessorStatus = pgTable("coprocessor_status", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  status: text("status").notNull().default("active"), // active, degraded, offline
  lastKeyRotation: timestamp("last_key_rotation"),
  totalComputations: integer("total_computations").notNull().default(0),
  averageLatencyMs: integer("average_latency_ms"),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Document attachments (encrypted)
export const documents = pgTable("documents", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  loanId: varchar("loan_id").references(() => loans.id),
  fileName: text("file_name").notNull(),
  fileType: text("file_type").notNull(),
  objectPath: text("object_path").notNull(), // Object storage path
  uploadedAt: timestamp("uploaded_at").defaultNow().notNull(),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  encryptedData: many(encryptedData),
  creditScores: many(creditScores),
  borrowedLoans: many(loans, { relationName: "borrower" }),
  lentLoans: many(loans, { relationName: "lender" }),
  documents: many(documents),
  auditLogs: many(auditLogs),
}));

export const encryptedDataRelations = relations(encryptedData, ({ one }) => ({
  user: one(users, {
    fields: [encryptedData.userId],
    references: [users.id],
  }),
}));

export const creditScoresRelations = relations(creditScores, ({ one }) => ({
  user: one(users, {
    fields: [creditScores.userId],
    references: [users.id],
  }),
}));

export const loansRelations = relations(loans, ({ one, many }) => ({
  borrower: one(users, {
    fields: [loans.borrowerId],
    references: [users.id],
    relationName: "borrower",
  }),
  lender: one(users, {
    fields: [loans.lenderId],
    references: [users.id],
    relationName: "lender",
  }),
  documents: many(documents),
}));

export const documentsRelations = relations(documents, ({ one }) => ({
  user: one(users, {
    fields: [documents.userId],
    references: [users.id],
  }),
  loan: one(loans, {
    fields: [documents.loanId],
    references: [loans.id],
  }),
}));

export const auditLogsRelations = relations(auditLogs, ({ one }) => ({
  user: one(users, {
    fields: [auditLogs.userId],
    references: [users.id],
  }),
}));

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
});

export const insertEncryptedDataSchema = createInsertSchema(encryptedData).omit({
  id: true,
  submittedAt: true,
});

export const insertCreditScoreSchema = createInsertSchema(creditScores).omit({
  id: true,
  computedAt: true,
});

export const insertLoanSchema = createInsertSchema(loans).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertAuditLogSchema = createInsertSchema(auditLogs).omit({
  id: true,
  timestamp: true,
});

export const insertDocumentSchema = createInsertSchema(documents).omit({
  id: true,
  uploadedAt: true,
});

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type EncryptedData = typeof encryptedData.$inferSelect;
export type InsertEncryptedData = z.infer<typeof insertEncryptedDataSchema>;

export type CreditScore = typeof creditScores.$inferSelect;
export type InsertCreditScore = z.infer<typeof insertCreditScoreSchema>;

export type Loan = typeof loans.$inferSelect;
export type InsertLoan = z.infer<typeof insertLoanSchema>;

export type AuditLog = typeof auditLogs.$inferSelect;
export type InsertAuditLog = z.infer<typeof insertAuditLogSchema>;

export type CoprocessorStatus = typeof coprocessorStatus.$inferSelect;

export type Document = typeof documents.$inferSelect;
export type InsertDocument = z.infer<typeof insertDocumentSchema>;
