import { describe, expect, it, beforeEach } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

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

describe("Portfolio Management", () => {
  describe("portfolio.getDashboard", () => {
    it("returns dashboard summary with zero values for new user", async () => {
      const { ctx } = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.portfolio.getDashboard();

      expect(result).toBeDefined();
      expect(result.totalNetWorth).toBeDefined();
      expect(typeof result.totalNetWorth).toBe("number");
      expect(result.currencyBreakdown).toBeDefined();
      expect(result.assetClassBreakdown).toBeDefined();
      expect(result.sectorBreakdown).toBeDefined();
    });
  });

  describe("portfolio.getAssets", () => {
    it("returns empty array for user with no assets", async () => {
      const { ctx } = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.portfolio.getAssets();

      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThanOrEqual(0);
    });
  });

  describe("portfolio.addAsset", () => {
    it("successfully adds a new stock asset", async () => {
      const { ctx } = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      const assetData = {
        assetType: "stock" as const,
        assetName: "HDFC Bank",
        ticker: "HDFCBANK",
        quantity: 100,
        purchasePrice: 1500,
        purchaseDate: new Date("2024-01-01"),
        currency: "INR",
        country: "India",
        sector: "Banking",
      };

      const result = await caller.portfolio.addAsset(assetData);

      expect(result).toBeDefined();
      expect(result.success).toBe(true);
      expect(result.assetId).toBeDefined();
    });

    it("validates required fields", async () => {
      const { ctx } = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      const invalidData = {
        assetType: "stock" as const,
        assetName: "",
        quantity: 100,
        purchasePrice: 1500,
        purchaseDate: new Date(),
        currency: "INR",
      };

      await expect(caller.portfolio.addAsset(invalidData)).rejects.toThrow();
    });

    it("validates positive quantity", async () => {
      const { ctx } = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      const invalidData = {
        assetType: "stock" as const,
        assetName: "Test Stock",
        quantity: -10,
        purchasePrice: 1500,
        purchaseDate: new Date(),
        currency: "INR",
      };

      await expect(caller.portfolio.addAsset(invalidData)).rejects.toThrow();
    });

    it("validates positive price", async () => {
      const { ctx } = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      const invalidData = {
        assetType: "stock" as const,
        assetName: "Test Stock",
        quantity: 100,
        purchasePrice: -1500,
        purchaseDate: new Date(),
        currency: "INR",
      };

      await expect(caller.portfolio.addAsset(invalidData)).rejects.toThrow();
    });
  });
});

describe("LRS Tracking", () => {
  describe("lrs.getUsage", () => {
    it("returns LRS usage summary", async () => {
      const { ctx } = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.lrs.getUsage();

      expect(result).toBeDefined();
      expect(result.used).toBeDefined();
      expect(result.limit).toBe(250000);
      expect(result.remaining).toBeDefined();
      expect(result.percentage).toBeDefined();
      expect(result.fiscalYearStart).toBeDefined();
    });

    it("calculates correct percentage", async () => {
      const { ctx } = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.lrs.getUsage();

      const expectedPercentage = (result.used / result.limit) * 100;
      expect(result.percentage).toBeCloseTo(expectedPercentage, 2);
    });
  });

  describe("lrs.getTransactions", () => {
    it("returns array of transactions", async () => {
      const { ctx } = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.lrs.getTransactions();

      expect(Array.isArray(result)).toBe(true);
    });
  });

  describe("lrs.addTransaction", () => {
    it("successfully adds a new LRS transaction", async () => {
      const { ctx } = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      const transactionData = {
        transactionDate: new Date("2024-01-15"),
        amountUsd: 50000,
        purpose: "Investment in US Stocks",
        description: "Purchase of Apple shares",
      };

      const result = await caller.lrs.addTransaction(transactionData);

      expect(result).toBeDefined();
      expect(result.success).toBe(true);
    });

    it("validates required fields", async () => {
      const { ctx } = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      const invalidData = {
        transactionDate: new Date(),
        amountUsd: 50000,
        purpose: "",
      };

      await expect(caller.lrs.addTransaction(invalidData)).rejects.toThrow();
    });

    it("validates positive amount", async () => {
      const { ctx } = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      const invalidData = {
        transactionDate: new Date(),
        amountUsd: -50000,
        purpose: "Investment",
      };

      await expect(caller.lrs.addTransaction(invalidData)).rejects.toThrow();
    });
  });
});

describe("Authentication", () => {
  describe("auth.me", () => {
    it("returns current user when authenticated", async () => {
      const { ctx } = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.auth.me();

      expect(result).toBeDefined();
      expect(result?.id).toBe(1);
      expect(result?.email).toBe("test@aether.com");
      expect(result?.name).toBe("Test User");
    });
  });
});
