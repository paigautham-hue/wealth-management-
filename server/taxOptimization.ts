/**
 * AETHER V5 - Tax Optimization Suite
 * Automated tax loss harvesting and optimization strategies
 */

import { invokeLLM } from "./_core/llm";
import type { Message } from "./_core/llm";

export interface TaxLossHarvestingOpportunity {
  assetId: number;
  ticker: string;
  assetName: string;
  purchasePrice: number;
  currentPrice: number;
  unrealizedLoss: number;
  lossPercentage: number;
  quantity: number;
  holdingPeriod: number; // Days
  taxSavings: number; // Estimated tax savings
  replacementSuggestions: string[]; // Similar assets to maintain exposure
  washSaleRisk: boolean;
  priority: "high" | "medium" | "low";
  reasoning: string;
}

export interface TaxOptimizationReport {
  totalUnrealizedLosses: number;
  totalPotentialTaxSavings: number;
  opportunities: TaxLossHarvestingOpportunity[];
  longTermGains: number;
  shortTermGains: number;
  capitalGainsLiability: number;
  recommendations: string[];
}

/**
 * Scan portfolio for tax loss harvesting opportunities
 */
export async function scanTaxLossHarvestingOpportunities(
  assets: Array<{
    id: number;
    ticker: string;
    name: string;
    purchasePrice: number;
    currentPrice: number;
    quantity: number;
    purchaseDate: string;
  }>,
  taxRate: number = 30 // Default 30% tax rate
): Promise<TaxOptimizationReport> {
  const opportunities: TaxLossHarvestingOpportunity[] = [];
  let totalUnrealizedLosses = 0;
  let totalPotentialTaxSavings = 0;

  for (const asset of assets) {
    const unrealizedLoss = (asset.purchasePrice - asset.currentPrice) * asset.quantity;
    
    if (unrealizedLoss > 0) {
      // This is a loss position
      const lossPercentage = ((asset.purchasePrice - asset.currentPrice) / asset.purchasePrice) * 100;
      const holdingPeriod = Math.floor(
        (Date.now() - new Date(asset.purchaseDate).getTime()) / (1000 * 60 * 60 * 24)
      );
      const taxSavings = unrealizedLoss * (taxRate / 100);

      // Determine priority
      let priority: "high" | "medium" | "low" = "low";
      if (lossPercentage > 20) priority = "high";
      else if (lossPercentage > 10) priority = "medium";

      // Check wash sale risk (30-day rule)
      const washSaleRisk = false; // In production, check recent transactions

      // Get AI recommendations for replacement assets
      const replacementSuggestions = await getReplacementSuggestions(asset.ticker, asset.name);

      opportunities.push({
        assetId: asset.id,
        ticker: asset.ticker,
        assetName: asset.name,
        purchasePrice: asset.purchasePrice,
        currentPrice: asset.currentPrice,
        unrealizedLoss,
        lossPercentage,
        quantity: asset.quantity,
        holdingPeriod,
        taxSavings,
        replacementSuggestions,
        washSaleRisk,
        priority,
        reasoning: `Sell to realize ₹${Math.round(unrealizedLoss).toLocaleString()} loss, save ₹${Math.round(taxSavings).toLocaleString()} in taxes. ${washSaleRisk ? "⚠️ Wash sale risk - wait 30 days before repurchasing." : ""}`,
      });

      totalUnrealizedLosses += unrealizedLoss;
      totalPotentialTaxSavings += taxSavings;
    }
  }

  // Sort by priority and tax savings
  opportunities.sort((a, b) => {
    const priorityOrder = { high: 3, medium: 2, low: 1 };
    if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    }
    return b.taxSavings - a.taxSavings;
  });

  // Calculate capital gains
  const longTermGains = 0; // Mock - calculate from holdings > 1 year
  const shortTermGains = 0; // Mock - calculate from holdings < 1 year
  const capitalGainsLiability = (longTermGains * 0.1) + (shortTermGains * (taxRate / 100));

  // Generate AI recommendations
  const recommendations = await generateTaxRecommendations(
    opportunities,
    totalUnrealizedLosses,
    capitalGainsLiability
  );

  return {
    totalUnrealizedLosses,
    totalPotentialTaxSavings,
    opportunities,
    longTermGains,
    shortTermGains,
    capitalGainsLiability,
    recommendations,
  };
}

/**
 * Get AI-powered replacement asset suggestions
 */
async function getReplacementSuggestions(ticker: string, assetName: string): Promise<string[]> {
  const messages: Message[] = [
    {
      role: "system",
      content: `You are a tax optimization expert. Suggest similar assets to maintain market exposure while avoiding wash sale rules.

Respond in JSON format:
{
  "replacements": ["<ticker1>", "<ticker2>", "<ticker3>"]
}`,
    },
    {
      role: "user",
      content: `I want to sell ${ticker} (${assetName}) for tax loss harvesting. Suggest 3 similar assets that:
1. Have similar market exposure
2. Are NOT substantially identical (to avoid wash sale)
3. Maintain my investment thesis

Provide tickers only.`,
    },
  ];

  try {
    const response = await invokeLLM({
      messages,
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "replacement_suggestions",
          strict: true,
          schema: {
            type: "object",
            properties: {
              replacements: {
                type: "array",
                items: { type: "string" },
              },
            },
            required: ["replacements"],
            additionalProperties: false,
          },
        },
      },
    });

    const content = response.choices[0]?.message?.content;
    if (!content || typeof content !== 'string') {
      return [];
    }

    const result = JSON.parse(content);
    return result.replacements;
  } catch (error) {
    console.error("Error getting replacement suggestions:", error);
    return [];
  }
}

/**
 * Generate AI-powered tax optimization recommendations
 */
async function generateTaxRecommendations(
  opportunities: TaxLossHarvestingOpportunity[],
  totalLosses: number,
  capitalGainsLiability: number
): Promise<string[]> {
  if (opportunities.length === 0) {
    return ["No tax loss harvesting opportunities found. Your portfolio is performing well!"];
  }

  const messages: Message[] = [
    {
      role: "system",
      content: `You are a tax optimization advisor for Indian HNIs. Provide actionable tax strategies.

Respond in JSON format:
{
  "recommendations": ["<recommendation1>", "<recommendation2>", ...]
}`,
    },
    {
      role: "user",
      content: `Portfolio tax situation:
- Total unrealized losses: ₹${Math.round(totalLosses).toLocaleString()}
- Number of loss positions: ${opportunities.length}
- Capital gains liability: ₹${Math.round(capitalGainsLiability).toLocaleString()}

Top opportunities:
${opportunities.slice(0, 3).map(o => `- ${o.ticker}: ${o.lossPercentage.toFixed(1)}% loss, ₹${Math.round(o.taxSavings).toLocaleString()} tax savings`).join("\n")}

Provide 3-5 specific, actionable tax optimization recommendations.`,
    },
  ];

  try {
    const response = await invokeLLM({
      messages,
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "tax_recommendations",
          strict: true,
          schema: {
            type: "object",
            properties: {
              recommendations: {
                type: "array",
                items: { type: "string" },
              },
            },
            required: ["recommendations"],
            additionalProperties: false,
          },
        },
      },
    });

    const content = response.choices[0]?.message?.content;
    if (!content || typeof content !== 'string') {
      return ["Consult with a tax professional for personalized advice."];
    }

    const result = JSON.parse(content);
    return result.recommendations;
  } catch (error) {
    console.error("Error generating tax recommendations:", error);
    return ["Consult with a tax professional for personalized advice."];
  }
}

/**
 * Calculate tax impact of a proposed transaction
 */
export async function calculateTaxImpact(
  purchasePrice: number,
  sellPrice: number,
  quantity: number,
  holdingPeriod: number, // Days
  taxRate: number = 30
): Promise<{
  capitalGain: number;
  isLongTerm: boolean;
  taxLiability: number;
  netProceeds: number;
}> {
  const capitalGain = (sellPrice - purchasePrice) * quantity;
  const isLongTerm = holdingPeriod > 365;
  
  // Indian tax rates: LTCG 10% (>1 year), STCG at slab rate
  const applicableTaxRate = isLongTerm ? 10 : taxRate;
  const taxLiability = capitalGain > 0 ? capitalGain * (applicableTaxRate / 100) : 0;
  const netProceeds = (sellPrice * quantity) - taxLiability;

  return {
    capitalGain,
    isLongTerm,
    taxLiability,
    netProceeds,
  };
}

/**
 * Generate year-end tax planning report
 */
export async function generateYearEndTaxReport(
  userId: number,
  assets: Array<{
    id: number;
    ticker: string;
    name: string;
    purchasePrice: number;
    currentPrice: number;
    quantity: number;
    purchaseDate: string;
  }>
): Promise<{
  summary: string;
  totalGains: number;
  totalLosses: number;
  netPosition: number;
  taxLiability: number;
  actionItems: string[];
}> {
  let totalGains = 0;
  let totalLosses = 0;

  for (const asset of assets) {
    const gain = (asset.currentPrice - asset.purchasePrice) * asset.quantity;
    if (gain > 0) {
      totalGains += gain;
    } else {
      totalLosses += Math.abs(gain);
    }
  }

  const netPosition = totalGains - totalLosses;
  const taxLiability = netPosition > 0 ? netPosition * 0.3 : 0;

  const actionItems = [
    "Review all loss positions for tax loss harvesting opportunities",
    "Consider deferring gains to next financial year if possible",
    "Maximize deductions under Section 80C (₹1.5L limit)",
    "Review capital gains tax liability and plan quarterly payments",
    "Consult with CA for final tax optimization strategies",
  ];

  const summary = `Year-end tax position: ₹${Math.round(totalGains).toLocaleString()} gains, ₹${Math.round(totalLosses).toLocaleString()} losses. Net: ₹${Math.round(netPosition).toLocaleString()}. Estimated tax liability: ₹${Math.round(taxLiability).toLocaleString()}.`;

  return {
    summary,
    totalGains,
    totalLosses,
    netPosition,
    taxLiability,
    actionItems,
  };
}
