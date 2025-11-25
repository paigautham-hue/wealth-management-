import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { formatINR } from "@/lib/currency";
import { motion } from "framer-motion";
import { ArrowLeft, TrendingDown, AlertTriangle, CheckCircle2 } from "lucide-react";
import { useLocation } from "wouter";

export default function TaxOptimizer() {
  const [, setLocation] = useLocation();
  const [selectedAssets, setSelectedAssets] = useState<number[]>([]);

  // Mock data for demonstration - in production, this would come from trpc
  const opportunities = [
    {
      id: 1,
      assetName: "Paytm",
      symbol: "PAYTM.NS",
      quantity: 100,
      purchasePrice: 150000,
      currentPrice: 45000,
      unrealizedLoss: -105000,
      taxSavings: 31500, // 30% STCG
      priority: "high" as const,
      replacementSuggestions: ["Zomato", "Swiggy (IPO)", "Nykaa"],
      washSaleRisk: false,
    },
    {
      id: 2,
      assetName: "Zomato",
      symbol: "ZOMATO.NS",
      quantity: 200,
      purchasePrice: 30000,
      currentPrice: 22000,
      unrealizedLoss: -8000,
      taxSavings: 2400,
      priority: "medium" as const,
      replacementSuggestions: ["Swiggy (IPO)", "Blinkit (via Zomato)"],
      washSaleRisk: false,
    },
    {
      id: 3,
      assetName: "HDFC Bank",
      symbol: "HDFCBANK.NS",
      quantity: 50,
      purchasePrice: 85000,
      currentPrice: 80000,
      unrealizedLoss: -5000,
      taxSavings: 500, // 10% LTCG
      priority: "low" as const,
      replacementSuggestions: ["ICICI Bank", "Kotak Mahindra Bank"],
      washSaleRisk: false,
    },
  ];

  const totalPotentialSavings = opportunities.reduce((sum, opp) => sum + opp.taxSavings, 0);
  const selectedSavings = opportunities
    .filter(opp => selectedAssets.includes(opp.id))
    .reduce((sum, opp) => sum + opp.taxSavings, 0);

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case "high":
        return <Badge variant="destructive">High Priority</Badge>;
      case "medium":
        return <Badge variant="default">Medium Priority</Badge>;
      case "low":
        return <Badge variant="secondary">Low Priority</Badge>;
      default:
        return null;
    }
  };

  const toggleAsset = (id: number) => {
    setSelectedAssets(prev =>
      prev.includes(id) ? prev.filter(assetId => assetId !== id) : [...prev, id]
    );
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setLocation("/")}
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-2xl font-serif text-foreground">Tax Optimizer</h1>
          </div>
          
          <Button 
            className="gap-2"
            disabled={selectedAssets.length === 0}
          >
            <CheckCircle2 className="h-4 w-4" />
            Execute Selected ({selectedAssets.length})
          </Button>
        </div>
      </header>

      <div className="container mx-auto px-6 py-8">
        {/* Summary Cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8"
        >
          <Card className="p-6">
            <p className="text-sm text-muted-foreground mb-2">Total Potential Savings</p>
            <p className="text-3xl font-bold text-green-600">{formatINR(totalPotentialSavings)}</p>
            <p className="text-sm text-muted-foreground mt-1">{opportunities.length} opportunities</p>
          </Card>

          <Card className="p-6">
            <p className="text-sm text-muted-foreground mb-2">Selected Savings</p>
            <p className="text-3xl font-bold text-foreground">{formatINR(selectedSavings)}</p>
            <p className="text-sm text-muted-foreground mt-1">{selectedAssets.length} selected</p>
          </Card>

          <Card className="p-6">
            <p className="text-sm text-muted-foreground mb-2">Tax Year</p>
            <p className="text-3xl font-bold text-foreground">FY 2024-25</p>
            <p className="text-sm text-muted-foreground mt-1">Ending Mar 31, 2025</p>
          </Card>
        </motion.div>

        {/* Info Banner */}
        <Card className="p-4 mb-6 bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5" />
            <div>
              <p className="font-medium text-blue-900 dark:text-blue-100">Tax Loss Harvesting Strategy</p>
              <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                Sell losing positions to offset capital gains. AI suggests replacement assets to avoid wash sale rules (30-day period).
                STCG tax: 30% | LTCG tax: 10% above ₹1L
              </p>
            </div>
          </div>
        </Card>

        {/* Opportunities Table */}
        <Card className="p-6">
          <h2 className="text-xl font-serif mb-4">Loss Harvesting Opportunities</h2>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12"></TableHead>
                <TableHead>Asset</TableHead>
                <TableHead>Priority</TableHead>
                <TableHead className="text-right">Purchase Price</TableHead>
                <TableHead className="text-right">Current Price</TableHead>
                <TableHead className="text-right">Unrealized Loss</TableHead>
                <TableHead className="text-right">Tax Savings</TableHead>
                <TableHead>Replacement Suggestions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {opportunities.map((opp) => (
                <TableRow key={opp.id} className={selectedAssets.includes(opp.id) ? "bg-accent/50" : ""}>
                  <TableCell>
                    <input
                      type="checkbox"
                      checked={selectedAssets.includes(opp.id)}
                      onChange={() => toggleAsset(opp.id)}
                      className="h-4 w-4 rounded border-gray-300"
                    />
                  </TableCell>
                  <TableCell>
                    <div>
                      <p className="font-medium">{opp.assetName}</p>
                      <p className="text-sm text-muted-foreground">{opp.symbol}</p>
                      <p className="text-xs text-muted-foreground">{opp.quantity} shares</p>
                    </div>
                  </TableCell>
                  <TableCell>{getPriorityBadge(opp.priority)}</TableCell>
                  <TableCell className="text-right font-mono">{formatINR(opp.purchasePrice)}</TableCell>
                  <TableCell className="text-right font-mono">{formatINR(opp.currentPrice)}</TableCell>
                  <TableCell className="text-right font-mono text-destructive flex items-center justify-end gap-1">
                    <TrendingDown className="h-4 w-4" />
                    {formatINR(opp.unrealizedLoss)}
                  </TableCell>
                  <TableCell className="text-right font-mono font-bold text-green-600">
                    {formatINR(opp.taxSavings)}
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {opp.replacementSuggestions.map((suggestion, idx) => (
                        <Badge key={idx} variant="outline" className="text-xs">
                          {suggestion}
                        </Badge>
                      ))}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>

        {/* Execution Plan */}
        {selectedAssets.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-6"
          >
            <Card className="p-6">
              <h2 className="text-xl font-serif mb-4">Execution Plan</h2>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Total Tax Savings</span>
                  <span className="text-2xl font-bold text-green-600">{formatINR(selectedSavings)}</span>
                </div>
                <div className="border-t border-border pt-4">
                  <h3 className="font-medium mb-2">Steps:</h3>
                  <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground">
                    <li>Sell selected positions to realize losses</li>
                    <li>Wait 30 days to avoid wash sale (or buy replacement assets immediately)</li>
                    <li>Use losses to offset capital gains from profitable positions</li>
                    <li>Carry forward excess losses to future years if needed</li>
                  </ol>
                </div>
                <div className="flex gap-2 pt-4">
                  <Button className="flex-1">Generate Trade Orders</Button>
                  <Button variant="outline" className="flex-1">Download Tax Report</Button>
                </div>
              </div>
            </Card>
          </motion.div>
        )}
      </div>
    </div>
  );
}
