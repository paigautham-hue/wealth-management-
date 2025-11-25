/**
 * AETHER V5 - Sentiment & News Analysis
 * Real-time monitoring of stocks, markets, and economic indicators
 */

import { invokeLLM } from "./_core/llm";
import type { Message } from "./_core/llm";

export interface NewsArticle {
  title: string;
  source: string;
  url: string;
  publishedAt: string;
  summary: string;
  sentiment: "positive" | "negative" | "neutral";
  sentimentScore: number; // -1 to 1
  relevance: number; // 0 to 1
  tickers: string[];
}

export interface SentimentAnalysis {
  ticker: string;
  overallSentiment: "bullish" | "bearish" | "neutral";
  sentimentScore: number; // -1 to 1
  newsCount: number;
  positiveCount: number;
  negativeCount: number;
  neutralCount: number;
  keyThemes: string[];
  riskFactors: string[];
  catalysts: string[];
  recentNews: NewsArticle[];
}

export interface MarketSentiment {
  market: "indian" | "us" | "global";
  sentiment: "bullish" | "bearish" | "neutral";
  fearGreedIndex: number; // 0-100
  indicators: {
    name: string;
    value: number;
    signal: "bullish" | "bearish" | "neutral";
  }[];
  summary: string;
}

/**
 * Fetch news for a specific stock
 * In production: integrate with NewsAPI, Alpha Vantage News, or similar
 */
export async function fetchStockNews(ticker: string): Promise<NewsArticle[]> {
  // Mock news data - in production, call real news API
  const mockNews = [
    {
      title: `${ticker} Reports Strong Q4 Earnings, Beats Estimates`,
      source: "Economic Times",
      url: `https://example.com/news/${ticker}-earnings`,
      publishedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      content: `${ticker} announced quarterly results that exceeded analyst expectations, driven by strong demand and operational efficiency.`,
    },
    {
      title: `Analysts Upgrade ${ticker} to Buy on Growth Prospects`,
      source: "Bloomberg",
      url: `https://example.com/news/${ticker}-upgrade`,
      publishedAt: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
      content: `Major brokerage firms have upgraded their rating on ${ticker} citing improving fundamentals and market position.`,
    },
    {
      title: `${ticker} Faces Regulatory Scrutiny Over Recent Practices`,
      source: "Reuters",
      url: `https://example.com/news/${ticker}-regulatory`,
      publishedAt: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(),
      content: `Regulatory authorities have initiated an investigation into ${ticker}'s business practices, raising concerns among investors.`,
    },
  ];

  // Use AI to analyze sentiment for each article
  const analyzedNews: NewsArticle[] = [];

  for (const article of mockNews) {
    const messages: Message[] = [
      {
        role: "system",
        content: `You are a financial news sentiment analyzer. Analyze the sentiment and extract key information.

Respond in JSON format:
{
  "summary": "<brief 1-sentence summary>",
  "sentiment": "positive" | "negative" | "neutral",
  "sentimentScore": <-1 to 1>,
  "relevance": <0 to 1>,
  "tickers": ["<ticker1>", "<ticker2>"]
}`,
      },
      {
        role: "user",
        content: `Analyze this news article:

Title: ${article.title}
Content: ${article.content}

Extract sentiment and key information.`,
      },
    ];

    const response = await invokeLLM({
      messages,
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "news_sentiment",
          strict: true,
          schema: {
            type: "object",
            properties: {
              summary: { type: "string" },
              sentiment: {
                type: "string",
                enum: ["positive", "negative", "neutral"],
              },
              sentimentScore: { type: "number" },
              relevance: { type: "number" },
              tickers: {
                type: "array",
                items: { type: "string" },
              },
            },
            required: ["summary", "sentiment", "sentimentScore", "relevance", "tickers"],
            additionalProperties: false,
          },
        },
      },
    });

    const content = response.choices[0]?.message?.content;
    if (!content || typeof content !== 'string') {
      continue;
    }

    const analysis = JSON.parse(content);

    analyzedNews.push({
      title: article.title,
      source: article.source,
      url: article.url,
      publishedAt: article.publishedAt,
      summary: analysis.summary,
      sentiment: analysis.sentiment,
      sentimentScore: analysis.sentimentScore,
      relevance: analysis.relevance,
      tickers: analysis.tickers,
    });
  }

  return analyzedNews;
}

/**
 * Comprehensive sentiment analysis for a stock
 */
export async function analyzeStockSentiment(ticker: string): Promise<SentimentAnalysis> {
  const news = await fetchStockNews(ticker);

  const positiveCount = news.filter(n => n.sentiment === "positive").length;
  const negativeCount = news.filter(n => n.sentiment === "negative").length;
  const neutralCount = news.filter(n => n.sentiment === "neutral").length;

  const avgSentiment = news.reduce((sum, n) => sum + n.sentimentScore, 0) / news.length;

  // Use AI to extract themes, risks, and catalysts
  const newsText = news.map(n => `${n.title}\n${n.summary}`).join("\n\n");

  const messages: Message[] = [
    {
      role: "system",
      content: `You are a financial analyst. Extract key themes, risk factors, and catalysts from news.

Respond in JSON format:
{
  "keyThemes": ["<theme1>", "<theme2>", ...],
  "riskFactors": ["<risk1>", "<risk2>", ...],
  "catalysts": ["<catalyst1>", "<catalyst2>", ...]
}`,
    },
    {
      role: "user",
      content: `Analyze news for ${ticker}:\n\n${newsText}`,
    },
  ];

  const response = await invokeLLM({
    messages,
    response_format: {
      type: "json_schema",
      json_schema: {
        name: "news_analysis",
        strict: true,
        schema: {
          type: "object",
          properties: {
            keyThemes: {
              type: "array",
              items: { type: "string" },
            },
            riskFactors: {
              type: "array",
              items: { type: "string" },
            },
            catalysts: {
              type: "array",
              items: { type: "string" },
            },
          },
          required: ["keyThemes", "riskFactors", "catalysts"],
          additionalProperties: false,
        },
      },
    },
  });

  const content = response.choices[0]?.message?.content;
  if (!content || typeof content !== 'string') {
    throw new Error("No response from AI");
  }

  const analysis = JSON.parse(content);

  return {
    ticker,
    overallSentiment: avgSentiment > 0.2 ? "bullish" : avgSentiment < -0.2 ? "bearish" : "neutral",
    sentimentScore: avgSentiment,
    newsCount: news.length,
    positiveCount,
    negativeCount,
    neutralCount,
    keyThemes: analysis.keyThemes,
    riskFactors: analysis.riskFactors,
    catalysts: analysis.catalysts,
    recentNews: news,
  };
}

/**
 * Analyze overall market sentiment
 */
export async function analyzeMarketSentiment(market: "indian" | "us" | "global"): Promise<MarketSentiment> {
  const messages: Message[] = [
    {
      role: "system",
      content: `You are a market analyst. Analyze current market sentiment and fear/greed indicators.

Respond in JSON format:
{
  "sentiment": "bullish" | "bearish" | "neutral",
  "fearGreedIndex": <0-100>,
  "indicators": [
    {
      "name": "<indicator name>",
      "value": <numeric value>,
      "signal": "bullish" | "bearish" | "neutral"
    }
  ],
  "summary": "<brief market summary>"
}`,
    },
    {
      role: "user",
      content: `Analyze current sentiment for the ${market} market. Consider:
- Recent price action
- Volatility (VIX)
- Put/call ratios
- Market breadth
- Economic data
- Geopolitical events

Provide comprehensive analysis.`,
    },
  ];

  const response = await invokeLLM({
    messages,
    response_format: {
      type: "json_schema",
      json_schema: {
        name: "market_sentiment",
        strict: true,
        schema: {
          type: "object",
          properties: {
            sentiment: {
              type: "string",
              enum: ["bullish", "bearish", "neutral"],
            },
            fearGreedIndex: { type: "number" },
            indicators: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  name: { type: "string" },
                  value: { type: "number" },
                  signal: {
                    type: "string",
                    enum: ["bullish", "bearish", "neutral"],
                  },
                },
                required: ["name", "value", "signal"],
                additionalProperties: false,
              },
            },
            summary: { type: "string" },
          },
          required: ["sentiment", "fearGreedIndex", "indicators", "summary"],
          additionalProperties: false,
        },
      },
    },
  });

  const content = response.choices[0]?.message?.content;
  if (!content || typeof content !== 'string') {
    throw new Error("No response from AI");
  }

  const analysis = JSON.parse(content);

  return {
    market,
    ...analysis,
  };
}

/**
 * Monitor portfolio holdings for sentiment changes
 */
export async function monitorPortfolioSentiment(tickers: string[]): Promise<{
  ticker: string;
  sentiment: "bullish" | "bearish" | "neutral";
  sentimentChange: "improving" | "deteriorating" | "stable";
  alertLevel: "high" | "medium" | "low";
  summary: string;
}[]> {
  const results = [];

  for (const ticker of tickers) {
    const analysis = await analyzeStockSentiment(ticker);
    
    // Determine alert level based on negative news and risk factors
    let alertLevel: "high" | "medium" | "low" = "low";
    if (analysis.negativeCount >= 2 || analysis.riskFactors.length >= 3) {
      alertLevel = "high";
    } else if (analysis.negativeCount === 1 || analysis.riskFactors.length >= 2) {
      alertLevel = "medium";
    }

    // Determine sentiment change (in production, compare with historical data)
    const sentimentChange: "improving" | "deteriorating" | "stable" = 
      analysis.positiveCount > analysis.negativeCount ? "improving" :
      analysis.negativeCount > analysis.positiveCount ? "deteriorating" : "stable";

    results.push({
      ticker,
      sentiment: analysis.overallSentiment,
      sentimentChange,
      alertLevel,
      summary: `${analysis.newsCount} articles, ${analysis.positiveCount} positive, ${analysis.negativeCount} negative. Key themes: ${analysis.keyThemes.slice(0, 2).join(", ")}`,
    });
  }

  return results;
}
