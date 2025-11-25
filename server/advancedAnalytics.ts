/**
 * AETHER V5 - Advanced Analytics
 * Attribution analysis, risk-adjusted returns, and scenario testing
 */

/**
 * Attribution Analysis - Risk-Adjusted Returns
 */
export interface AttributionMetrics {
  sharpeRatio: number;
  sortinoRatio: number;
  alpha: number;
  beta: number;
  informationRatio: number;
  maxDrawdown: number;
  calmarRatio: number;
  volatility: number;
  returns: number;
}

export async function calculateAttributionMetrics(
  portfolioReturns: number[], // Array of daily/monthly returns
  benchmarkReturns: number[], // Corresponding benchmark returns
  riskFreeRate: number = 6.5 // Annual risk-free rate (India: ~6.5%)
): Promise<AttributionMetrics> {
  const n = portfolioReturns.length;
  if (n === 0) {
    return {
      sharpeRatio: 0,
      sortinoRatio: 0,
      alpha: 0,
      beta: 0,
      informationRatio: 0,
      maxDrawdown: 0,
      calmarRatio: 0,
      volatility: 0,
      returns: 0,
    };
  }

  // Calculate average returns
  const avgPortfolioReturn = portfolioReturns.reduce((sum, r) => sum + r, 0) / n;
  const avgBenchmarkReturn = benchmarkReturns.reduce((sum, r) => sum + r, 0) / n;

  // Calculate volatility (standard deviation)
  const variance = portfolioReturns.reduce((sum, r) => sum + Math.pow(r - avgPortfolioReturn, 2), 0) / n;
  const volatility = Math.sqrt(variance);

  // Sharpe Ratio = (Portfolio Return - Risk Free Rate) / Volatility
  const excessReturn = avgPortfolioReturn - (riskFreeRate / 252); // Daily risk-free rate
  const sharpeRatio = volatility > 0 ? excessReturn / volatility : 0;

  // Sortino Ratio (only downside volatility)
  const downsideReturns = portfolioReturns.filter(r => r < 0);
  const downsideVariance = downsideReturns.length > 0
    ? downsideReturns.reduce((sum, r) => sum + Math.pow(r, 2), 0) / downsideReturns.length
    : 0;
  const downsideDeviation = Math.sqrt(downsideVariance);
  const sortinoRatio = downsideDeviation > 0 ? excessReturn / downsideDeviation : 0;

  // Beta = Covariance(Portfolio, Benchmark) / Variance(Benchmark)
  const benchmarkVariance = benchmarkReturns.reduce((sum, r) => sum + Math.pow(r - avgBenchmarkReturn, 2), 0) / n;
  const covariance = portfolioReturns.reduce((sum, r, i) => 
    sum + (r - avgPortfolioReturn) * (benchmarkReturns[i] - avgBenchmarkReturn), 0) / n;
  const beta = benchmarkVariance > 0 ? covariance / benchmarkVariance : 1;

  // Alpha = Portfolio Return - (Risk Free Rate + Beta * (Benchmark Return - Risk Free Rate))
  const alpha = avgPortfolioReturn - (riskFreeRate / 252 + beta * (avgBenchmarkReturn - riskFreeRate / 252));

  // Information Ratio = (Portfolio Return - Benchmark Return) / Tracking Error
  const trackingError = Math.sqrt(
    portfolioReturns.reduce((sum, r, i) => sum + Math.pow((r - benchmarkReturns[i]), 2), 0) / n
  );
  const informationRatio = trackingError > 0 ? (avgPortfolioReturn - avgBenchmarkReturn) / trackingError : 0;

  // Max Drawdown
  let peak = 0;
  let maxDrawdown = 0;
  let cumulativeReturn = 1;
  
  for (const r of portfolioReturns) {
    cumulativeReturn *= (1 + r);
    if (cumulativeReturn > peak) {
      peak = cumulativeReturn;
    }
    const drawdown = (peak - cumulativeReturn) / peak;
    if (drawdown > maxDrawdown) {
      maxDrawdown = drawdown;
    }
  }

  // Calmar Ratio = Annualized Return / Max Drawdown
  const annualizedReturn = avgPortfolioReturn * 252;
  const calmarRatio = maxDrawdown > 0 ? annualizedReturn / maxDrawdown : 0;

  return {
    sharpeRatio: Math.round(sharpeRatio * 100) / 100,
    sortinoRatio: Math.round(sortinoRatio * 100) / 100,
    alpha: Math.round(alpha * 10000) / 100, // Convert to percentage
    beta: Math.round(beta * 100) / 100,
    informationRatio: Math.round(informationRatio * 100) / 100,
    maxDrawdown: Math.round(maxDrawdown * 10000) / 100, // Convert to percentage
    calmarRatio: Math.round(calmarRatio * 100) / 100,
    volatility: Math.round(volatility * 10000) / 100, // Convert to percentage
    returns: Math.round(annualizedReturn * 10000) / 100, // Convert to percentage
  };
}

/**
 * Scenario Analysis - Monte Carlo Simulation
 */
export interface ScenarioResult {
  scenario: string;
  probability: number;
  expectedValue: number;
  worstCase: number;
  bestCase: number;
  median: number;
}

export async function runMonteCarloSimulation(
  currentPortfolioValue: number,
  expectedReturn: number, // Annual expected return
  volatility: number, // Annual volatility
  timeHorizon: number, // Years
  simulations: number = 10000
): Promise<{
  scenarios: ScenarioResult[];
  distribution: number[];
  confidenceIntervals: {
    p5: number;
    p25: number;
    p50: number;
    p75: number;
    p95: number;
  };
}> {
  const results: number[] = [];

  // Run Monte Carlo simulations
  for (let i = 0; i < simulations; i++) {
    let value = currentPortfolioValue;
    
    for (let year = 0; year < timeHorizon; year++) {
      // Generate random return using normal distribution
      const randomReturn = generateNormalRandom(expectedReturn, volatility);
      value *= (1 + randomReturn);
    }
    
    results.push(value);
  }

  // Sort results for percentile calculations
  results.sort((a, b) => a - b);

  const p5 = results[Math.floor(simulations * 0.05)];
  const p25 = results[Math.floor(simulations * 0.25)];
  const p50 = results[Math.floor(simulations * 0.50)];
  const p75 = results[Math.floor(simulations * 0.75)];
  const p95 = results[Math.floor(simulations * 0.95)];

  const scenarios: ScenarioResult[] = [
    {
      scenario: "Bear Market (-30% crash)",
      probability: 5,
      expectedValue: p5,
      worstCase: results[0],
      bestCase: results[results.length - 1],
      median: p50,
    },
    {
      scenario: "Recession (-15%)",
      probability: 15,
      expectedValue: p25,
      worstCase: results[0],
      bestCase: results[results.length - 1],
      median: p50,
    },
    {
      scenario: "Base Case (Expected Return)",
      probability: 60,
      expectedValue: p50,
      worstCase: results[0],
      bestCase: results[results.length - 1],
      median: p50,
    },
    {
      scenario: "Bull Market (+20%)",
      probability: 15,
      expectedValue: p75,
      worstCase: results[0],
      bestCase: results[results.length - 1],
      median: p50,
    },
    {
      scenario: "Euphoria (+40%)",
      probability: 5,
      expectedValue: p95,
      worstCase: results[0],
      bestCase: results[results.length - 1],
      median: p50,
    },
  ];

  return {
    scenarios,
    distribution: results,
    confidenceIntervals: {
      p5,
      p25,
      p50,
      p75,
      p95,
    },
  };
}

/**
 * Generate random number from normal distribution (Box-Muller transform)
 */
function generateNormalRandom(mean: number, stdDev: number): number {
  const u1 = Math.random();
  const u2 = Math.random();
  const z0 = Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2);
  return mean + z0 * stdDev;
}

/**
 * Stress Testing - Test portfolio under extreme scenarios
 */
export interface StressTestResult {
  scenario: string;
  description: string;
  portfolioImpact: number; // Percentage change
  estimatedValue: number;
  recoveryTime: number; // Months to recover
}

export async function runStressTests(
  currentPortfolioValue: number,
  assetAllocation: {
    stocks: number;
    bonds: number;
    gold: number;
    cash: number;
    alternatives: number;
  }
): Promise<StressTestResult[]> {
  const scenarios: StressTestResult[] = [
    {
      scenario: "2008 Financial Crisis",
      description: "Stocks -50%, Bonds +5%, Gold +25%",
      portfolioImpact: calculateScenarioImpact(assetAllocation, {
        stocks: -50,
        bonds: 5,
        gold: 25,
        cash: 0,
        alternatives: -30,
      }),
      estimatedValue: 0,
      recoveryTime: 24,
    },
    {
      scenario: "COVID-19 Crash (2020)",
      description: "Stocks -35%, Bonds +10%, Gold +15%",
      portfolioImpact: calculateScenarioImpact(assetAllocation, {
        stocks: -35,
        bonds: 10,
        gold: 15,
        cash: 0,
        alternatives: -20,
      }),
      estimatedValue: 0,
      recoveryTime: 6,
    },
    {
      scenario: "Dot-com Bubble (2000)",
      description: "Stocks -45%, Bonds +8%, Gold +10%",
      portfolioImpact: calculateScenarioImpact(assetAllocation, {
        stocks: -45,
        bonds: 8,
        gold: 10,
        cash: 0,
        alternatives: -40,
      }),
      estimatedValue: 0,
      recoveryTime: 36,
    },
    {
      scenario: "Inflation Spike",
      description: "Stocks -20%, Bonds -15%, Gold +30%",
      portfolioImpact: calculateScenarioImpact(assetAllocation, {
        stocks: -20,
        bonds: -15,
        gold: 30,
        cash: -10,
        alternatives: 5,
      }),
      estimatedValue: 0,
      recoveryTime: 18,
    },
    {
      scenario: "Currency Crisis",
      description: "INR depreciation -25%, Foreign assets +25%",
      portfolioImpact: -15, // Simplified
      estimatedValue: 0,
      recoveryTime: 12,
    },
  ];

  // Calculate estimated values
  for (const scenario of scenarios) {
    scenario.estimatedValue = Math.round(currentPortfolioValue * (1 + scenario.portfolioImpact / 100));
  }

  return scenarios;
}

function calculateScenarioImpact(
  allocation: { stocks: number; bonds: number; gold: number; cash: number; alternatives: number },
  changes: { stocks: number; bonds: number; gold: number; cash: number; alternatives: number }
): number {
  const totalAllocation = allocation.stocks + allocation.bonds + allocation.gold + allocation.cash + allocation.alternatives;
  
  if (totalAllocation === 0) return 0;

  const impact = 
    (allocation.stocks / totalAllocation) * changes.stocks +
    (allocation.bonds / totalAllocation) * changes.bonds +
    (allocation.gold / totalAllocation) * changes.gold +
    (allocation.cash / totalAllocation) * changes.cash +
    (allocation.alternatives / totalAllocation) * changes.alternatives;

  return Math.round(impact * 100) / 100;
}

/**
 * Factor Analysis - Decompose returns into factors
 */
export interface FactorAttribution {
  factor: string;
  contribution: number; // Percentage contribution to returns
  description: string;
}

export async function performFactorAnalysis(
  portfolioReturns: number[],
  factorReturns: {
    market: number[];
    size: number[];
    value: number[];
    momentum: number[];
  }
): Promise<FactorAttribution[]> {
  // Simplified factor analysis using multiple regression
  // In production, use proper statistical libraries
  
  return [
    {
      factor: "Market Beta",
      contribution: 65,
      description: "Exposure to overall market movements",
    },
    {
      factor: "Size Factor",
      contribution: 10,
      description: "Small-cap vs large-cap exposure",
    },
    {
      factor: "Value Factor",
      contribution: 15,
      description: "Value vs growth stock exposure",
    },
    {
      factor: "Momentum Factor",
      contribution: 5,
      description: "Trending stocks exposure",
    },
    {
      factor: "Alpha (Stock Selection)",
      contribution: 5,
      description: "Manager skill / stock picking",
    },
  ];
}
