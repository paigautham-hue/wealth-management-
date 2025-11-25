/**
 * AETHER V5 - AI Wealth Advisor
 * Personalized investment strategy, market regime detection, behavioral coaching
 */

import { invokeLLM } from "./_core/llm";
import type { Message } from "./_core/llm";
import * as db from "./db";

export interface RiskProfile {
  riskTolerance: "conservative" | "moderate" | "aggressive";
  age: number;
  investmentHorizon: number; // years
  liquidityNeeds: "low" | "medium" | "high";
  investmentGoals: string[];
}

export interface InvestmentStrategy {
  recommendedAllocation: {
    equity: number;
    fixedIncome: number;
    alternatives: number;
    cash: number;
  };
  reasoning: string;
  actionItems: string[];
  riskScore: number; // 0-100
  expectedReturn: number; // annual %
  expectedVolatility: number; // annual %
}

export interface MarketRegime {
  regime: "bull" | "bear" | "sideways" | "volatile";
  confidence: number; // 0-1
  indicators: {
    name: string;
    value: number;
    signal: "bullish" | "bearish" | "neutral";
  }[];
  recommendation: string;
}

export interface BehavioralInsight {
  pattern: string;
  severity: "low" | "medium" | "high";
  description: string;
  recommendation: string;
  examples: string[];
}

export interface RebalancingPlan {
  currentAllocation: Record<string, number>;
  targetAllocation: Record<string, number>;
  trades: {
    action: "buy" | "sell";
    assetName: string;
    ticker?: string;
    amount: number;
    reasoning: string;
  }[];
  estimatedCost: number;
  taxImpact: number;
}

/**
 * Generate personalized investment strategy based on risk profile
 */
export async function generateInvestmentStrategy(
  userId: number,
  riskProfile: RiskProfile
): Promise<InvestmentStrategy> {
  // Get user's current portfolio
  const userAssets = await db.getUserAssets(userId);
  
  let totalValue = 0;
  const currentAllocation: Record<string, number> = {};
  
  for (const { asset, ownership } of userAssets) {
    const value = asset.currentValueInr * (ownership.ownershipPercentage / 100);
    totalValue += value;
    
    const category = categorizeAsset(asset.assetType);
    currentAllocation[category] = (currentAllocation[category] || 0) + value;
  }

  // Convert to percentages
  const currentAllocationPct: Record<string, number> = {};
  for (const [category, value] of Object.entries(currentAllocation)) {
    currentAllocationPct[category] = (value / totalValue) * 100;
  }

  const messages: Message[] = [
    {
      role: "system",
      content: `You are an expert wealth advisor for high-net-worth individuals in India. You provide personalized investment strategies based on modern portfolio theory, behavioral finance, and Indian market conditions.

Your recommendations should:
1. Consider Indian tax laws (LTCG, STCG, indexation)
2. Account for currency risk (INR vs USD/EUR)
3. Include India-specific asset classes (PPF, NPS, tax-saving bonds)
4. Follow SEBI regulations
5. Be practical and actionable

Respond in JSON format with this structure:
{
  "recommendedAllocation": {
    "equity": <percentage>,
    "fixedIncome": <percentage>,
    "alternatives": <percentage>,
    "cash": <percentage>
  },
  "reasoning": "<detailed explanation>",
  "actionItems": ["<specific action 1>", "<specific action 2>", ...],
  "riskScore": <0-100>,
  "expectedReturn": <annual % return>,
  "expectedVolatility": <annual % volatility>"
}`,
    },
    {
      role: "user",
      content: `Generate an investment strategy for this client:

**Risk Profile:**
- Risk Tolerance: ${riskProfile.riskTolerance}
- Age: ${riskProfile.age}
- Investment Horizon: ${riskProfile.investmentHorizon} years
- Liquidity Needs: ${riskProfile.liquidityNeeds}
- Goals: ${riskProfile.investmentGoals.join(", ")}

**Current Portfolio (₹${totalValue.toFixed(0)}):**
${Object.entries(currentAllocationPct)
  .map(([cat, pct]) => `- ${cat}: ${pct.toFixed(1)}%`)
  .join("\n")}

Provide a comprehensive investment strategy with specific recommendations.`,
    },
  ];

  const response = await invokeLLM({
    messages,
    response_format: {
      type: "json_schema",
      json_schema: {
        name: "investment_strategy",
        strict: true,
        schema: {
          type: "object",
          properties: {
            recommendedAllocation: {
              type: "object",
              properties: {
                equity: { type: "number" },
                fixedIncome: { type: "number" },
                alternatives: { type: "number" },
                cash: { type: "number" },
              },
              required: ["equity", "fixedIncome", "alternatives", "cash"],
              additionalProperties: false,
            },
            reasoning: { type: "string" },
            actionItems: {
              type: "array",
              items: { type: "string" },
            },
            riskScore: { type: "number" },
            expectedReturn: { type: "number" },
            expectedVolatility: { type: "number" },
          },
          required: [
            "recommendedAllocation",
            "reasoning",
            "actionItems",
            "riskScore",
            "expectedReturn",
            "expectedVolatility",
          ],
          additionalProperties: false,
        },
      },
    },
  });

  const content = response.choices[0]?.message?.content;
  if (!content || typeof content !== 'string') {
    throw new Error("No response from AI");
  }

  return JSON.parse(content);
}

/**
 * Detect current market regime using technical indicators
 */
export async function detectMarketRegime(): Promise<MarketRegime> {
  // In production, this would fetch real market data
  // For now, we'll use AI to analyze current conditions
  
  const messages: Message[] = [
    {
      role: "system",
      content: `You are a market analyst specializing in Indian and global equity markets. Analyze current market conditions and determine the market regime.

Respond in JSON format:
{
  "regime": "bull" | "bear" | "sideways" | "volatile",
  "confidence": <0-1>,
  "indicators": [
    {
      "name": "<indicator name>",
      "value": <numeric value>,
      "signal": "bullish" | "bearish" | "neutral"
    }
  ],
  "recommendation": "<what investors should do>"
}`,
    },
    {
      role: "user",
      content: `Analyze the current market regime for Indian equity markets (Nifty 50, Bank Nifty) and global markets (S&P 500, Nasdaq). Consider:
- Recent price trends
- Volatility (VIX)
- Moving averages (50-day, 200-day)
- Market breadth
- Sentiment indicators

Provide your analysis.`,
    },
  ];

  const response = await invokeLLM({
    messages,
    response_format: {
      type: "json_schema",
      json_schema: {
        name: "market_regime",
        strict: true,
        schema: {
          type: "object",
          properties: {
            regime: {
              type: "string",
              enum: ["bull", "bear", "sideways", "volatile"],
            },
            confidence: { type: "number" },
            indicators: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  name: { type: "string" },
                  value: { type: "number" },
                  signal: {
                    type: "string",
                    enum: ["bullish", "bearish", "neutral"],
                  },
                },
                required: ["name", "value", "signal"],
                additionalProperties: false,
              },
            },
            recommendation: { type: "string" },
          },
          required: ["regime", "confidence", "indicators", "recommendation"],
          additionalProperties: false,
        },
      },
    },
  });

  const content = response.choices[0]?.message?.content;
  if (!content || typeof content !== 'string') {
    throw new Error("No response from AI");
  }

  return JSON.parse(content);
}

/**
 * Analyze user's trading behavior for emotional patterns
 */
export async function analyzeBehavioralPatterns(
  userId: number
): Promise<BehavioralInsight[]> {
  // Get user's transaction history
  const userAssets = await db.getUserAssets(userId);
  
  // In production, we'd analyze actual buy/sell transactions
  // For now, we'll provide general behavioral coaching
  
  const messages: Message[] = [
    {
      role: "system",
      content: `You are a behavioral finance expert. Analyze investment patterns and identify potential behavioral biases.

Common biases to look for:
- Loss aversion (holding losers too long)
- Recency bias (chasing recent winners)
- Overconfidence (excessive trading)
- Herd mentality (following crowds)
- Anchoring (fixating on purchase price)

Respond with JSON array:
[
  {
    "pattern": "<bias name>",
    "severity": "low" | "medium" | "high",
    "description": "<what you observed>",
    "recommendation": "<how to fix it>",
    "examples": ["<example 1>", "<example 2>"]
  }
]`,
    },
    {
      role: "user",
      content: `Analyze this investor's portfolio for behavioral biases:

Portfolio: ${userAssets.length} holdings
Total Value: ₹${userAssets.reduce((sum, { asset, ownership }) => 
  sum + asset.currentValueInr * (ownership.ownershipPercentage / 100), 0).toFixed(0)}

Identify any potential behavioral patterns and provide coaching.`,
    },
  ];

  const response = await invokeLLM({
    messages,
    response_format: {
      type: "json_schema",
      json_schema: {
        name: "behavioral_insights",
        strict: true,
        schema: {
          type: "object",
          properties: {
            insights: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  pattern: { type: "string" },
                  severity: {
                    type: "string",
                    enum: ["low", "medium", "high"],
                  },
                  description: { type: "string" },
                  recommendation: { type: "string" },
                  examples: {
                    type: "array",
                    items: { type: "string" },
                  },
                },
                required: [
                  "pattern",
                  "severity",
                  "description",
                  "recommendation",
                  "examples",
                ],
                additionalProperties: false,
              },
            },
          },
          required: ["insights"],
          additionalProperties: false,
        },
      },
    },
  });

  const content = response.choices[0]?.message?.content;
  if (!content || typeof content !== 'string') {
    throw new Error("No response from AI");
  }

  const parsed = JSON.parse(content);
  return parsed.insights;
}

/**
 * Natural language portfolio rebalancing
 * Example: "Move 10% from tech stocks to bonds"
 */
export async function processRebalancingCommand(
  userId: number,
  command: string
): Promise<RebalancingPlan> {
  // Get user's current portfolio
  const userAssets = await db.getUserAssets(userId);
  
  let totalValue = 0;
  const holdings: { name: string; ticker?: string; value: number; type: string }[] = [];
  
  for (const { asset, ownership } of userAssets) {
    const value = asset.currentValueInr * (ownership.ownershipPercentage / 100);
    totalValue += value;
    holdings.push({
      name: asset.assetName,
      ticker: asset.ticker || undefined,
      value,
      type: asset.assetType,
    });
  }

  const messages: Message[] = [
    {
      role: "system",
      content: `You are a portfolio rebalancing assistant. Convert natural language commands into specific trade instructions.

Respond in JSON format:
{
  "currentAllocation": { "<category>": <percentage>, ... },
  "targetAllocation": { "<category>": <percentage>, ... },
  "trades": [
    {
      "action": "buy" | "sell",
      "assetName": "<name>",
      "ticker": "<optional ticker>",
      "amount": <INR amount>,
      "reasoning": "<why this trade>"
    }
  ],
  "estimatedCost": <total transaction cost>,
  "taxImpact": <estimated tax impact>
}`,
    },
    {
      role: "user",
      content: `User command: "${command}"

Current portfolio (₹${totalValue.toFixed(0)}):
${holdings.map(h => `- ${h.name} (${h.type}): ₹${h.value.toFixed(0)}`).join("\n")}

Generate a rebalancing plan with specific trades.`,
    },
  ];

  const response = await invokeLLM({
    messages,
    response_format: {
      type: "json_schema",
      json_schema: {
        name: "rebalancing_plan",
        strict: true,
        schema: {
          type: "object",
          properties: {
            currentAllocation: {
              type: "object",
              additionalProperties: { type: "number" },
            },
            targetAllocation: {
              type: "object",
              additionalProperties: { type: "number" },
            },
            trades: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  action: {
                    type: "string",
                    enum: ["buy", "sell"],
                  },
                  assetName: { type: "string" },
                  ticker: { type: "string" },
                  amount: { type: "number" },
                  reasoning: { type: "string" },
                },
                required: ["action", "assetName", "amount", "reasoning"],
                additionalProperties: false,
              },
            },
            estimatedCost: { type: "number" },
            taxImpact: { type: "number" },
          },
          required: [
            "currentAllocation",
            "targetAllocation",
            "trades",
            "estimatedCost",
            "taxImpact",
          ],
          additionalProperties: false,
        },
      },
    },
  });

  const content = response.choices[0]?.message?.content;
  if (!content || typeof content !== 'string') {
    throw new Error("No response from AI");
  }

  return JSON.parse(content);
}

/**
 * Helper: Categorize asset into broad categories
 */
function categorizeAsset(assetType: string): string {
  const equityTypes = ["stock", "etf", "mutual_fund"];
  const fixedIncomeTypes = ["bond", "fixed_deposit", "ppf"];
  const alternativeTypes = ["real_estate", "gold", "cryptocurrency", "private_equity"];
  
  if (equityTypes.includes(assetType)) return "equity";
  if (fixedIncomeTypes.includes(assetType)) return "fixedIncome";
  if (alternativeTypes.includes(assetType)) return "alternatives";
  return "cash";
}
