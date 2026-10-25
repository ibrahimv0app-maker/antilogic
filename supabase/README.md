# Anti Logic Supabase setup

**Do not apply this migration to an unrelated existing trading-bot project.** Select a dedicated Anti Logic Supabase project first.

## Environment variables
Set these in Vercel and local .env.local:
- NEXT_PUBLIC_SUPABASE_URL
- NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY

The application also accepts NEXT_PUBLIC_SUPABASE_ANON_KEY for compatibility. Prefer a publishable key for new projects. Never expose a Supabase service-role or secret key in client code.

## Apply the schema
After verifying that the Supabase dashboard points to the dedicated Anti Logic project, apply migrations/20261025000100_anti_logic_base.sql through your migration workflow or SQL editor.

Then:
1. Enable email authentication and configure allowed redirect URLs.
2. Add the production and preview URLs to the Supabase Auth redirect allow-list.
3. Test sign up, email verification, sign in, password reset, and logout.
4. Run the Supabase security advisors.
5. Verify that user A cannot read or modify user B's rows.

This schema stores Anti Logic user-authored profiles, preferences, strategies, Telegram connection metadata, automation preferences, and application-owned audit events. It deliberately does not create permanent tables for Deriv ticks, proposals, account statements, or API-originating contract outcomes.

## Live trading
No live trading is enabled by this schema. Keep automation disabled and demo-first until the official Deriv authorization and contract execution workflow has been implemented and tested.
