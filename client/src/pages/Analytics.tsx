import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, TrendingUp, TrendingDown, Loader2, PieChart as PieChartIcon, BarChart3, Globe } from "lucide-react";
import { Link } from "wouter";
import { trpc } from "@/lib/trpc";
import { formatINR, formatPercentage } from "@/lib/currency";
import { motion } from "framer-motion";
import { getLoginUrl } from "@/const";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  BarChart,
  Bar,
} from "recharts";
import { useState } from "react";

/**
 * AETHER V5 - Analytics Dashboard
 * Interactive charts for portfolio insights
 */
export default function Analytics() {
  const { isAuthenticated, loading: authLoading } = useAuth();
  const [timeRange, setTimeRange] = useState<30 | 90 | 365>(30);

  const { data: assetAllocation, isLoading: loadingAllocation } = trpc.analytics.getAssetAllocation.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  const { data: performanceHistory, isLoading: loadingPerformance } = trpc.analytics.getPerformanceHistory.useQuery(
    { days: timeRange },
    { enabled: isAuthenticated }
  );

  const { data: sectorAllocation, isLoading: loadingSector } = trpc.analytics.getSectorAllocation.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  const { data: currencyExposure, isLoading: loadingCurrency } = trpc.analytics.getCurrencyExposure.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  const { data: topPerformers } = trpc.analytics.getTopPerformers.useQuery({ limit: 5 }, {
    enabled: isAuthenticated,
  });

  const { data: bottomPerformers } = trpc.analytics.getBottomPerformers.useQuery({ limit: 5 }, {
    enabled: isAuthenticated,
  });

  // Redirect to login if not authenticated
  if (!authLoading && !isAuthenticated) {
    window.location.href = getLoginUrl();
    return null;
  }

  // Color palette for charts
  const COLORS = ["#C9A961", "#8B7355", "#D4AF37", "#B8860B", "#DAA520", "#CD853F"];

  // Custom tooltip
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-card border border-border p-3 rounded-lg shadow-lg">
          <p className="text-sm font-medium text-foreground">{payload[0].name}</p>
          <p className="text-sm text-muted-foreground">
            {formatINR(payload[0].value)} ({payload[0].payload.percentage}%)
          </p>
        </div>
      );
    }
    return null;
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
          <h1 className="text-2xl font-bold text-foreground">Portfolio Analytics</h1>
        </div>
      </header>

      {/* Main Content */}
      <main className="container section-padding">
        <div className="max-w-7xl mx-auto space-y-8">
          {/* Performance Overview */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-foreground">Performance Over Time</h2>
              <div className="flex gap-2">
                <Button
                  variant={timeRange === 30 ? "default" : "outline"}
                  size="sm"
                  onClick={() => setTimeRange(30)}
                >
                  30D
                </Button>
                <Button
                  variant={timeRange === 90 ? "default" : "outline"}
                  size="sm"
                  onClick={() => setTimeRange(90)}
                >
                  90D
                </Button>
                <Button
                  variant={timeRange === 365 ? "default" : "outline"}
                  size="sm"
                  onClick={() => setTimeRange(365)}
                >
                  1Y
                </Button>
              </div>
            </div>

            <Card className="p-6">
              {loadingPerformance ? (
                <div className="h-80 flex items-center justify-center">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={320}>
                  <LineChart data={performanceHistory}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E5E1DA" />
                    <XAxis
                      dataKey="date"
                      stroke="#8B7355"
                      tick={{ fill: "#8B7355" }}
                      tickFormatter={(value) => new Date(value).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                    />
                    <YAxis
                      stroke="#8B7355"
                      tick={{ fill: "#8B7355" }}
                      tickFormatter={(value) => `₹${(value / 100000).toFixed(1)}L`}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#FAF8F3",
                        border: "1px solid #E5E1DA",
                        borderRadius: "8px",
                      }}
                      formatter={(value: any) => [formatINR(value), "Net Worth"]}
                      labelFormatter={(label) => new Date(label).toLocaleDateString()}
                    />
                    <Line
                      type="monotone"
                      dataKey="netWorth"
                      stroke="#C9A961"
                      strokeWidth={2}
                      dot={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </Card>
          </motion.div>

          {/* Charts Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Asset Allocation */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <Card className="p-6 space-y-4">
                <div className="flex items-center gap-2">
                  <PieChartIcon className="h-5 w-5 text-primary" />
                  <h3 className="text-xl font-bold text-foreground">Asset Allocation</h3>
                </div>

                {loadingAllocation ? (
                  <div className="h-80 flex items-center justify-center">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : (
                  <>
                    <ResponsiveContainer width="100%" height={280}>
                      <PieChart>
                        <Pie
                          data={assetAllocation}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={(entry) => `${entry.assetType}: ${entry.percentage}%`}
                          outerRadius={90}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {assetAllocation?.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip content={<CustomTooltip />} />
                      </PieChart>
                    </ResponsiveContainer>

                    <div className="space-y-2">
                      {assetAllocation?.map((item, index) => (
                        <div key={item.assetType} className="flex items-center justify-between text-sm">
                          <div className="flex items-center gap-2">
                            <div
                              className="w-3 h-3 rounded-full"
                              style={{ backgroundColor: COLORS[index % COLORS.length] }}
                            />
                            <span className="text-foreground">{item.assetType}</span>
                          </div>
                          <span className="text-muted-foreground">{formatINR(item.value)}</span>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </Card>
            </motion.div>

            {/* Sector Allocation */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Card className="p-6 space-y-4">
                <div className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-primary" />
                  <h3 className="text-xl font-bold text-foreground">Sector Diversification</h3>
                </div>

                {loadingSector ? (
                  <div className="h-80 flex items-center justify-center">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height={320}>
                    <BarChart data={sectorAllocation}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#E5E1DA" />
                      <XAxis
                        dataKey="sector"
                        stroke="#8B7355"
                        tick={{ fill: "#8B7355", fontSize: 12 }}
                        angle={-45}
                        textAnchor="end"
                        height={80}
                      />
                      <YAxis
                        stroke="#8B7355"
                        tick={{ fill: "#8B7355" }}
                        tickFormatter={(value) => `${value}%`}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "#FAF8F3",
                          border: "1px solid #E5E1DA",
                          borderRadius: "8px",
                        }}
                        formatter={(value: any, name: string) => [`${value}%`, "Allocation"]}
                      />
                      <Bar dataKey="percentage" fill="#C9A961" />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </Card>
            </motion.div>

            {/* Currency Exposure */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <Card className="p-6 space-y-4">
                <div className="flex items-center gap-2">
                  <Globe className="h-5 w-5 text-primary" />
                  <h3 className="text-xl font-bold text-foreground">Currency Exposure</h3>
                </div>

                {loadingCurrency ? (
                  <div className="h-80 flex items-center justify-center">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : (
                  <>
                    <ResponsiveContainer width="100%" height={280}>
                      <PieChart>
                        <Pie
                          data={currencyExposure}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={(entry) => `${entry.currency}: ${entry.percentage}%`}
                          outerRadius={90}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {currencyExposure?.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip content={<CustomTooltip />} />
                      </PieChart>
                    </ResponsiveContainer>

                    <div className="space-y-2">
                      {currencyExposure?.map((item, index) => (
                        <div key={item.currency} className="flex items-center justify-between text-sm">
                          <div className="flex items-center gap-2">
                            <div
                              className="w-3 h-3 rounded-full"
                              style={{ backgroundColor: COLORS[index % COLORS.length] }}
                            />
                            <span className="text-foreground">{item.currency}</span>
                          </div>
                          <span className="text-muted-foreground">{formatINR(item.value)}</span>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </Card>
            </motion.div>

            {/* Top & Bottom Performers */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              <Card className="p-6 space-y-6">
                <h3 className="text-xl font-bold text-foreground">Performance Leaders</h3>

                <Tabs defaultValue="top" className="w-full">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="top">Top Performers</TabsTrigger>
                    <TabsTrigger value="bottom">Bottom Performers</TabsTrigger>
                  </TabsList>

                  <TabsContent value="top" className="space-y-3 mt-4">
                    {topPerformers?.map((asset, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                      >
                        <div className="space-y-1">
                          <p className="font-medium text-foreground">{asset.assetName}</p>
                          {asset.ticker && (
                            <p className="text-xs text-muted-foreground">{asset.ticker}</p>
                          )}
                        </div>
                        <div className="text-right space-y-1">
                          <div className="flex items-center gap-1 text-success">
                            <TrendingUp className="h-4 w-4" />
                            <span className="font-semibold">{formatPercentage(asset.gainPercentage)}</span>
                          </div>
                          <p className="text-xs text-muted-foreground">{formatINR(asset.gain)}</p>
                        </div>
                      </div>
                    ))}
                  </TabsContent>

                  <TabsContent value="bottom" className="space-y-3 mt-4">
                    {bottomPerformers?.map((asset, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                      >
                        <div className="space-y-1">
                          <p className="font-medium text-foreground">{asset.assetName}</p>
                          {asset.ticker && (
                            <p className="text-xs text-muted-foreground">{asset.ticker}</p>
                          )}
                        </div>
                        <div className="text-right space-y-1">
                          <div className="flex items-center gap-1 text-destructive">
                            <TrendingDown className="h-4 w-4" />
                            <span className="font-semibold">{formatPercentage(asset.gainPercentage)}</span>
                          </div>
                          <p className="text-xs text-muted-foreground">{formatINR(asset.gain)}</p>
                        </div>
                      </div>
                    ))}
                  </TabsContent>
                </Tabs>
              </Card>
            </motion.div>
          </div>
        </div>
      </main>
    </div>
  );
}
