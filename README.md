# Anti Logic

A demo-first workspace foundation for binary trading research, strategy design, backtesting, and risk-aware automation.

## Current milestone

This repository currently contains the initial Next.js UI foundation. Trading integrations, account authentication, persistent profile data, Telegram, backtesting, and execution are **not implemented yet**. No live trading is enabled.

## Requirements

- Node.js 20.9+
- npm

## Run locally

```bash
npm install
npm run dev
```

Open http://localhost:3000.

## Stack

- Next.js App Router
- React and TypeScript
- Lucide icons
- Supabase SSR/client packages reserved for a later authenticated backend milestone

## Routes

- `/` — public landing page
- `/app` — workspace overview
- `/app/charts`
- `/app/ai-analysis`
- `/app/strategies`
- `/app/strategy-maker`
- `/app/backtest`
- `/app/history`
- `/app/automation`
- `/app/integrations/telegram`
- `/app/account`
- `/app/settings`
- `/app/notifications`
- `/app/support`

The current route pages clearly label features that are not yet connected. Never treat illustrative graphics as live market data.

## Safety notes

- Demo-first; automation is disabled.
- Never put a Supabase service-role key or provider token in frontend code.
- Add Supabase Row Level Security before exposing user-owned tables.
- Review Deriv's current API terms before storing provider-originating market, account, or contract data.
- Test all provider integrations in an authorized demo environment before any consideration of live execution.
