import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowLeft, Plus, TrendingUp, TrendingDown, Loader2 } from "lucide-react";
import { Link, useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { formatINR, formatPercentage, formatDate } from "@/lib/currency";
import { motion } from "framer-motion";
import { getLoginUrl } from "@/const";

/**
 * AETHER V5 - Portfolio Page
 * Displays all assets grouped by type with performance attribution
 */
export default function Portfolio() {
  const { isAuthenticated, loading: authLoading } = useAuth();
  const [, setLocation] = useLocation();
  
  const { data: assets, isLoading } = trpc.portfolio.getAssets.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  // Redirect to login if not authenticated
  if (!authLoading && !isAuthenticated) {
    window.location.href = getLoginUrl();
    return null;
  }

  // Loading state
  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto" />
          <p className="text-muted-foreground">Loading portfolio...</p>
        </div>
      </div>
    );
  }

  // Group assets by type
  const groupedAssets = (assets || []).reduce((acc, asset) => {
    if (!acc[asset.assetType]) {
      acc[asset.assetType] = [];
    }
    acc[asset.assetType].push(asset);
    return acc;
  }, {} as Record<string, NonNullable<typeof assets>>);

  const assetTypeLabels: Record<string, string> = {
    stock: "Stocks",
    bond: "Bonds",
    mutual_fund: "Mutual Funds",
    real_estate: "Real Estate",
    alternative: "Alternative Investments",
    cash: "Cash & Equivalents",
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card sticky top-0 z-10">
        <div className="container py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Home
              </Button>
            </Link>
            <h1 className="text-2xl font-bold text-foreground">Portfolio</h1>
          </div>
          <Link href="/portfolio/add">
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Asset
            </Button>
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="container section-padding">
        <div className="max-w-6xl mx-auto space-y-12">
          {/* Empty State */}
          {(!assets || assets.length === 0) && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center py-20 space-y-6"
            >
              <div className="space-y-2">
                <h2 className="text-3xl font-bold text-foreground">Start Building Your Portfolio</h2>
                <p className="text-lg text-muted-foreground">
                  Add your first asset to begin tracking your wealth
                </p>
              </div>
              <Link href="/portfolio/add">
                <Button size="lg">
                  <Plus className="h-5 w-5 mr-2" />
                  Add Your First Asset
                </Button>
              </Link>
            </motion.div>
          )}

          {/* Asset Groups */}
          {Object.entries(groupedAssets).map(([type, assetList], groupIndex) => (
            <motion.div
              key={type}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: groupIndex * 0.1, duration: 0.5 }}
              className="space-y-6"
            >
              {/* Group Header */}
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-foreground">
                  {assetTypeLabels[type] || type}
                </h2>
                <p className="text-lg text-muted-foreground">
                  {formatINR((assetList || []).reduce((sum, a) => sum + a.currentValue, 0))}
                </p>
              </div>

              {/* Asset Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {(assetList || []).map((asset, index) => {
                  const isGain = asset.gain >= 0;
                  
                  return (
                    <motion.div
                      key={asset.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: (groupIndex * 0.1) + (index * 0.05), duration: 0.5 }}
                    >
                      <Card className="p-6 space-y-4 hover:shadow-lg transition-shadow">
                        {/* Asset Header */}
                        <div className="flex items-start justify-between">
                          <div className="space-y-1">
                            <h3 className="text-lg font-semibold text-foreground">
                              {asset.assetName}
                            </h3>
                            {asset.ticker && (
                              <p className="text-sm text-muted-foreground">{asset.ticker}</p>
                            )}
                          </div>
                          {isGain ? (
                            <TrendingUp className="h-5 w-5 text-success" />
                          ) : (
                            <TrendingDown className="h-5 w-5 text-destructive" />
                          )}
                        </div>

                        {/* Current Value */}
                        <div className="space-y-1">
                          <p className="text-sm text-muted-foreground">Current Value</p>
                          <p className="text-2xl font-bold text-foreground financial-number">
                            {formatINR(asset.currentValue)}
                          </p>
                        </div>

                        {/* Performance */}
                        <div className="flex items-center justify-between pt-4 border-t border-border">
                          <div className="space-y-1">
                            <p className="text-xs text-muted-foreground">Gain/Loss</p>
                            <p className={`text-sm font-semibold ${isGain ? 'text-success' : 'text-destructive'}`}>
                              {formatINR(asset.gain)}
                            </p>
                          </div>
                          <div className="space-y-1 text-right">
                            <p className="text-xs text-muted-foreground">Return</p>
                            <p className={`text-sm font-semibold ${isGain ? 'text-success' : 'text-destructive'}`}>
                              {formatPercentage(asset.gainPercentage)}
                            </p>
                          </div>
                        </div>

                        {/* Details */}
                        <div className="flex items-center justify-between text-xs text-muted-foreground pt-2">
                          <span>{asset.quantity.toFixed(2)} units</span>
                          <span>Bought {formatDate(asset.purchaseDate)}</span>
                        </div>
                      </Card>
                    </motion.div>
                  );
                })}
              </div>
            </motion.div>
          ))}
        </div>
      </main>
    </div>
  );
}
