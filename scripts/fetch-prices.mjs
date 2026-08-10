// Fetch the real price for every unique product on ilovehana.com.
// The public pages say "Log in for pricing", but each product page embeds the
// price in `var BCData = {"product_attributes":{...,"price":{"without_tax":{...}}}}`
// and in JSON-LD. We extract that.
//
// Output: scripts/data/crawled-prices.json — a map of product URL -> price.
// Resumable: already-fetched URLs are skipped, so a re-run continues where it
// left off. Rate-limited (3 concurrent, 300ms gap) to be polite to the server.
// Usage: node scripts/fetch-prices.mjs

import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = resolve(__dirname, 'data');
const PRODUCTS_JSON = resolve(DATA_DIR, 'crawled-products.json');
const PRICES_JSON = resolve(DATA_DIR, 'crawled-prices.json');

const USER_AGENT =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36';
const DELAY_MS = 300;
const RETRIES = 3;
const CONCURRENCY = 3;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const rawProducts = JSON.parse(readFileSync(PRODUCTS_JSON, 'utf8'));

// Unique product URLs, keeping crawl order.
const unique = [];
const seen = new Set();
for (const p of rawProducts) {
  if (seen.has(p.url)) continue;
  seen.add(p.url);
  unique.push(p);
}

// Resume: load prices already fetched.
let prices = {};
try {
  prices = JSON.parse(readFileSync(PRICES_JSON, 'utf8'));
} catch {
  // fresh start
}
const queue = unique.filter((p) => prices[p.url] === undefined);
const total = unique.length;

let done = 0;
let ok = 0;
let fail = 0;
let sinceSave = 0;

const log = (msg) => console.log(`[${new Date().toISOString()}] ${msg}`);

const save = () => {
  writeFileSync(PRICES_JSON, JSON.stringify(prices, null, 1));
  sinceSave = 0;
};

async function fetchPrice(url) {
  for (let attempt = 1; attempt <= RETRIES; attempt++) {
    try {
      const res = await fetch(url + '/', {
        headers: { 'User-Agent': USER_AGENT },
        redirect: 'follow',
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const html = await res.text();
      // BCData product_attributes price (exact match for the logged-out page).
      const m = html.match(/"without_tax":\{"formatted":"[^"]*","value":([0-9.]+)/);
      if (m) return parseFloat(m[1]);
      // JSON-LD offer price fallback.
      const m2 = html.match(/"price"\s*:\s*"([0-9.]+)"/);
      if (m2) return parseFloat(m2[1]);
      return null; // page had no price (e.g. call-for-price product)
    } catch (err) {
      if (attempt < RETRIES) {
        log(`  retry ${attempt}/${RETRIES} ${url}: ${err.message}`);
        await sleep(1000 * attempt);
      } else {
        log(`  FAILED ${url}: ${err.message}`);
        return null;
      }
    }
  }
  return null;
}

async function worker() {
  while (queue.length) {
    const p = queue.shift();
    const price = await fetchPrice(p.url);
    if (price != null && price > 0) {
      prices[p.url] = price;
      ok++;
    } else {
      fail++;
      log(`  no price for ${p.url}`);
    }
    done++;
    sinceSave++;
    if (sinceSave >= 25) save();
    if (done % 100 === 0 || done === total) {
      log(`progress ${done}/${total} (ok ${ok}, missing ${fail})`);
    }
    await sleep(DELAY_MS);
  }
}

async function main() {
  log(`starting: ${queue.length} of ${total} unique products to fetch (${Object.keys(prices).length} already on file)`);
  const workers = Array.from({ length: CONCURRENCY }, () => worker());
  await Promise.all(workers);
  save();
  log(`done: ${ok} prices saved, ${fail} missing; file: ${PRICES_JSON}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
