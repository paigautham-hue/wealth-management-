import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowLeft, Plus, TrendingUp, Lock, Unlock } from "lucide-react";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import { formatINR } from "@/lib/currency";

type InvestmentType = "private_equity" | "real_estate" | "crypto" | "art" | "luxury";
type LiquidityStatus = "liquid" | "illiquid" | "partially_liquid";

interface AlternativeInvestment {
  id: number;
  name: string;
  type: InvestmentType;
  investedAmount: number;
  currentValue: number;
  quantity: number;
  unit: string;
  liquidityStatus: LiquidityStatus;
  lockupPeriod?: string;
  lastValuation: string;
  notes: string;
}

export default function AlternativeInvestments() {
  const [, setLocation] = useLocation();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);

  // Mock data
  const investments: AlternativeInvestment[] = [
    {
      id: 1,
      name: "Sequoia India Fund IV",
      type: "private_equity",
      investedAmount: 5000000,
      currentValue: 7500000,
      quantity: 50,
      unit: "units",
      liquidityStatus: "illiquid",
      lockupPeriod: "5 years (2 years remaining)",
      lastValuation: "2024-12-01",
      notes: "Tier-1 VC fund with strong track record",
    },
    {
      id: 2,
      name: "Bitcoin",
      type: "crypto",
      investedAmount: 2000000,
      currentValue: 3500000,
      quantity: 1.5,
      unit: "BTC",
      liquidityStatus: "liquid",
      lastValuation: "2024-12-25",
      notes: "Cold storage in Ledger Nano X",
    },
    {
      id: 3,
      name: "Gurgaon Commercial Property",
      type: "real_estate",
      investedAmount: 15000000,
      currentValue: 22000000,
      quantity: 2500,
      unit: "sq ft",
      liquidityStatus: "illiquid",
      lastValuation: "2024-11-15",
      notes: "Sector 44, generating ₹2.5L/month rental income",
    },
    {
      id: 4,
      name: "MF Husain Original Painting",
      type: "art",
      investedAmount: 3000000,
      currentValue: 4500000,
      quantity: 1,
      unit: "piece",
      liquidityStatus: "partially_liquid",
      lastValuation: "2024-10-01",
      notes: "Authenticated by Sotheby's, insured for ₹5Cr",
    },
    {
      id: 5,
      name: "Rolex Daytona 116500LN",
      type: "luxury",
      investedAmount: 1500000,
      currentValue: 2200000,
      quantity: 1,
      unit: "piece",
      liquidityStatus: "liquid",
      lastValuation: "2024-12-20",
      notes: "White dial, box and papers, purchased 2020",
    },
  ];

  const getTypeLabel = (type: InvestmentType) => {
    const labels = {
      private_equity: "Private Equity",
      real_estate: "Real Estate",
      crypto: "Cryptocurrency",
      art: "Art & Collectibles",
      luxury: "Luxury Assets",
    };
    return labels[type];
  };

  const getTypeColor = (type: InvestmentType) => {
    const colors = {
      private_equity: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
      real_estate: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
      crypto: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
      art: "bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200",
      luxury: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
    };
    return colors[type];
  };

  const getLiquidityBadge = (status: LiquidityStatus) => {
    switch (status) {
      case "liquid":
        return (
          <Badge variant="outline" className="gap-1">
            <Unlock className="h-3 w-3" />
            Liquid
          </Badge>
        );
      case "illiquid":
        return (
          <Badge variant="destructive" className="gap-1">
            <Lock className="h-3 w-3" />
            Illiquid
          </Badge>
        );
      case "partially_liquid":
        return (
          <Badge variant="secondary" className="gap-1">
            <Lock className="h-3 w-3" />
            Partially Liquid
          </Badge>
        );
    }
  };

  const totalInvested = investments.reduce((sum, inv) => sum + inv.investedAmount, 0);
  const totalCurrent = investments.reduce((sum, inv) => sum + inv.currentValue, 0);
  const totalGain = totalCurrent - totalInvested;
  const totalGainPercent = ((totalGain / totalInvested) * 100).toFixed(2);

  // Group by type
  const groupedByType = investments.reduce((acc, inv) => {
    if (!acc[inv.type]) acc[inv.type] = [];
    acc[inv.type].push(inv);
    return acc;
  }, {} as Record<InvestmentType, AlternativeInvestment[]>);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => setLocation("/")}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-2xl font-serif text-foreground">Alternative Investments</h1>
          </div>

          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                Add Investment
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Add Alternative Investment</DialogTitle>
                <DialogDescription>
                  Track private equity, real estate, crypto, art, or luxury assets
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Investment Name</Label>
                    <Input id="name" placeholder="e.g., Sequoia Fund IV" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="type">Type</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="private_equity">Private Equity</SelectItem>
                        <SelectItem value="real_estate">Real Estate</SelectItem>
                        <SelectItem value="crypto">Cryptocurrency</SelectItem>
                        <SelectItem value="art">Art & Collectibles</SelectItem>
                        <SelectItem value="luxury">Luxury Assets</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="invested">Invested Amount (₹)</Label>
                    <Input id="invested" type="number" placeholder="5000000" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="current">Current Value (₹)</Label>
                    <Input id="current" type="number" placeholder="7500000" />
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="quantity">Quantity</Label>
                    <Input id="quantity" type="number" placeholder="50" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="unit">Unit</Label>
                    <Input id="unit" placeholder="units, BTC, sq ft" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="liquidity">Liquidity</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="liquid">Liquid</SelectItem>
                        <SelectItem value="illiquid">Illiquid</SelectItem>
                        <SelectItem value="partially_liquid">Partially Liquid</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="notes">Notes</Label>
                  <Input id="notes" placeholder="Additional details..." />
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={() => setIsAddDialogOpen(false)}>Add Investment</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </header>

      <div className="container mx-auto px-6 py-8">
        {/* Summary Cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8"
        >
          <Card className="p-6">
            <p className="text-sm text-muted-foreground mb-2">Total Invested</p>
            <p className="text-2xl font-bold text-foreground">{formatINR(totalInvested)}</p>
          </Card>

          <Card className="p-6">
            <p className="text-sm text-muted-foreground mb-2">Current Value</p>
            <p className="text-2xl font-bold text-foreground">{formatINR(totalCurrent)}</p>
          </Card>

          <Card className="p-6">
            <p className="text-sm text-muted-foreground mb-2">Total Gain</p>
            <p className="text-2xl font-bold text-green-600 flex items-center gap-1">
              <TrendingUp className="h-5 w-5" />
              {formatINR(totalGain)}
            </p>
          </Card>

          <Card className="p-6">
            <p className="text-sm text-muted-foreground mb-2">Return</p>
            <p className="text-2xl font-bold text-green-600">+{totalGainPercent}%</p>
          </Card>
        </motion.div>

        {/* Investments Table */}
        <Card className="p-6">
          <h2 className="text-xl font-serif mb-4">All Investments</h2>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Type</TableHead>
                <TableHead className="text-right">Invested</TableHead>
                <TableHead className="text-right">Current Value</TableHead>
                <TableHead className="text-right">Gain/Loss</TableHead>
                <TableHead>Quantity</TableHead>
                <TableHead>Liquidity</TableHead>
                <TableHead>Last Valuation</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {investments.map((inv) => {
                const gain = inv.currentValue - inv.investedAmount;
                const gainPercent = ((gain / inv.investedAmount) * 100).toFixed(2);
                const isPositive = gain >= 0;

                return (
                  <TableRow key={inv.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{inv.name}</p>
                        {inv.lockupPeriod && (
                          <p className="text-xs text-muted-foreground">🔒 {inv.lockupPeriod}</p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={getTypeColor(inv.type)}>{getTypeLabel(inv.type)}</Badge>
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      {formatINR(inv.investedAmount)}
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      {formatINR(inv.currentValue)}
                    </TableCell>
                    <TableCell className={`text-right font-mono ${isPositive ? "text-green-600" : "text-red-600"}`}>
                      {isPositive ? "+" : ""}
                      {formatINR(gain)} ({isPositive ? "+" : ""}
                      {gainPercent}%)
                    </TableCell>
                    <TableCell>
                      {inv.quantity} {inv.unit}
                    </TableCell>
                    <TableCell>{getLiquidityBadge(inv.liquidityStatus)}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {new Date(inv.lastValuation).toLocaleDateString("en-IN")}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </Card>

        {/* Breakdown by Type */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
          {Object.entries(groupedByType).map(([type, invs]) => {
            const typeTotal = invs.reduce((sum, inv) => sum + inv.currentValue, 0);
            return (
              <Card key={type} className="p-6">
                <h3 className="font-serif text-lg mb-4">{getTypeLabel(type as InvestmentType)}</h3>
                <p className="text-3xl font-bold mb-2">{formatINR(typeTotal)}</p>
                <p className="text-sm text-muted-foreground">{invs.length} investment{invs.length > 1 ? "s" : ""}</p>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}
