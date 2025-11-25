import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, TrendingUp, TrendingDown, Activity } from "lucide-react";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
} from "recharts";

export default function RiskAnalytics() {
  const [, setLocation] = useLocation();

  // Mock attribution metrics
  const metrics = {
    sharpeRatio: 1.85,
    sortinoRatio: 2.34,
    alpha: 3.2,
    beta: 0.92,
    informationRatio: 1.12,
    maxDrawdown: -12.5,
    calmarRatio: 1.45,
    volatility: 15.8,
    returns: 18.5,
  };

  // Factor attribution data
  const factorData = [
    { factor: "Market Beta", contribution: 65, description: "Overall market exposure" },
    { factor: "Size Factor", contribution: 10, description: "Small-cap vs large-cap" },
    { factor: "Value Factor", contribution: 15, description: "Value vs growth stocks" },
    { factor: "Momentum", contribution: 5, description: "Trending stocks" },
    { factor: "Alpha", contribution: 5, description: "Stock selection skill" },
  ];

  // Risk-adjusted returns comparison
  const comparisonData = [
    { metric: "Sharpe Ratio", portfolio: 1.85, benchmark: 1.20, target: 2.00 },
    { metric: "Sortino Ratio", portfolio: 2.34, benchmark: 1.50, target: 2.50 },
    { metric: "Information Ratio", portfolio: 1.12, benchmark: 0, target: 1.50 },
    { metric: "Calmar Ratio", portfolio: 1.45, benchmark: 1.00, target: 1.80 },
  ];

  // Radar chart data for risk profile
  const riskProfileData = [
    { metric: "Returns", value: 85, fullMark: 100 },
    { metric: "Volatility Control", value: 70, fullMark: 100 },
    { metric: "Downside Protection", value: 80, fullMark: 100 },
    { metric: "Diversification", value: 75, fullMark: 100 },
    { metric: "Risk-Adjusted Return", value: 90, fullMark: 100 },
  ];

  // Historical drawdown data
  const drawdownData = [
    { month: "Jan", drawdown: 0 },
    { month: "Feb", drawdown: -3.2 },
    { month: "Mar", drawdown: -5.8 },
    { month: "Apr", drawdown: -2.1 },
    { month: "May", drawdown: -8.5 },
    { month: "Jun", drawdown: -12.5 },
    { month: "Jul", drawdown: -9.2 },
    { month: "Aug", drawdown: -6.1 },
    { month: "Sep", drawdown: -3.5 },
    { month: "Oct", drawdown: -1.2 },
    { month: "Nov", drawdown: 0 },
    { month: "Dec", drawdown: 0 },
  ];

  const getMetricColor = (value: number, isNegative: boolean = false) => {
    if (isNegative) {
      return value < -15 ? "text-red-600" : value < -10 ? "text-orange-600" : "text-yellow-600";
    }
    return value > 2 ? "text-green-600" : value > 1 ? "text-blue-600" : "text-gray-600";
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => setLocation("/")}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-2xl font-serif text-foreground">Risk Analytics</h1>
          </div>
          
          <Button variant="outline">Download Report</Button>
        </div>
      </header>

      <div className="container mx-auto px-6 py-8">
        {/* Key Metrics Cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8"
        >
          <Card className="p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-muted-foreground">Sharpe Ratio</p>
              <TrendingUp className="h-4 w-4 text-green-600" />
            </div>
            <p className={`text-3xl font-bold ${getMetricColor(metrics.sharpeRatio)}`}>
              {metrics.sharpeRatio.toFixed(2)}
            </p>
            <p className="text-xs text-muted-foreground mt-1">Risk-adjusted return</p>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-muted-foreground">Alpha</p>
              <Activity className="h-4 w-4 text-blue-600" />
            </div>
            <p className={`text-3xl font-bold ${getMetricColor(metrics.alpha)}`}>
              +{metrics.alpha.toFixed(1)}%
            </p>
            <p className="text-xs text-muted-foreground mt-1">Excess return vs benchmark</p>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-muted-foreground">Beta</p>
              <Activity className="h-4 w-4 text-purple-600" />
            </div>
            <p className="text-3xl font-bold text-foreground">{metrics.beta.toFixed(2)}</p>
            <p className="text-xs text-muted-foreground mt-1">Market sensitivity</p>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-muted-foreground">Max Drawdown</p>
              <TrendingDown className="h-4 w-4 text-red-600" />
            </div>
            <p className={`text-3xl font-bold ${getMetricColor(metrics.maxDrawdown, true)}`}>
              {metrics.maxDrawdown.toFixed(1)}%
            </p>
            <p className="text-xs text-muted-foreground mt-1">Peak-to-trough decline</p>
          </Card>
        </motion.div>

        {/* Risk-Adjusted Returns Comparison */}
        <Card className="p-6 mb-8">
          <h2 className="text-xl font-serif mb-4">Risk-Adjusted Returns vs Benchmark</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={comparisonData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="metric" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="portfolio" fill="#10b981" name="Your Portfolio" />
              <Bar dataKey="benchmark" fill="#6b7280" name="Nifty 50" />
              <Bar dataKey="target" fill="#3b82f6" name="Target" />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
          {/* Risk Profile Radar */}
          <Card className="p-6">
            <h2 className="text-xl font-serif mb-4">Risk Profile</h2>
            <ResponsiveContainer width="100%" height={300}>
              <RadarChart data={riskProfileData}>
                <PolarGrid />
                <PolarAngleAxis dataKey="metric" />
                <PolarRadiusAxis angle={90} domain={[0, 100]} />
                <Radar
                  name="Portfolio"
                  dataKey="value"
                  stroke="#10b981"
                  fill="#10b981"
                  fillOpacity={0.6}
                />
              </RadarChart>
            </ResponsiveContainer>
          </Card>

          {/* Drawdown Chart */}
          <Card className="p-6">
            <h2 className="text-xl font-serif mb-4">Historical Drawdown</h2>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={drawdownData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Line
                  type="monotone"
                  dataKey="drawdown"
                  stroke="#ef4444"
                  strokeWidth={2}
                  dot={{ fill: "#ef4444" }}
                />
              </LineChart>
            </ResponsiveContainer>
          </Card>
        </div>

        {/* Factor Attribution */}
        <Card className="p-6">
          <h2 className="text-xl font-serif mb-4">Factor Attribution Analysis</h2>
          <div className="space-y-4">
            {factorData.map((factor, idx) => (
              <div key={idx} className="space-y-2">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="font-medium">{factor.factor}</p>
                    <p className="text-sm text-muted-foreground">{factor.description}</p>
                  </div>
                  <span className="text-lg font-bold">{factor.contribution}%</span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div
                    className="bg-gradient-to-r from-blue-500 to-green-500 h-2 rounded-full transition-all duration-500"
                    style={{ width: `${factor.contribution}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Additional Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
          <Card className="p-6">
            <p className="text-sm text-muted-foreground mb-2">Sortino Ratio</p>
            <p className="text-2xl font-bold text-green-600">{metrics.sortinoRatio.toFixed(2)}</p>
            <p className="text-xs text-muted-foreground mt-1">Downside risk-adjusted</p>
          </Card>

          <Card className="p-6">
            <p className="text-sm text-muted-foreground mb-2">Information Ratio</p>
            <p className="text-2xl font-bold text-blue-600">{metrics.informationRatio.toFixed(2)}</p>
            <p className="text-xs text-muted-foreground mt-1">Active return per unit of risk</p>
          </Card>

          <Card className="p-6">
            <p className="text-sm text-muted-foreground mb-2">Calmar Ratio</p>
            <p className="text-2xl font-bold text-purple-600">{metrics.calmarRatio.toFixed(2)}</p>
            <p className="text-xs text-muted-foreground mt-1">Return vs max drawdown</p>
          </Card>
        </div>
      </div>
    </div>
  );
}
