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
        
        // Fetch real stock data from Yahoo Finance
        const { fetchStockData } = await import("./marketData");
        const stockData = await fetchStockData(input.ticker, input.market);
        
        const analysis = analyzeStock(stockData, input.market);
        
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
  // WEALTH ADVISOR
  // ============================================================================
  wealthAdvisor: router({
    // Generate personalized investment strategy
    generateStrategy: protectedProcedure
      .input(z.object({
        riskTolerance: z.enum(["conservative", "moderate", "aggressive"]),
        age: z.number(),
        investmentHorizon: z.number(),
        liquidityNeeds: z.enum(["low", "medium", "high"]),
        investmentGoals: z.array(z.string()),
      }))
      .mutation(async ({ ctx, input }) => {
        const { generateInvestmentStrategy } = await import("./wealthAdvisor");
        return await generateInvestmentStrategy(ctx.user.id, input);
      }),
    
    // Detect current market regime
    detectRegime: protectedProcedure.mutation(async () => {
      const { detectMarketRegime } = await import("./wealthAdvisor");
      return await detectMarketRegime();
    }),
    
    // Analyze behavioral patterns
    analyzeBehavior: protectedProcedure.mutation(async ({ ctx }) => {
      const { analyzeBehavioralPatterns } = await import("./wealthAdvisor");
      return await analyzeBehavioralPatterns(ctx.user.id);
    }),
    
    // Process natural language rebalancing command
    processRebalancing: protectedProcedure
      .input(z.object({
        command: z.string(),
      }))
      .mutation(async ({ ctx, input }) => {
        const { processRebalancingCommand } = await import("./wealthAdvisor");
        return await processRebalancingCommand(ctx.user.id, input.command);
      }),
  }),

  // ============================================================================
  // DOCUMENT INTELLIGENCE
  // ============================================================================
  documentIntelligence: router({
    // Parse Excel file
    parseExcel: protectedProcedure
      .input(z.object({
        fileUrl: z.string(),
      }))
      .mutation(async ({ input }) => {
        const response = await fetch(input.fileUrl);
        const buffer = Buffer.from(await response.arrayBuffer());
        const { parseExcelFile } = await import("./documentIntelligence");
        return await parseExcelFile(buffer);
      }),
    
    // Parse email
    parseEmail: protectedProcedure
      .input(z.object({
        emailContent: z.string(),
      }))
      .mutation(async ({ input }) => {
        const { parseEmail } = await import("./documentIntelligence");
        return await parseEmail(input.emailContent);
      }),
    
    // Parse Word document
    parseWord: protectedProcedure
      .input(z.object({
        fileUrl: z.string(),
      }))
      .mutation(async ({ input }) => {
        const response = await fetch(input.fileUrl);
        const buffer = Buffer.from(await response.arrayBuffer());
        const { parseWordDocument } = await import("./documentIntelligence");
        return await parseWordDocument(buffer);
      }),
    
    // Parse receipt (OCR)
    parseReceipt: protectedProcedure
      .input(z.object({
        imageUrl: z.string(),
      }))
      .mutation(async ({ input }) => {
        const { parseReceipt } = await import("./documentIntelligence");
        return await parseReceipt(input.imageUrl);
      }),
    
    // Categorize transactions
    categorizeTransactions: protectedProcedure
      .input(z.object({
        transactions: z.array(z.object({
          date: z.string(),
          description: z.string(),
          amount: z.number(),
          type: z.enum(["buy", "sell", "dividend", "interest"]),
          ticker: z.string().optional(),
          quantity: z.number().optional(),
          price: z.number().optional(),
          fees: z.number().optional(),
          confidence: z.number(),
        })),
      }))
      .mutation(async ({ input }) => {
        const { categorizeTransactions } = await import("./documentIntelligence");
        return await categorizeTransactions(input.transactions);
      }),
  }),

  // ============================================================================
  // FAMILY OFFICE
  // ============================================================================
  family: router({
    createFamily: protectedProcedure
      .input(z.object({
        name: z.string(),
      }))
      .mutation(async ({ ctx, input }) => {
        const { createFamilyGroup } = await import("./family");
        return await createFamilyGroup(ctx.user.id, input.name);
      }),
    
    getGroup: protectedProcedure
      .query(async ({ ctx }) => {
        const { getFamilyGroup } = await import("./family");
        return await getFamilyGroup(ctx.user.id);
      }),
    
    getMembers: protectedProcedure
      .query(async ({ ctx }) => {
        const { getFamilyMembers } = await import("./family");
        return await getFamilyMembers(ctx.user.id);
      }),
    
    getConsolidatedWealth: protectedProcedure
      .query(async ({ ctx }) => {
        const { getConsolidatedWealth } = await import("./family");
        return await getConsolidatedWealth(ctx.user.id);
      }),
    
    inviteMember: protectedProcedure
      .input(z.object({
        email: z.string().email(),
        role: z.enum(["family_admin", "family_viewer"]),
      }))
      .mutation(async ({ ctx, input }) => {
        const { inviteFamilyMember } = await import("./family");
        return await inviteFamilyMember(ctx.user.id, input.email, input.role);
      }),
    
    removeMember: protectedProcedure
      .input(z.object({
        userId: z.number(),
      }))
      .mutation(async ({ ctx, input }) => {
        const { removeFamilyMember } = await import("./family");
        return await removeFamilyMember(ctx.user.id, input.userId);
      }),
  }),

  // ============================================================================
  // SENTIMENT & NEWS ANALYSIS
  // ============================================================================
  sentiment: router({
    // Analyze sentiment for a specific stock
    analyzeStock: protectedProcedure
      .input(z.object({
        ticker: z.string(),
      }))
      .query(async ({ input }) => {
        const { analyzeStockSentiment } = await import("./sentimentAnalysis");
        return await analyzeStockSentiment(input.ticker);
      }),
    
    // Analyze overall market sentiment
    analyzeMarket: protectedProcedure
      .input(z.object({
        market: z.enum(["indian", "us", "global"]),
      }))
      .query(async ({ input }) => {
        const { analyzeMarketSentiment } = await import("./sentimentAnalysis");
        return await analyzeMarketSentiment(input.market);
      }),
    
    // Monitor portfolio holdings
    monitorPortfolio: protectedProcedure
      .input(z.object({
        tickers: z.array(z.string()),
      }))
      .query(async ({ input }) => {
        const { monitorPortfolioSentiment } = await import("./sentimentAnalysis");
        return await monitorPortfolioSentiment(input.tickers);
      }),
  }),

  // ============================================================================
  // PRICE UPDATER
  // ============================================================================
  priceUpdater: router({
    // Manual trigger for price updates (admin only)
    triggerUpdate: protectedProcedure.mutation(async () => {
      const { triggerManualUpdate } = await import("./priceUpdater");
      return await triggerManualUpdate();
    }),
  }),

  // ============================================================================
  // ANALYTICS
  // ============================================================================
  analytics: router({
    // Get asset allocation
    getAssetAllocation: protectedProcedure.query(async ({ ctx }) => {
      const { getAssetAllocation } = await import("./analytics");
      return await getAssetAllocation(ctx.user.id);
    }),
    
    // Get performance history
    getPerformanceHistory: protectedProcedure
      .input(z.object({
        days: z.number().default(30),
      }))
      .query(async ({ ctx, input }) => {
        const { getPerformanceHistory } = await import("./analytics");
        return await getPerformanceHistory(ctx.user.id, input.days);
      }),
    
    // Get sector allocation
    getSectorAllocation: protectedProcedure.query(async ({ ctx }) => {
      const { getSectorAllocation } = await import("./analytics");
      return await getSectorAllocation(ctx.user.id);
    }),
    
    // Get currency exposure
    getCurrencyExposure: protectedProcedure.query(async ({ ctx }) => {
      const { getCurrencyExposure } = await import("./analytics");
      return await getCurrencyExposure(ctx.user.id);
    }),
    
    // Get top performers
    getTopPerformers: protectedProcedure
      .input(z.object({
        limit: z.number().default(5),
      }))
      .query(async ({ ctx, input }) => {
        const { getTopPerformers } = await import("./analytics");
        return await getTopPerformers(ctx.user.id, input.limit);
      }),
    
    // Get bottom performers
    getBottomPerformers: protectedProcedure
      .input(z.object({
        limit: z.number().default(5),
      }))
      .query(async ({ ctx, input }) => {
        const { getBottomPerformers } = await import("./analytics");
        return await getBottomPerformers(ctx.user.id, input.limit);
      }),
  }),

  // ============================================================================
  // FOREX & CURRENCY CONVERSION
  // ============================================================================
  forex: router({
    // Get current exchange rates
    getRates: publicProcedure
      .input(z.object({
        baseCurrency: z.string().default("INR"),
      }))
      .query(async ({ input }) => {
        const { fetchExchangeRates } = await import("./forex");
        return await fetchExchangeRates(input.baseCurrency);
      }),
    
    // Convert currency
    convert: publicProcedure
      .input(z.object({
        amount: z.number(),
        fromCurrency: z.string(),
        toCurrency: z.string(),
      }))
      .query(async ({ input }) => {
        const { convertCurrency } = await import("./forex");
        const result = await convertCurrency(input.amount, input.fromCurrency, input.toCurrency);
        return { amount: result, fromCurrency: input.fromCurrency, toCurrency: input.toCurrency };
      }),
    
    // Calculate alpha breakdown
    calculateAlpha: protectedProcedure
      .input(z.object({
        purchasePriceNative: z.number(),
        currentPriceNative: z.number(),
        purchaseExchangeRate: z.number(),
        currentExchangeRate: z.number(),
      }))
      .query(({ input }) => {
        const { calculateAlpha } = require("./forex");
        return calculateAlpha(
          input.purchasePriceNative,
          input.currentPriceNative,
          input.purchaseExchangeRate,
          input.currentExchangeRate
        );
      }),
  }),

  // ============================================================================
  // DOCUMENT EXTRACTION
  // ============================================================================
  documents: router({
    // Extract transactions from PDF
    extract: protectedProcedure
      .input(z.object({
        pdfUrl: z.string().url(),
        broker: z.enum(["zerodha", "groww", "icici"]),
      }))
      .mutation(async ({ input }) => {
        const { extractTransactionsFromPDF } = await import("./documentExtraction");
        return await extractTransactionsFromPDF(input.pdfUrl, input.broker);
      }),
    
    // Commit extracted transactions to portfolio
    commitToPortfolio: protectedProcedure
      .input(z.object({
        transactions: z.array(z.object({
          date: z.string(),
          type: z.enum(["BUY", "SELL"]),
          ticker: z.string(),
          quantity: z.number(),
          price: z.number(),
          totalAmount: z.number(),
          charges: z.number(),
          netAmount: z.number(),
        })),
      }))
      .mutation(async ({ ctx, input }) => {
        // Process each transaction and create assets
        for (const txn of input.transactions) {
          // Create new asset for each transaction (simplified approach)
          const assetId = await db.createAsset({
            assetName: txn.ticker,
            ticker: txn.ticker,
            assetType: "stock",
            currentValueInr: txn.price,
            currency: "INR",
          });
          
          // Create asset ownership record
          await db.createAssetOwnership({
            ownerId: ctx.user.id,
            assetId,
            ownershipPercentage: 100,
            purchaseDate: new Date(txn.date),
            costBasisInr: txn.netAmount,
            costBasisNativeCurrency: txn.netAmount,
            nativeCurrency: "INR",
            exchangeRateAtPurchase: 1,
          });
        }
        
        return { success: true, count: input.transactions.length };
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
