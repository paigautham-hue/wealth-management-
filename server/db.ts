import { eq, and, desc, gte, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { 
  InsertUser, 
  users,
  assets,
  assetOwnership,
  dailyPortfolioSnapshots,
  documentUploads,
  lrsTransactions,
  stockAnalyses,
  opportunityAlerts,
  conciergeTasks,
  chatConversations,
  userPreferences,
  valuationHistory,
  InsertAsset,
  InsertAssetOwnership,
  InsertDailyPortfolioSnapshot,
  InsertDocumentUpload,
  InsertLrsTransaction,
  InsertStockAnalysis,
  InsertOpportunityAlert,
  InsertConciergeTask,
  InsertChatConversation,
  InsertUserPreference,
  InsertValuationHistory,
} from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

// ============================================================================
// USER MANAGEMENT
// ============================================================================

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getUserById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  
  const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

// ============================================================================
// ASSET MANAGEMENT
// ============================================================================

export async function createAsset(asset: InsertAsset) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(assets).values(asset);
  return result[0].insertId;
}

export async function createAssetOwnership(ownership: InsertAssetOwnership) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.insert(assetOwnership).values(ownership);
}

export async function getUserAssets(userId: number) {
  const db = await getDb();
  if (!db) return [];
  
  const result = await db
    .select({
      asset: assets,
      ownership: assetOwnership,
    })
    .from(assetOwnership)
    .innerJoin(assets, eq(assetOwnership.assetId, assets.id))
    .where(eq(assetOwnership.ownerId, userId))
    .orderBy(desc(assets.currentValueInr));
  
  return result;
}

export async function getAssetById(assetId: number) {
  const db = await getDb();
  if (!db) return undefined;
  
  const result = await db.select().from(assets).where(eq(assets.id, assetId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

// ============================================================================
// PORTFOLIO SNAPSHOTS
// ============================================================================

export async function getLatestSnapshot(userId: number) {
  const db = await getDb();
  if (!db) return undefined;
  
  const result = await db
    .select()
    .from(dailyPortfolioSnapshots)
    .where(eq(dailyPortfolioSnapshots.ownerId, userId))
    .orderBy(desc(dailyPortfolioSnapshots.date))
    .limit(1);
  
  return result.length > 0 ? result[0] : undefined;
}

export async function createSnapshot(snapshot: InsertDailyPortfolioSnapshot) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.insert(dailyPortfolioSnapshots).values(snapshot);
}

export async function getSnapshotByDate(userId: number, date: Date) {
  const db = await getDb();
  if (!db) return undefined;
  
  const dateStr = date.toISOString().split('T')[0];
  const result = await db
    .select()
    .from(dailyPortfolioSnapshots)
    .where(
      and(
        eq(dailyPortfolioSnapshots.ownerId, userId),
        sql`DATE(${dailyPortfolioSnapshots.date}) = ${dateStr}`
      )
    )
    .limit(1);
  
  return result.length > 0 ? result[0] : undefined;
}

// ============================================================================
// LRS TRANSACTIONS
// ============================================================================

export async function createLrsTransaction(transaction: InsertLrsTransaction) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.insert(lrsTransactions).values(transaction);
}

export async function getUserLrsTransactions(userId: number) {
  const db = await getDb();
  if (!db) return [];
  
  return await db
    .select()
    .from(lrsTransactions)
    .where(eq(lrsTransactions.userId, userId))
    .orderBy(desc(lrsTransactions.transactionDate));
}

export async function getLrsUsageForFiscalYear(userId: number, fiscalYearStart: Date) {
  const db = await getDb();
  if (!db) return 0;
  
  const result = await db
    .select({
      total: sql<number>`SUM(${lrsTransactions.amountUsd})`,
    })
    .from(lrsTransactions)
    .where(
      and(
        eq(lrsTransactions.userId, userId),
        gte(lrsTransactions.transactionDate, fiscalYearStart)
      )
    );
  
  return result[0]?.total || 0;
}

// ============================================================================
// STOCK ANALYSES
// ============================================================================

export async function createStockAnalysis(analysis: InsertStockAnalysis) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.insert(stockAnalyses).values(analysis);
}

export async function getStockAnalysis(ticker: string, market: "IN" | "US") {
  const db = await getDb();
  if (!db) return undefined;
  
  // Get analysis from last 24 hours
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
  
  const result = await db
    .select()
    .from(stockAnalyses)
    .where(
      and(
        eq(stockAnalyses.ticker, ticker),
        eq(stockAnalyses.market, market),
        gte(stockAnalyses.analysisDate, oneDayAgo)
      )
    )
    .orderBy(desc(stockAnalyses.analysisDate))
    .limit(1);
  
  return result.length > 0 ? result[0] : undefined;
}

// ============================================================================
// DOCUMENT UPLOADS
// ============================================================================

export async function createDocumentUpload(doc: InsertDocumentUpload) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(documentUploads).values(doc);
  return result[0].insertId;
}

export async function updateDocumentUpload(id: number, updates: Partial<InsertDocumentUpload>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.update(documentUploads).set(updates).where(eq(documentUploads.id, id));
}

export async function getUserDocuments(userId: number) {
  const db = await getDb();
  if (!db) return [];
  
  return await db
    .select()
    .from(documentUploads)
    .where(eq(documentUploads.userId, userId))
    .orderBy(desc(documentUploads.createdAt));
}

// ============================================================================
// CHAT CONVERSATIONS
// ============================================================================

export async function createChatMessage(chat: InsertChatConversation) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.insert(chatConversations).values(chat);
}

export async function getUserChatHistory(userId: number, conversationId?: string) {
  const db = await getDb();
  if (!db) return [];
  
  const conditions = conversationId
    ? and(eq(chatConversations.userId, userId), eq(chatConversations.conversationId, conversationId))
    : eq(chatConversations.userId, userId);
  
  return await db
    .select()
    .from(chatConversations)
    .where(conditions)
    .orderBy(chatConversations.createdAt);
}

// ============================================================================
// USER PREFERENCES
// ============================================================================

export async function getUserPreferences(userId: number) {
  const db = await getDb();
  if (!db) return undefined;
  
  const result = await db
    .select()
    .from(userPreferences)
    .where(eq(userPreferences.userId, userId))
    .limit(1);
  
  return result.length > 0 ? result[0] : undefined;
}

export async function upsertUserPreferences(prefs: InsertUserPreference) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db
    .insert(userPreferences)
    .values(prefs)
    .onDuplicateKeyUpdate({ set: prefs });
}
