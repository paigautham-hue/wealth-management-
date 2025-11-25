import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { ArrowLeft, Search, Loader2, TrendingUp, AlertCircle } from "lucide-react";
import { Link } from "wouter";
import { trpc } from "@/lib/trpc";
import { formatINR } from "@/lib/currency";
import { motion, AnimatePresence } from "framer-motion";
import CountUp from "react-countup";
import { getLoginUrl } from "@/const";

/**
 * AETHER V5 - The Oracle
 * AI-powered stock analysis with 8 investment framework lenses
 */
export default function Oracle() {
  const { isAuthenticated, loading: authLoading } = useAuth();
  const [ticker, setTicker] = useState("");
  const [market, setMarket] = useState<"IN" | "US">("IN");
  const [showBearCase, setShowBearCase] = useState(false);

  const { data: analysis, isLoading, error, refetch } = trpc.oracle.getAnalysis.useQuery(
    { ticker: ticker.toUpperCase(), market },
    { enabled: false }
  );

  // Redirect to login if not authenticated
  if (!authLoading && !isAuthenticated) {
    window.location.href = getLoginUrl();
    return null;
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (ticker.trim()) {
      refetch();
    }
  };

  const getRecommendationColor = (rec: string) => {
    switch (rec) {
      case "STRONG_BUY":
      case "BUY":
        return "text-success";
      case "HOLD":
        return "text-warning";
      case "SELL":
      case "STRONG_SELL":
        return "text-destructive";
      default:
        return "text-foreground";
    }
  };

  const lensLabels = {
    buffett: "Warren Buffett (Value + Moat)",
    lynch: "Peter Lynch (GARP)",
    graham: "Benjamin Graham (Deep Value)",
    fisher: "Philip Fisher (Quality Growth)",
    jhunjhunwala: "Rakesh Jhunjhunwala (India)",
    kacholia: "Ashish Kacholia (Small/Mid)",
    kedia: "Vijay Kedia (SMiLE)",
    quantitative: "Quantitative (Data-Driven)",
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
          <h1 className="text-2xl font-bold text-foreground">The Oracle</h1>
        </div>
      </header>

      {/* Main Content */}
      <main className="container section-padding">
        <div className="max-w-4xl mx-auto space-y-8">
          {/* Search Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-center space-y-6"
          >
            <div className="space-y-2">
              <h2 className="text-4xl font-bold text-foreground">
                AI-Powered Stock Analysis
              </h2>
              <p className="text-lg text-muted-foreground">
                8 investment frameworks analyze any stock in seconds
              </p>
            </div>

            {/* Search Form */}
            <Card className="p-6">
              <form onSubmit={handleSearch} className="space-y-4">
                <div className="flex gap-4">
                  <Input
                    placeholder="Enter stock ticker (e.g., HDFCBANK, AAPL)"
                    value={ticker}
                    onChange={(e) => setTicker(e.target.value.toUpperCase())}
                    className="flex-1 text-lg"
                  />
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant={market === "IN" ? "default" : "outline"}
                      onClick={() => setMarket("IN")}
                    >
                      India
                    </Button>
                    <Button
                      type="button"
                      variant={market === "US" ? "default" : "outline"}
                      onClick={() => setMarket("US")}
                    >
                      USA
                    </Button>
                  </div>
                </div>
                <Button type="submit" size="lg" className="w-full" disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                      Analyzing...
                    </>
                  ) : (
                    <>
                      <Search className="h-5 w-5 mr-2" />
                      Analyze Stock
                    </>
                  )}
                </Button>
              </form>
            </Card>
          </motion.div>

          {/* Error State */}
          {error && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <Card className="p-6 border-destructive bg-destructive/10">
                <div className="flex items-center gap-3">
                  <AlertCircle className="h-5 w-5 text-destructive" />
                  <p className="text-destructive">
                    Unable to analyze this stock. Please check the ticker symbol and try again.
                  </p>
                </div>
              </Card>
            </motion.div>
          )}

          {/* Analysis Results */}
          <AnimatePresence>
            {analysis && (
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -30 }}
                transition={{ duration: 0.5 }}
                className="space-y-8"
              >
                {/* Summary Card */}
                <Card className="card-padding text-center space-y-6">
                  <div className="space-y-2">
                    <h3 className="text-3xl font-bold text-foreground">
                      {analysis.ticker}
                    </h3>
                    <p className="text-muted-foreground">
                      {analysis.market === "IN" ? "India" : "USA"} Market
                    </p>
                  </div>

                  {/* Score */}
                  <div className="space-y-4">
                    <div className="text-8xl font-bold text-foreground financial-number">
                      <CountUp
                        start={0}
                        end={analysis.finalScore}
                        duration={1.5}
                        decimals={1}
                      />
                      <span className="text-4xl text-muted-foreground">/10</span>
                    </div>
                    <p className={`text-3xl font-bold ${getRecommendationColor(analysis.recommendation)}`}>
                      {analysis.recommendation.replace("_", " ")}
                    </p>
                  </div>

                  {/* Target Price */}
                  <div className="flex items-center justify-center gap-8 pt-6 border-t border-border">
                    <div className="text-center">
                      <p className="text-sm text-muted-foreground">Current Price</p>
                      <p className="text-2xl font-bold text-foreground financial-number">
                        {formatINR(analysis.currentPrice)}
                      </p>
                    </div>
                    <TrendingUp className="h-6 w-6 text-success" />
                    <div className="text-center">
                      <p className="text-sm text-muted-foreground">Target Price</p>
                      <p className="text-2xl font-bold text-success financial-number">
                        {formatINR(analysis.targetPrice)}
                      </p>
                    </div>
                  </div>

                  <p className="text-lg text-success">
                    {analysis.upsidePercentage > 0 ? "+" : ""}
                    {analysis.upsidePercentage}% potential upside
                  </p>

                  {/* Bear Case Button */}
                  <Button
                    variant="outline"
                    onClick={() => setShowBearCase(!showBearCase)}
                    className="mt-4"
                  >
                    {showBearCase ? "Hide" : "Show"} Devil's Advocate
                  </Button>
                </Card>

                {/* Bear Case */}
                <AnimatePresence>
                  {showBearCase && analysis.bearCase && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.3 }}
                    >
                      <Card className="p-6 border-destructive bg-destructive/5">
                        <h4 className="text-xl font-bold text-destructive mb-4">
                          Why NOT to Buy
                        </h4>
                        <p className="text-foreground whitespace-pre-line">
                          {analysis.bearCase}
                        </p>
                      </Card>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Investment Framework Scores */}
                <Card className="card-padding space-y-6">
                  <h3 className="text-2xl font-bold text-foreground">
                    Investment Framework Scores
                  </h3>

                  <div className="space-y-4">
                    {Object.entries(analysis.lensScores).map(([key, lens], index) => (
                      <motion.div
                        key={key}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1, duration: 0.3 }}
                        className="space-y-2"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-foreground">
                            {lensLabels[key as keyof typeof lensLabels]}
                          </span>
                          <span className="text-sm font-bold text-foreground">
                            {lens.score.toFixed(1)}/10
                          </span>
                        </div>
                        <Progress value={lens.score * 10} className="h-2" />
                        <p className="text-xs text-muted-foreground">{lens.verdict}</p>
                      </motion.div>
                    ))}
                  </div>
                </Card>

                {/* Strengths & Risks */}
                {((analysis.strengths && analysis.strengths.length > 0) || (analysis.risks && analysis.risks.length > 0)) && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {analysis.strengths && analysis.strengths.length > 0 && (
                      <Card className="p-6 space-y-4">
                        <h4 className="text-xl font-bold text-success">Strengths</h4>
                        <ul className="space-y-2">
                          {analysis.strengths.map((strength, i) => (
                            <li key={i} className="text-sm text-foreground flex items-start gap-2">
                              <span className="text-success">✓</span>
                              {strength}
                            </li>
                          ))}
                        </ul>
                      </Card>
                    )}

                    {analysis.risks && analysis.risks.length > 0 && (
                      <Card className="p-6 space-y-4">
                        <h4 className="text-xl font-bold text-destructive">Risks</h4>
                        <ul className="space-y-2">
                          {analysis.risks.map((risk, i) => (
                            <li key={i} className="text-sm text-foreground flex items-start gap-2">
                              <span className="text-destructive">⚠</span>
                              {risk}
                            </li>
                          ))}
                        </ul>
                      </Card>
                    )}
                  </div>
                )}

                {/* Executive Summary */}
                {analysis.executiveSummary && (
                  <Card className="p-6 space-y-4">
                    <h4 className="text-xl font-bold text-foreground">Executive Summary</h4>
                    <p className="text-foreground leading-relaxed">
                      {analysis.executiveSummary}
                    </p>
                  </Card>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}
