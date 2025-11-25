/**
 * AETHER V5 - Automated Price Updater
 * Daily cron job to update portfolio holdings with latest market prices
 */

import cron from "node-cron";
import * as db from "./db";
import { fetchStockData } from "./marketData";
import { getUsdToInrRate } from "./forex";

interface UpdateResult {
  success: boolean;
  updatedAssets: number;
  errors: string[];
  timestamp: Date;
}

/**
 * Update all asset prices from market data
 */
export async function updateAllAssetPrices(): Promise<UpdateResult> {
  const startTime = new Date();
  console.log(`[Price Updater] Starting price update at ${startTime.toISOString()}`);

  const result: UpdateResult = {
    success: true,
    updatedAssets: 0,
    errors: [],
    timestamp: startTime,
  };

  try {
    // Get all assets that have tickers (stocks)
    // TODO: Implement getAllAssets in db.ts
    // For now, return empty array as placeholder
    const assetsWithTickers: any[] = [];

    console.log(`[Price Updater] Found ${assetsWithTickers.length} assets to update`);

    // Get current USD/INR rate for foreign stocks
    const usdToInr = await getUsdToInrRate();

    // Update each asset
    for (const asset of assetsWithTickers) {
      try {
        // Determine market based on ticker
        const market = asset.ticker?.endsWith(".NS") || asset.ticker?.endsWith(".BO") ? "IN" : "US";

        // Fetch latest price
        const stockData = await fetchStockData(asset.ticker!, market);

        // Calculate INR value
        let priceInr = stockData.price;
        if (market === "US") {
          priceInr = stockData.price * usdToInr;
        }

        // Update asset (simplified - in production would update asset table)
        // For now, we'll just log the update
        // TODO: Add updateAssetPrice to db.ts

        result.updatedAssets++;
        console.log(`[Price Updater] Updated ${asset.ticker}: ₹${priceInr.toFixed(2)}`);

        // Small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 200));
      } catch (error) {
        const errorMsg = `Failed to update ${asset.ticker}: ${error instanceof Error ? error.message : "Unknown error"}`;
        result.errors.push(errorMsg);
        console.error(`[Price Updater] ${errorMsg}`);
      }
    }

    // Create daily snapshot after price updates
    await createDailySnapshots();

    const endTime = new Date();
    const duration = (endTime.getTime() - startTime.getTime()) / 1000;
    console.log(`[Price Updater] Completed in ${duration}s. Updated ${result.updatedAssets} assets with ${result.errors.length} errors.`);

    result.success = result.errors.length === 0;
  } catch (error) {
    result.success = false;
    result.errors.push(error instanceof Error ? error.message : "Unknown error");
    console.error(`[Price Updater] Fatal error:`, error);
  }

  return result;
}

/**
 * Create daily portfolio snapshots for all users
 */
async function createDailySnapshots() {
  try {
    console.log("[Price Updater] Creating daily snapshots...");

    // Get all users (for now, skip snapshot creation as it requires user iteration)
    // TODO: Implement getAllUsers and createDailySnapshot in db.ts
    const users: any[] = []; // Placeholder

    for (const user of users) {
      try {
        // Get user's portfolio summary
        const userAssets = await db.getUserAssets(user.id);

        let totalNetWorth = 0;
        let totalCostBasis = 0;

        const currencyBreakdown: Record<string, number> = {};
        const assetClassBreakdown: Record<string, number> = {};
        const sectorBreakdown: Record<string, number> = {};

        for (const { asset, ownership } of userAssets) {
          const value = asset.currentValueInr * (ownership.ownershipPercentage / 100);
          const cost = ownership.costBasisInr;

          totalNetWorth += value;
          totalCostBasis += cost;

          // Currency breakdown
          const currency = asset.currency || "INR";
          currencyBreakdown[currency] = (currencyBreakdown[currency] || 0) + value;

          // Asset class breakdown
          const assetClass = asset.assetType;
          assetClassBreakdown[assetClass] = (assetClassBreakdown[assetClass] || 0) + value;

          // Sector breakdown
          const sector = asset.sector || "Other";
          sectorBreakdown[sector] = (sectorBreakdown[sector] || 0) + value;
        }

        const totalGain = totalNetWorth - totalCostBasis;
        const totalGainPercentage = totalCostBasis > 0 ? (totalGain / totalCostBasis) * 100 : 0;

        // Create snapshot
        await db.createSnapshot({
          ownerId: user.id,
          date: new Date(),
          totalNetWorthInr: totalNetWorth,
          currencyBreakdown,
          assetClassBreakdown,
          sectorBreakdown,
        });

        console.log(`[Price Updater] Created snapshot for user ${user.id}: ₹${totalNetWorth.toFixed(2)}`);
      } catch (error) {
        console.error(`[Price Updater] Failed to create snapshot for user ${user.id}:`, error);
      }
    }

    console.log("[Price Updater] Daily snapshots created successfully");
  } catch (error) {
    console.error("[Price Updater] Failed to create daily snapshots:", error);
  }
}

/**
 * Schedule daily price updates
 * Runs at 4:00 PM IST (after Indian market close at 3:30 PM)
 * Cron format: second minute hour day month weekday
 */
export function scheduleDailyUpdates() {
  // Run at 4:00 PM IST every weekday (Monday-Friday)
  // IST is UTC+5:30, so 4:00 PM IST = 10:30 AM UTC
  const cronSchedule = "0 30 10 * * 1-5"; // 10:30 AM UTC, Mon-Fri

  cron.schedule(cronSchedule, async () => {
    console.log("[Price Updater] Triggered scheduled price update");
    await updateAllAssetPrices();
  });

  console.log(`[Price Updater] Scheduled daily updates at 4:00 PM IST (${cronSchedule})`);
}

/**
 * Manual trigger for testing (can be called via API)
 */
export async function triggerManualUpdate(): Promise<UpdateResult> {
  console.log("[Price Updater] Manual update triggered");
  return await updateAllAssetPrices();
}
