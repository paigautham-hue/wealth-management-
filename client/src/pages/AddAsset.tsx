import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Loader2, CheckCircle } from "lucide-react";
import { Link, useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { getLoginUrl } from "@/const";

/**
 * AETHER V5 - Add Asset Page
 * Manual asset entry with validation
 */
export default function AddAsset() {
  const { isAuthenticated, loading: authLoading } = useAuth();
  const [, setLocation] = useLocation();
  const utils = trpc.useUtils();
  
  const [formData, setFormData] = useState({
    assetType: "stock" as const,
    assetName: "",
    ticker: "",
    quantity: "",
    purchasePrice: "",
    purchaseDate: new Date().toISOString().split('T')[0],
    currency: "INR",
    country: "India",
    sector: "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const addAssetMutation = trpc.portfolio.addAsset.useMutation({
    onSuccess: () => {
      toast.success("Asset added successfully!", {
        icon: <CheckCircle className="h-4 w-4" />,
      });
      
      // Invalidate queries to refresh data
      utils.portfolio.getAssets.invalidate();
      utils.portfolio.getDashboard.invalidate();
      
      // Navigate to portfolio
      setTimeout(() => {
        setLocation("/portfolio");
      }, 1000);
    },
    onError: (error) => {
      toast.error(error.message || "Failed to add asset");
    },
  });

  // Redirect to login if not authenticated
  if (!authLoading && !isAuthenticated) {
    window.location.href = getLoginUrl();
    return null;
  }

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.assetName.trim()) {
      newErrors.assetName = "Asset name is required";
    }
    
    const quantity = parseFloat(formData.quantity);
    if (!formData.quantity || isNaN(quantity) || quantity <= 0) {
      newErrors.quantity = "Quantity must be a positive number";
    }
    
    const price = parseFloat(formData.purchasePrice);
    if (!formData.purchasePrice || isNaN(price) || price <= 0) {
      newErrors.purchasePrice = "Purchase price must be a positive number";
    }

    if (!formData.purchaseDate) {
      newErrors.purchaseDate = "Purchase date is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast.error("Please fix the errors in the form");
      return;
    }

    addAssetMutation.mutate({
      assetType: formData.assetType,
      assetName: formData.assetName.trim(),
      ticker: formData.ticker.trim() || undefined,
      quantity: parseFloat(formData.quantity),
      purchasePrice: parseFloat(formData.purchasePrice),
      purchaseDate: new Date(formData.purchaseDate),
      currency: formData.currency,
      country: formData.country || undefined,
      sector: formData.sector.trim() || undefined,
    });
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="container py-4 flex items-center gap-4">
          <Link href="/portfolio">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Portfolio
            </Button>
          </Link>
          <h1 className="text-2xl font-bold text-foreground">Add Asset</h1>
        </div>
      </header>

      {/* Main Content */}
      <main className="container section-padding">
        <div className="max-w-2xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Card className="card-padding">
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Asset Type */}
                <div className="space-y-2">
                  <Label htmlFor="assetType">Asset Type *</Label>
                  <Select
                    value={formData.assetType}
                    onValueChange={(value: any) => setFormData({ ...formData, assetType: value })}
                  >
                    <SelectTrigger id="assetType">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="stock">Stock</SelectItem>
                      <SelectItem value="bond">Bond</SelectItem>
                      <SelectItem value="mutual_fund">Mutual Fund</SelectItem>
                      <SelectItem value="real_estate">Real Estate</SelectItem>
                      <SelectItem value="alternative">Alternative Investment</SelectItem>
                      <SelectItem value="cash">Cash & Equivalents</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Asset Name */}
                <div className="space-y-2">
                  <Label htmlFor="assetName">Asset Name *</Label>
                  <Input
                    id="assetName"
                    placeholder="e.g., HDFC Bank, Apple Inc."
                    value={formData.assetName}
                    onChange={(e) => setFormData({ ...formData, assetName: e.target.value })}
                  />
                  {errors.assetName && (
                    <p className="text-sm text-destructive">{errors.assetName}</p>
                  )}
                </div>

                {/* Ticker */}
                <div className="space-y-2">
                  <Label htmlFor="ticker">Ticker Symbol (Optional)</Label>
                  <Input
                    id="ticker"
                    placeholder="e.g., HDFCBANK, AAPL"
                    value={formData.ticker}
                    onChange={(e) => setFormData({ ...formData, ticker: e.target.value.toUpperCase() })}
                  />
                </div>

                {/* Quantity and Price */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="quantity">Quantity *</Label>
                    <Input
                      id="quantity"
                      type="number"
                      step="0.01"
                      placeholder="e.g., 100"
                      value={formData.quantity}
                      onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                    />
                    {errors.quantity && (
                      <p className="text-sm text-destructive">{errors.quantity}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="purchasePrice">Purchase Price *</Label>
                    <Input
                      id="purchasePrice"
                      type="number"
                      step="0.01"
                      placeholder="e.g., 1500"
                      value={formData.purchasePrice}
                      onChange={(e) => setFormData({ ...formData, purchasePrice: e.target.value })}
                    />
                    {errors.purchasePrice && (
                      <p className="text-sm text-destructive">{errors.purchasePrice}</p>
                    )}
                  </div>
                </div>

                {/* Purchase Date */}
                <div className="space-y-2">
                  <Label htmlFor="purchaseDate">Purchase Date *</Label>
                  <Input
                    id="purchaseDate"
                    type="date"
                    value={formData.purchaseDate}
                    onChange={(e) => setFormData({ ...formData, purchaseDate: e.target.value })}
                  />
                  {errors.purchaseDate && (
                    <p className="text-sm text-destructive">{errors.purchaseDate}</p>
                  )}
                </div>

                {/* Currency and Country */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="currency">Currency</Label>
                    <Select
                      value={formData.currency}
                      onValueChange={(value) => setFormData({ ...formData, currency: value })}
                    >
                      <SelectTrigger id="currency">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="INR">INR (₹)</SelectItem>
                        <SelectItem value="USD">USD ($)</SelectItem>
                        <SelectItem value="EUR">EUR (€)</SelectItem>
                        <SelectItem value="GBP">GBP (£)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="country">Country</Label>
                    <Input
                      id="country"
                      placeholder="e.g., India, USA"
                      value={formData.country}
                      onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                    />
                  </div>
                </div>

                {/* Sector */}
                <div className="space-y-2">
                  <Label htmlFor="sector">Sector (Optional)</Label>
                  <Input
                    id="sector"
                    placeholder="e.g., Banking, Technology"
                    value={formData.sector}
                    onChange={(e) => setFormData({ ...formData, sector: e.target.value })}
                  />
                </div>

                {/* Submit Button */}
                <div className="flex gap-4 pt-4">
                  <Link href="/portfolio" className="flex-1">
                    <Button type="button" variant="outline" className="w-full">
                      Cancel
                    </Button>
                  </Link>
                  <Button 
                    type="submit" 
                    className="flex-1"
                    disabled={addAssetMutation.isPending}
                  >
                    {addAssetMutation.isPending ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Adding...
                      </>
                    ) : (
                      "Add Asset"
                    )}
                  </Button>
                </div>
              </form>
            </Card>
          </motion.div>
        </div>
      </main>
    </div>
  );
}
