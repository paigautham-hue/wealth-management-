import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Brain, TrendingUp, AlertTriangle, Target, Loader2 } from "lucide-react";
import { Link } from "wouter";
import { trpc } from "@/lib/trpc";
import { getLoginUrl } from "@/const";
import { motion } from "framer-motion";
import { useState } from "react";
import { Streamdown } from "streamdown";

/**
 * AETHER V5 - AI Wealth Advisor
 * Personalized investment strategy and behavioral coaching
 */
export default function WealthAdvisor() {
  const { isAuthenticated, loading: authLoading } = useAuth();
  const [activeTab, setActiveTab] = useState<"strategy" | "regime" | "behavioral" | "rebalance">("strategy");

  // Strategy form state
  const [riskTolerance, setRiskTolerance] = useState<"conservative" | "moderate" | "aggressive">("moderate");
  const [age, setAge] = useState("35");
  const [horizon, setHorizon] = useState("10");
  const [liquidity, setLiquidity] = useState<"low" | "medium" | "high">("medium");
  const [goals, setGoals] = useState("Retirement, Children's education, Wealth preservation");

  // Rebalancing command
  const [rebalanceCommand, setRebalanceCommand] = useState("");

  // tRPC mutations
  const strategyMutation = trpc.wealthAdvisor.generateStrategy.useMutation();
  const regimeMutation = trpc.wealthAdvisor.detectRegime.useMutation();
  const behavioralMutation = trpc.wealthAdvisor.analyzeBehavior.useMutation();
  const rebalanceMutation = trpc.wealthAdvisor.processRebalancing.useMutation();

  if (!authLoading && !isAuthenticated) {
    window.location.href = getLoginUrl();
    return null;
  }

  const handleGenerateStrategy = () => {
    strategyMutation.mutate({
      riskTolerance,
      age: parseInt(age),
      investmentHorizon: parseInt(horizon),
      liquidityNeeds: liquidity,
      investmentGoals: goals.split(",").map(g => g.trim()),
    });
  };

  const handleDetectRegime = () => {
    regimeMutation.mutate();
  };

  const handleAnalyzeBehavior = () => {
    behavioralMutation.mutate();
  };

  const handleRebalance = () => {
    if (rebalanceCommand.trim()) {
      rebalanceMutation.mutate({ command: rebalanceCommand });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card sticky top-0 z-10">
        <div className="container py-4 flex items-center gap-4">
          <Link href="/">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Home
            </Button>
          </Link>
          <div className="flex items-center gap-2">
            <Brain className="h-6 w-6 text-primary" />
            <h1 className="text-2xl font-bold text-foreground">AI Wealth Advisor</h1>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container section-padding">
        <div className="max-w-6xl mx-auto space-y-8">
          {/* Tab Navigation */}
          <div className="flex gap-2 border-b border-border">
            <button
              onClick={() => setActiveTab("strategy")}
              className={`px-4 py-2 font-medium transition-colors ${
                activeTab === "strategy"
                  ? "text-primary border-b-2 border-primary"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Target className="inline h-4 w-4 mr-2" />
              Investment Strategy
            </button>
            <button
              onClick={() => setActiveTab("regime")}
              className={`px-4 py-2 font-medium transition-colors ${
                activeTab === "regime"
                  ? "text-primary border-b-2 border-primary"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <TrendingUp className="inline h-4 w-4 mr-2" />
              Market Regime
            </button>
            <button
              onClick={() => setActiveTab("behavioral")}
              className={`px-4 py-2 font-medium transition-colors ${
                activeTab === "behavioral"
                  ? "text-primary border-b-2 border-primary"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <AlertTriangle className="inline h-4 w-4 mr-2" />
              Behavioral Insights
            </button>
            <button
              onClick={() => setActiveTab("rebalance")}
              className={`px-4 py-2 font-medium transition-colors ${
                activeTab === "rebalance"
                  ? "text-primary border-b-2 border-primary"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Brain className="inline h-4 w-4 mr-2" />
              Smart Rebalancing
            </button>
          </div>

          {/* Investment Strategy Tab */}
          {activeTab === "strategy" && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              <Card className="p-6 space-y-6">
                <div>
                  <h2 className="text-xl font-bold text-foreground mb-2">Personalized Investment Strategy</h2>
                  <p className="text-muted-foreground">
                    Answer a few questions to receive AI-powered investment recommendations tailored to your goals.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label>Risk Tolerance</Label>
                    <Select value={riskTolerance} onValueChange={(v: any) => setRiskTolerance(v)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="conservative">Conservative</SelectItem>
                        <SelectItem value="moderate">Moderate</SelectItem>
                        <SelectItem value="aggressive">Aggressive</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Age</Label>
                    <Input
                      type="number"
                      value={age}
                      onChange={(e) => setAge(e.target.value)}
                      placeholder="35"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Investment Horizon (years)</Label>
                    <Input
                      type="number"
                      value={horizon}
                      onChange={(e) => setHorizon(e.target.value)}
                      placeholder="10"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Liquidity Needs</Label>
                    <Select value={liquidity} onValueChange={(v: any) => setLiquidity(v)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Low</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2 md:col-span-2">
                    <Label>Investment Goals (comma-separated)</Label>
                    <Textarea
                      value={goals}
                      onChange={(e) => setGoals(e.target.value)}
                      placeholder="Retirement, Children's education, Wealth preservation"
                      rows={3}
                    />
                  </div>
                </div>

                <Button
                  onClick={handleGenerateStrategy}
                  disabled={strategyMutation.isPending}
                  className="w-full"
                >
                  {strategyMutation.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Generating Strategy...
                    </>
                  ) : (
                    "Generate Investment Strategy"
                  )}
                </Button>
              </Card>

              {/* Strategy Results */}
              {strategyMutation.data && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-6"
                >
                  <Card className="p-6 space-y-4">
                    <h3 className="text-lg font-bold text-foreground">Recommended Allocation</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="text-center p-4 rounded-lg bg-muted/50">
                        <p className="text-sm text-muted-foreground">Equity</p>
                        <p className="text-2xl font-bold text-foreground">
                          {strategyMutation.data.recommendedAllocation.equity}%
                        </p>
                      </div>
                      <div className="text-center p-4 rounded-lg bg-muted/50">
                        <p className="text-sm text-muted-foreground">Fixed Income</p>
                        <p className="text-2xl font-bold text-foreground">
                          {strategyMutation.data.recommendedAllocation.fixedIncome}%
                        </p>
                      </div>
                      <div className="text-center p-4 rounded-lg bg-muted/50">
                        <p className="text-sm text-muted-foreground">Alternatives</p>
                        <p className="text-2xl font-bold text-foreground">
                          {strategyMutation.data.recommendedAllocation.alternatives}%
                        </p>
                      </div>
                      <div className="text-center p-4 rounded-lg bg-muted/50">
                        <p className="text-sm text-muted-foreground">Cash</p>
                        <p className="text-2xl font-bold text-foreground">
                          {strategyMutation.data.recommendedAllocation.cash}%
                        </p>
                      </div>
                    </div>
                  </Card>

                  <Card className="p-6 space-y-4">
                    <h3 className="text-lg font-bold text-foreground">Strategy Reasoning</h3>
                    <div className="prose prose-sm max-w-none">
                      <Streamdown>{strategyMutation.data.reasoning}</Streamdown>
                    </div>
                  </Card>

                  <Card className="p-6 space-y-4">
                    <h3 className="text-lg font-bold text-foreground">Action Items</h3>
                    <ul className="space-y-2">
                      {strategyMutation.data.actionItems.map((item: string, idx: number) => (
                        <li key={idx} className="flex items-start gap-2">
                          <span className="text-primary mt-1">•</span>
                          <span className="text-foreground">{item}</span>
                        </li>
                      ))}
                    </ul>
                  </Card>

                  <Card className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <p className="text-sm text-muted-foreground">Risk Score</p>
                        <p className="text-2xl font-bold text-foreground">{strategyMutation.data.riskScore}/100</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Expected Return</p>
                        <p className="text-2xl font-bold text-success">{strategyMutation.data.expectedReturn}% p.a.</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Expected Volatility</p>
                        <p className="text-2xl font-bold text-muted-foreground">
                          {strategyMutation.data.expectedVolatility}% p.a.
                        </p>
                      </div>
                    </div>
                  </Card>
                </motion.div>
              )}
            </motion.div>
          )}

          {/* Market Regime Tab */}
          {activeTab === "regime" && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              <Card className="p-6 space-y-6">
                <div>
                  <h2 className="text-xl font-bold text-foreground mb-2">Market Regime Detection</h2>
                  <p className="text-muted-foreground">
                    AI-powered analysis of current market conditions to help you adjust your strategy.
                  </p>
                </div>

                <Button onClick={handleDetectRegime} disabled={regimeMutation.isPending}>
                  {regimeMutation.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Analyzing Markets...
                    </>
                  ) : (
                    "Detect Current Regime"
                  )}
                </Button>
              </Card>

              {regimeMutation.data && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-6"
                >
                  <Card className="p-6 space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-bold text-foreground">Current Regime</h3>
                      <span className="px-4 py-2 rounded-full bg-primary/10 text-primary font-semibold capitalize">
                        {regimeMutation.data.regime}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Confidence: {(regimeMutation.data.confidence * 100).toFixed(0)}%
                    </p>
                  </Card>

                  <Card className="p-6 space-y-4">
                    <h3 className="text-lg font-bold text-foreground">Key Indicators</h3>
                    <div className="space-y-3">
                      {regimeMutation.data.indicators.map((indicator: any, idx: number) => (
                        <div key={idx} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                          <div>
                            <p className="font-medium text-foreground">{indicator.name}</p>
                            <p className="text-sm text-muted-foreground">{indicator.value.toFixed(2)}</p>
                          </div>
                          <span
                            className={`px-3 py-1 rounded-full text-sm font-medium ${
                              indicator.signal === "bullish"
                                ? "bg-success/10 text-success"
                                : indicator.signal === "bearish"
                                ? "bg-destructive/10 text-destructive"
                                : "bg-muted text-muted-foreground"
                            }`}
                          >
                            {indicator.signal}
                          </span>
                        </div>
                      ))}
                    </div>
                  </Card>

                  <Card className="p-6 space-y-4">
                    <h3 className="text-lg font-bold text-foreground">Recommendation</h3>
                    <div className="prose prose-sm max-w-none">
                      <Streamdown>{regimeMutation.data.recommendation}</Streamdown>
                    </div>
                  </Card>
                </motion.div>
              )}
            </motion.div>
          )}

          {/* Behavioral Insights Tab */}
          {activeTab === "behavioral" && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              <Card className="p-6 space-y-6">
                <div>
                  <h2 className="text-xl font-bold text-foreground mb-2">Behavioral Finance Coaching</h2>
                  <p className="text-muted-foreground">
                    Identify emotional trading patterns and biases that may be hurting your returns.
                  </p>
                </div>

                <Button onClick={handleAnalyzeBehavior} disabled={behavioralMutation.isPending}>
                  {behavioralMutation.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Analyzing Behavior...
                    </>
                  ) : (
                    "Analyze My Behavior"
                  )}
                </Button>
              </Card>

              {behavioralMutation.data && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-4"
                >
                  {behavioralMutation.data.map((insight: any, idx: number) => (
                    <Card key={idx} className="p-6 space-y-4">
                      <div className="flex items-center justify-between">
                        <h3 className="text-lg font-bold text-foreground">{insight.pattern}</h3>
                        <span
                          className={`px-3 py-1 rounded-full text-sm font-medium ${
                            insight.severity === "high"
                              ? "bg-destructive/10 text-destructive"
                              : insight.severity === "medium"
                              ? "bg-warning/10 text-warning"
                              : "bg-muted text-muted-foreground"
                          }`}
                        >
                          {insight.severity} severity
                        </span>
                      </div>

                      <div className="space-y-2">
                        <p className="text-foreground">{insight.description}</p>
                        <div className="p-4 rounded-lg bg-primary/5 border-l-4 border-primary">
                          <p className="text-sm font-medium text-foreground">Recommendation:</p>
                          <p className="text-sm text-muted-foreground mt-1">{insight.recommendation}</p>
                        </div>
                      </div>

                      {insight.examples.length > 0 && (
                        <div>
                          <p className="text-sm font-medium text-foreground mb-2">Examples:</p>
                          <ul className="space-y-1">
                            {insight.examples.map((example: string, exIdx: number) => (
                              <li key={exIdx} className="text-sm text-muted-foreground flex items-start gap-2">
                                <span className="text-primary mt-1">•</span>
                                <span>{example}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </Card>
                  ))}
                </motion.div>
              )}
            </motion.div>
          )}

          {/* Smart Rebalancing Tab */}
          {activeTab === "rebalance" && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              <Card className="p-6 space-y-6">
                <div>
                  <h2 className="text-xl font-bold text-foreground mb-2">Natural Language Rebalancing</h2>
                  <p className="text-muted-foreground">
                    Describe how you want to rebalance your portfolio in plain English, and AI will generate specific trade instructions.
                  </p>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Rebalancing Command</Label>
                    <Textarea
                      value={rebalanceCommand}
                      onChange={(e) => setRebalanceCommand(e.target.value)}
                      placeholder='Example: "Move 10% from tech stocks to bonds" or "Increase gold allocation to 15%"'
                      rows={4}
                    />
                  </div>

                  <Button onClick={handleRebalance} disabled={rebalanceMutation.isPending || !rebalanceCommand.trim()}>
                    {rebalanceMutation.isPending ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      "Generate Rebalancing Plan"
                    )}
                  </Button>
                </div>
              </Card>

              {rebalanceMutation.data && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-6"
                >
                  <Card className="p-6 space-y-4">
                    <h3 className="text-lg font-bold text-foreground">Allocation Changes</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground mb-2">Current</p>
                        {Object.entries(rebalanceMutation.data.currentAllocation).map(([cat, pct]: [string, any]) => (
                          <div key={cat} className="flex justify-between text-sm">
                            <span className="text-foreground capitalize">{cat}</span>
                            <span className="text-muted-foreground">{pct.toFixed(1)}%</span>
                          </div>
                        ))}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-muted-foreground mb-2">Target</p>
                        {Object.entries(rebalanceMutation.data.targetAllocation).map(([cat, pct]: [string, any]) => (
                          <div key={cat} className="flex justify-between text-sm">
                            <span className="text-foreground capitalize">{cat}</span>
                            <span className="text-primary font-medium">{pct.toFixed(1)}%</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </Card>

                  <Card className="p-6 space-y-4">
                    <h3 className="text-lg font-bold text-foreground">Recommended Trades</h3>
                    <div className="space-y-3">
                      {rebalanceMutation.data.trades.map((trade: any, idx: number) => (
                        <div key={idx} className="p-4 rounded-lg bg-muted/50 space-y-2">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-medium text-foreground">
                                {trade.action === "buy" ? "Buy" : "Sell"} {trade.assetName}
                              </p>
                              {trade.ticker && (
                                <p className="text-sm text-muted-foreground">{trade.ticker}</p>
                              )}
                            </div>
                            <p className={`text-lg font-bold ${trade.action === "buy" ? "text-success" : "text-destructive"}`}>
                              ₹{trade.amount.toLocaleString("en-IN")}
                            </p>
                          </div>
                          <p className="text-sm text-muted-foreground">{trade.reasoning}</p>
                        </div>
                      ))}
                    </div>
                  </Card>

                  <Card className="p-6">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-muted-foreground">Estimated Transaction Cost</p>
                        <p className="text-xl font-bold text-foreground">
                          ₹{rebalanceMutation.data.estimatedCost.toLocaleString("en-IN")}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Estimated Tax Impact</p>
                        <p className="text-xl font-bold text-warning">
                          ₹{rebalanceMutation.data.taxImpact.toLocaleString("en-IN")}
                        </p>
                      </div>
                    </div>
                  </Card>
                </motion.div>
              )}
            </motion.div>
          )}
        </div>
      </main>
    </div>
  );
}
