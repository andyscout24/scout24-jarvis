-- Social Jarvis Dashboard
-- PostgreSQL / Supabase schema for the internal Automation Hub.

create extension if not exists pgcrypto;

create table if not exists users (
  id uuid primary key default gen_random_uuid(),
  external_auth_id text unique,
  name text not null,
  email text not null unique,
  role text not null check (role in ('admin', 'sales_user', 'marketing_user', 'management_viewer')),
  team text,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists clients (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  external_ref text unique,
  industry text,
  owner_user_id uuid references users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists tools (
  id text primary key,
  name text not null,
  description text not null,
  category text not null,
  status text not null check (status in ('ready', 'in_progress', 'error', 'disabled', 'pending_connection')),
  is_active boolean not null default true,
  owner_team text,
  route text,
  external_url text,
  integration_type text not null default 'manual',
  integration_state text not null default 'planned',
  config jsonb not null default '{}'::jsonb,
  metadata jsonb not null default '{}'::jsonb,
  last_run_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists automations (
  id text primary key,
  tool_id text not null references tools(id) on delete cascade,
  name text not null,
  description text,
  schedule text not null default 'manual',
  enabled boolean not null default false,
  created_by_user_id uuid references users(id) on delete set null,
  config jsonb not null default '{}'::jsonb,
  last_run_at timestamptz,
  next_run_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists automation_runs (
  id text primary key default gen_random_uuid()::text,
  automation_id text references automations(id) on delete set null,
  tool_id text not null references tools(id) on delete cascade,
  client_id uuid references clients(id) on delete set null,
  status text not null check (status in ('queued', 'running', 'succeeded', 'failed', 'cancelled')),
  trigger_source text not null check (trigger_source in ('manual', 'schedule', 'api', 'system')),
  actor_user_id uuid references users(id) on delete set null,
  input jsonb not null default '{}'::jsonb,
  output jsonb not null default '{}'::jsonb,
  error_code text,
  error_message text,
  started_at timestamptz not null default now(),
  finished_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists reports (
  id text primary key default gen_random_uuid()::text,
  tool_id text not null references tools(id) on delete restrict,
  client_id uuid references clients(id) on delete set null,
  automation_run_id text references automation_runs(id) on delete set null,
  campaign_name text not null,
  report_type text not null default 'campaign_review',
  reporting_period text,
  channel text,
  data_source text,
  data_source_label text,
  status text not null check (status in ('draft', 'generated', 'in_review', 'pending_connection', 'exported', 'completed', 'error')),
  file_name text,
  file_url text,
  error_message text,
  created_by_user_id uuid references users(id) on delete set null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists offers (
  id text primary key default gen_random_uuid()::text,
  tool_id text not null references tools(id) on delete restrict,
  client_id uuid references clients(id) on delete set null,
  automation_run_id text references automation_runs(id) on delete set null,
  offer_number text unique,
  status text not null check (status in ('draft', 'generated', 'sent', 'accepted', 'rejected', 'error')),
  amount numeric(12, 2),
  currency char(3) not null default 'EUR',
  file_name text,
  file_url text,
  created_by_user_id uuid references users(id) on delete set null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists api_connections (
  id uuid primary key default gen_random_uuid(),
  tool_id text references tools(id) on delete cascade,
  name text not null,
  base_url text,
  health_endpoint text,
  auth_type text not null default 'none' check (auth_type in ('none', 'api_key', 'oauth2', 'basic', 'service_role')),
  status text not null default 'unknown' check (status in ('healthy', 'degraded', 'down', 'unknown', 'disabled')),
  last_checked_at timestamptz,
  last_error text,
  config jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists activity_logs (
  id text primary key default gen_random_uuid()::text,
  tool_id text references tools(id) on delete set null,
  automation_run_id text references automation_runs(id) on delete set null,
  user_id uuid references users(id) on delete set null,
  timestamp timestamptz not null default now(),
  actor_label text not null default 'System',
  action text not null default 'activity.logged',
  status text not null check (status in ('info', 'success', 'warning', 'error')),
  level text not null default 'info' check (level in ('info', 'success', 'warning', 'error')),
  message text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists settings (
  setting_key text primary key,
  scope text not null default 'global' check (scope in ('global', 'tool', 'user')),
  tool_id text references tools(id) on delete cascade,
  user_id uuid references users(id) on delete cascade,
  value jsonb not null,
  is_secret boolean not null default false,
  updated_by_user_id uuid references users(id) on delete set null,
  updated_at timestamptz not null default now()
);

create index if not exists idx_users_role_active on users(role, active);
create index if not exists idx_clients_owner on clients(owner_user_id);
create index if not exists idx_tools_status_active on tools(status, is_active);
create index if not exists idx_tools_integration_type on tools(integration_type);
create index if not exists idx_automations_tool_enabled on automations(tool_id, enabled);
create index if not exists idx_automation_runs_tool_started on automation_runs(tool_id, started_at desc);
create index if not exists idx_automation_runs_status_started on automation_runs(status, started_at desc);
create index if not exists idx_reports_tool_created on reports(tool_id, created_at desc);
create index if not exists idx_reports_client_created on reports(client_id, created_at desc);
create index if not exists idx_reports_status on reports(status);
create index if not exists idx_reports_source_created on reports(data_source, created_at desc);
create index if not exists idx_offers_tool_created on offers(tool_id, created_at desc);
create index if not exists idx_offers_client_created on offers(client_id, created_at desc);
create index if not exists idx_offers_status on offers(status);
create index if not exists idx_activity_logs_tool_created on activity_logs(tool_id, created_at desc);
create index if not exists idx_activity_logs_level_created on activity_logs(level, created_at desc);
create index if not exists idx_activity_logs_status_created on activity_logs(status, created_at desc);
create index if not exists idx_api_connections_tool_status on api_connections(tool_id, status);
create index if not exists idx_settings_scope on settings(scope, tool_id, user_id);
