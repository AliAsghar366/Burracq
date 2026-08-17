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
- **Variations** — products that share a supplier code (or a specific name,
  for colorways that ship under their own code) are treated as one product
  with color/style variations. Product pages show a color picker (swatches
  link to each variant's page) and grids dedupe so each product appears once
  with a swatch row on its card.
- **ilovehana.com color variations** — `scripts/hana-crawl.mjs` scrapes the
  "color:" option list AND the per-color image gallery from ilovehana.com's
  product pages (matched to our catalog by the ilovehana URL each product was
  crawled from). Product pages render the variations inside the product view:
  a thumbnail strip under the main image (one photo per color, swapping the
  main image in place) plus an "Available in:" chip row that jumps to the
  matching photo, and the color names are spelled out in the description.
- **Fast-loading images** — grid cards request a smaller CDN stencil size
  (450×450) instead of the full 900×900 image, and a bundled placeholder
  renders if any image ever fails to load.

### Rebuilding the catalog

```bash
node scripts/build-catalog.mjs   # regenerates src/data/catalog.ts
npm run dev                      # local dev server
npm run build                    # typecheck + production build
npm run lint                     # oxlint
```

### Variations & dedupe

`src/data/catalog.ts` (generated) exposes helpers used across the storefront:

- `variantsFor(product)` — every color/style variation of a product
  (grouped by supplier code, falling back to a shared specific name).
- `variantNameOf(product)` — human-readable label parsed from the slug.
- `uniqueProducts(list)` — collapses multi-category duplicates and color
  variations so grids show one card per product.

Re-crawling the supplier site is optional and rate-limited:

```bash
node scripts/crawl.mjs           # refreshes scripts/data/crawled-*.json
node scripts/fetch-prices.mjs    # refreshes wholesale prices
node scripts/hana-crawl.mjs enumerate   # walks ilovehana.com category pages
node scripts/hana-crawl.mjs fetch       # fetches product pages -> scripts/data/hana-variations.json
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

## Notes for launch

- Product images come from the supplier's CDN — confirm you have permission to
  reuse them before launch.
- `INBOUND_FACTOR` is a rough assumption; replace it with your real inbound
  shipping cost per item for accurate landed cost.
- Orders are confirmed by phone/email; no online payment gateway is wired up
  yet (see `src/lib/supabase.ts` for best-effort order sync and the Stripe
  TODO in `src/context/CartContext.tsx`).
- The contact form opens the visitor's email app (`mailto:`); swap in a real
  support email before launch.
