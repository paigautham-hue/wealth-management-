import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { ArrowLeft, Plus, Loader2, AlertTriangle } from "lucide-react";
import { Link } from "wouter";
import { trpc } from "@/lib/trpc";
import { formatUSD, formatDate } from "@/lib/currency";
import { motion } from "framer-motion";
import { getLoginUrl } from "@/const";

/**
 * AETHER V5 - LRS Tracking Page
 * India-specific Liberalised Remittance Scheme tracking
 */
export default function LRS() {
  const { isAuthenticated, loading: authLoading } = useAuth();
  
  const { data: usage, isLoading: usageLoading } = trpc.lrs.getUsage.useQuery(undefined, {
    enabled: isAuthenticated,
  });
  
  const { data: transactions, isLoading: transactionsLoading } = trpc.lrs.getTransactions.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  // Redirect to login if not authenticated
  if (!authLoading && !isAuthenticated) {
    window.location.href = getLoginUrl();
    return null;
  }

  // Loading state
  if (authLoading || usageLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto" />
          <p className="text-muted-foreground">Loading LRS data...</p>
        </div>
      </div>
    );
  }

  const isApproachingLimit = (usage?.percentage || 0) > 80;

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
            <h1 className="text-2xl font-bold text-foreground">LRS Tracking</h1>
          </div>
          <Link href="/lrs/add">
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Transaction
            </Button>
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="container section-padding">
        <div className="max-w-4xl mx-auto space-y-8">
          {/* LRS Usage Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Card className="card-padding">
              <div className="space-y-6">
                {/* Header */}
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <h2 className="text-2xl font-bold text-foreground">
                      Fiscal Year {usage?.fiscalYearStart ? new Date(usage.fiscalYearStart).getFullYear() : new Date().getFullYear()}
                    </h2>
                    <p className="text-sm text-muted-foreground">
                      April 1 - March 31
                    </p>
                  </div>
                  {isApproachingLimit && (
                    <div className="flex items-center gap-2 text-warning">
                      <AlertTriangle className="h-5 w-5" />
                      <span className="text-sm font-medium">Approaching Limit</span>
                    </div>
                  )}
                </div>

                {/* Usage Stats */}
                <div className="space-y-4">
                  <div className="flex items-end justify-between">
                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground">Used</p>
                      <p className="text-4xl font-bold text-foreground financial-number">
                        {formatUSD(usage?.used || 0)}
                      </p>
                    </div>
                    <div className="space-y-1 text-right">
                      <p className="text-sm text-muted-foreground">Remaining</p>
                      <p className="text-4xl font-bold text-success financial-number">
                        {formatUSD(usage?.remaining || 0)}
                      </p>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="space-y-2">
                    <Progress 
                      value={usage?.percentage || 0} 
                      className="h-3"
                    />
                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                      <span>{(usage?.percentage || 0).toFixed(1)}% used</span>
                      <span>Limit: {formatUSD(usage?.limit || 250000)}</span>
                    </div>
                  </div>
                </div>

                {/* Info */}
                <div className="pt-4 border-t border-border">
                  <p className="text-sm text-muted-foreground">
                    The Liberalised Remittance Scheme (LRS) allows Indian residents to remit up to USD 250,000 per financial year for permitted current or capital account transactions.
                  </p>
                </div>
              </div>
            </Card>
          </motion.div>

          {/* Transactions List */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="space-y-4"
          >
            <h2 className="text-2xl font-bold text-foreground">Transactions</h2>

            {transactionsLoading ? (
              <Card className="p-8 text-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
              </Card>
            ) : !transactions || transactions.length === 0 ? (
              <Card className="p-8 text-center space-y-4">
                <p className="text-muted-foreground">No transactions yet</p>
                <Link href="/lrs/add">
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Your First Transaction
                  </Button>
                </Link>
              </Card>
            ) : (
              <div className="space-y-3">
                {transactions.map((transaction, index) => (
                  <motion.div
                    key={transaction.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05, duration: 0.3 }}
                  >
                    <Card className="p-6">
                      <div className="flex items-start justify-between">
                        <div className="space-y-2 flex-1">
                          <div className="flex items-center gap-3">
                            <h3 className="text-lg font-semibold text-foreground">
                              {transaction.purpose}
                            </h3>
                            <span className="text-sm text-muted-foreground">
                              {formatDate(transaction.transactionDate)}
                            </span>
                          </div>
                          {transaction.description && (
                            <p className="text-sm text-muted-foreground">
                              {transaction.description}
                            </p>
                          )}
                        </div>
                        <p className="text-xl font-bold text-foreground financial-number">
                          {formatUSD(transaction.amountUsd)}
                        </p>
                      </div>
                    </Card>
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>
        </div>
      </main>
    </div>
  );
}
