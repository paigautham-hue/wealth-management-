import { z } from "zod";
import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import * as db from "./db";

// ============================================================================
// VALIDATION SCHEMAS
// ============================================================================

const addAssetSchema = z.object({
  assetType: z.enum(["stock", "bond", "mutual_fund", "real_estate", "alternative", "cash"]),
  assetName: z.string().min(1, "Asset name is required"),
  ticker: z.string().optional(),
  quantity: z.number().positive("Quantity must be positive"),
  purchasePrice: z.number().positive("Purchase price must be positive"),
  purchaseDate: z.date(),
  currency: z.string().default("INR"),
  country: z.string().optional(),
  sector: z.string().optional(),
});

const addLrsTransactionSchema = z.object({
  transactionDate: z.date(),
  amountUsd: z.number().positive("Amount must be positive"),
  purpose: z.string().min(1, "Purpose is required"),
  description: z.string().optional(),
  assetId: z.number().optional(),
});

// ============================================================================
// APP ROUTER
// ============================================================================

export const appRouter = router({
  system: systemRouter,
  
  // ============================================================================
  // AUTHENTICATION
  // ============================================================================
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),

  // ============================================================================
  // PORTFOLIO MANAGEMENT
  // ============================================================================
  portfolio: router({
    // Get dashboard summary
    getDashboard: protectedProcedure.query(async ({ ctx }) => {
      const userId = ctx.user.id;
      
      // Try to get latest snapshot first (fast path)
      const snapshot = await db.getLatestSnapshot(userId);
      
      if (snapshot) {
        return {
          totalNetWorth: snapshot.totalNetWorthInr,
          currencyBreakdown: snapshot.currencyBreakdown || {},
          assetClassBreakdown: snapshot.assetClassBreakdown || {},
          sectorBreakdown: snapshot.sectorBreakdown || {},
          lastUpdated: snapshot.date,
        };
      }
      
      // Fallback: Calculate from assets (slow path)
      const userAssets = await db.getUserAssets(userId);
      
      let totalNetWorth = 0;
      const currencyBreakdown: Record<string, number> = {};
      const assetClassBreakdown: Record<string, number> = {};
      const sectorBreakdown: Record<string, number> = {};
      
      for (const { asset, ownership } of userAssets) {
        const value = asset.currentValueInr * (ownership.ownershipPercentage / 100);
        totalNetWorth += value;
        
        // Currency breakdown
        currencyBreakdown[asset.currency] = (currencyBreakdown[asset.currency] || 0) + value;
        
        // Asset class breakdown
        assetClassBreakdown[asset.assetType] = (assetClassBreakdown[asset.assetType] || 0) + value;
        
        // Sector breakdown
        if (asset.sector) {
          sectorBreakdown[asset.sector] = (sectorBreakdown[asset.sector] || 0) + value;
        }
      }
      
      return {
        totalNetWorth,
        currencyBreakdown,
        assetClassBreakdown,
        sectorBreakdown,
        lastUpdated: new Date(),
      };
    }),
    
    // Get all assets with ownership details
    getAssets: protectedProcedure.query(async ({ ctx }) => {
      const userAssets = await db.getUserAssets(ctx.user.id);
      
      return userAssets.map(({ asset, ownership }) => {
        const currentValue = asset.currentValueInr * (ownership.ownershipPercentage / 100);
        const gain = currentValue - ownership.costBasisInr;
        const gainPercentage = (gain / ownership.costBasisInr) * 100;
        
        return {
          id: asset.id,
          assetType: asset.assetType,
          assetName: asset.assetName,
          ticker: asset.ticker,
          currentValue,
          quantity: asset.currentQuantity * (ownership.ownershipPercentage / 100),
          currentPrice: asset.currentPrice,
          costBasis: ownership.costBasisInr,
          gain,
          gainPercentage,
          currency: asset.currency,
          country: asset.country,
          sector: asset.sector,
          purchaseDate: ownership.purchaseDate,
          ownershipPercentage: ownership.ownershipPercentage,
        };
      });
    }),
    
    // Add new asset manually
    addAsset: protectedProcedure
      .input(addAssetSchema)
      .mutation(async ({ ctx, input }) => {
        const userId = ctx.user.id;
        
        // Calculate current value (for new assets, current = purchase)
        const currentValue = Math.round(input.quantity * input.purchasePrice);
        
        // Create asset
        const assetId = await db.createAsset({
          assetType: input.assetType,
          assetName: input.assetName,
          ticker: input.ticker,
          currentValueInr: currentValue,
          currentQuantity: Math.round(input.quantity),
          currentPrice: Math.round(input.purchasePrice),
          currency: input.currency,
          country: input.country,
          sector: input.sector,
        });
        
        // Create ownership (100% ownership for manually added assets)
        await db.createAssetOwnership({
          assetId: Number(assetId),
          ownerId: userId,
          ownershipPercentage: 100,
          costBasisInr: currentValue,
          costBasisNativeCurrency: Math.round(input.purchasePrice),
          nativeCurrency: input.currency,
          exchangeRateAtPurchase: 100, // 1:1 for INR, will be updated for foreign assets
          purchaseDate: input.purchaseDate,
        });
        
        return { success: true, assetId };
      }),
  }),

  // ============================================================================
  // LRS TRACKING
  // ============================================================================
  lrs: router({
    // Get LRS usage for current fiscal year
    getUsage: protectedProcedure.query(async ({ ctx }) => {
      const userId = ctx.user.id;
      
      // Indian fiscal year starts April 1
      const now = new Date();
      const fiscalYearStart = new Date(
        now.getMonth() >= 3 ? now.getFullYear() : now.getFullYear() - 1,
        3, // April
        1
      );
      
      const used = await db.getLrsUsageForFiscalYear(userId, fiscalYearStart);
      const limit = 250000; // $250,000 USD limit
      const remaining = limit - used;
      
      return {
        used,
        limit,
        remaining,
        percentage: (used / limit) * 100,
        fiscalYearStart,
      };
    }),
    
    // Get all LRS transactions
    getTransactions: protectedProcedure.query(async ({ ctx }) => {
      return await db.getUserLrsTransactions(ctx.user.id);
    }),
    
    // Add new LRS transaction
    addTransaction: protectedProcedure
      .input(addLrsTransactionSchema)
      .mutation(async ({ ctx, input }) => {
        await db.createLrsTransaction({
          userId: ctx.user.id,
          transactionDate: input.transactionDate,
          amountUsd: Math.round(input.amountUsd),
          purpose: input.purpose,
          description: input.description,
          assetId: input.assetId,
        });
        
        return { success: true };
      }),
  }),

  // ============================================================================
  // STOCK ANALYSIS (The Oracle)
  // ============================================================================
  oracle: router({
    // Get stock analysis (cached for 24 hours)
    getAnalysis: protectedProcedure
      .input(z.object({
        ticker: z.string(),
        market: z.enum(["IN", "US"]),
      }))
      .query(async ({ input }) => {
        const analysis = await db.getStockAnalysis(input.ticker, input.market);
        return analysis;
      }),
  }),

  // ============================================================================
  // CHAT ASSISTANT
  // ============================================================================
  chat: router({
    // Get chat history
    getHistory: protectedProcedure
      .input(z.object({
        conversationId: z.string().optional(),
      }))
      .query(async ({ ctx, input }) => {
        return await db.getUserChatHistory(ctx.user.id, input.conversationId);
      }),
  }),
});

export type AppRouter = typeof appRouter;
