import { z } from "zod";
import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import * as db from "./db";
import { analyzeStock, type StockData } from "./oracle";

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
    // Get stock analysis
    getAnalysis: protectedProcedure
      .input(z.object({
        ticker: z.string(),
        market: z.enum(["IN", "US"]),
      }))
      .query(async ({ input }) => {
        // Check cache first
        const cached = await db.getStockAnalysis(input.ticker, input.market);
        if (cached) {
          return {
            ...cached,
            lensScores: {
              buffett: { score: cached.buffettScore / 10, verdict: cached.buffettVerdict || "", reasoning: "" },
              lynch: { score: cached.lynchScore / 10, verdict: cached.lynchVerdict || "", reasoning: "" },
              graham: { score: cached.grahamScore / 10, verdict: cached.grahamVerdict || "", reasoning: "" },
              fisher: { score: cached.fisherScore / 10, verdict: cached.fisherVerdict || "", reasoning: "" },
              jhunjhunwala: { score: cached.jhunjhunwalaScore / 10, verdict: cached.jhunjhunwalaVerdict || "", reasoning: "" },
              kacholia: { score: cached.kacholiaScore / 10, verdict: cached.kacholiaVerdict || "", reasoning: "" },
              kedia: { score: cached.kediaScore / 10, verdict: cached.kediaVerdict || "", reasoning: "" },
              quantitative: { score: cached.quantitativeScore / 10, verdict: cached.quantitativeVerdict || "", reasoning: "" },
            },
          };
        }
        
        // Mock stock data for demo (in production, fetch from real API)
        const mockData: StockData = {
          ticker: input.ticker,
          price: 1500,
          marketCap: 500000,
          pe: 18,
          pb: 3.5,
          roe: 18,
          roce: 22,
          debtToEquity: 0.3,
          revenueGrowth: 15,
          eps: 80,
          bookValue: 450,
          ebit: 25000,
          enterpriseValue: 550000,
          capitalEmployed: 100000,
          piotroskiScore: 7,
          priceChange3M: 5,
          priceChange6M: 12,
          promoterHolding: 65,
          sector: "Banking",
          companyAge: 25,
          tam: 5000000,
          revenue: 100000,
        };
        
        const analysis = analyzeStock(mockData, input.market);
        
        // Save to database
        await db.createStockAnalysis({
          ticker: input.ticker,
          market: input.market,
          analysisDate: new Date(),
          buffettScore: Math.round(analysis.lensScores.buffett.score * 10),
          buffettVerdict: analysis.lensScores.buffett.verdict,
          lynchScore: Math.round(analysis.lensScores.lynch.score * 10),
          lynchVerdict: analysis.lensScores.lynch.verdict,
          grahamScore: Math.round(analysis.lensScores.graham.score * 10),
          grahamVerdict: analysis.lensScores.graham.verdict,
          fisherScore: Math.round(analysis.lensScores.fisher.score * 10),
          fisherVerdict: analysis.lensScores.fisher.verdict,
          jhunjhunwalaScore: Math.round(analysis.lensScores.jhunjhunwala.score * 10),
          jhunjhunwalaVerdict: analysis.lensScores.jhunjhunwala.verdict,
          kacholiaScore: Math.round(analysis.lensScores.kacholia.score * 10),
          kacholiaVerdict: analysis.lensScores.kacholia.verdict,
          kediaScore: Math.round(analysis.lensScores.kedia.score * 10),
          kediaVerdict: analysis.lensScores.kedia.verdict,
          quantitativeScore: Math.round(analysis.lensScores.quantitative.score * 10),
          quantitativeVerdict: analysis.lensScores.quantitative.verdict,
          finalScore: Math.round(analysis.finalScore * 10),
          recommendation: analysis.recommendation,
          confidence: analysis.confidence,
          currentPrice: analysis.currentPrice,
          targetPrice: analysis.targetPrice,
          upsidePercentage: analysis.upsidePercentage,
          executiveSummary: "This stock shows strong fundamentals with consistent growth and reasonable valuation. The company demonstrates competitive advantages in its sector.",
          strengths: ["Strong market position", "Consistent revenue growth", "Healthy profitability metrics"],
          risks: ["Market volatility", "Regulatory changes", "Competition pressure"],
          bearCase: "Despite positive indicators, investors should consider potential headwinds including market saturation, increased competition, and macroeconomic uncertainties that could impact growth projections.",
        });
        
        return {
          ...analysis,
          executiveSummary: "This stock shows strong fundamentals with consistent growth and reasonable valuation. The company demonstrates competitive advantages in its sector.",
          strengths: ["Strong market position", "Consistent revenue growth", "Healthy profitability metrics"],
          risks: ["Market volatility", "Regulatory changes", "Competition pressure"],
          bearCase: "Despite positive indicators, investors should consider potential headwinds including market saturation, increased competition, and macroeconomic uncertainties that could impact growth projections.",
        };
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
    
    // Send message and get AI response
    sendMessage: protectedProcedure
      .input(z.object({
        message: z.string().min(1),
        conversationId: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const { generateChatResponse } = await import("./chat");
        
        // Get portfolio context
        const userAssets = await db.getUserAssets(ctx.user.id);
        const totalNetWorth = userAssets.reduce(
          (sum, { asset, ownership }) => sum + asset.currentValueInr * (ownership.ownershipPercentage / 100),
          0
        );
        
        const now = new Date();
        const fiscalYearStart = new Date(
          now.getMonth() >= 3 ? now.getFullYear() : now.getFullYear() - 1,
          3,
          1
        );
        const lrsUsed = await db.getLrsUsageForFiscalYear(ctx.user.id, fiscalYearStart);
        
        const chatContext = {
          userId: ctx.user.id,
          portfolioSummary: {
            totalNetWorth,
            assetCount: userAssets.length,
            lrsUsed,
            lrsRemaining: 250000 - lrsUsed,
          },
        };
        
        // Generate response
        const response = await generateChatResponse(input.message, chatContext);
        
        // Save conversation to database
        const conversationId = input.conversationId || `conv_${Date.now()}`;
        await db.createChatMessage({
          userId: ctx.user.id,
          conversationId,
          message: input.message,
          response: response,
        });
        
        return {
          response,
          conversationId,
        };
      }),
  }),
});

export type AppRouter = typeof appRouter;
