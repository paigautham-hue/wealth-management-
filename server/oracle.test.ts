import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";
import { analyzeStock, type StockData } from "./oracle";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAuthContext(): { ctx: TrpcContext } {
  const user: AuthenticatedUser = {
    id: 1,
    openId: "test-user-123",
    email: "test@aether.com",
    name: "Test User",
    loginMethod: "manus",
    role: "user",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  const ctx: TrpcContext = {
    user,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: () => {},
    } as TrpcContext["res"],
  };

  return { ctx };
}

describe("The Oracle - Stock Analysis Engine", () => {
  describe("oracle.getAnalysis", () => {
    it("returns analysis for Indian stock", async () => {
      const { ctx } = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.oracle.getAnalysis({
        ticker: "HDFCBANK",
        market: "IN",
      });

      expect(result).toBeDefined();
      expect(result.ticker).toBe("HDFCBANK");
      expect(result.market).toBe("IN");
      expect(result.finalScore).toBeGreaterThanOrEqual(0);
      expect(result.finalScore).toBeLessThanOrEqual(100); // Database stores as 0-100
      expect(result.lensScores).toBeDefined();
    });

    it("returns analysis for US stock", async () => {
      const { ctx } = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.oracle.getAnalysis({
        ticker: "AAPL",
        market: "US",
      });

      expect(result).toBeDefined();
      expect(result.ticker).toBe("AAPL");
      expect(result.market).toBe("US");
    });

    it("includes all 8 investment lens scores", async () => {
      const { ctx } = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.oracle.getAnalysis({
        ticker: "RELIANCE",
        market: "IN",
      });

      expect(result.lensScores.buffett).toBeDefined();
      expect(result.lensScores.lynch).toBeDefined();
      expect(result.lensScores.graham).toBeDefined();
      expect(result.lensScores.fisher).toBeDefined();
      expect(result.lensScores.jhunjhunwala).toBeDefined();
      expect(result.lensScores.kacholia).toBeDefined();
      expect(result.lensScores.kedia).toBeDefined();
      expect(result.lensScores.quantitative).toBeDefined();
    });

    it("provides recommendation based on score", async () => {
      const { ctx } = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.oracle.getAnalysis({
        ticker: "TCS",
        market: "IN",
      });

      expect(result.recommendation).toMatch(/STRONG_BUY|BUY|HOLD|SELL|STRONG_SELL/);
      expect(result.confidence).toBeGreaterThanOrEqual(60);
      expect(result.confidence).toBeLessThanOrEqual(95);
    });

    it("calculates target price and upside", async () => {
      const { ctx } = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.oracle.getAnalysis({
        ticker: "INFY",
        market: "IN",
      });

      expect(result.currentPrice).toBeGreaterThan(0);
      expect(result.targetPrice).toBeGreaterThan(0);
      expect(result.upsidePercentage).toBeDefined();
    });
  });

  describe("Stock Analysis Logic", () => {
    const mockStockData: StockData = {
      ticker: "TEST",
      price: 1000,
      marketCap: 50000,
      pe: 15,
      pb: 2.5,
      roe: 20,
      roce: 25,
      debtToEquity: 0.2,
      revenueGrowth: 18,
      eps: 65,
      bookValue: 400,
      ebit: 15000,
      enterpriseValue: 55000,
      capitalEmployed: 40000,
      piotroskiScore: 8,
      priceChange3M: 8,
      priceChange6M: 15,
      promoterHolding: 60,
      sector: "Technology",
      companyAge: 15,
      tam: 500000,
      revenue: 80000,
    };

    it("analyzes stock with all lenses", () => {
      const analysis = analyzeStock(mockStockData, "IN");

      expect(analysis.lensScores.buffett.score).toBeGreaterThanOrEqual(0);
      expect(analysis.lensScores.buffett.score).toBeLessThanOrEqual(10);
      expect(analysis.lensScores.buffett.verdict).toBeDefined();
    });

    it("calculates weighted final score", () => {
      const analysis = analyzeStock(mockStockData, "IN");

      expect(analysis.finalScore).toBeGreaterThanOrEqual(0);
      expect(analysis.finalScore).toBeLessThanOrEqual(10);
    });

    it("provides actionable recommendation", () => {
      const analysis = analyzeStock(mockStockData, "IN");

      expect(["STRONG_BUY", "BUY", "HOLD", "SELL", "STRONG_SELL"]).toContain(
        analysis.recommendation
      );
    });
  });
});

describe("Chat Assistant", () => {
  describe("chat.sendMessage", () => {
    it("responds to net worth query", async () => {
      const { ctx } = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.chat.sendMessage({
        message: "What is my net worth?",
      });

      expect(result).toBeDefined();
      expect(result.response).toBeDefined();
      expect(typeof result.response).toBe("string");
      expect(result.conversationId).toBeDefined();
    });

    it("responds to LRS query", async () => {
      const { ctx } = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.chat.sendMessage({
        message: "How much LRS have I used?",
      });

      expect(result).toBeDefined();
      expect(result.response).toBeDefined();
    });

    it("maintains conversation context", async () => {
      const { ctx } = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      const first = await caller.chat.sendMessage({
        message: "Hello",
      });

      const second = await caller.chat.sendMessage({
        message: "What's my portfolio value?",
        conversationId: first.conversationId,
      });

      expect(second.conversationId).toBe(first.conversationId);
    }, 10000);
  });

  describe("chat.getHistory", () => {
    it("retrieves chat history", async () => {
      const { ctx } = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      const history = await caller.chat.getHistory({});

      expect(Array.isArray(history)).toBe(true);
    });
  });
});
