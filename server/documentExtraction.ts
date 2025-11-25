/**
 * AETHER V5 - Document Extraction Service
 * Claude 3.5 Sonnet powered PDF parsing for brokerage statements
 */

interface ExtractedTransaction {
  date: string;
  type: "BUY" | "SELL";
  ticker: string;
  quantity: number;
  price: number;
  totalAmount: number;
  charges: number;
  netAmount: number;
}

interface ExtractionResult {
  success: boolean;
  transactions: ExtractedTransaction[];
  totalBuy: number;
  totalSell: number;
  netCashFlow: number;
  checksumPassed: boolean;
  errors: string[];
}

/**
 * Extract transactions from brokerage statement PDF using Claude 3.5 Sonnet
 * Supports: Zerodha, Groww, ICICI Direct
 */
export async function extractTransactionsFromPDF(
  pdfUrl: string,
  broker: "zerodha" | "groww" | "icici"
): Promise<ExtractionResult> {
  try {
    // Check if ANTHROPIC_API_KEY is available
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      console.warn("ANTHROPIC_API_KEY not found, using mock extraction");
      return getMockExtractionResult();
    }

    // Import Anthropic SDK
    const Anthropic = (await import("@anthropic-ai/sdk")).default;
    const client = new Anthropic({ apiKey });

    // Prepare extraction prompt based on broker
    const prompt = getBrokerSpecificPrompt(broker);

    // Call Claude API with PDF
    const response = await client.messages.create({
      model: "claude-3-5-sonnet-20241022",
      max_tokens: 4096,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "document",
              source: {
                type: "url",
                url: pdfUrl,
              },
            },
            {
              type: "text",
              text: prompt,
            },
          ],
        },
      ],
    });

    // Parse Claude's response
    const content = response.content[0];
    if (content.type !== "text") {
      throw new Error("Unexpected response type from Claude");
    }

    const extractedData = JSON.parse(content.text);
    
    // Validate and perform math checksum
    const validationResult = validateExtraction(extractedData);
    
    return validationResult;
  } catch (error) {
    console.error("Document extraction error:", error);
    return {
      success: false,
      transactions: [],
      totalBuy: 0,
      totalSell: 0,
      netCashFlow: 0,
      checksumPassed: false,
      errors: [error instanceof Error ? error.message : "Unknown error"],
    };
  }
}

/**
 * Get broker-specific extraction prompt
 */
function getBrokerSpecificPrompt(broker: "zerodha" | "groww" | "icici"): string {
  const basePrompt = `You are an expert at extracting transaction data from Indian brokerage statements.

Extract ALL transactions from this ${broker.toUpperCase()} statement and return them in the following JSON format:

{
  "transactions": [
    {
      "date": "YYYY-MM-DD",
      "type": "BUY" or "SELL",
      "ticker": "STOCK_SYMBOL",
      "quantity": number,
      "price": number,
      "totalAmount": number,
      "charges": number (brokerage + taxes + other fees),
      "netAmount": number (total amount including charges)
    }
  ],
  "summary": {
    "totalBuyAmount": number,
    "totalSellAmount": number,
    "totalCharges": number,
    "netCashFlow": number (negative for net buy, positive for net sell)
  }
}

CRITICAL REQUIREMENTS:
1. Extract EVERY transaction - do not skip any
2. Ensure math accuracy: netAmount = totalAmount + charges (for BUY) or totalAmount - charges (for SELL)
3. Verify summary totals match individual transactions
4. Use exact ticker symbols as shown in the statement
5. Include all charges (brokerage, STT, GST, stamp duty, etc.)

Return ONLY the JSON object, no additional text.`;

  // Broker-specific hints
  const brokerHints: Record<string, string> = {
    zerodha: "\nZerodha format: Look for 'Contract Notes' section. Ticker symbols are in NSE/BSE format.",
    groww: "\nGroww format: Transactions are in 'Trade Summary' section. Charges shown separately.",
    icici: "\nICICI Direct format: Look for 'Transaction Details'. May have multiple pages.",
  };

  return basePrompt + (brokerHints[broker] || "");
}

/**
 * Validate extracted data and perform math checksums
 */
function validateExtraction(data: any): ExtractionResult {
  const transactions: ExtractedTransaction[] = data.transactions || [];
  const errors: string[] = [];

  // Validate each transaction
  let totalBuy = 0;
  let totalSell = 0;

  transactions.forEach((txn, index) => {
    // Check required fields
    if (!txn.date || !txn.type || !txn.ticker || !txn.quantity || !txn.price) {
      errors.push(`Transaction ${index + 1}: Missing required fields`);
    }

    // Math checksum: netAmount should equal totalAmount ± charges
    const expectedNet = txn.type === "BUY" 
      ? txn.totalAmount + txn.charges 
      : txn.totalAmount - txn.charges;
    
    if (Math.abs(txn.netAmount - expectedNet) > 0.01) {
      errors.push(`Transaction ${index + 1}: Math checksum failed (expected ${expectedNet}, got ${txn.netAmount})`);
    }

    // Accumulate totals
    if (txn.type === "BUY") {
      totalBuy += txn.netAmount;
    } else {
      totalSell += txn.netAmount;
    }
  });

  // Verify summary totals
  const summary = data.summary || {};
  if (Math.abs(totalBuy - (summary.totalBuyAmount || 0)) > 0.01) {
    errors.push(`Total buy amount mismatch: calculated ${totalBuy}, summary shows ${summary.totalBuyAmount}`);
  }
  if (Math.abs(totalSell - (summary.totalSellAmount || 0)) > 0.01) {
    errors.push(`Total sell amount mismatch: calculated ${totalSell}, summary shows ${summary.totalSellAmount}`);
  }

  const netCashFlow = totalSell - totalBuy;
  const checksumPassed = errors.length === 0;

  return {
    success: checksumPassed,
    transactions,
    totalBuy,
    totalSell,
    netCashFlow,
    checksumPassed,
    errors,
  };
}

/**
 * Mock extraction result for testing when API key is not available
 */
function getMockExtractionResult(): ExtractionResult {
  return {
    success: true,
    transactions: [
      {
        date: "2024-01-15",
        type: "BUY",
        ticker: "RELIANCE",
        quantity: 10,
        price: 2500,
        totalAmount: 25000,
        charges: 50,
        netAmount: 25050,
      },
      {
        date: "2024-01-20",
        type: "BUY",
        ticker: "TCS",
        quantity: 5,
        price: 3600,
        totalAmount: 18000,
        charges: 36,
        netAmount: 18036,
      },
    ],
    totalBuy: 43086,
    totalSell: 0,
    netCashFlow: -43086,
    checksumPassed: true,
    errors: [],
  };
}
