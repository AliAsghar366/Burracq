# BURACQ — Fashion, Accessories & Everyday Finds

A customer-facing retail e-commerce storefront (React + TypeScript + Vite). BURACQ
sells individual products — hats, bags, accessories, apparel and more — at retail
prices, with the supplier (HANA / ilovehana.com) kept behind the scenes.

## Retail conversion

The store is built from a crawled snapshot of the supplier's catalog
(`scripts/data/crawled-*.json`). `scripts/build-catalog.mjs` transforms it into
`src/data/catalog.ts`:

- **Single-unit selling** — supplier pack quantities (e.g. `(12pairs)`, `(6pc)`,
  `(DZ)`) are divided out so customers buy one unit. The pack size is kept as
  backend metadata (`packSize`) for inventory management.
- **Retail pricing** — every item shows two prices: the discounted price =
  landed cost × `RETAIL_MULTIPLIER` (2.7) and a compare-at ("was") price =
  landed cost × `REAL_PRICE_MULTIPLIER` (3.7), both rounded to `.99` price
  points. Landed cost = supplier unit cost × `INBOUND_FACTOR` (1.1, an
  estimate for inbound shipping/per-item costs). Tune these constants at the
  top of the build script.
- **Retail titles** — supplier model codes are moved into a `sku` field and the
  "C.C" brand, pack suffixes and code fragments are stripped from titles.
- **Original copy** — every product description and category tagline is
  generated retail copy (no supplier text is reused).

### Rebuilding the catalog

```bash
node scripts/build-catalog.mjs   # regenerates src/data/catalog.ts
npm run dev                      # local dev server
npm run build                    # typecheck + production build
npm run lint                     # oxlint
```

Re-crawling the supplier site is optional and rate-limited:

```bash
node scripts/crawl.mjs           # refreshes scripts/data/crawled-*.json
node scripts/fetch-prices.mjs    # refreshes wholesale prices
```

## Admin panel (/admin)

The store has a hidden admin dashboard at `/admin` (no links to it anywhere on
the site). Password: `burracq1214`. It shows:

- **Dashboard** — KPIs (unique visitors, page views, orders, revenue, order
  conversion), the order-stage funnel (placed → confirmed → shipped →
  delivered with drop-off %), recent orders and visitor regions.
- **Orders** — search by order # / name / city / phone, filter by status and
  date range, sort by date or total, change an order's stage inline, expand
  rows for item/shipping detail, and download PDFs (all filtered orders or a
  single order).
- **Analytics** — page views per day, top pages and visitor regions. Views
  are recorded automatically as visitors browse the storefront (region is
  inferred from the browser timezone — no IPs are collected).

**Setup:** run `scripts/setup-supabase.sql` in the Supabase SQL editor once. It
adds the `status` column to `orders`, creates `order_status_log` and
`analytics_views`, and enables the Row Level Security policies the app needs.

> ⚠️ **Security note:** the `/admin` password is a client-side gate (the hash
> lives in the JS bundle) — it keeps casual visitors out but is not real
> security. The current SQL policies also let the anon key read orders, which
> is fine for development. Before launch, harden this:
> 1. Switch `/admin` to Supabase Auth (email/password sign-in against an
>    `admins` table).
> 2. Change the RLS policies so only the authenticated admin role can
>    SELECT/UPDATE orders (anon can only INSERT orders and views).
> 3. Move sensitive reads behind a server endpoint (Supabase Edge Function)
>    using the service-role key instead of the anon key.

## PayPal checkout

The cart offers PayPal as an online payment option. Architecture:

- **Browser** — the PayPal JS SDK (loaded with the *public* client ID) renders
  the buttons on the cart page (`src/components/PayPalButton.tsx`,
  `src/lib/paypal.ts`). The browser never sees the secret.
- **Server** — two Netlify Functions create and capture the order with the
  PayPal REST API (`netlify/functions/create-paypal-order.js`,
  `netlify/functions/capture-paypal-order.js`). These hold the secret.

### Environment variables

| Variable | Used by | Notes |
| --- | --- | --- |
| `VITE_PAYPAL_CLIENT_ID` | Browser | Public client ID; enables the PayPal button. Inlined at build time. |
| `VITE_PAYPAL_ENV` | Browser | `live` or `sandbox` (default `live`). |
| `PAYPAL_CLIENT_ID` | Functions | Server-side client ID. |
| `PAYPAL_CLIENT_SECRET` | Functions | **Secret — never expose to the browser or commit to git.** |
| `PAYPAL_ENV` | Functions | `live` or `sandbox` (default `live`). |

**Local development:** copy `.env.example` to `.env` and fill in the keys (the
`.env` file is git-ignored). Vite picks up the `VITE_*` values automatically;
the functions read `PAYPAL_*` at runtime. `npm run dev` serves the Netlify
Functions locally too (see `vite.config.ts`), so PayPal checkout works in
plain dev — no `netlify dev` needed. You can also use `netlify dev` if you
prefer the official emulator.

**Netlify (production):** in the Netlify dashboard go to **Site settings →
Environment variables** and add the same five variables (the client will
supply the real keys). No code changes needed — the build inlines
`VITE_*` and the functions read `PAYPAL_*` at runtime. The values are
**not** committed to the repo, so they must be added there.

**Testing:** use PayPal sandbox credentials with `PAYPAL_ENV=sandbox` /
`VITE_PAYPAL_ENV=sandbox` before going live. The keys currently in `.env`
are **live** credentials — real money moves when a payment is approved.

## Notes for launch

- Product images come from the supplier's CDN — confirm you have permission to
  reuse them before launch.
- `INBOUND_FACTOR` is a rough assumption; replace it with your real inbound
  shipping cost per item for accurate landed cost.
- Orders are confirmed by phone/email; payment is taken via PayPal (see above)
  or **Cash on Delivery** — the cart asks the customer to pick a payment method
  at checkout. Order data syncs best-effort to Supabase (`src/lib/supabase.ts`),
  including the chosen `payment_method`.
- The contact form opens the visitor's email app (`mailto:`); swap in a real
  support email before launch.
