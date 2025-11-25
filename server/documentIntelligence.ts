/**
 * AETHER V5 - AI Document Intelligence
 * Multi-format extraction: PDF, Excel, emails, receipts, contracts
 */

import { invokeLLM } from "./_core/llm";
import type { Message } from "./_core/llm";
import * as XLSX from "xlsx";
import { simpleParser } from "mailparser";
import mammoth from "mammoth";

export interface ExtractedTransaction {
  date: string;
  description: string;
  amount: number;
  type: "buy" | "sell" | "dividend" | "interest";
  ticker?: string;
  quantity?: number;
  price?: number;
  fees?: number;
  confidence: number; // 0-1
}

export interface ExtractedDocument {
  documentType: "brokerage_statement" | "bank_statement" | "receipt" | "contract" | "email" | "other";
  broker?: string;
  accountNumber?: string;
  statementPeriod?: {
    from: string;
    to: string;
  };
  transactions: ExtractedTransaction[];
  summary?: {
    openingBalance?: number;
    closingBalance?: number;
    totalBuys?: number;
    totalSells?: number;
    totalDividends?: number;
  };
  checksumValid: boolean;
  rawText: string;
}

export interface LuxuryPurchase {
  item: string;
  category: "art" | "watch" | "jewelry" | "car" | "yacht" | "other";
  brand?: string;
  model?: string;
  purchaseDate: string;
  amount: number;
  vendor: string;
  serialNumber?: string;
  appraisalValue?: number;
}

/**
 * Extract financial data from PDF (already implemented in documentExtraction.ts)
 * This extends it with additional formats
 */

/**
 * Parse Excel/CSV file for portfolio data
 */
export async function parseExcelFile(buffer: Buffer): Promise<ExtractedDocument> {
  const workbook = XLSX.read(buffer, { type: "buffer" });
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  
  // Convert to JSON
  const data = XLSX.utils.sheet_to_json(sheet, { header: 1 });
  
  // Convert to text for AI processing
  const textContent = data
    .map((row: any) => row.join("\t"))
    .join("\n");

  // Use AI to extract structured data
  const messages: Message[] = [
    {
      role: "system",
      content: `You are a financial document parser. Extract transaction data from Excel/CSV files.

Respond in JSON format:
{
  "documentType": "brokerage_statement" | "bank_statement" | "other",
  "broker": "<broker name if applicable>",
  "transactions": [
    {
      "date": "YYYY-MM-DD",
      "description": "<description>",
      "amount": <number>,
      "type": "buy" | "sell" | "dividend" | "interest",
      "ticker": "<optional ticker>",
      "quantity": <optional quantity>,
      "price": <optional price>,
      "fees": <optional fees>,
      "confidence": <0-1>
    }
  ],
  "checksumValid": true | false,
  "rawText": "<original text>"
}`,
    },
    {
      role: "user",
      content: `Extract financial transactions from this Excel data:\n\n${textContent}`,
    },
  ];

  const response = await invokeLLM({
    messages,
    response_format: {
      type: "json_schema",
      json_schema: {
        name: "excel_extraction",
        strict: true,
        schema: {
          type: "object",
          properties: {
            documentType: {
              type: "string",
              enum: ["brokerage_statement", "bank_statement", "other"],
            },
            broker: { type: "string" },
            transactions: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  date: { type: "string" },
                  description: { type: "string" },
                  amount: { type: "number" },
                  type: {
                    type: "string",
                    enum: ["buy", "sell", "dividend", "interest"],
                  },
                  ticker: { type: "string" },
                  quantity: { type: "number" },
                  price: { type: "number" },
                  fees: { type: "number" },
                  confidence: { type: "number" },
                },
                required: ["date", "description", "amount", "type", "confidence"],
                additionalProperties: false,
              },
            },
            checksumValid: { type: "boolean" },
            rawText: { type: "string" },
          },
          required: ["documentType", "transactions", "checksumValid", "rawText"],
          additionalProperties: false,
        },
      },
    },
  });

  const content = response.choices[0]?.message?.content;
  if (!content || typeof content !== 'string') {
    throw new Error("No response from AI");
  }

  return JSON.parse(content);
}

/**
 * Parse email for financial information
 */
export async function parseEmail(emailContent: string): Promise<ExtractedDocument> {
  const parsed = await simpleParser(emailContent);
  
  const subject = parsed.subject || "";
  const from = parsed.from?.text || "";
  const body = parsed.text || "";
  
  const fullText = `From: ${from}\nSubject: ${subject}\n\n${body}`;

  const messages: Message[] = [
    {
      role: "system",
      content: `You are a financial email parser. Extract transaction data from emails (trade confirmations, dividend notifications, etc.).

Respond in JSON format:
{
  "documentType": "brokerage_statement" | "bank_statement" | "email" | "other",
  "broker": "<broker name if applicable>",
  "transactions": [
    {
      "date": "YYYY-MM-DD",
      "description": "<description>",
      "amount": <number>,
      "type": "buy" | "sell" | "dividend" | "interest",
      "ticker": "<optional ticker>",
      "quantity": <optional quantity>,
      "price": <optional price>",
      "fees": <optional fees>,
      "confidence": <0-1>
    }
  ],
  "checksumValid": true,
  "rawText": "<original text>"
}`,
    },
    {
      role: "user",
      content: `Extract financial information from this email:\n\n${fullText}`,
    },
  ];

  const response = await invokeLLM({
    messages,
    response_format: {
      type: "json_schema",
      json_schema: {
        name: "email_extraction",
        strict: true,
        schema: {
          type: "object",
          properties: {
            documentType: {
              type: "string",
              enum: ["brokerage_statement", "bank_statement", "email", "other"],
            },
            broker: { type: "string" },
            transactions: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  date: { type: "string" },
                  description: { type: "string" },
                  amount: { type: "number" },
                  type: {
                    type: "string",
                    enum: ["buy", "sell", "dividend", "interest"],
                  },
                  ticker: { type: "string" },
                  quantity: { type: "number" },
                  price: { type: "number" },
                  fees: { type: "number" },
                  confidence: { type: "number" },
                },
                required: ["date", "description", "amount", "type", "confidence"],
                additionalProperties: false,
              },
            },
            checksumValid: { type: "boolean" },
            rawText: { type: "string" },
          },
          required: ["documentType", "transactions", "checksumValid", "rawText"],
          additionalProperties: false,
        },
      },
    },
  });

  const content = response.choices[0]?.message?.content;
  if (!content || typeof content !== 'string') {
    throw new Error("No response from AI");
  }

  return JSON.parse(content);
}

/**
 * Parse Word document for contract analysis
 */
export async function parseWordDocument(buffer: Buffer): Promise<{
  documentType: "contract" | "agreement" | "other";
  parties: string[];
  keyTerms: {
    term: string;
    value: string;
    importance: "high" | "medium" | "low";
  }[];
  effectiveDate?: string;
  expirationDate?: string;
  summary: string;
  rawText: string;
}> {
  const result = await mammoth.extractRawText({ buffer });
  const textContent = result.value;

  const messages: Message[] = [
    {
      role: "system",
      content: `You are a legal contract analyzer. Extract key terms from contracts and agreements.

Respond in JSON format:
{
  "documentType": "contract" | "agreement" | "other",
  "parties": ["<party 1>", "<party 2>", ...],
  "keyTerms": [
    {
      "term": "<term name>",
      "value": "<term value>",
      "importance": "high" | "medium" | "low"
    }
  ],
  "effectiveDate": "YYYY-MM-DD",
  "expirationDate": "YYYY-MM-DD",
  "summary": "<brief summary>",
  "rawText": "<original text>"
}`,
    },
    {
      role: "user",
      content: `Analyze this contract:\n\n${textContent}`,
    },
  ];

  const response = await invokeLLM({
    messages,
    response_format: {
      type: "json_schema",
      json_schema: {
        name: "contract_analysis",
        strict: true,
        schema: {
          type: "object",
          properties: {
            documentType: {
              type: "string",
              enum: ["contract", "agreement", "other"],
            },
            parties: {
              type: "array",
              items: { type: "string" },
            },
            keyTerms: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  term: { type: "string" },
                  value: { type: "string" },
                  importance: {
                    type: "string",
                    enum: ["high", "medium", "low"],
                  },
                },
                required: ["term", "value", "importance"],
                additionalProperties: false,
              },
            },
            effectiveDate: { type: "string" },
            expirationDate: { type: "string" },
            summary: { type: "string" },
            rawText: { type: "string" },
          },
          required: ["documentType", "parties", "keyTerms", "summary", "rawText"],
          additionalProperties: false,
        },
      },
    },
  });

  const content = response.choices[0]?.message?.content;
  if (!content || typeof content !== 'string') {
    throw new Error("No response from AI");
  }

  return JSON.parse(content);
}

/**
 * OCR receipt for luxury purchases
 */
export async function parseReceipt(imageUrl: string): Promise<LuxuryPurchase> {
  // Use Claude Vision to extract receipt data
  const messages: Message[] = [
    {
      role: "user",
      content: [
        {
          type: "text",
          text: `Extract luxury purchase information from this receipt. Respond in JSON format:
{
  "item": "<item name>",
  "category": "art" | "watch" | "jewelry" | "car" | "yacht" | "other",
  "brand": "<brand name>",
  "model": "<model if applicable>",
  "purchaseDate": "YYYY-MM-DD",
  "amount": <number>,
  "vendor": "<vendor name>",
  "serialNumber": "<serial number if visible>",
  "appraisalValue": <number if mentioned>
}`,
        },
        {
          type: "image_url",
          image_url: {
            url: imageUrl,
            detail: "high",
          },
        },
      ],
    },
  ];

  const response = await invokeLLM({
    messages,
    response_format: {
      type: "json_schema",
      json_schema: {
        name: "receipt_extraction",
        strict: true,
        schema: {
          type: "object",
          properties: {
            item: { type: "string" },
            category: {
              type: "string",
              enum: ["art", "watch", "jewelry", "car", "yacht", "other"],
            },
            brand: { type: "string" },
            model: { type: "string" },
            purchaseDate: { type: "string" },
            amount: { type: "number" },
            vendor: { type: "string" },
            serialNumber: { type: "string" },
            appraisalValue: { type: "number" },
          },
          required: ["item", "category", "purchaseDate", "amount", "vendor"],
          additionalProperties: false,
        },
      },
    },
  });

  const content = response.choices[0]?.message?.content;
  if (!content || typeof content !== 'string') {
    throw new Error("No response from AI");
  }

  return JSON.parse(content);
}

/**
 * Automatic categorization of transactions
 */
export async function categorizeTransactions(
  transactions: ExtractedTransaction[]
): Promise<{
  transactionId: number;
  category: "business_expense" | "personal" | "investment" | "tax_deductible";
  subcategory: string;
  confidence: number;
}[]> {
  const transactionList = transactions
    .map((t, idx) => `${idx}. ${t.date} - ${t.description} - ₹${t.amount}`)
    .join("\n");

  const messages: Message[] = [
    {
      role: "system",
      content: `You are a transaction categorization expert. Classify transactions for tax optimization.

Categories:
- business_expense: Deductible business costs
- personal: Non-deductible personal spending
- investment: Capital investments
- tax_deductible: Other tax-deductible expenses

Respond in JSON format:
{
  "categorizations": [
    {
      "transactionId": <index>,
      "category": "<category>",
      "subcategory": "<specific subcategory>",
      "confidence": <0-1>
    }
  ]
}`,
    },
    {
      role: "user",
      content: `Categorize these transactions:\n\n${transactionList}`,
    },
  ];

  const response = await invokeLLM({
    messages,
    response_format: {
      type: "json_schema",
      json_schema: {
        name: "transaction_categorization",
        strict: true,
        schema: {
          type: "object",
          properties: {
            categorizations: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  transactionId: { type: "number" },
                  category: {
                    type: "string",
                    enum: ["business_expense", "personal", "investment", "tax_deductible"],
                  },
                  subcategory: { type: "string" },
                  confidence: { type: "number" },
                },
                required: ["transactionId", "category", "subcategory", "confidence"],
                additionalProperties: false,
              },
            },
          },
          required: ["categorizations"],
          additionalProperties: false,
        },
      },
    },
  });

  const content = response.choices[0]?.message?.content;
  if (!content || typeof content !== 'string') {
    throw new Error("No response from AI");
  }

  const parsed = JSON.parse(content);
  return parsed.categorizations;
}
