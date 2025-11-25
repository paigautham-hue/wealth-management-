/**
 * AETHER V5 - Chat Assistant
 * GPT-4o powered conversational interface for portfolio queries
 */

import { invokeLLM } from "./_core/llm";
import type { Message } from "./_core/llm";

export interface ChatContext {
  userId: number;
  portfolioSummary: {
    totalNetWorth: number;
    assetCount: number;
    lrsUsed: number;
    lrsRemaining: number;
  };
}

export async function generateChatResponse(
  userMessage: string,
  context: ChatContext,
  conversationHistory: Array<{ role: "user" | "assistant"; content: string }> = []
): Promise<string> {
  const systemPrompt = `You are a luxury wealth management assistant for AETHER V5, serving Indian HNI (High Net Worth Individual) clients.

Current User Context:
- Total Net Worth: ₹${context.portfolioSummary.totalNetWorth.toLocaleString("en-IN")}
- Number of Assets: ${context.portfolioSummary.assetCount}
- LRS Used: $${context.portfolioSummary.lrsUsed.toLocaleString("en-US")} / $250,000
- LRS Remaining: $${context.portfolioSummary.lrsRemaining.toLocaleString("en-US")}

Guidelines:
1. Be concise, professional, and sophisticated
2. Use Indian currency format (Lakhs/Crores) when discussing INR amounts
3. Provide actionable insights when relevant
4. Reference the user's actual portfolio data from the context above
5. For complex analysis requests, suggest using The Oracle feature
6. For document uploads, guide users to the Document Upload page
7. Keep responses under 150 words unless detailed analysis is requested

Respond naturally to queries about:
- Net worth and portfolio value
- Asset allocation and diversification
- LRS (Liberalised Remittance Scheme) usage
- Investment performance
- Stock analysis recommendations
- General wealth management advice`;

  const messages: Message[] = [
    { role: "system", content: systemPrompt },
    ...conversationHistory.map((msg) => ({
      role: msg.role as "user" | "assistant",
      content: msg.content,
    })),
    { role: "user", content: userMessage },
  ];

  try {
    const response = await invokeLLM({ messages });
    const content = response.choices[0]?.message?.content;
    if (typeof content === "string") {
      return content;
    }
    return "I apologize, but I couldn't generate a response. Please try again.";
  } catch (error) {
    console.error("Chat error:", error);
    return "I encountered an error processing your request. Please try again.";
  }
}

// Intent detection for routing queries
export function detectIntent(message: string): {
  intent: "net_worth" | "lrs" | "assets" | "analysis" | "general";
  confidence: number;
} {
  const lowerMessage = message.toLowerCase();

  // Net worth queries
  if (
    lowerMessage.includes("net worth") ||
    lowerMessage.includes("total wealth") ||
    lowerMessage.includes("how much")
  ) {
    return { intent: "net_worth", confidence: 0.9 };
  }

  // LRS queries
  if (
    lowerMessage.includes("lrs") ||
    lowerMessage.includes("remittance") ||
    lowerMessage.includes("250") ||
    lowerMessage.includes("limit")
  ) {
    return { intent: "lrs", confidence: 0.9 };
  }

  // Asset queries
  if (
    lowerMessage.includes("asset") ||
    lowerMessage.includes("stock") ||
    lowerMessage.includes("portfolio") ||
    lowerMessage.includes("holding")
  ) {
    return { intent: "assets", confidence: 0.8 };
  }

  // Analysis queries
  if (
    lowerMessage.includes("analyze") ||
    lowerMessage.includes("analysis") ||
    lowerMessage.includes("should i buy") ||
    lowerMessage.includes("recommendation")
  ) {
    return { intent: "analysis", confidence: 0.8 };
  }

  return { intent: "general", confidence: 0.5 };
}
