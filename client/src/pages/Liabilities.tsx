import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { formatINR } from "@/lib/currency";
import { motion } from "framer-motion";
import { ArrowLeft, Plus, TrendingDown, CreditCard, Home, Car } from "lucide-react";
import { useLocation } from "wouter";

export default function Liabilities() {
  const [, setLocation] = useLocation();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    type: "mortgage" as const,
    name: "",
    lender: "",
    principalAmount: "",
    currentBalance: "",
    interestRate: "",
    monthlyPayment: "",
    startDate: "",
    maturityDate: "",
    collateral: "",
    notes: "",
  });

  const { data: liabilities, refetch } = trpc.liabilities.getAll.useQuery();
  const { data: payoffProjection } = trpc.liabilities.getPayoffProjection.useQuery();
  const { data: breakdown } = trpc.liabilities.getBreakdown.useQuery();
  
  const addLiability = trpc.liabilities.add.useMutation({
    onSuccess: () => {
      refetch();
      setIsAddDialogOpen(false);
      resetForm();
    },
  });

  const deleteLiability = trpc.liabilities.delete.useMutation({
    onSuccess: () => refetch(),
  });

  const resetForm = () => {
    setFormData({
      type: "mortgage",
      name: "",
      lender: "",
      principalAmount: "",
      currentBalance: "",
      interestRate: "",
      monthlyPayment: "",
      startDate: "",
      maturityDate: "",
      collateral: "",
      notes: "",
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    addLiability.mutate({
      type: formData.type,
      name: formData.name,
      lender: formData.lender || undefined,
      principalAmount: Math.round(parseFloat(formData.principalAmount) * 100),
      currentBalance: Math.round(parseFloat(formData.currentBalance) * 100),
      interestRate: Math.round(parseFloat(formData.interestRate) * 100), // Convert to basis points
      monthlyPayment: formData.monthlyPayment ? Math.round(parseFloat(formData.monthlyPayment) * 100) : undefined,
      startDate: formData.startDate || undefined,
      maturityDate: formData.maturityDate || undefined,
      collateral: formData.collateral || undefined,
      notes: formData.notes || undefined,
    });
  };

  const totalLiabilities = liabilities?.reduce((sum, l) => sum + l.currentBalance, 0) || 0;
  const totalMonthlyPayment = liabilities?.reduce((sum, l) => sum + (l.monthlyPayment || 0), 0) || 0;

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "mortgage": return <Home className="h-4 w-4" />;
      case "auto_loan": return <Car className="h-4 w-4" />;
      case "credit_card": return <CreditCard className="h-4 w-4" />;
      default: return <TrendingDown className="h-4 w-4" />;
    }
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
            <h1 className="text-2xl font-serif text-foreground">Liabilities & Debt</h1>
          </div>
          
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                Add Liability
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Add New Liability</DialogTitle>
                <DialogDescription>
                  Track your debts and loans for accurate net worth calculation
                </DialogDescription>
              </DialogHeader>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="type">Type</Label>
                    <Select
                      value={formData.type}
                      onValueChange={(value: any) => setFormData({ ...formData, type: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="mortgage">Mortgage</SelectItem>
                        <SelectItem value="personal_loan">Personal Loan</SelectItem>
                        <SelectItem value="auto_loan">Auto Loan</SelectItem>
                        <SelectItem value="credit_card">Credit Card</SelectItem>
                        <SelectItem value="student_loan">Student Loan</SelectItem>
                        <SelectItem value="business_loan">Business Loan</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label htmlFor="name">Name</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="e.g., Home Loan - Mumbai"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="lender">Lender</Label>
                    <Input
                      id="lender"
                      value={formData.lender}
                      onChange={(e) => setFormData({ ...formData, lender: e.target.value })}
                      placeholder="e.g., HDFC Bank"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="interestRate">Interest Rate (%)</Label>
                    <Input
                      id="interestRate"
                      type="number"
                      step="0.01"
                      value={formData.interestRate}
                      onChange={(e) => setFormData({ ...formData, interestRate: e.target.value })}
                      placeholder="e.g., 8.5"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="principalAmount">Original Amount (₹)</Label>
                    <Input
                      id="principalAmount"
                      type="number"
                      value={formData.principalAmount}
                      onChange={(e) => setFormData({ ...formData, principalAmount: e.target.value })}
                      placeholder="e.g., 5000000"
                      required
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="currentBalance">Current Balance (₹)</Label>
                    <Input
                      id="currentBalance"
                      type="number"
                      value={formData.currentBalance}
                      onChange={(e) => setFormData({ ...formData, currentBalance: e.target.value })}
                      placeholder="e.g., 4500000"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="monthlyPayment">Monthly Payment (₹)</Label>
                    <Input
                      id="monthlyPayment"
                      type="number"
                      value={formData.monthlyPayment}
                      onChange={(e) => setFormData({ ...formData, monthlyPayment: e.target.value })}
                      placeholder="e.g., 45000"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="collateral">Collateral</Label>
                    <Input
                      id="collateral"
                      value={formData.collateral}
                      onChange={(e) => setFormData({ ...formData, collateral: e.target.value })}
                      placeholder="e.g., Property - Mumbai"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="startDate">Start Date</Label>
                    <Input
                      id="startDate"
                      type="date"
                      value={formData.startDate}
                      onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="maturityDate">Maturity Date</Label>
                    <Input
                      id="maturityDate"
                      type="date"
                      value={formData.maturityDate}
                      onChange={(e) => setFormData({ ...formData, maturityDate: e.target.value })}
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="notes">Notes</Label>
                  <Input
                    id="notes"
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    placeholder="Additional notes..."
                  />
                </div>

                <div className="flex justify-end gap-2 pt-4">
                  <Button type="button" variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={addLiability.isPending}>
                    {addLiability.isPending ? "Adding..." : "Add Liability"}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
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
            <p className="text-sm text-muted-foreground mb-2">Total Liabilities</p>
            <p className="text-3xl font-bold text-destructive">{formatINR(totalLiabilities / 100)}</p>
            <p className="text-sm text-muted-foreground mt-1">{liabilities?.length || 0} active debts</p>
          </Card>

          <Card className="p-6">
            <p className="text-sm text-muted-foreground mb-2">Monthly Debt Service</p>
            <p className="text-3xl font-bold text-foreground">{formatINR(totalMonthlyPayment / 100)}</p>
            <p className="text-sm text-muted-foreground mt-1">Total monthly payments</p>
          </Card>

          <Card className="p-6">
            <p className="text-sm text-muted-foreground mb-2">Debt Types</p>
            <p className="text-3xl font-bold text-foreground">{breakdown?.length || 0}</p>
            <p className="text-sm text-muted-foreground mt-1">Different categories</p>
          </Card>
        </motion.div>

        {/* Liabilities Table */}
        <Card className="p-6 mb-8">
          <h2 className="text-xl font-serif mb-4">All Liabilities</h2>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Type</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Lender</TableHead>
                <TableHead className="text-right">Balance</TableHead>
                <TableHead className="text-right">Interest Rate</TableHead>
                <TableHead className="text-right">Monthly Payment</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {liabilities?.map((liability: any) => (
                <TableRow key={liability.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {getTypeIcon(liability.type)}
                      <span className="capitalize">{liability.type.replace("_", " ")}</span>
                    </div>
                  </TableCell>
                  <TableCell className="font-medium">{liability.name}</TableCell>
                  <TableCell>{liability.lender || "—"}</TableCell>
                  <TableCell className="text-right font-mono text-destructive">
                    {formatINR(liability.currentBalance / 100)}
                  </TableCell>
                  <TableCell className="text-right">{(liability.interestRate / 100).toFixed(2)}%</TableCell>
                  <TableCell className="text-right font-mono">
                    {liability.monthlyPayment ? formatINR(liability.monthlyPayment / 100) : "—"}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deleteLiability.mutate({ liabilityId: liability.id })}
                    >
                      Delete
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>

        {/* Payoff Projection */}
        {payoffProjection && payoffProjection.length > 0 && (
          <Card className="p-6">
            <h2 className="text-xl font-serif mb-4">Debt Payoff Projection</h2>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Liability</TableHead>
                  <TableHead className="text-right">Current Balance</TableHead>
                  <TableHead className="text-right">Monthly Payment</TableHead>
                  <TableHead className="text-right">Months to Payoff</TableHead>
                  <TableHead className="text-right">Total Interest</TableHead>
                  <TableHead className="text-right">Payoff Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {payoffProjection.map((proj: any) => (
                  <TableRow key={proj.liabilityId}>
                    <TableCell className="font-medium">{proj.name}</TableCell>
                    <TableCell className="text-right font-mono">
                      {formatINR(proj.currentBalance / 100)}
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      {formatINR(proj.monthlyPayment / 100)}
                    </TableCell>
                    <TableCell className="text-right">{proj.monthsToPayoff || "—"}</TableCell>
                    <TableCell className="text-right font-mono text-destructive">
                      {formatINR(proj.totalInterestPaid / 100)}
                    </TableCell>
                    <TableCell className="text-right">{proj.payoffDate}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        )}
      </div>
    </div>
  );
}
