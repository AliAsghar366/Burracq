// Check availability of every unique product image URL.
// Writes scripts/data/broken-images.json: [{ slug, url, status }]
// Usage: node scripts/check-images.mjs

import { readFileSync, writeFileSync } from 'node:fs';

const products = JSON.parse(readFileSync('scripts/data/crawled-products.json', 'utf8'));

const seen = new Map(); // url -> slug
for (const p of products) {
  if (!seen.has(p.image)) seen.set(p.image, p.slug);
}
const urls = [...seen.entries()];
console.log(`checking ${urls.length} unique images...`);

const CONCURRENCY = 12;
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36';

async function check(url) {
  // HEAD first; some CDNs reject HEAD, fall back to GET with a tiny range.
  for (const opts of [
    { method: 'HEAD' },
    { method: 'GET', headers: { Range: 'bytes=0-0' } },
  ]) {
    try {
      const res = await fetch(url, { method: opts.method, headers: { 'User-Agent': UA, ...(opts.headers || {}) }, redirect: 'follow' });
      if (res.ok) return { ok: true, status: res.status };
      if (res.status === 405 || res.status === 403) continue;
      return { ok: false, status: res.status };
    } catch (err) {
      return { ok: false, status: 'ERR' };
    }
  }
  return { ok: false, status: 'BLOCKED' };
}

let idx = 0;
let broken = [];
let okCount = 0;
let done = 0;

async function worker() {
  while (idx < urls.length) {
    const i = idx++;
    const [url, slug] = urls[i];
    const result = await check(url);
    if (result.ok) {
      okCount++;
    } else {
      broken.push({ slug, url, status: String(result.status) });
    }
    done++;
    if (done % 250 === 0) console.log(`  ${done}/${urls.length} checked, ${broken.length} broken`);
  }
}

const workers = Array.from({ length: CONCURRENCY }, () => worker());
await Promise.all(workers);

writeFileSync('scripts/data/broken-images.json', JSON.stringify(broken, null, 1));
console.log('='.repeat(50));
console.log(`done: ${okCount} ok, ${broken.length} broken of ${urls.length}`);
