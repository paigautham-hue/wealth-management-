/**
 * AETHER V5 - Liabilities & True Net Worth
 * Comprehensive debt tracking for accurate net worth calculation
 */

import { getDb } from "./db";
import { liabilities, type InsertLiability } from "../drizzle/schema";
import { eq } from "drizzle-orm";

export async function addLiability(userId: number, liability: Omit<InsertLiability, "userId">) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.insert(liabilities).values({
    ...liability,
    userId,
  });

  return true;
}

export async function getLiabilities(userId: number) {
  const db = await getDb();
  if (!db) return [];

  return await db.select().from(liabilities).where(eq(liabilities.userId, userId));
}

export async function updateLiability(userId: number, liabilityId: number, updates: Partial<InsertLiability>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.update(liabilities)
    .set(updates)
    .where(eq(liabilities.id, liabilityId));

  return true;
}

export async function deleteLiability(userId: number, liabilityId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.delete(liabilities).where(eq(liabilities.id, liabilityId));

  return true;
}

/**
 * Calculate total liabilities for a user
 */
export async function getTotalLiabilities(userId: number): Promise<number> {
  const userLiabilities = await getLiabilities(userId);
  return userLiabilities.reduce((sum, liability) => sum + liability.currentBalance, 0);
}

/**
 * Calculate true net worth (assets - liabilities)
 */
export async function getTrueNetWorth(userId: number, totalAssets: number): Promise<{
  totalAssets: number;
  totalLiabilities: number;
  netWorth: number;
  debtToEquityRatio: number;
  monthlyDebtService: number;
}> {
  const userLiabilities = await getLiabilities(userId);
  
  const totalLiabilities = userLiabilities.reduce((sum, l) => sum + l.currentBalance, 0);
  const netWorth = totalAssets - totalLiabilities;
  const debtToEquityRatio = totalAssets > 0 ? totalLiabilities / totalAssets : 0;
  const monthlyDebtService = userLiabilities.reduce((sum, l) => sum + (l.monthlyPayment || 0), 0);

  return {
    totalAssets,
    totalLiabilities,
    netWorth,
    debtToEquityRatio,
    monthlyDebtService,
  };
}

/**
 * Calculate debt payoff projection
 */
export async function getDebtPayoffProjection(userId: number): Promise<{
  liabilityId: number;
  name: string;
  currentBalance: number;
  monthlyPayment: number;
  interestRate: number;
  monthsToPayoff: number;
  totalInterestPaid: number;
  payoffDate: string;
}[]> {
  const userLiabilities = await getLiabilities(userId);
  
  return userLiabilities.map(liability => {
    const monthlyRate = (liability.interestRate / 10000) / 12; // Convert basis points to monthly rate
    const monthlyPayment = liability.monthlyPayment || 0;
    
    if (monthlyPayment === 0) {
      return {
        liabilityId: liability.id,
        name: liability.name,
        currentBalance: liability.currentBalance,
        monthlyPayment: 0,
        interestRate: liability.interestRate / 100, // Convert to percentage
        monthsToPayoff: 0,
        totalInterestPaid: 0,
        payoffDate: "N/A",
      };
    }

    // Calculate months to payoff using amortization formula
    let balance = liability.currentBalance;
    let months = 0;
    let totalInterest = 0;
    const maxMonths = 360; // 30 years max

    while (balance > 0 && months < maxMonths) {
      const interestPayment = balance * monthlyRate;
      const principalPayment = monthlyPayment - interestPayment;
      
      if (principalPayment <= 0) {
        // Payment doesn't cover interest
        months = 0;
        totalInterest = 0;
        break;
      }

      balance -= principalPayment;
      totalInterest += interestPayment;
      months++;
    }

    const payoffDate = new Date();
    payoffDate.setMonth(payoffDate.getMonth() + months);

    return {
      liabilityId: liability.id,
      name: liability.name,
      currentBalance: liability.currentBalance,
      monthlyPayment,
      interestRate: liability.interestRate / 100,
      monthsToPayoff: months,
      totalInterestPaid: Math.round(totalInterest),
      payoffDate: months > 0 ? payoffDate.toISOString().split('T')[0] : "N/A",
    };
  });
}

/**
 * Get liabilities breakdown by type
 */
export async function getLiabilitiesBreakdown(userId: number): Promise<{
  type: string;
  count: number;
  totalBalance: number;
  percentage: number;
}[]> {
  const userLiabilities = await getLiabilities(userId);
  const totalBalance = userLiabilities.reduce((sum, l) => sum + l.currentBalance, 0);

  const breakdown = new Map<string, { count: number; totalBalance: number }>();

  for (const liability of userLiabilities) {
    const existing = breakdown.get(liability.type) || { count: 0, totalBalance: 0 };
    breakdown.set(liability.type, {
      count: existing.count + 1,
      totalBalance: existing.totalBalance + liability.currentBalance,
    });
  }

  return Array.from(breakdown.entries()).map(([type, data]) => ({
    type,
    count: data.count,
    totalBalance: data.totalBalance,
    percentage: totalBalance > 0 ? (data.totalBalance / totalBalance) * 100 : 0,
  }));
}
