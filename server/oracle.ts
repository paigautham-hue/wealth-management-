/**
 * AETHER V5 - The Oracle
 * Stock analysis engine with 8 investment framework lenses
 */

export interface StockData {
  ticker: string;
  price: number;
  marketCap: number;
  pe: number;
  pb: number;
  roe: number;
  roce: number;
  debtToEquity: number;
  revenueGrowth: number;
  eps: number;
  bookValue: number;
  ebit: number;
  enterpriseValue: number;
  capitalEmployed: number;
  piotroskiScore: number;
  priceChange3M: number;
  priceChange6M: number;
  promoterHolding: number;
  sector: string;
  companyAge: number;
  tam: number;
  revenue: number;
}

export interface LensScore {
  score: number;
  verdict: string;
  reasoning: string;
}

export interface OracleAnalysis {
  ticker: string;
  market: "IN" | "US";
  lensScores: {
    buffett: LensScore;
    lynch: LensScore;
    graham: LensScore;
    fisher: LensScore;
    jhunjhunwala: LensScore;
    kacholia: LensScore;
    kedia: LensScore;
    quantitative: LensScore;
  };
  finalScore: number;
  recommendation: "STRONG_BUY" | "BUY" | "HOLD" | "SELL" | "STRONG_SELL";
  confidence: number;
  currentPrice: number;
  targetPrice: number;
  upsidePercentage: number;
  executiveSummary: string;
  strengths: string[];
  risks: string[];
  bearCase: string;
}

// ============================================================================
// LENS 1: Warren Buffett (Value + Moat)
// ============================================================================

export function calculateBuffettScore(data: StockData): LensScore {
  let score = 5;
  const reasons: string[] = [];

  // Economic moat indicators
  if (data.roce > 20) {
    score += 1;
    reasons.push("Strong ROCE > 20%");
  }

  // Valuation - simplified DCF proxy using PE and growth
  const fairPE = data.revenueGrowth * 1.5;
  if (data.pe < fairPE * 0.7) {
    score += 2;
    reasons.push("Trading at significant discount to fair value");
  } else if (data.pe < fairPE) {
    score += 1;
    reasons.push("Reasonable valuation");
  }

  // Management quality (promoter holding)
  if (data.promoterHolding > 50 && data.promoterHolding < 75) {
    score += 0.5;
    reasons.push("Optimal promoter holding");
  }

  // Financial strength
  if (data.debtToEquity < 0.5) {
    score += 0.5;
    reasons.push("Low debt levels");
  }

  const finalScore = Math.min(10, Math.max(0, score));
  const verdict = finalScore >= 7 ? "Strong Buy" : finalScore >= 5 ? "Hold" : "Avoid";

  return {
    score: finalScore,
    verdict,
    reasoning: reasons.join(". "),
  };
}

// ============================================================================
// LENS 2: Peter Lynch (GARP - Growth at Reasonable Price)
// ============================================================================

export function calculateLynchScore(data: StockData): LensScore {
  let score = 5;
  const reasons: string[] = [];

  // PEG ratio (PE / Growth Rate)
  const peg = data.pe / data.revenueGrowth;
  if (peg < 1) {
    score += 2;
    reasons.push("Excellent PEG ratio < 1");
  } else if (peg < 1.5) {
    score += 1;
    reasons.push("Good PEG ratio < 1.5");
  } else if (peg > 2) {
    score -= 1;
    reasons.push("High PEG ratio indicates overvaluation");
  }

  // Growth characteristics
  if (data.revenueGrowth > 20) {
    score += 1;
    reasons.push("Strong revenue growth > 20%");
  }

  // Profitability
  if (data.roe > 15) {
    score += 1;
    reasons.push("Healthy ROE > 15%");
  }

  const finalScore = Math.min(10, Math.max(0, score));
  const verdict = finalScore >= 7 ? "Buy" : finalScore >= 5 ? "Hold" : "Pass";

  return {
    score: finalScore,
    verdict,
    reasoning: reasons.join(". "),
  };
}

// ============================================================================
// LENS 3: Benjamin Graham (Deep Value)
// ============================================================================

export function calculateGrahamScore(data: StockData): LensScore {
  let score = 5;
  const reasons: string[] = [];

  // P/B ratio
  if (data.pb < 1) {
    score += 2;
    reasons.push("Trading below book value");
  } else if (data.pb < 1.5) {
    score += 1;
    reasons.push("Reasonable P/B ratio");
  } else if (data.pb > 3) {
    score -= 1;
    reasons.push("High P/B ratio");
  }

  // P/E ratio
  if (data.pe < 15) {
    score += 1;
    reasons.push("Low PE ratio < 15");
  } else if (data.pe > 25) {
    score -= 1;
    reasons.push("High PE ratio > 25");
  }

  // Graham Number
  const grahamNumber = Math.sqrt(22.5 * data.eps * data.bookValue);
  if (data.price < grahamNumber * 0.8) {
    score += 2;
    reasons.push("Trading well below Graham Number");
  }

  // Debt
  if (data.debtToEquity < 0.5) {
    score += 1;
    reasons.push("Conservative debt levels");
  }

  const finalScore = Math.min(10, Math.max(0, score));
  const verdict = finalScore >= 7 ? "Strong Value" : finalScore >= 5 ? "Fair Value" : "Expensive";

  return {
    score: finalScore,
    verdict,
    reasoning: reasons.join(". "),
  };
}

// ============================================================================
// LENS 4: Philip Fisher (Quality Growth)
// ============================================================================

export function calculateFisherScore(data: StockData): LensScore {
  let score = 5;
  const reasons: string[] = [];

  // Profitability metrics
  if (data.roe > 20) {
    score += 1.5;
    reasons.push("Exceptional ROE > 20%");
  }

  if (data.roce > 20) {
    score += 1.5;
    reasons.push("Strong ROCE > 20%");
  }

  // Competitive advantage (market position)
  if (data.marketCap > 100000) {
    // Large cap in crores
    score += 1;
    reasons.push("Established market leader");
  }

  // Growth consistency
  if (data.revenueGrowth > 15) {
    score += 1;
    reasons.push("Consistent growth trajectory");
  }

  const finalScore = Math.min(10, Math.max(0, score));
  const verdict = finalScore >= 7 ? "Quality Compounder" : finalScore >= 5 ? "Good Business" : "Average";

  return {
    score: finalScore,
    verdict,
    reasoning: reasons.join(". "),
  };
}

// ============================================================================
// LENS 5: Rakesh Jhunjhunwala (India Growth)
// ============================================================================

export function calculateJhunjhunwalaScore(data: StockData): LensScore {
  let score = 5;
  const reasons: string[] = [];

  // India growth themes
  const growthSectors = ["financial_services", "consumer", "infrastructure", "pharma"];
  if (growthSectors.includes(data.sector.toLowerCase())) {
    score += 1.5;
    reasons.push("Aligned with India growth themes");
  }

  // Promoter quality
  if (data.promoterHolding > 50 && data.promoterHolding < 75) {
    score += 1;
    reasons.push("Strong promoter commitment");
  }

  // Scalability (large TAM)
  if (data.tam > data.revenue * 10) {
    score += 1.5;
    reasons.push("Large addressable market");
  }

  // Growth momentum
  if (data.revenueGrowth > 20) {
    score += 1;
    reasons.push("Strong growth momentum");
  }

  const finalScore = Math.min(10, Math.max(0, score));
  const verdict = finalScore >= 7 ? "India Story" : finalScore >= 5 ? "Potential" : "Pass";

  return {
    score: finalScore,
    verdict,
    reasoning: reasons.join(". "),
  };
}

// ============================================================================
// LENS 6: Ashish Kacholia (Small/Mid-Cap)
// ============================================================================

export function calculateKacholiaScore(data: StockData): LensScore {
  let score = 5;
  const reasons: string[] = [];

  // Market cap sweet spot (₹500 Cr - ₹10,000 Cr)
  if (data.marketCap >= 500 && data.marketCap <= 10000) {
    score += 2;
    reasons.push("Ideal small/mid-cap size");
  } else {
    score -= 1;
    reasons.push("Outside preferred market cap range");
  }

  // Niche leadership
  if (data.roe > 18 && data.roce > 18) {
    score += 1.5;
    reasons.push("Niche market leader with strong returns");
  }

  // Growth consistency
  if (data.revenueGrowth > 15) {
    score += 1.5;
    reasons.push("Consistent growth track record");
  }

  const finalScore = Math.min(10, Math.max(0, score));
  const verdict = finalScore >= 7 ? "Hidden Gem" : finalScore >= 5 ? "Watch" : "Pass";

  return {
    score: finalScore,
    verdict,
    reasoning: reasons.join(". "),
  };
}

// ============================================================================
// LENS 7: Vijay Kedia (SMiLE Framework)
// ============================================================================

export function calculateKediaScore(data: StockData): LensScore {
  let score = 5;
  const reasons: string[] = [];

  // S: Small size (₹100-5,000 Cr)
  if (data.marketCap >= 100 && data.marketCap <= 5000) {
    score += 1;
    reasons.push("Small size with growth potential");
  }

  // Mi: Medium experience (5-10 years)
  if (data.companyAge >= 5 && data.companyAge <= 15) {
    score += 1;
    reasons.push("Proven track record");
  }

  // L: Large aspiration (TAM > 10x revenue)
  if (data.tam > data.revenue * 10) {
    score += 2;
    reasons.push("Massive growth runway");
  }

  // E: Extra-large potential (scalable model)
  if (data.revenueGrowth > 25 && data.roe > 20) {
    score += 1;
    reasons.push("Scalable business model");
  }

  const finalScore = Math.min(10, Math.max(0, score));
  const verdict = finalScore >= 7 ? "SMiLE Stock" : finalScore >= 5 ? "Potential" : "Not SMiLE";

  return {
    score: finalScore,
    verdict,
    reasoning: reasons.join(". "),
  };
}

// ============================================================================
// LENS 8: Quantitative (Data-Driven)
// ============================================================================

export function calculateQuantitativeScore(data: StockData): LensScore {
  let score = 5;
  const reasons: string[] = [];

  // Magic Formula (Greenblatt)
  const earningsYield = data.ebit / data.enterpriseValue;
  const returnOnCapital = data.ebit / data.capitalEmployed;
  if (earningsYield > 0.1 && returnOnCapital > 0.2) {
    score += 2;
    reasons.push("Passes Magic Formula criteria");
  }

  // Piotroski F-Score
  if (data.piotroskiScore >= 8) {
    score += 2;
    reasons.push("Strong Piotroski F-Score ≥ 8");
  } else if (data.piotroskiScore >= 6) {
    score += 1;
    reasons.push("Good Piotroski F-Score ≥ 6");
  }

  // Momentum
  if (data.priceChange3M > 0 && data.priceChange6M > 0) {
    score += 1;
    reasons.push("Positive price momentum");
  }

  const finalScore = Math.min(10, Math.max(0, score));
  const verdict = finalScore >= 7 ? "Quantitatively Strong" : finalScore >= 5 ? "Neutral" : "Weak";

  return {
    score: finalScore,
    verdict,
    reasoning: reasons.join(". "),
  };
}

// ============================================================================
// MASTER ANALYSIS FUNCTION
// ============================================================================

export function analyzeStock(data: StockData, market: "IN" | "US"): Omit<OracleAnalysis, "executiveSummary" | "strengths" | "risks" | "bearCase"> {
  const lensScores = {
    buffett: calculateBuffettScore(data),
    lynch: calculateLynchScore(data),
    graham: calculateGrahamScore(data),
    fisher: calculateFisherScore(data),
    jhunjhunwala: calculateJhunjhunwalaScore(data),
    kacholia: calculateKacholiaScore(data),
    kedia: calculateKediaScore(data),
    quantitative: calculateQuantitativeScore(data),
  };

  // Calculate weighted final score
  const scores = Object.values(lensScores).map((l) => l.score);
  const finalScore = scores.reduce((sum, s) => sum + s, 0) / scores.length;

  // Determine recommendation
  let recommendation: OracleAnalysis["recommendation"];
  if (finalScore >= 8) recommendation = "STRONG_BUY";
  else if (finalScore >= 6.5) recommendation = "BUY";
  else if (finalScore >= 4.5) recommendation = "HOLD";
  else if (finalScore >= 3) recommendation = "SELL";
  else recommendation = "STRONG_SELL";

  // Calculate target price (simplified)
  const growthMultiplier = 1 + data.revenueGrowth / 100;
  const targetPrice = Math.round(data.price * growthMultiplier * (finalScore / 5));
  const upsidePercentage = Math.round(((targetPrice - data.price) / data.price) * 100);

  // Confidence based on data quality and consensus
  const scoreVariance = Math.sqrt(
    scores.reduce((sum, s) => sum + Math.pow(s - finalScore, 2), 0) / scores.length
  );
  const confidence = Math.round(Math.max(60, Math.min(95, 100 - scoreVariance * 10)));

  return {
    ticker: data.ticker,
    market,
    lensScores,
    finalScore: Math.round(finalScore * 10) / 10,
    recommendation,
    confidence,
    currentPrice: Math.round(data.price),
    targetPrice,
    upsidePercentage,
  };
}
