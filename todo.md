# AETHER V5 - Project TODO

## Phase 1: Foundation & Schema
- [x] Database schema setup with all core tables
- [x] Asset management tables (assets, asset_ownership, valuation_history)
- [x] Portfolio snapshot tables (daily_portfolio_snapshots)
- [x] Document processing tables (document_uploads)
- [x] LRS tracking tables (lrs_transactions)
- [x] Stock analysis tables (stock_analyses, opportunity_alerts)
- [x] Concierge tables (concierge_tasks)
- [x] Chat tables (chat_conversations)
- [x] User preferences table

## Phase 2: Authentication & Design System
- [x] Email/password authentication
- [x] Google OAuth integration
- [x] Password reset functionality
- [x] Alabaster color palette implementation
- [x] Playfair Display font for headings
- [x] Inter font for body text
- [x] Custom Tailwind configuration
- [x] Animation system with Framer Motion
- [x] Currency formatting utilities (Lakhs/Crores)

## Phase 3: Portfolio Management
- [x] Home dashboard with net worth display
- [x] Real-time wealth counter animation
- [x] Portfolio page with asset listing
- [x] Asset grouping by type
- [x] Performance attribution (Asset Alpha vs Currency Alpha)
- [x] Manual asset entry form
- [x] Asset type selection
- [x] Form validation with Zod
- [x] Optimistic UI updates

## Phase 4: Document Extraction (Data Airlock)
- [ ] Document upload UI with drag-and-drop
- [ ] File upload to storage
- [ ] Document parsing integration
- [ ] AI extraction with Claude
- [ ] Data validation with Zod
- [ ] Math checksum verification
- [ ] Review UI for extracted data
- [ ] Error highlighting
- [ ] Commit to database workflow

## Phase 5: The Oracle (Stock Analysis)
- [x] Stock search UI with autocomplete
- [x] Stock data fetching (NSE/BSE and US markets)
- [x] Warren Buffett lens calculation
- [x] Peter Lynch lens calculation
- [x] Benjamin Graham lens calculation
- [x] Philip Fisher lens calculation
- [x] Rakesh Jhunjhunwala lens calculation
- [x] Ashish Kacholia lens calculation
- [x] Vijay Kedia lens calculation
- [x] Quantitative lens calculation
- [x] AI report generation with GPT-4o
- [x] Bear case generation
- [x] Results UI with score visualization
- [x] Animated score bars
- [x] Devil's advocate section

## Phase 6: Portfolio Chatbot & LRS
- [x] Chat widget (Cmd+K trigger)
- [x] Intent detection system
- [x] Portfolio value queries
- [x] Allocation queries
- [x] Performance queries
- [x] LRS usage queries
- [x] Response generation
- [x] Chat history storage
- [x] LRS dashboard
- [x] LRS transaction form
- [x] LRS limit warnings

## Phase 7: Daily Snapshots & Concierge
- [x] Cron job for daily snapshots (schema ready)
- [x] Snapshot generation logic
- [x] Currency breakdown calculation
- [x] Asset class breakdown calculation
- [x] Sector breakdown calculation
- [x] Opportunity scanner (schema ready)
- [x] Rebalancing detection
- [x] Fee reduction detection
- [x] Tax loss harvesting detection
- [x] Concierge UI (schema ready)
- [x] Task approval workflow
- [x] Task execution system

## Security & Privacy
- [ ] Row Level Security (RLS) policies
- [ ] PII redaction before LLM calls
- [ ] Input validation across all forms
- [ ] Secure session management

## Responsive Design
- [ ] Mobile-optimized layouts
- [ ] Tablet breakpoint handling
- [ ] Touch-friendly interactions
- [ ] Swipe gestures

## Testing & Optimization
- [ ] Unit tests for core functions
- [ ] Integration tests for API endpoints
- [ ] Performance optimization
- [ ] Dashboard load time < 2 seconds
- [ ] Animation performance (60fps)
- [ ] Cross-browser testing

## Deployment
- [ ] Production environment variables
- [ ] Database migrations
- [ ] Final checkpoint creation
- [ ] Production deployment

## Phase 9: Real Market Data Integration
- [x] Yahoo Finance API integration
- [x] NSE/BSE stock data fetching
- [x] US stock data fetching
- [x] Real-time price updates
- [x] Fundamental data (PE, PB, ROE, etc.)
- [x] Historical performance data
- [x] Market cap and volume data
- [x] Replace mock data in Oracle

## Phase 10: Document Extraction (Claude 3.5 Sonnet)
- [x] Claude API integration
- [x] PDF parsing for Zerodha statements
- [x] PDF parsing for Groww statements
- [x] PDF parsing for ICICI statements
- [x] Transaction extraction logic
- [x] Math checksum verification
- [x] Review UI for extracted data
- [x] Commit to portfolio workflow

## Phase 11: Multi-Currency Support
- [x] Forex API integration (Exchange Rate API)
- [x] Real-time USD/INR conversion
- [x] EUR/INR conversion
- [x] GBP/INR conversion
- [x] Currency alpha calculation
- [x] Asset alpha calculation
- [x] Multi-currency portfolio display
- [x] Historical exchange rate tracking

## Phase 12: Portfolio Analytics Dashboard
- [x] Install Recharts library
- [x] Create Analytics page component
- [x] Asset allocation pie chart
- [x] Performance over time line chart
- [x] Sector diversification chart
- [x] Currency exposure breakdown
- [x] Drill-down capabilities
- [x] Interactive tooltips
- [x] Responsive chart layouts
- [x] Export chart data functionality

## Phase 13: Automated Daily Price Updates
- [x] Install node-cron library
- [x] Create price update service
- [x] Fetch prices for all holdings
- [x] Update asset values in database
- [x] Recalculate net worth
- [x] Recalculate gains and alpha metrics
- [x] Schedule cron job for market close
- [x] Error handling and retry logic
- [x] Logging for audit trail
- [x] Manual trigger endpoint for testing

## Phase 14: AI Wealth Advisor
- [x] Risk tolerance questionnaire
- [x] Investment strategy generator (GPT-4o)
- [x] Market regime detection (ML model)
- [x] Behavioral finance coach
- [x] Natural language portfolio rebalancing
- [x] Personalized allocation recommendations
- [x] AI conversation interface
- [x] Strategy backtesting

## Phase 15: AI Document Intelligence
- [x] Multi-format parser (PDF, Excel, emails)
- [x] Receipt OCR for luxury purchases
- [x] Contract analysis
- [x] Automatic transaction categorization
- [x] Duplicate detection
- [x] Data validation and checksums across documents

## Phase 16: Sentiment & News Analysis
- [x] Real-time news monitoring (NewsAPI)
- [x] Sentiment analysis on holdings
- [x] Social media signals (Twitter/Reddit)
- [x] Insider trading alerts (SEC filings)
- [x] Earnings call transcript summaries
- [x] News impact scoring

## Phase 17: Family Office Mode
- [x] Hierarchical user roles and permissions (schema)
- [x] Family groups table
- [x] Consolidated family dashboard
- [x] Member invitation system
- [x] Role-based access control
- [x] Family net worth aggregation
- [x] Multi-user wealth management
- [ ] Secure family messaging

## Phase 18: Alternative Investments
- [ ] Private equity/VC tracking
- [ ] Real estate portfolio manager
- [ ] Art & collectibles catalog
- [ ] Luxury assets (watches, jewelry, cars)
- [ ] Cryptocurrency multi-wallet integration
- [ ] Commodities tracking (gold, silver)
- [ ] Manual valuation updates

## Phase 19: Fixed Income Advanced
- [ ] Bond ladder visualization
- [ ] Duration & convexity calculation
- [ ] Credit rating monitoring
- [ ] Callable bond modeling
- [ ] Yield curve analysis
- [ ] Interest rate risk metrics

## Phase 20: Insurance as Asset Class
- [ ] Life insurance tracker
- [ ] Health insurance management
- [ ] Property & casualty insurance
- [ ] Insurance needs analysis (AI)
- [ ] Coverage gap detection
- [ ] Claim history tracking

## Phase 21: True Net Worth Calculation
- [ ] Comprehensive liability tracking
- [ ] Mortgage manager with amortization
- [ ] Personal loans tracker
- [ ] Business debt management
- [ ] Margin loans with LTV monitoring
- [ ] Debt payoff optimizer
- [ ] Assets - Liabilities = Net Worth
- [ ] Liquid vs illiquid breakdown

## Phase 22: Attribution Analysis
- [ ] Performance attribution engine
- [ ] Factor exposure analysis
- [ ] Benchmark comparison tools
- [ ] Sharpe ratio calculation
- [ ] Sortino ratio
- [ ] Maximum drawdown tracking
- [ ] Risk-adjusted returns dashboard

## Phase 23: Scenario Analysis & Stress Testing
- [ ] Monte Carlo simulation engine
- [ ] What-if analysis tool
- [ ] Historical stress tests (2008, COVID)
- [ ] Custom scenario builder
- [ ] Retirement success probability
- [ ] Portfolio resilience scoring

## Phase 24: Tax Optimization Suite
- [ ] Tax loss harvesting detector
- [ ] Capital gains optimizer (FIFO/LIFO/specific ID)
- [ ] Tax-efficient withdrawal calculator
- [ ] Dividend tax tracking (qualified vs ordinary)
- [ ] India LTCG/STCG calculator
- [ ] Section 54/54F exemption tracker
- [ ] Tax report generator

## Phase 25: Personalization
- [ ] Custom dashboard builder (drag-and-drop)
- [ ] Saved views system
- [ ] Theme customization
- [ ] Multi-language support (Hindi, Gujarati, etc.)
- [ ] Currency display toggle (INR/USD/EUR)
- [ ] Widget library
- [ ] User preferences storage

## Phase 21: True Net Worth Calculation
- [x] Liabilities tracking (mortgages, loans, credit cards)
- [x] Debt-to-equity ratio calculation
- [x] Monthly debt service tracking
- [x] Debt payoff projections
- [x] Liabilities breakdown by type
- [x] True net worth calculation (assets - liabilities)

## Phase 22: Tax Optimization Suite
- [x] Tax loss harvesting scanner
- [x] AI-powered replacement asset suggestions
- [x] Wash sale rule compliance
- [x] Capital gains liability calculation
- [x] Tax impact calculator for transactions
- [x] Year-end tax planning report
- [x] Priority-based opportunity ranking

## Phase 23: Alternative Investments
- [x] Private equity/VC tracking
- [x] Real estate property management
- [x] Cryptocurrency portfolio tracking
- [x] Art and collectibles valuation
- [x] Commodities tracking
- [x] Liquidity status management

## Phase 24: Fixed Income Advanced
- [x] Bond ladder visualization
- [x] Duration and convexity metrics
- [x] Yield to maturity calculations
- [x] Credit rating tracking
- [x] Interest rate risk analysis

## Phase 25: Insurance as Asset Class
- [x] Life insurance tracking with cash value
- [x] Health insurance coverage monitoring
- [x] Property insurance management
- [x] Beneficiary tracking
- [x] Premium payment scheduling

## Phase 26: Attribution Analysis
- [x] Sharpe ratio calculation
- [x] Sortino ratio calculation
- [x] Alpha and Beta metrics
- [x] Information ratio
- [x] Max drawdown analysis
- [x] Calmar ratio
- [x] Factor attribution analysis

## Phase 27: Scenario Analysis & Stress Testing
- [x] Monte Carlo simulation (10,000 runs)
- [x] Confidence interval calculations (P5, P25, P50, P75, P95)
- [x] Historical stress tests (2008, COVID, Dot-com)
- [x] Custom scenario modeling
- [x] Recovery time estimation

## Phase 28: Personalization
- [x] Custom dashboard preferences (schema ready)
- [x] Personalized asset allocation recommendations
- [x] Custom reporting preferences
- [x] Theme and layout customization

## Phase 29: UI Pages for Advanced Features
- [x] Liabilities Dashboard page
- [x] Add liability form
- [x] Debt payoff projection visualization
- [x] Debt-to-equity ratio display
- [x] Tax Optimizer UI page
- [x] Loss harvesting opportunities table
- [x] Tax savings calculator
- [x] Replacement asset suggestions
- [ ] Alternative Investments Manager page
- [ ] Add alternative investment form
- [ ] Liquidity status tracking
- [ ] Valuation hist- [x] Alternative Investments Manager page
- [x] Add alternative investment form
- [x] Liquidity status tracking
- [x] Valuation history charts
- [x] Risk Analytics Dashboard page
- [x] Attribution metrics visualization (Sharpe, Sortino, Alpha, Beta)
- [x] Max drawdown chart
- [x] Factor attribution breakdown
- [x] Scenario Planner page
- [x] Monte Carlo simulation results
- [x] Confidence interval visualization
- [x] Stress test scenarios displayEnhanced Family Office Dashboard
- [ ] Consolidated metrics with new features
- [ ] Member performance comparison

## Phase 30: Progressive Web App (PWA)
- [x] Create manifest.json with app metadata
- [x] Add service worker for offline caching
- [x] Implement cache strategies (network-first, cache-first)
- [x] Add install prompt for "Add to Home Screen"
- [x] Create app icons (192x192, 512x512)
- [x] Add splash screens for iOS
- [x] Implement push notification service
- [x] Add notification permission request
- [x] PWA install banner component
- [x] Service worker registration hook
- [x] Offline support for static assets

## Phase 31: Mobile Optimization
- [x] Create hamburger menu component
- [x] Add mobile navigation drawer
- [x] Implement menu open/close animations
- [x] Add backdrop overlay for menu
- [x] Responsive navigation (show hamburger on mobile, horizontal on desktop)
- [x] Pull-to-refresh component
- [x] Touch gesture detection
- [x] Loading spinner during refresh
- [x] Sync portfolio data on pull-to-refresh
- [x] Toast notifications for refresh status

## Phase 32: Fix Vite HMR WebSocket Error
- [x] Update Vite config to use proxied domain for HMR
- [x] Configure WebSocket connection settings (wss protocol, port 443)
- [x] Add full hostname to HMR configuration
- [x] Test HMR connection in browser
