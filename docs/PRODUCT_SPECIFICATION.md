# Anti Logic — Complete A–Z Product Specification and Production Blueprint

**Version:** 1.0  
**Last reviewed:** 25 October 2026  
**Repository:** ibrahimv0app-maker/antilogic  
**Audience:** Founder, developers, AI coding agents, reviewers and future operators.

This is the target product specification, not a claim that every described feature is already implemented. The actual repository state is tracked separately in [IMPLEMENTATION_STATUS.md](./IMPLEMENTATION_STATUS.md).

---

## 1. Product vision: what Anti Logic must become

Anti Logic is intended to become a professional, premium, trustworthy trading research and strategy workspace built around Deriv markets. It combines market charts, technical analysis, AI-assisted explanations, strategy building, historical backtesting, personal account management, activity and contract history, notifications, Telegram win/loss alerts, and—only after specific provider, security, risk and legal approval—optional trading automation.

The result must be a real SaaS product, not a collection of good-looking but nonfunctional pages. Every important control must perform a genuine action or clearly explain why it is disabled. Data must be sourced, timestamped, validated, persisted where appropriate, private to the correct owner, and observable in production.

The initial release should focus on secure accounts, charting, strategy management, CSV backtesting and notification foundations. Authorized Deriv demo workflows come later. Real-money execution is a separate gated capability and must remain disabled until the release gates in this document are passed.

### Product principles

1. **Honest data:** identify data source, timestamp, connection health and whether an event is a signal, simulation, demo contract or confirmed provider contract.
2. **Demo-first:** a user cannot place a live order simply because a UI toggle exists.
3. **Security by design:** enforce ownership and permissions on the server and database; keep secrets server-side.
4. **Functional completeness:** forms save; buttons work; loading, empty, disabled, error and success states exist.
5. **Reproducible research:** strategy versions are immutable and backtests disclose assumptions, limitations and data splits.
6. **Risk awareness:** no guaranteed-win/profit claims; historical performance does not promise future results.
7. **Small complete releases:** build testable slices instead of shipping many placeholders.
8. **Provider compliance:** review current official Deriv API documentation, permissions, data-retention terms and authorization requirements before expanding integrations.

### Prohibited shortcuts and claims

- No guaranteed profits, fabricated accuracy, fake win/loss statistics, fake balances or invented live prices.
- No unimplemented AI, billing, Telegram delivery, admin functions or support workflows presented as complete.
- No arbitrary user JavaScript execution in strategies.
- No credentials in browser storage, URLs, client bundles, source maps, telemetry or logs.
- No unauthorized persistence or redistribution of provider-originating data.
- Do not reuse the separate Quotex trading bot database or credentials.
- Do not enable real-money trading by default or hide it behind an unreviewed switch.

---

## 2. Users, roles and access control

**Visitor:** can read the landing page, public features, blog, documentation, FAQs, pricing information, status, contact and legal/risk pages. No private workspace data.

**Registered user:** can access only their own profile, preferences, strategies, strategy versions, backtest records, notifications, Telegram link and authorized account data.

**Demo-connected user:** has authorized a supported Deriv demo account and may read permitted account data. Demo contracts/automation are enabled only after that workflow is implemented and tested.

**Live-connected user (future gated capability):** must explicitly authorize a supported account and consent to the risks. Requires a formal release decision, server-enforced limits, reconciliation, audit trail, provider compliance and legal review.

**Support agent:** sees assigned tickets and minimal account metadata. No tokens, bot credentials or unrelated private strategies by default.

**Content editor:** manages article drafts and publication according to assigned permissions, not broad admin access.

**Administrator:** manages user status, roles, content, support, system flags and service health. All privileged actions require server-side authorization and audit records.

**Background service:** uses a separate least-privilege identity rather than a normal user or unrestricted database key.

Every protected route and API must check permissions on the server. Hiding navigation items is not access control.

---

## 3. Full sitemap

### Public website
- / — landing page
- /platform — product tour
- /features — feature catalogue
- /pricing — plans/comparison; no fake checkout
- /blog and /blog/[slug] — article listing and article detail
- /docs — user and product documentation
- /faq — frequently asked questions
- /about — product explanation
- /contact — validated form with real delivery
- /security — security practices and reporting
- /status — service health without secret configuration
- /risk-disclosure — trading risks
- /terms — reviewed terms
- /privacy — reviewed privacy policy
- /cookies — cookie notice and preferences
- /auth/sign-up and /auth/sign-in — registration and login
- /auth/forgot-password and /auth/reset-password — recovery
- /auth/callback and /auth/verify — auth callback and verification status

### Authenticated workspace
- /app — dashboard
- /app/account — profile/account
- /app/account/security — security and sessions
- /app/account/deriv — Deriv connection
- /app/charts — market chart
- /app/ai-analysis — analysis
- /app/history — separated activity and contract history
- /app/backtest — CSV simulation and results
- /app/strategies — strategy library
- /app/strategy-maker — rule builder
- /app/automation — automation controls and safeguards; disabled until ready
- /app/integrations/telegram — linking and alert preferences
- /app/notifications — inbox, preferences and delivery states
- /app/settings — appearance, locale, chart and risk settings
- /app/support — support tickets
- /app/usage and /app/billing — only when entitlements/billing are real

### Admin workspace
- /admin — operational overview
- /admin/users and /admin/roles — user status and role assignment
- /admin/content — blog/docs management
- /admin/support — ticket queue
- /admin/notifications — delivery failures and safe retry
- /admin/audit — privileged action log
- /admin/system — health, feature flags and incidents
- /admin/plans — plans/entitlements if billing exists

These are target routes. Existing UI shells must be accurately marked as unfinished until the backend capability is verified.

---

## 4. Page-by-page specification

### 4.1 Landing page
**UI:** logo, responsive navigation, clear hero, product/features, sign-up/sign-in links, honest product preview, charts/analysis/strategy/backtest/Telegram feature sections, “how it works,” risk statement, FAQ teaser, latest published articles, legal/contact footer.

**Backend:** public/static content where suitable; never expose account data; optional analytics respects consent. No fake performance counters.

**Acceptance:** all links work, mobile menu is accessible, metadata/canonical URL configured, previews are labelled honestly.

### 4.2 Sign-up, sign-in and recovery
**UI:** accessible email/password fields, validation, password show/hide, terms acknowledgement, loading/error states, email verification, forgot-password and sign-out.

**Backend:** Supabase Auth; never custom password storage. Configure local, preview and production callback URLs. Validate and rate-limit requests; verify callback state; initialize profiles safely; protect private APIs. Recovery links expire and are single-use. Use generic recovery/login messages to avoid account enumeration. Do not log passwords, reset links or tokens.

**Acceptance:** anonymous APIs cannot read private records; changing user IDs in requests grants no access; expired sessions fail safely; sign-out revokes/clears the session; missing config cannot look like successful auth.

### 4.3 Dashboard
**UI:** greeting/profile, onboarding checklist, public feed/Deriv/Telegram connection status, strategy count/recent items, recent backtest summaries labelled simulation, confirmed provider activity only if authorized, risk summary, demo/live label, notifications and shortcuts.

**Backend:** query only the current user's profile/preferences/strategies/backtests. Provider account data requires a valid connection. Never mix simulated trades with actual contracts.

**Acceptance:** new users see helpful empty/setup state rather than fake balance data; stale data is obvious; shortcuts go to real pages.

### 4.4 Account/profile
**Fields:** display name, optional unique username/avatar, verified email display, preferred language (English/Urdu), timezone (Asia/Karachi can be the initial default), created date.

**Sections:** profile editor, avatar upload, password/security/session controls, email verification, Deriv status/revoke, Telegram link/unlink, notifications, data export/deletion and privacy links.

**Backend:** server/database validation; avatar file type/size rules and controlled storage; signed links for private assets. Account deletion follows documented retention and applicable legal/provider obligations. Email identity changes require verification.

**Acceptance:** clear save/cancel and unsaved-change prompts; no user can alter another user or assign themselves admin.

### 4.5 Deriv account connection
**UI:** connect/disconnect/revoke, permission summary, demo/live mode, masked identifier, authorization time, connection health, expiry/reconnect states. Never reveal full tokens.

**Workflow:** first review current official Deriv docs, OAuth/authorization method, app requirements, scopes and API-user terms. Public market data is separate from private authorization. Verify callback state on server; store only required credentials and use managed encryption for server-held tokens; never put tokens in URLs, browser storage, logs, telemetry or client error reports. Disconnect must revoke externally where possible and remove local credentials. Start with demo.

**Acceptance:** test denial, invalid/replayed callback, expiry, revoke, reconnect and provider outage. Live mode stays disabled until formal approval.

### 4.6 Charts/market
**UI:** active symbol/search/favorites, timeframe, OHLC candles, latest quote, indicator controls/settings, crosshair/time/price scale, last update, connection/loading/stale/no-data states and reconnect.

**Workflow:** use documented public endpoints; update candles without duplicate timestamps; cancel old subscriptions when switching symbols/timeframes; reconnect with capped exponential backoff and jitter; show stale data after a defined threshold. Public price feed is not executable contract pricing. Do not persist provider data unless current terms allow it.

**Acceptance:** handle browser sleep, disconnects, rate limits and malformed messages; no duplicated candles/unbounded memory; the UI never looks live after disconnect.

### 4.7 AI analysis
**UI:** market/timeframe/window, indicator settings, trend/momentum/volatility/range observations, explicit values, detected conditions, neutral/no-signal state, timestamp/validity and “why” explanation. Separate deterministic calculations from generated commentary.

**Backend:** documented/tested indicators. A future language model receives minimum data, has validated structured output and is labelled as generated commentary; it cannot directly authorize trades. Include timestamp, assumptions, failure state and model/version where relevant. Missing/stale data must not produce authoritative-looking output.

**Acceptance:** values can be traced to inputs; no guaranteed prediction/profit language.

### 4.8 Strategy library
**UI:** search/filter, name/description, market/type, status (draft/validated/disabled), version, dates, tags, clone/edit/archive/delete, validation result and backtest shortcut.

**Backend:** owner-scoped queries; server validation; immutable snapshots on meaningful changes; each backtest references exact strategy version; conflict detection prevents silent overwrite.

**Acceptance:** user A cannot read/change/delete user B's strategy; saved strategies survive refresh/re-login; archived strategy cannot execute.

### 4.9 Strategy Maker
**UI:** name/description, symbol/timeframe, AND/OR entry-rule groups, supported indicator/operators (e.g. price crosses moving average, RSI threshold, momentum threshold), supported exit/expiry rules, conflict handling if both CALL and PUT conditions fire, readable rule preview, validate/save/version/duplicate/backtest/disable controls.

**Backend:** structured schema only; validate fields, operators, ranges, lookback lengths, timeframe, rule limits and supported contracts. Never execute arbitrary user code.

**Lifecycle:** Draft → Validated → Backtested → Demo-eligible after separate checks → Disabled/Archived. A strategy cannot place a trade merely because it was saved or tested.

**Acceptance:** save/load round trip; invalid config fails safely; immutable versions; client cannot bypass execution gate.

### 4.10 Backtest lab
**Current baseline:** browser-only CSV and a simplified binary-style simulation; CSV is not uploaded/persisted and results disappear on refresh. Keep this limitation visible until changed.

**Import:** timestamp/time/date and close/price columns; sample CSV; preview; file/type/row limits; positive-price and strict chronological validation; duplicate/missing row diagnostics. Keep data local by default and disclose any future cloud upload/retention.

**Configuration:** strategy/version, dataset/date/timeframe, stake, payout assumptions, expiry bars, tie handling, applicable costs/latency/slippage, out-of-sample split and walk-forward options.

**Results:** trade count; wins/losses/draws; clear win-rate denominator; net P/L; amount staked; ROI; max drawdown; longest losing streak; average outcome; equity curve where valid; trade details; methodology/model version/warnings; user-initiated CSV export.

**Correctness:** signal precedes assumed fill; no same-candle look-ahead; no future leakage; split in-sample/out-of-sample data; model payout variability and execution limitations or disclose them; don't hide drawdowns/failures; make run reproducible; bound/cancel large runs. Never store unauthorized raw provider data. A backtest is not a forecast of future returns.

**Acceptance:** deterministic results within documented tolerance; tests for rising/falling/flat prices, ties, no signals, malformed CSV, duplicate timestamps, high volume and edge cases; export matches results; optimizer cannot access holdout data.

### 4.11 History
Separate categories: confirmed provider contracts/orders, demo contracts, strategy signals, backtest simulations and application activity.

**UI:** date/type/source filters, market/contract/status/direction/stake, provider-reported result only where valid, P/L/currency, pagination, detail/export and source badges.

**Backend:** confirmed contract history comes from authorized provider data with stable provider IDs. Signals and simulations never appear as real contracts. Handle delayed settlement, correction, duplicate events, reconnect and unknown outcomes.

**Acceptance:** no simulation is called a real win/loss; retries don't duplicate records; timezone is explicit.

### 4.12 Telegram and win/loss alerts
**UI:** setup instructions, verified state, masked chat information, link/unlink, preferences for confirmed wins/losses, demo outcomes, strategy/system events, test message, delivery status and retry/error view.

**Linking:** authenticated user requests a link; server generates a random short-lived single-use challenge; user interacts with bot; webhook/update authenticity is checked; challenge consumed once. Expired/replayed tokens fail. Unlink stops future delivery.

**Delivery:** trusted server event creates outbox record with idempotency key; background worker sends with server-only bot token; record success/failure/attempts; bounded retry with backoff; deduplicate events; don't claim delivery before provider acceptance. A test message proves connectivity only. No alert should claim win/loss based only on a signal or unconfirmed local event.

**Acceptance:** webhook verification, one-time linking, duplicate prevention, retry exhaustion, unlink and preference enforcement tested. Identify demo/live source and avoid leaking account IDs.

### 4.13 Settings and risk controls
**Settings:** appearance, language/timezone, default symbol/timeframe, chart preferences, notification channels, security, privacy/export/deletion, risk preferences.

**Future execution limits:** max stake, daily-loss stop, max open contracts, consecutive-loss pause, cooldown, permitted markets/contracts, demo-only mode and master stop. Validate units and currency.

A client-side form is not a risk system. Before every future order, server reloads authoritative settings, checks limits, calculates exposure atomically, reconciles open contracts and fails closed on stale/missing settings or uncertain provider state. Log decisions without secrets. Stop switch prevents new orders/pauses workers; do not promise it cancels a provider-accepted contract unless confirmed.

### 4.14 Automation
Stages: disabled explanation; dry-run simulation; authorized demo workflow; live execution only after independent review.

Controls: visible mode, exact strategy version, symbol/contract/expiry/stake, risk summary, decisions, run/pause/resume/stop confirmation, worker heartbeat, pending/unknown order reconciliation, failure state and emergency disable.

Fail closed on token expiry, provider outage, stale feed, unknown order, risk limit, mode mismatch, duplicate-request risk, rate limit or inconsistent contract state. Reconcile ambiguous prior requests before retry.

### 4.15 Notifications
A unified inbox with unread count, event filters, read/unread, related link, mark-all-read, preferences and per-channel delivery status. Notifications are user-owned; event types are controlled; retries idempotent; preferences enforced on server; sensitive details omitted from previews.

### 4.16 Blog and documentation CMS
Public pages show published posts only, with categories/tags/search/pagination, author, publish/update dates and SEO metadata. Article pages use accessible headings/images/links and optional table of contents.

Admin workflow: Draft → Review → Scheduled/Published → Archived. Add preview, revision history, slug validation and sanitized rendering. Visitors cannot read drafts; only authorized editors/publishers can update/publish. Never render unsanitized HTML.

### 4.17 Contact and support
Contact form: validation, spam controls, rate limits, real delivery, reference/confirmation. Support: owner, status, priority/category, messages, attachments, staff-only notes, assignment and timestamps. Enforce ticket ownership, validate file type/size, scan if available, notify staff via a real service and audit privileged actions.

### 4.18 Admin panel
Overview: service health, aggregate user counts, integration state, delivery failures, support backlog, recent security events. User management: lookup/status/role/data requests. Content: draft/preview/publish/archive/revisions. System: provider/queue/migration status and feature flags, never secrets. Audit records actor/action/target/time/request ID/safe metadata/result. Enforce admin roles server-side; use strong authentication and step-up verification for high-impact actions where available.

### 4.19 Pricing and billing — later
Do not claim plans are purchasable until payment is real. Use suitable provider; verify webhook signatures; process idempotently; model subscription states; show invoices/cancellation/refund terms; enforce entitlements server-side; never store raw card details. Billing must not delay core security.

### 4.20 Legal, privacy and cookies
Required pages include Terms, Privacy, Cookie Preferences, Risk Disclosure and provider integration disclosures. Have final text reviewed by qualified counsel for the actual markets. Inventory collected data/purpose/retention/access/processors/deletion. Distinguish necessary and optional cookies, honour consent where required, and avoid deceptive banners. Review applicable financial promotion, data protection, provider API, consumer, age, tax and billing obligations. Don't claim regulatory approval unless verified.

---

## 5. Technical architecture and API boundaries

### Current stack
- Next.js App Router, React and TypeScript.
- Supabase Auth and PostgreSQL.
- Supabase RLS plus server-side authorization.
- Vercel hosting/deployment.
- GitHub Actions for tests, lint, build and release checks.
- Official Deriv API for permitted public market data and future authorized account operations.
- Telegram Bot API for notifications after server delivery is implemented.

Keep the architecture as simple as reliability allows. Add a queue/worker when notification delivery or future execution requires durable processing.

**Browser:** accessible UI and documented public market-data WebSocket.  
**Next.js server/API:** auth, permission checks, validation, rate limiting, business rules, integration calls and audit.  
**Database:** app-owned records and RLS.  
**Provider adapters:** payload validation, timeouts, retries, rate handling and redaction.  
**Worker/outbox:** idempotent notifications and any future demo automation.  
**Observability:** redacted logs, correlation IDs, metrics, error tracking and alerts.

### API groups
- **Account:** own profile/preferences, session status, export/deletion request.
- **Strategies:** own CRUD, immutable versions, clone and validation.
- **Backtesting:** validate/import, run/cancel/status/results, paginated details and export; enforce file/row/time/memory limits.
- **Deriv:** authorization start/callback, own connection status, revoke, permitted account read; future proposal/demo order/contract reconciliation only when approved.
- **Telegram:** link challenge, verified callback, unlink, preferences, test send, outbox and webhook processing.
- **Admin:** user/role/content/support/feature flag/audit APIs with server-side roles.

Every endpoint validates inputs and ownership; returns accurate HTTP status/typed safe errors; uses request IDs; rate-limits sensitive/expensive actions; uses idempotency for retryable external operations; never returns secrets.

---

## 6. Target data model

The current starter migration includes profiles, user preferences, strategies, strategy versions, Telegram preferences, automation preferences and audit events. Additions below need design, migrations and review before use.

- **deriv_connections:** owner, masked provider reference, mode/scopes, expiry, encrypted token or managed secret reference, state and authorized/revoked timestamps.
- **backtest_runs:** owner, strategy/version, simulator version, dataset metadata/hash if permitted, parameters, times, status, summary, assumptions, error and retention.
- **backtest_trade_rows:** optional bounded result details for user-owned runs.
- **activity_events:** explicit source/type for signals, simulations, provider and app events.
- **provider_contracts:** stable provider ID, state, account mode, currency/stake/result/times/reconciliation; never mix with backtests.
- **telegram_link_challenges:** user, hashed challenge, expiry and consumed state.
- **notification_outbox / notification_deliveries:** idempotency key, destination, event, state, attempts, retry time and safe error category.
- **notifications:** user, category, title/body, read state, relation and timestamp.
- **support_tickets / support_messages:** owner, status, priority, category, messages, assignment, private notes and timestamps.
- **blog_posts / blog_revisions:** slug, title/body, editor, state, SEO, publish time and revisions.
- **admin_role_assignments / feature_flags:** constrained role mapping and server-owned flags.
- **subscriptions / entitlements / billing_events:** only if billing approved.
- **data_export_requests / deletion_requests:** status and audit history.

Rules: foreign keys/constraints, RLS on every restricted exposed table, cross-user CRUD tests, indexes for owner/status/time queries, migrations tested outside prod, provider data separated from app-owned records, retention defined, no credentials in preference JSON, least-privilege grants, and exact target-project verification. The separate Supabase project named **quotex-m1-signal-bot** must not be used for Anti Logic.

---

## 7. Security, privacy and reliability

### Identity/access
Dedicated Anti Logic Supabase project; configured callbacks; tested RLS and server checks; server-owned admin/editor/support roles; provider revocation/expiry handling; tested session expiration/logout.

### Secrets
Public Supabase URL/publishable key may be client-visible where intended. Service-role key, Deriv tokens, Telegram bot/webhook secrets, encryption keys, billing and email credentials remain server-only. Never prefix secret values with NEXT_PUBLIC. Keep secrets out of source, bundles, logs, telemetry, error reports and screenshots. Rotate compromised credentials.

### Application hardening
Validate input/output; appropriate CSP/security headers; CSRF protection for relevant cookie-authenticated mutations; rate limits/body limits; sanitized Markdown/HTML; safe uploads; dependency/secret scanning; critical/high advisories remediated or explicitly mitigated; no arbitrary code execution.

### Execution safety
Demo-first; live execution disabled by default and protected by server-side feature flag. Any order path needs server risk validation, account-mode enforcement, atomic exposure check, reconciliation after uncertain results, kill switch, safe logs and audit. Review provider terms and applicable legal rules first.

### Privacy
Data inventory and purpose limitation; retention/deletion/export policy; accurate privacy/cookie notices; minimum collection; restricted support access; incident/breach procedure.

---

## 8. Design, accessibility and performance

**Visual direction:** premium dark-first trading workspace, optional light theme, strong readable type, consistent spacing, clear chart hierarchy, restrained status colours. Avoid fake terminal effects, excessive gradients and colour-only states.

**Shared UI system:** buttons, forms, validation, cards, metric tiles, tabs, dialogs/confirmations, tables, filters, pagination, skeletons, empty/error states, toasts, status badges, connection indicators, chart controls and accessible tooltips.

**Rules:** controls work or have a reason disabled; forms show loading/success/error; confirm destructive/financial-impact actions; prevent double submissions; show data source/last update; visible keyboard focus; semantic labels; reduced-motion support; screen-reader status; mobile/tablet/desktop layouts; translation-ready English/Urdu; locale-aware times/currency.

**Performance goals:** measure Core Web Vitals; lazy-load large charts; paginate history; cap imports, rows, calculations and memory; no unbounded reconnect/retry; run automated/manual accessibility and desktop/mobile smoke tests. These are targets, not a claim that they have been measured.

---

## 9. CI/CD and production operations

### Environments
Local: non-production. Preview/staging: isolated non-production database and demo credentials. Production: canonical domain, production secrets, least privilege, reviewed migrations and monitoring. Do not casually share a database between environments.

### Existing public environment variables
- NEXT_PUBLIC_ANTI_LOGIC_SUPABASE_URL
- NEXT_PUBLIC_ANTI_LOGIC_SUPABASE_PUBLISHABLE_KEY
- NEXT_PUBLIC_ANTI_LOGIC_SITE_URL

Keep example files free of real values. Future Deriv/Telegram/email/billing variables are added only as integrations are implemented and secret values remain server-side. Missing protected integration config must fail closed and show a truthful state.

### CI gates
1. Lockfile-consistent dependency install.
2. TypeScript/typecheck.
3. Unit tests.
4. Lint.
5. Production build.
6. Dependency/security scan with reviewed exceptions.
7. Migration/RLS tests against a disposable environment.
8. E2E tests for auth, ownership and core flows.
9. Accessibility/performance checks where configured.

### Deployment
Verify Vercel repo/branch/project, released commit and canonical domain. Check namespaced environment variable presence without exposing values. Confirm SSO/access restrictions. Smoke-test public pages, auth, protected routes, profile persistence, strategy create/edit, chart connected/stale states, CSV backtest/export, Telegram unconfigured state, health/status and error pages. Keep rollback instructions and a known-good deployment. Do not run production migration without target verification and backup plan.

### Operations
Structured/redacted logs, request IDs, error tracking, app/provider health, provider/queue/backtest/notification metrics, outage alerts and incident runbook. Define recovery objectives; back up production database; test restoration in non-production; version migrations and protect destructive changes.

---

## 10. Testing and acceptance

**Unit:** validators, strategy schemas, indicator calculations, backtest math, ties/payouts, timestamps, parser bounds, idempotency, risk calculations and state transitions.

**Integration:** Supabase/RLS, profile setup, strategy versions, migrations, auth callback/recovery, mocked provider lifecycle, Telegram challenge/webhook, outbox retries and audit logging.

**E2E:** visitor navigation; registration/verification/login/logout; anonymous API rejection; cross-user denial; strategy persistence after login; invalid strategy rejection; malformed/oversized CSV rejection; assumptions visible and export accurate; stale chart/reconnect; client cannot mark Telegram connected; test send succeeds or shows an actual error; history source separation; admin role denial; safe production smoke test.

**Failure cases:** timeouts, duplicate webhook/job, token expiry/revoke, provider rate limit, stale data, malformed message, browser sleep, process/DB outage, migration failure, partial notification and ambiguous order response.

A feature is done only when requirements, UI and backend are complete; ownership is enforced; all states exist; tests pass; logs are safe; docs/env instructions are current; no known critical blocker remains; the target environment is verified; and implementation status is updated honestly.

---

## 11. Delivery roadmap

### Phase 0 — Stabilize
Review dependency advisories; get tests/lint/typecheck/build green; verify CI for current main; create dedicated non-production Supabase project; confirm Vercel variables, target domain and access protection. **Exit:** checks pass and deployment/configuration state is known.

### Phase 1 — Secure accounts
Apply reviewed migration only to dedicated non-prod; test RLS/cross-user isolation; finish auth, verification, recovery, sign-out, profile, preferences and strategy persistence. **Exit:** real auth and private persistence pass security tests.

### Phase 2 — Research core
Verify deployed Deriv public chart; complete stale/error/reconnect UI; version strategies; finish CSV backtest correctness, assumptions and export; keep CSV local by default. **Exit:** chart/strategy/backtest journey is repeatable.

### Phase 3 — Real notifications/content
Secure Telegram linking, outbox, delivery/retry/deduplication; notification inbox; actual contact/support delivery; blog CMS; legal/privacy/cookie review. **Exit:** no fake delivery or dead public form.

### Phase 4 — Authorized demo workflows
Review current Deriv authorization/docs/terms; secure connect/disconnect; account data; permitted demo order/contract flow; server limits, idempotency, reconciliation and kill switch first. **Exit:** demo workflow handles provider errors and ambiguous results safely.

### Phase 5 — Operations/admin
Complete roles, support, content, audit, status, monitoring, backup restore, security review and accessibility/performance checks. Billing remains optional. **Exit:** launch checklist signed off.

### Phase 6 — Optional live execution
Independent security/execution review; confirm provider permissions and legal requirements; test limits/concurrency/reconciliation/kill switch/outage handling; explicit user consent; server-side feature flag, monitoring and rollback. **Exit:** formal approval by responsible owner. Until then, live execution stays disabled.

---

## 12. Instructions for AI coding agents

Use this document as product source of truth and IMPLEMENTATION_STATUS.md as the current implementation record.

For each task:
1. Inspect repository/files first.
2. Identify user journey, route, API, schema and security boundary.
3. Keep change focused and define acceptance tests.
4. Implement backend with UI when required.
5. Validate on server and enforce ownership in server/database.
6. Add success/error/security tests.
7. Run tests, lint, typecheck if configured and production build; fix failures.
8. Update env examples, migrations and docs.
9. Review diff for unrelated changes, secrets and false feature claims.
10. Commit focused work or open a reviewable PR.
11. Verify CI/deployment; never claim a check passed unless observed.
12. If provider/account is not configured, show truthful disabled state.

Never delete failing tests, weaken RLS, reuse the unrelated database, expose secrets, hardcode fake price/balance/trade data, enable real execution without a formal gate, or claim a route is finished merely because it renders.

For substantial work, report changed files, APIs/schema touched, tests and their actual result, required configuration, remaining risks, and whether it was verified locally, in preview or production.

---

## 13. Current implementation baseline — 25 October 2026

This snapshot reflects the recorded implementation notes. Update it after verification.

### Already present in code
- Responsive public website and workspace navigation.
- Dashboard/profile/preferences foundation.
- Strategy library and strategy maker foundation.
- Browser-only CSV backtest with simplified rules and disclosed assumptions.
- Chart UI connected in code to public read-only Deriv WebSocket with reconnect/stale handling.
- Telegram preference/setup UI.
- Supabase Auth code and starter migration.
- Admin route/layout foundation.
- Sitemap/robots, status/health routes and GitHub Actions CI.

### Needs configuration or verification
- Auth/private persistence requires dedicated Anti Logic Supabase project, reviewed migration, redirect configuration and RLS tests.
- Production deployment must match reviewed main commit and canonical domain.
- Public Deriv chart must be tested in deployed browser.
- Latest CI success must be observed, not inferred from changed tests.

### Not production-complete
- Remote migration/full RLS/auth verification.
- Deriv account authorization/private account data.
- Provider proposals/orders/settlement/reconciliation/live execution.
- Server-side Telegram linking/delivery/webhook/deduplication/confirmed outcome alerts.
- Full admin user/role management.
- Persistent support/contact delivery.
- Server-backed blog CMS.
- Subscription billing.
- Final legal review, monitoring, backup/restore drill and security release review.

### Recorded launch blockers
- Last recorded PR-triggered CI failed before test expectations were corrected; verify a green run for the newer commit.
- Dependency install reported five vulnerabilities: two moderate, one high, two critical. Inspect and remediate or approve an explicit mitigation before launch.
- Vercel previously showed generic Supabase variable names while code expects Anti Logic-specific names. Confirm correct configuration without exposing values.
- The recorded READY deployment predates the foundation merge and does not prove latest main is live.
- Vercel SSO/protection and public reachability need verification.
- The separate Supabase project named **quotex-m1-signal-bot** must not be reused.

Only close a blocker after verification, not merely after making a code change.

---

## 14. Final production launch checklist

### Code/build
- [ ] Reviewed main commit identified.
- [ ] Unit, integration, RLS and E2E tests pass.
- [ ] Lint, typecheck and build pass.
- [ ] Critical/high dependencies remediated or mitigation approved.
- [ ] No secrets/environment files committed.
- [ ] Critical journeys contain no fake success/dead buttons.

### Supabase/auth
- [ ] Dedicated Anti Logic project verified.
- [ ] Correct preview/production variables configured.
- [ ] Reviewed migrations applied to the correct target.
- [ ] RLS and cross-user tests pass.
- [ ] Verification, recovery, redirects, expiry and sign-out tested.
- [ ] Admin/support role path secured.
- [ ] Backup/restore verified.

### Deriv/chart
- [ ] Current official docs/terms reviewed.
- [ ] Public chart tested from deployed browser.
- [ ] Source, connection and stale state visible.
- [ ] Account authorization separated from public chart.
- [ ] Credential/revoke/expiry handling tested before account features.
- [ ] Data retention/redistribution permissions reviewed.

### Telegram
- [ ] Bot/webhook secrets privately configured server-side.
- [ ] Expiring single-use linking challenge tested.
- [ ] Webhook authenticity checked.
- [ ] Outbox/idempotency/retries/failure states tested.
- [ ] Alerts use confirmed event source and accurate demo/live label.
- [ ] Unlink stops future delivery.

### Safety/operations
- [ ] Live execution disabled unless independently approved.
- [ ] Future order limits enforced server-side.
- [ ] Ambiguous requests reconciled, never blindly retried.
- [ ] Kill switch tested.
- [ ] Error tracking/redaction/health/alerts active.
- [ ] Rollback and incident procedures documented.
- [ ] Legal/privacy/cookie pages match the actual service and have review.
- [ ] Contact/support reach monitored services.
- [ ] Domain, HTTPS, access rules, sitemap and email delivery checked.
- [ ] Smoke test run against exact released commit.

---

## 15. Definition of finished Anti Logic

Anti Logic is production-ready only when public and authenticated journeys work; account data is secure; charts show source/freshness honestly; strategies persist and are versioned; backtests are reproducible and disclose assumptions; history distinguishes simulation from confirmed events; Telegram alerts are genuinely delivered and deduplicated; support and forms reach real services; admin actions are authorized/audited; dependency and security issues are addressed; backups/release processes are tested; and the deployed commit is verified.

The long-term vision includes secure account-authorized demo workflows and a separately gated possibility of live execution. The product earns that capability through testing and risk controls. Until then, Anti Logic should be a strong research, strategy, charting, backtesting and notification platform—not pretend to be an already-complete real-money trading bot.

**Founding principle:** build fewer features completely, verify them honestly, and expand only when safety and reliability can support the next capability.
