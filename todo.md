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
- [ ] Stock search UI with autocomplete
- [ ] Stock data fetching (NSE/BSE and US markets)
- [ ] Warren Buffett lens calculation
- [ ] Peter Lynch lens calculation
- [ ] Benjamin Graham lens calculation
- [ ] Philip Fisher lens calculation
- [ ] Rakesh Jhunjhunwala lens calculation
- [ ] Ashish Kacholia lens calculation
- [ ] Vijay Kedia lens calculation
- [ ] Quantitative lens calculation
- [ ] AI report generation with GPT-4o
- [ ] Bear case generation
- [ ] Results UI with score visualization
- [ ] Animated score bars
- [ ] Devil's advocate section

## Phase 6: Portfolio Chatbot & LRS
- [ ] Chat widget (Cmd+K trigger)
- [ ] Intent detection system
- [ ] Portfolio value queries
- [ ] Allocation queries
- [ ] Performance queries
- [ ] LRS usage queries
- [ ] Response generation
- [ ] Chat history storage
- [ ] LRS dashboard
- [ ] LRS transaction form
- [ ] LRS limit warnings

## Phase 7: Daily Snapshots & Concierge
- [ ] Cron job for daily snapshots
- [ ] Snapshot generation logic
- [ ] Currency breakdown calculation
- [ ] Asset class breakdown calculation
- [ ] Sector breakdown calculation
- [ ] Opportunity scanner
- [ ] Rebalancing detection
- [ ] Fee reduction detection
- [ ] Tax loss harvesting detection
- [ ] Concierge UI
- [ ] Task approval workflow
- [ ] Task execution system

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
