-- ============================================================
-- BURACQ — Supabase Setup (run once)
--
-- HOW TO USE:
--   1. Change YOUR_EMAIL and YOUR_PASSWORD below
--   2. Dashboard → SQL Editor → New query → Paste → Run
--
-- The email is used internally by Supabase Auth only.
-- The admin login form asks for PASSWORD ONLY — no email field.
-- ============================================================

-- ★ STEP 1: Change these two values ★
--   Pick any email (this is internal, never shown to the user)
--   Pick a strong password

DO $$
DECLARE
  admin_email    text := 'admin@burracq.com';   -- ← change this
  admin_password text := 'MyStr0ngP@ssword!';    -- ← change this
  admin_id       uuid;
BEGIN
  -- ─── Create admin user in Supabase Auth ──────────────────
  admin_id := gen_random_uuid();

  INSERT INTO auth.users (
    instance_id, id, aud, role, email, encrypted_password,
    email_confirmed_at, confirmation_token, confirmation_sent_at,
    raw_user_meta_data, created_at, updated_at,
    recovery_token, recovery_sent_at, last_sign_in_at, factors
  ) VALUES (
    '00000000-0000-0000-0000-000000000000',
    admin_id,
    'authenticated',
    'authenticated',
    admin_email,
    crypt(admin_password, gen_salt('bf')),
    now(), '', now(),
    jsonb_build_object('full_name', 'BURACQ Admin'),
    now(), now(), '', now(), now(), '[]'::jsonb
  );

  INSERT INTO auth.identities (
    id, user_id, identity_data, provider,
    last_sign_in_at, created_at, updated_at
  ) VALUES (
    gen_random_uuid(),
    admin_id,
    jsonb_build_object('sub', admin_id::text, 'email', admin_email),
    'email', now(), now(), now()
  );

  RAISE NOTICE 'Admin user created: %', admin_email;
END $$;

-- ─── Orders table ──────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.orders (
  id            BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  order_id      TEXT UNIQUE NOT NULL,
  items         JSONB NOT NULL DEFAULT '[]',
  total_items   INT NOT NULL DEFAULT 0,
  subtotal      NUMERIC NOT NULL DEFAULT 0,
  bill          NUMERIC NOT NULL DEFAULT 0,
  name          TEXT NOT NULL DEFAULT '',
  address       TEXT NOT NULL DEFAULT '',
  city          TEXT NOT NULL DEFAULT '',
  customer      JSONB,
  payment_method TEXT,
  status        TEXT NOT NULL DEFAULT 'placed',
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ─── Order status history ──────────────────────────────────

CREATE TABLE IF NOT EXISTS public.order_status_log (
  id         BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  order_id   TEXT NOT NULL,
  status     TEXT NOT NULL,
  note       TEXT,
  changed_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ─── Storefront analytics ──────────────────────────────────

CREATE TABLE IF NOT EXISTS public.analytics_views (
  id         BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  path       TEXT NOT NULL,
  region     TEXT,
  session_id TEXT,
  user_agent TEXT,
  viewed_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ─── Row Level Security ────────────────────────────────────
--
--   Customers (anon)      → INSERT only (place orders + track views)
--   Admin (authenticated) → full READ + UPDATE on all tables
--
-- This means the Supabase anon key CANNOT read orders.
-- Only the authenticated admin session can access them.

ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_status_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analytics_views ENABLE ROW LEVEL SECURITY;

-- Drop old policies safely
DO $$ BEGIN
  DROP POLICY IF EXISTS "anon can insert orders" ON public.orders;
  DROP POLICY IF EXISTS "authenticated can read orders" ON public.orders;
  DROP POLICY IF EXISTS "authenticated can update orders" ON public.orders;
  DROP POLICY IF EXISTS "anon can insert status log" ON public.order_status_log;
  DROP POLICY IF EXISTS "authenticated can read status log" ON public.order_status_log;
  DROP POLICY IF EXISTS "anon can insert views" ON public.analytics_views;
  DROP POLICY IF EXISTS "authenticated can read views" ON public.analytics_views;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

-- ORDERS: anon can INSERT, authenticated can SELECT + UPDATE
CREATE POLICY "anon can insert orders"
  ON public.orders FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "authenticated can read orders"
  ON public.orders FOR SELECT TO authenticated USING (true);
CREATE POLICY "authenticated can update orders"
  ON public.orders FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

-- STATUS LOG: anon can INSERT, authenticated can SELECT
CREATE POLICY "anon can insert status log"
  ON public.order_status_log FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "authenticated can read status log"
  ON public.order_status_log FOR SELECT TO authenticated USING (true);

-- ANALYTICS: anon can INSERT, authenticated can SELECT
CREATE POLICY "anon can insert views"
  ON public.analytics_views FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "authenticated can read views"
  ON public.analytics_views FOR SELECT TO authenticated USING (true);

-- ============================================================
-- ✓ DONE
--
-- What was created:
--   • Admin user in Supabase Auth (email + bcrypt password)
--   • Tables: orders, order_status_log, analytics_views
--   • RLS: customers can only INSERT, admin can READ + UPDATE
--
-- Next: update .env with your new Supabase project credentials
-- ============================================================
