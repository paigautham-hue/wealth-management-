/**
 * AETHER V5 - Analytics Service
 * Portfolio analytics and chart data generation
 */

import * as db from "./db";

export interface AssetAllocation {
  assetType: string;
  value: number;
  percentage: number;
  count: number;
}

export interface PerformanceDataPoint {
  date: string;
  netWorth: number;
  gain: number;
  gainPercentage: number;
}

export interface SectorAllocation {
  sector: string;
  value: number;
  percentage: number;
  count: number;
}

export interface CurrencyExposure {
  currency: string;
  value: number;
  percentage: number;
  count: number;
}

/**
 * Calculate asset allocation breakdown
 */
export async function getAssetAllocation(userId: number): Promise<AssetAllocation[]> {
  const userAssets = await db.getUserAssets(userId);
  
  const totalValue = userAssets.reduce(
    (sum, { asset, ownership }) => sum + asset.currentValueInr * (ownership.ownershipPercentage / 100),
    0
  );

  // Group by asset type
  const grouped = userAssets.reduce((acc, { asset, ownership }) => {
    const type = asset.assetType;
    const value = asset.currentValueInr * (ownership.ownershipPercentage / 100);
    
    if (!acc[type]) {
      acc[type] = { value: 0, count: 0 };
    }
    acc[type].value += value;
    acc[type].count += 1;
    
    return acc;
  }, {} as Record<string, { value: number; count: number }>);

  // Convert to array with percentages
  return Object.entries(grouped).map(([assetType, data]) => ({
    assetType: assetType.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase()),
    value: Math.round(data.value),
    percentage: Math.round((data.value / totalValue) * 100 * 10) / 10,
    count: data.count,
  }));
}

/**
 * Get performance over time (using snapshots)
 * TODO: Implement actual snapshot retrieval when daily snapshots are created
 */
export async function getPerformanceHistory(userId: number, days: number = 30): Promise<PerformanceDataPoint[]> {
  // For now, generate mock historical data
  // In production, this would query daily_portfolio_snapshots table
  const userAssets = await db.getUserAssets(userId);
  const currentNetWorth = userAssets.reduce(
    (sum, { asset, ownership }) => sum + asset.currentValueInr * (ownership.ownershipPercentage / 100),
    0
  );
  
  const dataPoints: PerformanceDataPoint[] = [];
  const today = new Date();
  
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    
    // Simulate growth trend with some volatility
    const volatility = (Math.random() - 0.5) * 0.02; // ±1% daily volatility
    const trend = 0.0003 * (days - i); // Slight upward trend
    const multiplier = 1 + trend + volatility;
    const netWorth = Math.round(currentNetWorth * multiplier);
    const gain = netWorth - currentNetWorth;
    const gainPercentage = (gain / currentNetWorth) * 100;
    
    dataPoints.push({
      date: date.toISOString().split("T")[0],
      netWorth,
      gain,
      gainPercentage: Math.round(gainPercentage * 10) / 10,
    });
  }
  
  return dataPoints;
}

/**
 * Calculate sector allocation
 */
export async function getSectorAllocation(userId: number): Promise<SectorAllocation[]> {
  const userAssets = await db.getUserAssets(userId);
  
  const totalValue = userAssets.reduce(
    (sum, { asset, ownership }) => sum + asset.currentValueInr * (ownership.ownershipPercentage / 100),
    0
  );

  // Group by sector (from asset metadata or default)
  const grouped = userAssets.reduce((acc, { asset, ownership }) => {
    // For stocks, we'd ideally have sector info; for now use asset type as proxy
    const sector = asset.sector || asset.assetType.replace(/_/g, " ");
    const value = asset.currentValueInr * (ownership.ownershipPercentage / 100);
    
    if (!acc[sector]) {
      acc[sector] = { value: 0, count: 0 };
    }
    acc[sector].value += value;
    acc[sector].count += 1;
    
    return acc;
  }, {} as Record<string, { value: number; count: number }>);

  return Object.entries(grouped).map(([sector, data]) => ({
    sector: sector.replace(/\b\w/g, l => l.toUpperCase()),
    value: Math.round(data.value),
    percentage: Math.round((data.value / totalValue) * 100 * 10) / 10,
    count: data.count,
  }));
}

/**
 * Calculate currency exposure
 */
export async function getCurrencyExposure(userId: number): Promise<CurrencyExposure[]> {
  const userAssets = await db.getUserAssets(userId);
  
  const totalValue = userAssets.reduce(
    (sum, { asset, ownership }) => sum + asset.currentValueInr * (ownership.ownershipPercentage / 100),
    0
  );

  // Group by currency
  const grouped = userAssets.reduce((acc, { asset, ownership }) => {
    const currency = asset.currency || "INR";
    const value = asset.currentValueInr * (ownership.ownershipPercentage / 100);
    
    if (!acc[currency]) {
      acc[currency] = { value: 0, count: 0 };
    }
    acc[currency].value += value;
    acc[currency].count += 1;
    
    return acc;
  }, {} as Record<string, { value: number; count: number }>);

  return Object.entries(grouped).map(([currency, data]) => ({
    currency,
    value: Math.round(data.value),
    percentage: Math.round((data.value / totalValue) * 100 * 10) / 10,
    count: data.count,
  }));
}

/**
 * Get top performing assets
 */
export async function getTopPerformers(userId: number, limit: number = 5) {
  const userAssets = await db.getUserAssets(userId);
  
  const assetsWithGain = userAssets.map(({ asset, ownership }) => {
    const currentValue = asset.currentValueInr * (ownership.ownershipPercentage / 100);
    const costBasis = ownership.costBasisInr;
    const gain = currentValue - costBasis;
    const gainPercentage = (gain / costBasis) * 100;
    
    return {
      assetName: asset.assetName,
      ticker: asset.ticker,
      gain,
      gainPercentage: Math.round(gainPercentage * 10) / 10,
      currentValue,
    };
  });

  // Sort by gain percentage descending
  assetsWithGain.sort((a, b) => b.gainPercentage - a.gainPercentage);
  
  return assetsWithGain.slice(0, limit);
}

/**
 * Get bottom performing assets
 */
export async function getBottomPerformers(userId: number, limit: number = 5) {
  const userAssets = await db.getUserAssets(userId);
  
  const assetsWithGain = userAssets.map(({ asset, ownership }) => {
    const currentValue = asset.currentValueInr * (ownership.ownershipPercentage / 100);
    const costBasis = ownership.costBasisInr;
    const gain = currentValue - costBasis;
    const gainPercentage = (gain / costBasis) * 100;
    
    return {
      assetName: asset.assetName,
      ticker: asset.ticker,
      gain,
      gainPercentage: Math.round(gainPercentage * 10) / 10,
      currentValue,
    };
  });

  // Sort by gain percentage ascending
  assetsWithGain.sort((a, b) => a.gainPercentage - b.gainPercentage);
  
  return assetsWithGain.slice(0, limit);
}
