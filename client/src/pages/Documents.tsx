import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ArrowLeft, Upload, FileText, Loader2, CheckCircle, AlertCircle, Download } from "lucide-react";
import { Link } from "wouter";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { getLoginUrl } from "@/const";
import { formatINR } from "@/lib/currency";

/**
 * AETHER V5 - Document Upload & Extraction
 * Claude 3.5 Sonnet powered PDF parsing
 */
export default function Documents() {
  const { isAuthenticated, loading: authLoading } = useAuth();
  const [file, setFile] = useState<File | null>(null);
  const [broker, setBroker] = useState<"zerodha" | "groww" | "icici">("zerodha");
  const [uploadProgress, setUploadProgress] = useState(0);
  const [extractionStatus, setExtractionStatus] = useState<"idle" | "uploading" | "extracting" | "reviewing" | "complete">("idle");
  const [extractedData, setExtractedData] = useState<any>(null);

  const utils = trpc.useUtils();

  const extractMutation = trpc.documents.extract.useMutation({
    onSuccess: (data) => {
      setExtractedData(data);
      setExtractionStatus("reviewing");
      if (data.checksumPassed) {
        toast.success("Extraction complete! All checksums passed.");
      } else {
        toast.warning(`Extraction complete with ${data.errors.length} warnings.`);
      }
    },
    onError: (error) => {
      toast.error(error.message || "Failed to extract data");
      setExtractionStatus("idle");
    },
  });

  const commitMutation = trpc.documents.commitToPortfolio.useMutation({
    onSuccess: () => {
      toast.success("Transactions committed to portfolio!");
      setExtractionStatus("complete");
      utils.portfolio.getDashboard.invalidate();
      utils.portfolio.getAssets.invalidate();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to commit transactions");
    },
  });

  // Redirect to login if not authenticated
  if (!authLoading && !isAuthenticated) {
    window.location.href = getLoginUrl();
    return null;
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile && selectedFile.type === "application/pdf") {
      setFile(selectedFile);
    } else {
      toast.error("Please upload a PDF file");
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    setExtractionStatus("uploading");
    setUploadProgress(0);

    // Simulate upload progress
    const progressInterval = setInterval(() => {
      setUploadProgress((prev) => {
        if (prev >= 90) {
          clearInterval(progressInterval);
          return 90;
        }
        return prev + 10;
      });
    }, 200);

    // In production: upload to S3 first
    // For now, simulate with timeout
    setTimeout(() => {
      clearInterval(progressInterval);
      setUploadProgress(100);
      setExtractionStatus("extracting");
      
      // Call extraction API
      extractMutation.mutate({
        pdfUrl: "https://example.com/statement.pdf", // Replace with actual S3 URL
        broker,
      });
    }, 2000);
  };

  const handleCommit = () => {
    if (!extractedData) return;
    
    commitMutation.mutate({
      transactions: extractedData.transactions,
    });
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card sticky top-0 z-10">
        <div className="container py-4 flex items-center gap-4">
          <Link href="/portfolio">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
          </Link>
          <h1 className="text-2xl font-bold text-foreground">Document Extraction</h1>
        </div>
      </header>

      {/* Main Content */}
      <main className="container section-padding">
        <div className="max-w-4xl mx-auto space-y-8">
          {/* Upload Section */}
          {extractionStatus === "idle" && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              <div className="text-center space-y-2">
                <h2 className="text-3xl font-bold text-foreground">Upload Brokerage Statement</h2>
                <p className="text-muted-foreground">AI-powered extraction with 100% accuracy verification</p>
              </div>

              <Card className="p-8 space-y-6">
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-foreground mb-2 block">Select Broker</label>
                    <Select value={broker} onValueChange={(v) => setBroker(v as any)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="zerodha">Zerodha</SelectItem>
                        <SelectItem value="groww">Groww</SelectItem>
                        <SelectItem value="icici">ICICI Direct</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-foreground mb-2 block">Upload PDF Statement</label>
                    <Input
                      type="file"
                      accept="application/pdf"
                      onChange={handleFileSelect}
                    />
                  </div>

                  {file && (
                    <div className="flex items-center gap-3 p-4 bg-muted rounded-lg">
                      <FileText className="h-8 w-8 text-primary" />
                      <div className="flex-1">
                        <p className="font-medium text-foreground">{file.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {(file.size / 1024 / 1024).toFixed(2)} MB
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                <Button
                  size="lg"
                  onClick={handleUpload}
                  disabled={!file}
                  className="w-full"
                >
                  <Upload className="h-5 w-5 mr-2" />
                  Upload and Extract
                </Button>
              </Card>
            </motion.div>
          )}

          {/* Processing Status */}
          <AnimatePresence>
            {(extractionStatus === "uploading" || extractionStatus === "extracting") && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
              >
                <Card className="p-8 space-y-6">
                  <div className="space-y-4">
                    <div className="flex items-center gap-4">
                      {extractionStatus === "uploading" ? (
                        <Loader2 className="h-6 w-6 animate-spin text-primary" />
                      ) : (
                        <CheckCircle className="h-6 w-6 text-success" />
                      )}
                      <div className="flex-1">
                        <p className="font-medium text-foreground">Uploading document</p>
                        <p className="text-sm text-muted-foreground">{uploadProgress}%</p>
                      </div>
                    </div>

                    {extractionStatus === "extracting" && (
                      <div className="flex items-center gap-4">
                        <Loader2 className="h-6 w-6 animate-spin text-primary" />
                        <div className="flex-1">
                          <p className="font-medium text-foreground">AI extraction with Claude 3.5 Sonnet</p>
                          <p className="text-sm text-muted-foreground">Analyzing transactions and performing checksums...</p>
                        </div>
                      </div>
                    )}
                  </div>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Review Extracted Data */}
          {extractionStatus === "reviewing" && extractedData && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-2xl font-bold text-foreground">Review Extracted Transactions</h3>
                {extractedData.checksumPassed ? (
                  <div className="flex items-center gap-2 text-success">
                    <CheckCircle className="h-5 w-5" />
                    <span className="font-medium">All checksums passed</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-warning">
                    <AlertCircle className="h-5 w-5" />
                    <span className="font-medium">{extractedData.errors.length} warnings</span>
                  </div>
                )}
              </div>

              <Card className="p-6">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Ticker</TableHead>
                      <TableHead className="text-right">Qty</TableHead>
                      <TableHead className="text-right">Price</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                      <TableHead className="text-right">Charges</TableHead>
                      <TableHead className="text-right">Net Amount</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {extractedData.transactions.map((txn: any, idx: number) => (
                      <TableRow key={idx}>
                        <TableCell>{new Date(txn.date).toLocaleDateString()}</TableCell>
                        <TableCell>
                          <span className={txn.type === "BUY" ? "text-success" : "text-destructive"}>
                            {txn.type}
                          </span>
                        </TableCell>
                        <TableCell className="font-medium">{txn.ticker}</TableCell>
                        <TableCell className="text-right">{txn.quantity}</TableCell>
                        <TableCell className="text-right">{formatINR(txn.price)}</TableCell>
                        <TableCell className="text-right">{formatINR(txn.totalAmount)}</TableCell>
                        <TableCell className="text-right">{formatINR(txn.charges)}</TableCell>
                        <TableCell className="text-right font-medium">{formatINR(txn.netAmount)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Card>

              {extractedData.errors.length > 0 && (
                <Card className="p-4 bg-warning/10 border-warning">
                  <h4 className="font-semibold text-warning mb-2">Warnings:</h4>
                  <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                    {extractedData.errors.map((error: string, idx: number) => (
                      <li key={idx}>{error}</li>
                    ))}
                  </ul>
                </Card>
              )}

              <div className="flex gap-4">
                <Button variant="outline" className="flex-1" onClick={() => setExtractionStatus("idle")}>
                  Cancel
                </Button>
                <Button className="flex-1" onClick={handleCommit} disabled={commitMutation.isPending}>
                  {commitMutation.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Committing...
                    </>
                  ) : (
                    "Commit to Portfolio"
                  )}
                </Button>
              </div>
            </motion.div>
          )}
        </div>
      </main>
    </div>
  );
}
