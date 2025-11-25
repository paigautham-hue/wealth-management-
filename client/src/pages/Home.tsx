import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowRight, TrendingUp, Loader2 } from "lucide-react";
import { PortfolioChatbot } from "@/components/PortfolioChatbot";
import { APP_LOGO, APP_TITLE, getLoginUrl } from "@/const";
import { trpc } from "@/lib/trpc";
import { formatINR, formatPercentage } from "@/lib/currency";
import CountUp from "react-countup";
import { motion } from "framer-motion";
import { Link } from "wouter";

/**
 * AETHER V5 - Home Dashboard
 * Displays user's total wealth with generous whitespace and smooth animations
 */
export default function Home() {
  const { user, loading: authLoading, isAuthenticated } = useAuth();
  const { data: dashboard, isLoading } = trpc.portfolio.getDashboard.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  // Show login for unauthenticated users
  if (!authLoading && !isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center space-y-8 max-w-2xl mx-auto px-4"
        >
          <div className="space-y-4">
            <h1 className="text-6xl md:text-7xl font-bold text-foreground tracking-tight">
              AETHER V5
            </h1>
            <p className="text-xl md:text-2xl text-muted-foreground font-light">
              Luxury Wealth Management for Indian HNIs
            </p>
          </div>
          
          <div className="space-y-4">
            <p className="text-lg text-muted-foreground max-w-xl mx-auto">
              Experience the world's most advanced wealth management platform. 
              Combining Apple's simplicity, Tesla's intelligence, and Stripe's reliability.
            </p>
          </div>

          <Button 
            size="lg" 
            className="text-lg px-8 py-6"
            onClick={() => window.location.href = getLoginUrl()}
          >
            Get Started
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        </motion.div>
      </div>
    );
  }

  // Loading state
  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto" />
          <p className="text-muted-foreground">Loading your wealth...</p>
        </div>
      </div>
    );
  }

  // Calculate year-to-date performance (mock for now)
  const ytdPercentage = 8.3;
  const isPositive = ytdPercentage > 0;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="container py-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-foreground">AETHER V5</h2>
          <div className="flex items-center gap-4">
            <Link href="/portfolio">
              <Button variant="ghost">Portfolio</Button>
            </Link>
            <Link href="/oracle">
              <Button variant="ghost">Oracle</Button>
            </Link>
            <Link href="/lrs">
              <Button variant="ghost">LRS</Button>
            </Link>
            <Link href="/analytics">
              <Button variant="ghost">Analytics</Button>
            </Link>
            <Link href="/wealth-advisor">
              <Button variant="ghost">AI Advisor</Button>
            </Link>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">{user?.name}</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content - Generous Whitespace */}
      <main className="container section-padding">
        <div className="max-w-4xl mx-auto">
          {/* Hero Section - 70% whitespace */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="text-center space-y-12 py-20"
          >
            {/* Greeting */}
            <div className="space-y-2">
              <p className="text-lg text-muted-foreground">Your Wealth</p>
            </div>

            {/* Main Wealth Display */}
            <div className="space-y-4">
              <h1 className="text-7xl md:text-8xl font-bold text-foreground financial-number">
                {dashboard?.totalNetWorth ? (
                  <CountUp
                    start={0}
                    end={dashboard.totalNetWorth}
                    duration={1.5}
                    separator=","
                    decimals={0}
                    formattingFn={(value) => formatINR(value)}
                  />
                ) : (
                  formatINR(0)
                )}
              </h1>

              {/* Year Performance */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3, duration: 0.3 }}
                className="flex items-center justify-center gap-2"
              >
                <TrendingUp 
                  className={`h-5 w-5 ${isPositive ? 'text-success' : 'text-destructive'}`} 
                />
                <span className={`text-xl ${isPositive ? 'text-success' : 'text-destructive'}`}>
                  {formatPercentage(ytdPercentage)} this year
                </span>
              </motion.div>
            </div>

            {/* CTA */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5, duration: 0.3 }}
            >
              <Link href="/portfolio">
                <Button size="lg" variant="outline" className="text-lg px-8">
                  View Details
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
            </motion.div>
          </motion.div>

          {/* Divider */}
          <div className="border-t border-border my-12" />

          {/* Quick Stats */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7, duration: 0.5 }}
            className="space-y-6"
          >
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Portfolio Health */}
              <Card className="p-6 space-y-2">
                <p className="text-sm text-muted-foreground">Portfolio Health</p>
                <p className="text-2xl font-semibold text-success">Excellent 🟢</p>
              </Card>

              {/* Asset Classes */}
              <Card className="p-6 space-y-2">
                <p className="text-sm text-muted-foreground">Asset Classes</p>
                <p className="text-2xl font-semibold text-foreground">
                  {Object.keys(dashboard?.assetClassBreakdown || {}).length || 0}
                </p>
              </Card>

              {/* Next Action */}
              <Card className="p-6 space-y-2">
                <p className="text-sm text-muted-foreground">Next Action</p>
                <Link href="/portfolio/add">
                  <Button variant="link" className="p-0 h-auto text-lg font-semibold">
                    Add Assets →
                  </Button>
                </Link>
              </Card>
            </div>
          </motion.div>
        </div>
      </main>
      
      {/* Portfolio Chatbot */}
      {isAuthenticated && <PortfolioChatbot />}
    </div>
  );
}
