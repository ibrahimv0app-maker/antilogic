# Anti Logic — Implementation Status

Last updated: 2026-10-25

The repository changes continue on `feat/anti-logic-v1-foundation`; the GitHub Actions checks on the latest branch revision still need to be rerun and reviewed before merge.

This document describes actual code boundaries for the first implementation milestone. A page existing does not mean every integration behind it is complete.

## Public website

Implemented:
- Landing page, responsive header/mobile navigation, feature overview, pricing placeholder, documentation, FAQ, about, contact, security, risk and legal drafts
- Starter research articles
- Cookie-preference controls
- Page metadata, public sitemap and robots policy
- Preview deployments are configured as noindex
- Public system-configuration status page and no-store health endpoint

Still to implement:
- Server-backed blog CMS and publication workflow
- Contact form submission service
- Production-ready support ticket delivery
- Final reviewed legal content and final canonical domain configuration

## Private workspace

Implemented:
- Workspace sidebar and user menu
- Dashboard reads the saved strategy count from the authenticated Supabase account when configured, otherwise shows local draft count
- Profile preferences
- General preferences
- Risk-preference draft
- Notification preferences
- Strategy Maker and Strategy Library
- Local browser storage fallback for drafts and preferences
- Authenticated Supabase persistence code for user-owned profiles/preferences/strategies
- Responsive chart, market, and account UI foundations

Not yet production complete:
- Session enforcement depends on a configured dedicated Anti Logic Supabase project
- Account avatar storage/upload
- Admin user/role management
- Support ticket persistence
- Full subscription billing

## Deriv market data

Implemented in code:
- Read-only public WebSocket connection to the documented public market-data endpoint
- Active-symbol discovery
- Candle-history request and tick subscription
- In-memory price/candle updates
- Basic bounded reconnect logic
- Chart timeframe selection, symbol search, local favorites, OHLC candlesticks, current quote, and moving-average overlay
- Visible stale/disconnected states
- No provider-originating market data is persisted to the Anti Logic database

Not yet verified or implemented:
- The WebSocket has not yet been end-to-end tested from a deployed browser in this environment
- User account OAuth/authorization
- Account balances or account-specific data
- Binary contract proposals, buy/sell execution, or contract settlement
- Any automated or live trading

## Backtesting

Implemented:
- Browser-only CSV parser with file and row limits
- Timestamp and positive-price validation
- RSI, simple moving-average spread, and momentum rule evaluation
- Simplified CALL/PUT simulation
- Configurable expiry in bars, stake units, payout assumption and tie handling
- Win rate, net P/L, stake allocation, ROI, drawdown, and loss streak
- Recent trade rows with a fixed-size buffer
- Explicit assumptions and local CSV export
- The signal condition is evaluated at a candle close and the simplified fill is the next candle close to avoid treating the same close as both signal and fill
- Non-overlapping simulated positions and bounded storage of the latest 5,000 trade-detail rows
- Unit tests for parsing, payout calculations, tie handling, and large-result truncation

Important limits:
- Imported CSV data is never uploaded by the backtest page.
- Results are held in page memory and cleared on refresh.
- The simulator does not model real proposal pricing, execution latency, payout changes, fees, or every Deriv contract rule.
- Backtesting is not proof of future profitability.

## Telegram

Implemented:
- Account/local notification preference storage
- Status and setup UI
- No bot token is exposed to browser code

Not implemented:
- Verified chat linking
- Server-side message delivery
- Webhook verification
- Guaranteed deduplication against a real bot/event source
- Confirmed contract outcome alerts

## Supabase

A starter migration exists at:
`supabase/migrations/20261025000100_anti_logic_base.sql`.

**It has not been applied to any remote database.**

The only currently connected Supabase project found during implementation is named `quotex-m1-signal-bot` and already contains a separate trading bot's data/configuration. Anti Logic must use a dedicated project. Do not point the Anti Logic environment variables at that existing project.

Environment variables used by the app:
- `NEXT_PUBLIC_ANTI_LOGIC_SUPABASE_URL`
- `NEXT_PUBLIC_ANTI_LOGIC_SUPABASE_PUBLISHABLE_KEY`
- `NEXT_PUBLIC_ANTI_LOGIC_SITE_URL` (optional canonical site URL)

Never put a service-role key or other secret in a `NEXT_PUBLIC_*` variable.

## Vercel and verification

- The repository is `ibrahimv0app-maker/antilogic`.
- Work is on branch `feat/anti-logic-v1-foundation`.
- The draft PR is intentionally not merged.
- A Vercel project named `anti-logic` exists, but project inspection currently requires team-scope authorization. No deployment URL or production success is claimed in this status file.
- GitHub Actions is configured for unit tests, lint, and build. Check the latest run before merging; do not assume a pass without a recorded successful run.

## Run locally

```bash
npm install
npm run dev
npm run test
npm run lint
npm run build
```

Use a current Node.js 20.9+ release. Configure the dedicated Supabase project only after reviewing the migration target, redirect URLs, RLS policies, and relevant security advisors.

## Production gate

Do not enable real-money execution until an independently reviewed, documented, authorized demo workflow exists, risk controls are server-enforced, ambiguous executions are reconciled safely, the provider's current API terms are reviewed, and the relevant legal requirements are checked.
