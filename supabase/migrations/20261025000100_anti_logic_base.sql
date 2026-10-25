-- Anti Logic starter schema.
-- Apply only to a dedicated Anti Logic Supabase project, NOT to an existing trading-bot database.
-- Do not store provider-originating Deriv content here without explicit permission.

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null default '' check (char_length(display_name) <= 80),
  username text unique check (username is null or username ~ '^[A-Za-z0-9_-]{3,24}$'),
  avatar_url text,
  preferred_language text not null default 'en' check (preferred_language in ('en','ur')),
  time_zone text not null default 'Asia/Karachi',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.user_preferences (
  user_id uuid primary key references auth.users(id) on delete cascade,
  theme text not null default 'dark' check (theme in ('dark','light','system')),
  preferred_symbol text,
  default_account_mode text not null default 'demo' check (default_account_mode in ('demo','live')),
  notification_preferences jsonb not null default '{"in_app":true,"email":false,"telegram":false}'::jsonb,
  updated_at timestamptz not null default now()
);

create table if not exists public.strategies (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null check (char_length(name) between 3 and 80),
  description text not null default '' check (char_length(description) <= 1000),
  symbol text not null,
  contract_type text not null,
  configuration jsonb not null default '{}'::jsonb check (jsonb_typeof(configuration) = 'object'),
  status text not null default 'draft' check (status in ('draft','validated','disabled')),
  current_version integer not null default 1 check (current_version > 0),
  unique (id, user_id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists strategies_user_updated_idx on public.strategies (user_id, updated_at desc);

create table if not exists public.strategy_versions (
  id uuid primary key default gen_random_uuid(),
  strategy_id uuid not null,
  user_id uuid not null references auth.users(id) on delete cascade,
  version integer not null check (version > 0),
  configuration jsonb not null check (jsonb_typeof(configuration) = 'object'),
  created_at timestamptz not null default now(),
  unique (strategy_id, version),
  constraint strategy_versions_owned_strategy_fkey foreign key (strategy_id, user_id) references public.strategies(id, user_id) on delete cascade
);
create index if not exists strategy_versions_user_strategy_idx on public.strategy_versions (user_id, strategy_id, version desc);

create table if not exists public.telegram_connections (
  user_id uuid primary key references auth.users(id) on delete cascade,
  telegram_chat_id text unique,
  is_connected boolean not null default false,
  notification_preferences jsonb not null default '{"win":true,"loss":true,"automation":true,"connection":true}'::jsonb,
  connected_at timestamptz,
  updated_at timestamptz not null default now()
);

create table if not exists public.automation_preferences (
  user_id uuid primary key references auth.users(id) on delete cascade,
  enabled boolean not null default false,
  account_mode text not null default 'demo' check (account_mode in ('demo','live')),
  max_stake numeric(18,6) not null default 1 check (max_stake > 0),
  daily_loss_limit numeric(18,6) not null default 10 check (daily_loss_limit > 0),
  max_open_contracts integer not null default 1 check (max_open_contracts between 1 and 20),
  updated_at timestamptz not null default now()
);

create table if not exists public.app_audit_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  action text not null check (char_length(action) between 1 and 100),
  resource_type text,
  resource_id text,
  metadata jsonb not null default '{}'::jsonb check (jsonb_typeof(metadata) = 'object'),
  created_at timestamptz not null default now()
);
create index if not exists app_audit_events_user_created_idx on public.app_audit_events (user_id, created_at desc);

alter table public.profiles enable row level security;
alter table public.user_preferences enable row level security;
alter table public.strategies enable row level security;
alter table public.strategy_versions enable row level security;
alter table public.telegram_connections enable row level security;
alter table public.automation_preferences enable row level security;
alter table public.app_audit_events enable row level security;

create policy "profiles_select_own" on public.profiles for select to authenticated using ((select auth.uid()) = id);
create policy "profiles_insert_own" on public.profiles for insert to authenticated with check ((select auth.uid()) = id);
create policy "profiles_update_own" on public.profiles for update to authenticated using ((select auth.uid()) = id) with check ((select auth.uid()) = id);

create policy "preferences_select_own" on public.user_preferences for select to authenticated using ((select auth.uid()) = user_id);
create policy "preferences_insert_own" on public.user_preferences for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "preferences_update_own" on public.user_preferences for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

create policy "strategies_select_own" on public.strategies for select to authenticated using ((select auth.uid()) = user_id);
create policy "strategies_insert_own" on public.strategies for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "strategies_update_own" on public.strategies for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "strategies_delete_own" on public.strategies for delete to authenticated using ((select auth.uid()) = user_id);

create policy "strategy_versions_select_own" on public.strategy_versions for select to authenticated using ((select auth.uid()) = user_id);
create policy "strategy_versions_insert_own" on public.strategy_versions for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "strategy_versions_delete_own" on public.strategy_versions for delete to authenticated using ((select auth.uid()) = user_id);

create policy "telegram_select_own" on public.telegram_connections for select to authenticated using ((select auth.uid()) = user_id);
create policy "telegram_delete_own" on public.telegram_connections for delete to authenticated using ((select auth.uid()) = user_id);

create policy "automation_preferences_select_own" on public.automation_preferences for select to authenticated using ((select auth.uid()) = user_id);

create policy "audit_events_select_own" on public.app_audit_events for select to authenticated using ((select auth.uid()) = user_id);

-- No anonymous access, no public write access, no service-role key in browser code.

-- Explicit least-privilege grants for the public Data API. RLS still controls each row.
grant usage on schema public to authenticated;
grant select, insert, update on public.profiles to authenticated;
grant select, insert, update on public.user_preferences to authenticated;
grant select, insert, update, delete on public.strategies to authenticated;
grant select, insert, delete on public.strategy_versions to authenticated;
grant select, delete on public.telegram_connections to authenticated;
grant select on public.automation_preferences to authenticated;
grant select on public.app_audit_events to authenticated;

-- Verified Telegram connection state and automation controls must be written by trusted
-- server-side code, never directly by an untrusted browser client.
