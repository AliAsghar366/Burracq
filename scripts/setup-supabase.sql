-- ============================================================
-- BURACQ — Supabase setup for the admin panel & analytics
-- Run this in the Supabase dashboard: SQL Editor → New query → Run.
-- ============================================================

-- 1) Orders table — make sure every column the storefront writes exists
--    (order_id, items, customer and created_at usually already exist; the
--    rest are added here). Stages: placed → confirmed → shipped → delivered
--    (+ cancelled).
alter table public.orders
  add column if not exists order_id text not null,
  add column if not exists items jsonb not null default '[]',
  add column if not exists total_items int not null default 0,
  add column if not exists subtotal numeric not null default 0,
  add column if not exists bill numeric not null default 0,
  add column if not exists name text not null default '',
  add column if not exists address text not null default '',
  add column if not exists city text not null default '',
  add column if not exists customer jsonb,
  add column if not exists status text not null default 'placed',
  add column if not exists created_at timestamptz not null default now();

-- 2) Order status history (audit trail of stage changes)
create table if not exists public.order_status_log (
  id bigint generated always as identity primary key,
  order_id text not null,
  status text not null,
  note text,
  changed_at timestamptz not null default now()
);

-- 3) Storefront analytics — one row per page view, with the region
--    inferred from the visitor's timezone (no IPs are ever collected).
create table if not exists public.analytics_views (
  id bigint generated always as identity primary key,
  path text not null,
  region text,
  session_id text,
  user_agent text,
  viewed_at timestamptz not null default now()
);

-- 4) Row Level Security
--    NOTE: these policies are deliberately permissive so the browser-based
--    admin can read/update orders with the anon key. That means anyone who
--    knows the anon key (it ships in the JS bundle) can also read orders.
--    For a production store, replace this with Supabase Auth:
--    sign admins in with email/password and restrict SELECT/UPDATE to the
--    authenticated admin role (see README → "Hardening the admin panel").
alter table public.orders enable row level security;
alter table public.order_status_log enable row level security;
alter table public.analytics_views enable row level security;

-- Drop-then-create makes this safe to run more than once.
drop policy if exists "anon can insert orders" on public.orders;
drop policy if exists "anon can read orders" on public.orders;
drop policy if exists "anon can update orders" on public.orders;
create policy "anon can insert orders" on public.orders
  for insert to anon with check (true);
create policy "anon can read orders" on public.orders
  for select to anon using (true);
create policy "anon can update orders" on public.orders
  for update to anon using (true) with check (true);

drop policy if exists "anon can insert status log" on public.order_status_log;
drop policy if exists "anon can read status log" on public.order_status_log;
create policy "anon can insert status log" on public.order_status_log
  for insert to anon with check (true);
create policy "anon can read status log" on public.order_status_log
  for select to anon using (true);

drop policy if exists "anon can insert views" on public.analytics_views;
drop policy if exists "anon can read views" on public.analytics_views;
create policy "anon can insert views" on public.analytics_views
  for insert to anon with check (true);
create policy "anon can read views" on public.analytics_views
  for select to anon using (true);
