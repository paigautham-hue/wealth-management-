/**
 * AETHER V5 - Forex Service
 * Real-time currency conversion with Exchange Rate API
 */

interface ExchangeRates {
  USD: number;
  EUR: number;
  GBP: number;
  INR: number;
}

interface ForexResponse {
  base: string;
  rates: Record<string, number>;
  timestamp: number;
}

/**
 * Fetch current exchange rates from Exchange Rate API
 * Free tier: 1500 requests/month
 * Alternative: https://api.exchangerate-api.com/v4/latest/USD
 */
export async function fetchExchangeRates(baseCurrency: string = "INR"): Promise<ExchangeRates> {
  try {
    // Using free Exchange Rate API
    const url = `https://api.exchangerate-api.com/v4/latest/${baseCurrency}`;
    
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Exchange Rate API error: ${response.status}`);
    }

    const data: ForexResponse = await response.json();
    
    return {
      USD: data.rates.USD || 0.012,
      EUR: data.rates.EUR || 0.011,
      GBP: data.rates.GBP || 0.0095,
      INR: data.rates.INR || 1,
    };
  } catch (error) {
    console.error("Error fetching exchange rates:", error);
    
    // Return fallback rates (approximate as of 2024)
    return {
      USD: 0.012, // 1 INR = 0.012 USD (or 1 USD = 83 INR)
      EUR: 0.011, // 1 INR = 0.011 EUR
      GBP: 0.0095, // 1 INR = 0.0095 GBP
      INR: 1,
    };
  }
}

/**
 * Convert amount from one currency to another
 */
export async function convertCurrency(
  amount: number,
  fromCurrency: string,
  toCurrency: string
): Promise<number> {
  if (fromCurrency === toCurrency) {
    return amount;
  }

  const rates = await fetchExchangeRates(fromCurrency);
  const rate = rates[toCurrency as keyof ExchangeRates];
  
  if (!rate) {
    throw new Error(`Unsupported currency: ${toCurrency}`);
  }

  return amount * rate;
}

/**
 * Get USD to INR exchange rate
 */
export async function getUsdToInrRate(): Promise<number> {
  try {
    const url = "https://api.exchangerate-api.com/v4/latest/USD";
    const response = await fetch(url);
    const data: ForexResponse = await response.json();
    
    return data.rates.INR || 83;
  } catch (error) {
    console.error("Error fetching USD/INR rate:", error);
    return 83; // Fallback rate
  }
}

/**
 * Calculate currency alpha vs asset alpha
 * 
 * Example:
 * - Bought US stock at $100 when USD/INR = 80 (₹8,000)
 * - Current price: $120, USD/INR = 83
 * - Asset Alpha: 20% (from $100 to $120)
 * - Currency Alpha: 3.75% (from 80 to 83)
 * - Total Return in INR: 24.5% (₹8,000 to ₹9,960)
 */
export function calculateAlpha(
  purchasePriceNative: number,
  currentPriceNative: number,
  purchaseExchangeRate: number,
  currentExchangeRate: number
): {
  assetAlpha: number;
  currencyAlpha: number;
  totalReturnInr: number;
} {
  // Asset alpha (performance in native currency)
  const assetAlpha = ((currentPriceNative - purchasePriceNative) / purchasePriceNative) * 100;

  // Currency alpha (exchange rate change)
  const currencyAlpha = ((currentExchangeRate - purchaseExchangeRate) / purchaseExchangeRate) * 100;

  // Total return in INR
  const purchaseValueInr = purchasePriceNative * purchaseExchangeRate;
  const currentValueInr = currentPriceNative * currentExchangeRate;
  const totalReturnInr = ((currentValueInr - purchaseValueInr) / purchaseValueInr) * 100;

  return {
    assetAlpha: Math.round(assetAlpha * 100) / 100,
    currencyAlpha: Math.round(currencyAlpha * 100) / 100,
    totalReturnInr: Math.round(totalReturnInr * 100) / 100,
  };
}

/**
 * Get historical exchange rate for a specific date
 * Note: Free API has limited historical data
 */
export async function getHistoricalRate(
  date: Date,
  fromCurrency: string,
  toCurrency: string
): Promise<number> {
  try {
    // Format date as YYYY-MM-DD
    const dateStr = date.toISOString().split("T")[0];
    
    // Using exchangerate.host for historical data (free tier)
    const url = `https://api.exchangerate.host/${dateStr}?base=${fromCurrency}&symbols=${toCurrency}`;
    
    const response = await fetch(url);
    const data = await response.json();
    
    return data.rates?.[toCurrency] || 83;
  } catch (error) {
    console.error("Error fetching historical rate:", error);
    
    // Return approximate rate based on currency pair
    if (fromCurrency === "USD" && toCurrency === "INR") {
      return 83;
    }
    return 1;
  }
}
