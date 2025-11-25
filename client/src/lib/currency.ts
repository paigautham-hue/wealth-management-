/**
 * AETHER V5 - Currency Formatting Utilities
 * Indian currency format (Lakhs/Crores) for wealth management
 */

/**
 * Format amount in INR using Indian numbering system
 * Examples:
 * - 50000 → ₹50 K
 * - 500000 → ₹5 L
 * - 25000000 → ₹2.5 Cr
 */
export function formatINR(amount: number): string {
  const absAmount = Math.abs(amount);
  const sign = amount < 0 ? '-' : '';
  
  if (absAmount >= 10000000) {
    // Crores (1 Cr = 10 million)
    return `${sign}₹${(absAmount / 10000000).toFixed(2)} Cr`;
  } else if (absAmount >= 100000) {
    // Lakhs (1 L = 100 thousand)
    return `${sign}₹${(absAmount / 100000).toFixed(2)} L`;
  } else if (absAmount >= 1000) {
    // Thousands
    return `${sign}₹${(absAmount / 1000).toFixed(2)} K`;
  } else {
    // Below 1000
    return `${sign}₹${absAmount.toFixed(2)}`;
  }
}

/**
 * Format amount with full precision (for detailed views)
 */
export function formatINRDetailed(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2,
  }).format(amount);
}

/**
 * Format percentage with sign
 */
export function formatPercentage(value: number, decimals: number = 2): string {
  const sign = value > 0 ? '+' : '';
  return `${sign}${value.toFixed(decimals)}%`;
}

/**
 * Format date in Indian format
 */
export function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  }).format(d);
}

/**
 * Format USD amount
 */
export function formatUSD(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * Calculate performance attribution
 */
export interface PerformanceAttribution {
  assetAlpha: number;
  currencyAlpha: number;
  totalGain: number;
}

export function calculateAttribution(
  currentPrice: number,
  purchasePrice: number,
  quantity: number,
  currentExchangeRate: number,
  purchaseExchangeRate: number
): PerformanceAttribution {
  // Asset Alpha: Gain from price movement in native currency
  const nativeGain = (currentPrice - purchasePrice) * quantity;
  const assetAlpha = nativeGain * currentExchangeRate;
  
  // Currency Alpha: Gain from exchange rate movement
  const fxGain = quantity * purchasePrice * (currentExchangeRate - purchaseExchangeRate);
  const currencyAlpha = fxGain;
  
  return {
    assetAlpha,
    currencyAlpha,
    totalGain: assetAlpha + currencyAlpha
  };
}
