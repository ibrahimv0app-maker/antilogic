# Anti Logic

Anti Logic is a demo-first workspace for binary trading research, strategy design, data inspection, browser-only backtesting, and future risk-aware automation.

## Current milestone

The website, private workspace structure, Supabase authentication code, profile/strategy preference flows, and research tools are being built incrementally.

**Current capability boundaries:**
- The public website and workspace navigation are implemented.
- Supabase Auth forms are wired to the namespaced Anti Logic environment variables, but sign-in is unavailable until a dedicated Anti Logic project and redirect configuration are supplied.
- The charts workspace uses Deriv's documented **public read-only WebSocket** for active market discovery, recent candle history, and live candle/tick updates. It does not authenticate an account or place trades.
- Strategy drafts support local browser persistence and account persistence when the dedicated Anti Logic Supabase schema is available.
- The backtest lab can run a simplified binary-style simulation from a user-provided CSV within the current browser page. The file is not uploaded or persisted by Anti Logic.
- Telegram alert preferences can be configured locally or saved to the account when configured; messages are not sent until an authorized bot integration is implemented.
- **No Deriv account is connected, no trade execution is enabled, and live trading remains disabled.**
- Supabase schema migrations are stored in this repository but have **not** been applied to any remote database.

## Requirements

- Node.js 20.9 or later
- npm

## Run locally

```bash
npm install
npm run dev
```

Open http://localhost:3000.

## Tests and checks

```bash
npm run test
npm run lint
npm run build
```

GitHub Actions runs these checks on relevant branch pushes and pull requests. Review the latest run before merging.

## Configuration

Copy `.env.example` to `.env.local` and set:
- `NEXT_PUBLIC_ANTI_LOGIC_SUPABASE_URL`
- `NEXT_PUBLIC_ANTI_LOGIC_SUPABASE_PUBLISHABLE_KEY`

Use a **dedicated Anti Logic Supabase project**. The existing `quotex-m1-signal-bot` project is not part of this app and must not be reused for Anti Logic.

Never expose a Supabase service-role or secret key in browser code or any `NEXT_PUBLIC_*` variable.

For authentication, configure the allowed redirect URLs in Supabase Auth, including the local callback at `/api/auth/callback` and the actual production/preview URLs.

## Routes

Public routes include landing, platform/features, pricing, blog articles, docs, FAQ, contact, security/status, and legal draft pages.

Workspace routes include:
- `/app` — overview
- `/app/account` — profile
- `/app/account/deriv` — future account connection
- `/app/charts` — public market-data chart
- `/app/ai-analysis` — analysis configuration
- `/app/history` — confirmed-trade-history shell
- `/app/strategies` — strategy library
- `/app/strategy-maker` — rule builder
- `/app/backtest` — browser-only CSV simulation
- `/app/automation` — automation state shell
- `/app/integrations/telegram` — notification preferences
- `/app/settings` — workspace preferences
- `/app/notifications` — notification settings
- `/app/support` — support shell
- `/admin` — protected admin foundation

Pages must continue to identify data sources honestly. Never present an illustration or simulation as live data or an executed trade.

## Backtesting CSV format

The backtest input expects a header row with a timestamp/time/date column and a close/price column, for example:

```csv
timestamp,close
2026-01-01T10:00:00Z,123.45
2026-01-01T10:01:00Z,123.51
```

Numeric epoch timestamps in seconds are normalized to milliseconds. Data must be strictly chronological and prices positive. The current simulator uses simplified indicator definitions and payout assumptions; it ignores real contract-specific pricing, execution delay, provider constraints, and other frictions. A backtest is not a claim of future profit.

## Deriv public market feed and data retention

The chart reads public market data directly in the browser through the documented public WebSocket endpoint. The implementation must not persist ticks, candles, proposals, account statements, or provider-originating trade records without verifying that the current Deriv terms explicitly permit that use.

Reference the current official API documentation and terms before expanding the integration:
- https://developers.deriv.com/docs/intro/api-overview/
- https://developers.deriv.com/docs/options/websocket/
- https://developers.deriv.com/docs/data/active-symbols/
- https://developers.deriv.com/docs/data/ticks/
- https://developers.deriv.com/docs/data/ticks-history/
- https://deriv.com/terms-and-conditions/api-users

## Safety notes

- Demo-first; automation is disabled.
- The public market-data connection is read-only; no account actions are available through it.
- Never put a Supabase service-role key, Deriv token, or Telegram bot token in frontend code.
- Enable and verify Supabase Row Level Security for every user-owned table.
- Apply `supabase/migrations/20261025000100_anti_logic_base.sql` only to a dedicated Anti Logic project, after verifying its target.
- Review provider API terms and relevant legal requirements before commercial launch.
- Test future authenticated contract workflows in an authorized demo environment before considering any live execution.
