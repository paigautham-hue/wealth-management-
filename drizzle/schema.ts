import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, decimal, boolean, json, index, unique } from "drizzle-orm/mysql-core";

/**
 * AETHER V5 Database Schema
 * Luxury wealth management platform for Indian HNIs
 */

// ============================================================================
// AUTHENTICATION & USERS
// ============================================================================

export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin", "family_admin", "family_viewer"]).default("user").notNull(),
  familyId: int("familyId"), // Link to family group
  profilePicture: text("profilePicture"), // URL to profile image
  bio: text("bio"), // Short bio
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// ============================================================================
// FAMILY OFFICE
// ============================================================================

export const familyGroups = mysqlTable("family_groups", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(), // Family name
  createdBy: int("createdBy").notNull(), // User ID of creator
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type FamilyGroup = typeof familyGroups.$inferSelect;
export type InsertFamilyGroup = typeof familyGroups.$inferInsert;

// ============================================================================
// USER PREFERENCES
// ============================================================================

export const userPreferences = mysqlTable("user_preferences", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  riskTolerance: mysqlEnum("riskTolerance", ["conservative", "moderate", "aggressive"]).default("moderate"),
  targetAllocation: json("targetAllocation").$type<Record<string, number>>(),
  persona: varchar("persona", { length: 100 }),
  theme: mysqlEnum("theme", ["light", "dark"]).default("light"),
  emailNotifications: boolean("emailNotifications").default(true),
  pushNotifications: boolean("pushNotifications").default(true),
  aiLensWeights: json("aiLensWeights").$type<Record<string, number>>(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  userIdIdx: index("userIdIdx").on(table.userId),
}));

export type UserPreference = typeof userPreferences.$inferSelect;
export type InsertUserPreference = typeof userPreferences.$inferInsert;

// ============================================================================
// ASSETS & OWNERSHIP
// ============================================================================

export const assets = mysqlTable("assets", {
  id: int("id").autoincrement().primaryKey(),
  assetType: mysqlEnum("assetType", ["stock", "bond", "mutual_fund", "real_estate", "alternative", "cash"]).notNull(),
  assetName: varchar("assetName", { length: 255 }).notNull(),
  ticker: varchar("ticker", { length: 50 }),
  currentValueInr: int("currentValueInr").notNull().default(0),
  currentQuantity: int("currentQuantity").notNull().default(0),
  currentPrice: int("currentPrice").notNull().default(0),
  currency: varchar("currency", { length: 10 }).notNull().default("INR"),
  country: varchar("country", { length: 100 }),
  sector: varchar("sector", { length: 100 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  tickerIdx: index("tickerIdx").on(table.ticker),
  assetTypeIdx: index("assetTypeIdx").on(table.assetType),
}));

export type Asset = typeof assets.$inferSelect;
export type InsertAsset = typeof assets.$inferInsert;

export const assetOwnership = mysqlTable("asset_ownership", {
  id: int("id").autoincrement().primaryKey(),
  assetId: int("assetId").notNull(),
  ownerId: int("ownerId").notNull(),
  ownershipPercentage: int("ownershipPercentage").notNull().default(100),
  costBasisInr: int("costBasisInr").notNull(),
  costBasisNativeCurrency: int("costBasisNativeCurrency").notNull(),
  nativeCurrency: varchar("nativeCurrency", { length: 10 }).notNull(),
  exchangeRateAtPurchase: int("exchangeRateAtPurchase").notNull().default(100),
  purchaseDate: timestamp("purchaseDate").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  assetIdIdx: index("assetIdIdx").on(table.assetId),
  ownerIdIdx: index("ownerIdIdx").on(table.ownerId),
}));

export type AssetOwnership = typeof assetOwnership.$inferSelect;
export type InsertAssetOwnership = typeof assetOwnership.$inferInsert;

export const valuationHistory = mysqlTable("valuation_history", {
  id: int("id").autoincrement().primaryKey(),
  assetId: int("assetId").notNull(),
  date: timestamp("date").notNull(),
  valueInr: int("valueInr").notNull(),
  quantity: int("quantity").notNull(),
  price: int("price").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  assetDateIdx: index("assetDateIdx").on(table.assetId, table.date),
}));

export type ValuationHistory = typeof valuationHistory.$inferSelect;
export type InsertValuationHistory = typeof valuationHistory.$inferInsert;

// ============================================================================
// PORTFOLIO SNAPSHOTS
// ============================================================================

export const dailyPortfolioSnapshots = mysqlTable("daily_portfolio_snapshots", {
  id: int("id").autoincrement().primaryKey(),
  ownerId: int("ownerId").notNull(),
  date: timestamp("date").notNull(),
  totalNetWorthInr: int("totalNetWorthInr").notNull(),
  totalLrsUsedUsd: int("totalLrsUsedUsd").notNull().default(0),
  currencyBreakdown: json("currencyBreakdown").$type<Record<string, number>>(),
  assetClassBreakdown: json("assetClassBreakdown").$type<Record<string, number>>(),
  sectorBreakdown: json("sectorBreakdown").$type<Record<string, number>>(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  ownerDateIdx: unique("ownerDateIdx").on(table.ownerId, table.date),
  ownerIdIdx: index("ownerIdIdx").on(table.ownerId),
}));

export type DailyPortfolioSnapshot = typeof dailyPortfolioSnapshots.$inferSelect;
export type InsertDailyPortfolioSnapshot = typeof dailyPortfolioSnapshots.$inferInsert;

// ============================================================================
// DOCUMENT UPLOADS
// ============================================================================

export const documentUploads = mysqlTable("document_uploads", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  fileName: varchar("fileName", { length: 255 }).notNull(),
  filePath: varchar("filePath", { length: 500 }).notNull(),
  fileType: varchar("fileType", { length: 50 }).notNull(),
  fileSize: int("fileSize").notNull(),
  status: mysqlEnum("status", ["pending", "processing", "completed", "failed", "needs_review"]).default("pending").notNull(),
  extractedData: json("extractedData").$type<any>(),
  extractionErrors: json("extractionErrors").$type<any[]>(),
  documentDate: timestamp("documentDate"),
  institution: varchar("institution", { length: 255 }),
  tags: json("tags").$type<string[]>(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  userIdIdx: index("userIdIdx").on(table.userId),
  statusIdx: index("statusIdx").on(table.status),
}));

export type DocumentUpload = typeof documentUploads.$inferSelect;
export type InsertDocumentUpload = typeof documentUploads.$inferInsert;

// ============================================================================
// LRS TRANSACTIONS (India-specific)
// ============================================================================

export const lrsTransactions = mysqlTable("lrs_transactions", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  transactionDate: timestamp("transactionDate").notNull(),
  amountUsd: int("amountUsd").notNull(),
  purpose: varchar("purpose", { length: 255 }).notNull(),
  description: text("description"),
  assetId: int("assetId"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  userIdIdx: index("userIdIdx").on(table.userId),
  transactionDateIdx: index("transactionDateIdx").on(table.transactionDate),
}));

export type LrsTransaction = typeof lrsTransactions.$inferSelect;
export type InsertLrsTransaction = typeof lrsTransactions.$inferInsert;

// ============================================================================
// STOCK ANALYSES (The Oracle)
// ============================================================================

export const stockAnalyses = mysqlTable("stock_analyses", {
  id: int("id").autoincrement().primaryKey(),
  ticker: varchar("ticker", { length: 50 }).notNull(),
  market: mysqlEnum("market", ["IN", "US"]).notNull(),
  analysisDate: timestamp("analysisDate").notNull(),
  
  // Individual lens scores
  buffettScore: int("buffettScore").notNull(),
  buffettVerdict: text("buffettVerdict"),
  lynchScore: int("lynchScore").notNull(),
  lynchVerdict: text("lynchVerdict"),
  grahamScore: int("grahamScore").notNull(),
  grahamVerdict: text("grahamVerdict"),
  fisherScore: int("fisherScore").notNull(),
  fisherVerdict: text("fisherVerdict"),
  jhunjhunwalaScore: int("jhunjhunwalaScore").notNull(),
  jhunjhunwalaVerdict: text("jhunjhunwalaVerdict"),
  kacholiaScore: int("kacholiaScore").notNull(),
  kacholiaVerdict: text("kacholiaVerdict"),
  kediaScore: int("kediaScore").notNull(),
  kediaVerdict: text("kediaVerdict"),
  quantitativeScore: int("quantitativeScore").notNull(),
  quantitativeVerdict: text("quantitativeVerdict"),
  
  // Overall analysis
  finalScore: int("finalScore").notNull(),
  recommendation: mysqlEnum("recommendation", ["STRONG_BUY", "BUY", "HOLD", "SELL", "STRONG_SELL"]).notNull(),
  confidence: int("confidence").notNull(),
  currentPrice: int("currentPrice").notNull(),
  targetPrice: int("targetPrice").notNull(),
  upsidePercentage: int("upsidePercentage").notNull(),
  
  // Detailed analysis
  executiveSummary: text("executiveSummary"),
  strengths: json("strengths").$type<string[]>(),
  risks: json("risks").$type<string[]>(),
  bearCase: text("bearCase"),
  fullReport: text("fullReport"),
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  tickerMarketIdx: index("tickerMarketIdx").on(table.ticker, table.market),
  analysisDateIdx: index("analysisDateIdx").on(table.analysisDate),
}));

export type StockAnalysis = typeof stockAnalyses.$inferSelect;
export type InsertStockAnalysis = typeof stockAnalyses.$inferInsert;

// ============================================================================
// OPPORTUNITY ALERTS
// ============================================================================

export const opportunityAlerts = mysqlTable("opportunity_alerts", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  opportunityType: varchar("opportunityType", { length: 100 }).notNull(),
  ticker: varchar("ticker", { length: 50 }),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  thesis: text("thesis"),
  risks: text("risks"),
  suggestedAction: text("suggestedAction"),
  potentialBenefitInr: int("potentialBenefitInr"),
  timeRequiredMinutes: int("timeRequiredMinutes"),
  confidenceScore: int("confidenceScore"),
  status: mysqlEnum("status", ["new", "viewed", "dismissed", "acted"]).default("new").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  userIdIdx: index("userIdIdx").on(table.userId),
  statusIdx: index("statusIdx").on(table.status),
}));

export type OpportunityAlert = typeof opportunityAlerts.$inferSelect;
export type InsertOpportunityAlert = typeof opportunityAlerts.$inferInsert;

// ============================================================================
// CONCIERGE TASKS
// ============================================================================

export const conciergeTasks = mysqlTable("concierge_tasks", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  taskType: varchar("taskType", { length: 100 }).notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  draftContent: json("draftContent").$type<any>(),
  status: mysqlEnum("status", ["pending_review", "approved", "rejected", "completed", "failed"]).default("pending_review").notNull(),
  userNotes: text("userNotes"),
  executedAt: timestamp("executedAt"),
  executionResult: json("executionResult").$type<any>(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  userIdIdx: index("userIdIdx").on(table.userId),
  statusIdx: index("statusIdx").on(table.status),
}));

export type ConciergeTask = typeof conciergeTasks.$inferSelect;
export type InsertConciergeTask = typeof conciergeTasks.$inferInsert;

// ============================================================================
// CHAT CONVERSATIONS
// ============================================================================

export const chatConversations = mysqlTable("chat_conversations", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  message: text("message").notNull(),
  response: text("response").notNull(),
  intent: varchar("intent", { length: 100 }),
  conversationId: varchar("conversationId", { length: 100 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  userIdIdx: index("userIdIdx").on(table.userId),
  conversationIdIdx: index("conversationIdIdx").on(table.conversationId),
}));

export type ChatConversation = typeof chatConversations.$inferSelect;
export type InsertChatConversation = typeof chatConversations.$inferInsert;
