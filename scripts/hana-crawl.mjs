// Crawl ilovehana.com:
//  Stage 1: enumerate product URLs by walking category pages (?page=N).
//  Stage 2: fetch each product page, extract SKU code + color option labels.
// Output: scripts/data/hana-variations.json  { [code]: { colors: string[], url: string, title: string } }
import fs from 'node:fs';
import path from 'node:path';

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36';
const BASE = 'https://www.ilovehana.com';

const MODE = process.argv[2] || 'enumerate'; // 'enumerate' | 'verify' | 'fetch' | 'both'
const CATS_ARG = process.argv[3]; // optional file with category URLs to process
const CATEGORY_URLS_FILE = 'scripts/data/hana-category-urls.txt';
const PRODUCT_URLS_FILE = 'scripts/data/hana-product-urls.txt';
const OUT_FILE = 'scripts/data/hana-variations.json';
const PROGRESS_FILE = 'scripts/data/hana-fetch-progress.json';

const delay = (ms) => new Promise((r) => setTimeout(r, ms));

async function fetchText(url, tries = 3) {
  for (let i = 0; i < tries; i++) {
    try {
      const ctrl = new AbortController();
      const t = setTimeout(() => ctrl.abort(), 30000);
      const res = await fetch(url, {
        headers: { 'User-Agent': UA, Accept: 'text/html,*/*' },
        signal: ctrl.signal,
      });
      clearTimeout(t);
      if (res.status === 404) return null;
      if (!res.ok) throw new Error('HTTP ' + res.status);
      return await res.text();
    } catch (e) {
      if (i === tries - 1) throw e;
      await delay(1200 * (i + 1));
    }
  }
  return null;
}

function extractProductLinks(html, base) {
  const links = new Set();
  for (const m of html.matchAll(/href="(https:\/\/www\.ilovehana\.com\/[^"#?]*\/?)"/g)) {
    const href = m[1].replace(/\/+$/, '') + '/';
    // product pages: path has 2 segments like /c-c-argyle-pattern-cuff-beanie-winter-hat-htc0131/
    const segs = href.replace(BASE, '').split('/').filter(Boolean);
    if (segs.length === 1) {
      const slug = segs[0];
      if (
        slug.length > 8 &&
        !slug.startsWith('categories') &&
        !/^(about-us|blog|contact|sitemap|giftcertificates|login|cart|account|search|wishlist|products|checkout|orderstatus|productupdates|newsletter|privacy|terms|shipping|returns|faq|home|new|sale)/.test(slug)
      ) {
        links.add(href);
      }
    }
  }
  return links;
}

function codeFromSlug(slug) {
  // codes are trailing uppercase alnum segments like HTC0131, MS0394, G-1932, 5AL98086
  const m = slug.match(/(?:^|-)([A-Z0-9]{4,}[A-Z0-9-]*[A-Z0-9])$/);
  if (!m) return null;
  const code = m[1];
  if (/^(the|new|sale|blog|about)$/i.test(code)) return null;
  return code;
}

// A listing page that has no product-card markup was almost certainly
// throttled/blocked (BigCommerce returns a slim page). Only treat a page as
// genuinely empty when it has cards but no NEW links.
function hasProductCards(html) {
  return /data-product-id=|card-figure__link/.test(html);
}

async function enumerateCategories() {
  let cats = fs.existsSync(CATEGORY_URLS_FILE)
    ? fs.readFileSync(CATEGORY_URLS_FILE, 'utf8').split('\n').map((s) => s.trim()).filter(Boolean)
    : [];
  if (CATS_ARG) {
    cats = fs.readFileSync(CATS_ARG, 'utf8').split('\n').map((s) => s.trim()).filter(Boolean);
    console.log('Restricted to', cats.length, 'categories from', CATS_ARG);
  }
  console.log('Starting with', cats.length, 'category URLs');

  const allProducts = new Set();
  if (fs.existsSync(PRODUCT_URLS_FILE)) {
    for (const l of fs.readFileSync(PRODUCT_URLS_FILE, 'utf8').split('\n')) {
      const t = l.trim();
      if (t) allProducts.add(t);
    }
  }

  let totalPages = 0;
  for (let ci = 0; ci < cats.length; ci++) {
    const cat = cats[ci];
    let page = 1;
    let emptyRuns = 0;
    for (;;) {
      const url = page === 1 ? cat : `${cat}?page=${page}`;
      let html = null;
      let attempts = 0;
      while (attempts < 5) {
        attempts++;
        try {
          html = await fetchText(url);
        } catch (e) {
          console.log(`  [ERR] ${url}: ${e.message}`);
        }
        // Retry when a listing page comes back without any product cards.
        if (html && !hasProductCards(html) && attempts < 5) {
          const wait = 4000 * attempts + 1500;
          console.log(`  [RETRY] ${url} (attempt ${attempts}, no cards)`);
          await delay(wait);
          continue;
        }
        break;
      }
      if (!html) break; // 404 -> no more pages
      const links = extractProductLinks(html, BASE);
      if (links.size === 0) {
        console.log(`  [DBG] ${url}: html=${html.length} cards=${hasProductCards(html)} sample=${html.slice(0, 120).replace(/\s+/g, ' ')}`);
      }
      const before = allProducts.size;
      for (const l of links) allProducts.add(l);
      const added = allProducts.size - before;
      totalPages++;
      console.log(`[${ci + 1}/${cats.length}] page ${page} (${url}): +${added} products (total ${allProducts.size})`);
      if (added === 0) {
        emptyRuns++;
        if (emptyRuns >= 3) break;
      } else {
        emptyRuns = 0;
      }
      // stop when the page has fewer links than a typical page (last page) or no next link
      const hasNext = /page=(\d+)/.test(html);
      page++;
      if (links.size < 20 && !hasNext) break;
      if (page > 400) break;
      await delay(350);
    }
    await delay(300);
  }

  fs.writeFileSync(PRODUCT_URLS_FILE, [...allProducts].sort().join('\n'));
  console.log('ENUMERATION DONE:', allProducts.size, 'unique product URLs');
}

// Tokens that are sizes/abbreviations/codes, not color names.
const NON_COLOR_RE =
  /^(xs|s|m|l|xl|2xl|3xl|4xl|5xl|6xl|xxl|xxxl|sm|md|lg|one ?size|free ?size|sm\/ml|ml\/l|s\/m|m\/l|l\/xl|a|b|c|d|e|f|g|h|k|p|r|t|u|w|y|z|bk|bt|rd|wt|wh|gy|gr|bl|pk|nv|br|be|au|ag|dz|pc|pcs)$/i;
const CODE_LIKE_RE = /^[A-Z0-9][A-Z0-9-]*\d[A-Z0-9-]*$/i; // SJE311049-1, HTC0131 …
const COMBO_RE = /[()/\\]|\bcm\b|\bmm\b|\b\d+\.?\d*\s*(cm|mm|inch|\")|x\d+/i;

function isColorLabel(label) {
  const t = label.trim();
  if (t.length < 2) return false;
  if (NON_COLOR_RE.test(t)) return false;
  if (CODE_LIKE_RE.test(t)) return false;
  if (COMBO_RE.test(t)) return false;
  if (/^\d/.test(t)) return false;
  if (!/[A-Za-z]/.test(t)) return false;
  if (/^[A-Z]{1,3}$/.test(t)) return false; // uppercase abbreviations
  return true;
}

// Extract the color option group from a product page. BigCommerce renders each
// option as <div class="form-field" data-product-attribute="set-radio"> with a
// group label ("color:") and value labels (data-product-attribute-value).
function extractColors(html) {
  const blocks = html.split('data-product-attribute="');
  const colors = [];
  for (let i = 1; i < blocks.length; i++) {
    const block = blocks[i];
    const nameM = block.match(/<label[^>]*id="[^"]*"[^>]*>([\s\S]*?)<\/label>/);
    const groupName = nameM ? nameM[1].replace(/<[^>]+>/g, ' ').replace(/&amp;/g, '&').trim() : '';
    const values = [...block.matchAll(/data-product-attribute-value="\d+"[^>]*>([\s\S]*?)<\/label>/gi)]
      .map((m) => m[1].replace(/<[^>]+>/g, ' ').replace(/&amp;/g, '&').replace(/&#39;|&apos;/g, "'").replace(/\s+/g, ' ').trim())
      .filter(Boolean);
    const isColorGroup = /^color/i.test(groupName);
    for (const v of values) {
      if (isColorGroup && isColorLabel(v)) colors.push(v);
      // Non-color groups (size, material…) are ignored — this task is about
      // the color variations ilovehana lists.
    }
  }
  return [...new Set(colors)];
}

// The product image gallery: every image BigCommerce stores for the product
// (per-color photos are named with the color, e.g. JS2416-BLACK-1).
function extractGallery(html) {
  const urls = [...html.matchAll(/data-image-gallery-new-image-url="([^"]+)"/g)]
    .map((m) => m[1])
    .filter((u) => /\/stencil\/\d+x\d+\//.test(u))
    .map((u) => u.replace(/\/stencil\/\d+x\d+\//, '/stencil/900x900/'));
  return [...new Set(urls)];
}

async function fetchProducts(onlyMissing = false) {
  // URL set = union of the enumerated ilovehana listing and our own catalog
  // crawl (crawled-products.json carries the same ilovehana.com URLs).
  let urls = fs.readFileSync(PRODUCT_URLS_FILE, 'utf8').split('\n').map((s) => s.trim()).filter(Boolean);
  try {
    const crawled = JSON.parse(fs.readFileSync('scripts/data/crawled-products.json', 'utf8'));
    for (const p of crawled) {
      const u = (p.url || '').trim();
      if (u) urls.push(u);
    }
  } catch {
    // ignore
  }
  urls = [...new Set(urls.map((u) => u.replace(/\/+$/, '')))];

  let out = {};
  if (fs.existsSync(OUT_FILE)) out = JSON.parse(fs.readFileSync(OUT_FILE, 'utf8'));

  let progress = { done: 0, errors: 0 };
  if (fs.existsSync(PROGRESS_FILE)) progress = JSON.parse(fs.readFileSync(PROGRESS_FILE, 'utf8'));

  const pending = onlyMissing
    ? urls.filter((u) => !out[u] || !(out[u].colors || []).length || !(out[u].gallery || []).length)
    : urls;
  console.log('Pending fetches:', pending.length, 'of', urls.length);

  const CONCURRENCY = 8;
  let idx = 0;
  async function worker() {
    while (idx < pending.length) {
      const u = pending[idx++];
      try {
        const html = await fetchText(u);
        if (html) {
          const colors = extractColors(html);
          const gallery = extractGallery(html);
          const title = (html.match(/<title>([^<]*)<\/title>/) || [])[1] || '';
          const entry = out[u] || { colors: [], gallery: [], title: '' };
          entry.colors = [...new Set([...(entry.colors || []), ...colors])];
          entry.gallery = [...new Set([...(entry.gallery || []), ...gallery])];
          entry.title = title.replace(/ - HANA WHOLESALE/i, '').trim();
          out[u] = entry;
        } else {
          progress.errors++;
        }
      } catch (e) {
        progress.errors++;
        console.log('  [ERR]', u, e.message);
      }
      progress.done++;
      if (progress.done % 50 === 0) {
        fs.writeFileSync(PROGRESS_FILE, JSON.stringify(progress));
        fs.writeFileSync(OUT_FILE, JSON.stringify(out, null, 1));
        console.log(`  progress ${progress.done}/${pending.length} (errors ${progress.errors})`);
      }
      await delay(120);
    }
  }
  await Promise.all(Array.from({ length: CONCURRENCY }, worker));
  fs.writeFileSync(PROGRESS_FILE, JSON.stringify(progress));
  fs.writeFileSync(OUT_FILE, JSON.stringify(out, null, 1));

  const withColors = Object.entries(out).filter(([, v]) => (v.colors || []).length > 0);
  const withGallery = Object.entries(out).filter(([, v]) => (v.gallery || []).length > 1);
  console.log('FETCH DONE:', Object.keys(out).length, 'urls,', withColors.length, 'with colors,', withGallery.length, 'with gallery');
}

(async () => {
  if (MODE === 'enumerate') await enumerateCategories();
  if (MODE === 'fetch') await fetchProducts(true);
  if (MODE === 'fetchAll') await fetchProducts(false);
  if (MODE === 'both') {
    await enumerateCategories();
    await fetchProducts(false);
  }
})();
