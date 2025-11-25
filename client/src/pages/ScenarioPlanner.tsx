import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Play, TrendingUp, TrendingDown, AlertTriangle } from "lucide-react";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import { formatINR } from "@/lib/currency";
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

export default function ScenarioPlanner() {
  const [, setLocation] = useLocation();
  const [isRunning, setIsRunning] = useState(false);

  // Mock Monte Carlo simulation results (10,000 runs)
  const monteCarloData = [
    { year: 2025, p10: 850000, p50: 950000, p90: 1100000 },
    { year: 2026, p10: 900000, p50: 1050000, p90: 1250000 },
    { year: 2027, p10: 950000, p50: 1180000, p90: 1450000 },
    { year: 2028, p10: 1000000, p50: 1320000, p90: 1700000 },
    { year: 2029, p10: 1050000, p50: 1480000, p90: 2000000 },
    { year: 2030, p10: 1100000, p50: 1660000, p90: 2350000 },
  ];

  // Stress test scenarios
  const stressTests = [
    {
      name: "2008 Financial Crisis",
      description: "Subprime mortgage collapse, global recession",
      impact: -42.5,
      duration: "18 months",
      recovery: "54 months",
      portfolioImpact: -385000,
      severity: "high" as const,
    },
    {
      name: "COVID-19 Crash (2020)",
      description: "Pandemic-induced market crash",
      impact: -34.2,
      duration: "3 months",
      recovery: "6 months",
      portfolioImpact: -310000,
      severity: "high" as const,
    },
    {
      name: "Dot-com Bubble (2000)",
      description: "Technology stock crash",
      impact: -49.1,
      duration: "30 months",
      recovery: "84 months",
      portfolioImpact: -445000,
      severity: "high" as const,
    },
    {
      name: "Taper Tantrum (2013)",
      description: "Fed tapering announcement",
      impact: -15.8,
      duration: "4 months",
      recovery: "8 months",
      portfolioImpact: -143000,
      severity: "medium" as const,
    },
    {
      name: "Brexit Vote (2016)",
      description: "UK referendum volatility",
      impact: -8.5,
      duration: "2 months",
      recovery: "4 months",
      portfolioImpact: -77000,
      severity: "low" as const,
    },
  ];

  // Probability distribution
  const probabilityData = [
    { range: "< ₹5L", probability: 2 },
    { range: "₹5-7L", probability: 8 },
    { range: "₹7-9L", probability: 15 },
    { range: "₹9-11L", probability: 25 },
    { range: "₹11-13L", probability: 22 },
    { range: "₹13-15L", probability: 15 },
    { range: "₹15-17L", probability: 8 },
    { range: "> ₹17L", probability: 5 },
  ];

  // Custom scenarios
  const customScenarios = [
    {
      name: "Bull Market",
      annualReturn: 18,
      volatility: 12,
      projectedValue: 1850000,
      probability: 25,
    },
    {
      name: "Base Case",
      annualReturn: 12,
      volatility: 15,
      projectedValue: 1480000,
      probability: 50,
    },
    {
      name: "Bear Market",
      annualReturn: 5,
      volatility: 22,
      probability: 15,
      projectedValue: 1100000,
    },
    {
      name: "Recession",
      annualReturn: -8,
      volatility: 30,
      projectedValue: 750000,
      probability: 10,
    },
  ];

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case "high":
        return <Badge variant="destructive">High Severity</Badge>;
      case "medium":
        return <Badge variant="default">Medium Severity</Badge>;
      case "low":
        return <Badge variant="secondary">Low Severity</Badge>;
      default:
        return null;
    }
  };

  const runSimulation = () => {
    setIsRunning(true);
    setTimeout(() => setIsRunning(false), 2000);
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
            <h1 className="text-2xl font-serif text-foreground">Scenario Planner</h1>
          </div>

          <Button className="gap-2" onClick={runSimulation} disabled={isRunning}>
            <Play className="h-4 w-4" />
            {isRunning ? "Running..." : "Run New Simulation"}
          </Button>
        </div>
      </header>

      <div className="container mx-auto px-6 py-8">
        <Tabs defaultValue="monte-carlo" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="monte-carlo">Monte Carlo</TabsTrigger>
            <TabsTrigger value="stress-tests">Stress Tests</TabsTrigger>
            <TabsTrigger value="custom">Custom Scenarios</TabsTrigger>
          </TabsList>

          {/* Monte Carlo Tab */}
          <TabsContent value="monte-carlo" className="space-y-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="grid grid-cols-1 md:grid-cols-3 gap-6"
            >
              <Card className="p-6">
                <p className="text-sm text-muted-foreground mb-2">10th Percentile (Worst Case)</p>
                <p className="text-2xl font-bold text-red-600">{formatINR(1100000)}</p>
                <p className="text-xs text-muted-foreground mt-1">10% chance of being below this</p>
              </Card>

              <Card className="p-6">
                <p className="text-sm text-muted-foreground mb-2">50th Percentile (Median)</p>
                <p className="text-2xl font-bold text-foreground">{formatINR(1660000)}</p>
                <p className="text-xs text-muted-foreground mt-1">Most likely outcome</p>
              </Card>

              <Card className="p-6">
                <p className="text-sm text-muted-foreground mb-2">90th Percentile (Best Case)</p>
                <p className="text-2xl font-bold text-green-600">{formatINR(2350000)}</p>
                <p className="text-xs text-muted-foreground mt-1">10% chance of exceeding this</p>
              </Card>
            </motion.div>

            <Card className="p-6">
              <h2 className="text-xl font-serif mb-4">Portfolio Value Projection (5 Years)</h2>
              <p className="text-sm text-muted-foreground mb-4">
                Based on 10,000 Monte Carlo simulations with 12% expected return and 15% volatility
              </p>
              <ResponsiveContainer width="100%" height={400}>
                <AreaChart data={monteCarloData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="year" />
                  <YAxis />
                  <Tooltip formatter={(value) => formatINR(value as number)} />
                  <Legend />
                  <Area
                    type="monotone"
                    dataKey="p90"
                    stackId="1"
                    stroke="#10b981"
                    fill="#10b981"
                    fillOpacity={0.2}
                    name="90th Percentile"
                  />
                  <Area
                    type="monotone"
                    dataKey="p50"
                    stackId="2"
                    stroke="#3b82f6"
                    fill="#3b82f6"
                    fillOpacity={0.4}
                    name="Median"
                  />
                  <Area
                    type="monotone"
                    dataKey="p10"
                    stackId="3"
                    stroke="#ef4444"
                    fill="#ef4444"
                    fillOpacity={0.2}
                    name="10th Percentile"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </Card>

            <Card className="p-6">
              <h2 className="text-xl font-serif mb-4">Probability Distribution (2030)</h2>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={probabilityData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="range" />
                  <YAxis label={{ value: "Probability (%)", angle: -90, position: "insideLeft" }} />
                  <Tooltip />
                  <Bar dataKey="probability" fill="#3b82f6" />
                </BarChart>
              </ResponsiveContainer>
            </Card>
          </TabsContent>

          {/* Stress Tests Tab */}
          <TabsContent value="stress-tests" className="space-y-6">
            <Card className="p-4 bg-yellow-50 dark:bg-yellow-950 border-yellow-200 dark:border-yellow-800">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-yellow-600 dark:text-yellow-400 mt-0.5" />
                <div>
                  <p className="font-medium text-yellow-900 dark:text-yellow-100">Historical Stress Tests</p>
                  <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
                    See how your portfolio would have performed during major historical market events
                  </p>
                </div>
              </div>
            </Card>

            <div className="space-y-4">
              {stressTests.map((test, idx) => (
                <Card key={idx} className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-serif mb-1">{test.name}</h3>
                      <p className="text-sm text-muted-foreground">{test.description}</p>
                    </div>
                    {getSeverityBadge(test.severity)}
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Market Impact</p>
                      <p className="text-lg font-bold text-red-600 flex items-center gap-1">
                        <TrendingDown className="h-4 w-4" />
                        {test.impact}%
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Duration</p>
                      <p className="text-lg font-medium">{test.duration}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Recovery Time</p>
                      <p className="text-lg font-medium">{test.recovery}</p>
                    </div>
                    <div className="col-span-2">
                      <p className="text-xs text-muted-foreground mb-1">Your Portfolio Impact</p>
                      <p className="text-lg font-bold text-red-600">{formatINR(test.portfolioImpact)}</p>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Custom Scenarios Tab */}
          <TabsContent value="custom" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {customScenarios.map((scenario, idx) => {
                const isPositive = scenario.annualReturn > 0;
                return (
                  <Card key={idx} className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <h3 className="text-lg font-serif">{scenario.name}</h3>
                      <Badge variant="outline">{scenario.probability}% probability</Badge>
                    </div>

                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">Annual Return</span>
                        <span className={`text-lg font-bold ${isPositive ? "text-green-600" : "text-red-600"}`}>
                          {isPositive ? "+" : ""}
                          {scenario.annualReturn}%
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">Volatility</span>
                        <span className="text-lg font-medium">{scenario.volatility}%</span>
                      </div>
                      <div className="flex justify-between items-center pt-3 border-t">
                        <span className="text-sm text-muted-foreground">Projected Value (2030)</span>
                        <span className="text-xl font-bold text-foreground">
                          {formatINR(scenario.projectedValue)}
                        </span>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>

            <Card className="p-6">
              <h2 className="text-xl font-serif mb-4">Build Custom Scenario</h2>
              <p className="text-sm text-muted-foreground mb-4">
                Create your own scenario by adjusting expected returns, volatility, and time horizon
              </p>
              <Button variant="outline">Coming Soon</Button>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
