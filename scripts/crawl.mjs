// Crawl all categories from ilovehana.com, extracting product cards (name, url, image).
// Writes scripts/data/crawled-categories.json and scripts/data/crawled-products.json.
// Rate-limited to be polite to the server.
// Usage: node scripts/crawl.mjs

import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = resolve(__dirname, 'data');
mkdirSync(DATA_DIR, { recursive: true });

const DELAY_MS = 500;
const RETRIES = 2;
const USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36';

// ---- category list from the nav -------------------------------------------
// Each entry: { slug, name, url }
const CATEGORIES = [
  { slug: 'new', name: 'New', url: 'https://www.ilovehana.com/categories/new.html' },
  { slug: 'patriotic-pride', name: 'Patriotic Pride Collection', url: 'https://www.ilovehana.com/categories/patriotic-pride-collection.html' },
  { slug: 'cc-beanie', name: 'C.C Beanie', url: 'https://www.ilovehana.com/Hat-CC-Beanie/cc-beanie.html' },
  { slug: 'cc-kids', name: 'C.C Kids', url: 'https://www.ilovehana.com/categories/cc/cc-beanie-kids.html' },
  { slug: 'cc-scarf', name: 'C.C Scarf', url: 'https://www.ilovehana.com/categories/cc/cc-scarf.html' },
  { slug: 'cc-gloves', name: 'C.C Gloves', url: 'https://www.ilovehana.com/categories/sale.html' },
  { slug: 'cc-hat', name: 'C.C Hat', url: 'https://www.ilovehana.com/categories/cc/cc-hat.html' },
  { slug: 'cc-headband', name: 'C.C Headband', url: 'https://www.ilovehana.com/categories/cc-brand/cc-headband.html' },
  { slug: 'cc-cap', name: 'C.C Cap', url: 'https://www.ilovehana.com/categories/cc/cc-cap.html' },
  { slug: 'cc-slippers', name: 'C.C Slippers', url: 'https://www.ilovehana.com/categories/c-c-slippers.html' },
  { slug: 'cc-accessories', name: 'C.C Accessories', url: 'https://www.ilovehana.com/categories/cc/key-chain.html' },
  { slug: 'hats', name: 'Hats', url: 'https://www.ilovehana.com/Hat-Glove-wholesale/hat-glove.html' },
  { slug: 'baseball-cap', name: 'Baseball Cap', url: 'https://www.ilovehana.com/categories/hat-glove/cap.html' },
  { slug: 'cowboy-hats', name: 'Cowboy Hats', url: 'https://www.ilovehana.com/categories/hats/cowboy-hats.html' },
  { slug: 'beanie', name: 'Beanie', url: 'https://www.ilovehana.com/categories/beanie.html' },
  { slug: 'kids-hats', name: 'Kids Hats and Beanies', url: 'https://www.ilovehana.com/categories/hats/kids-hats-and-beanies.html' },
  { slug: 'beret', name: 'Beret', url: 'https://www.ilovehana.com/categories/hats/beret.html' },
  { slug: 'fedora', name: 'Fedora', url: 'https://www.ilovehana.com/categories/hats/fedora.html' },
  { slug: 'bucket-hat', name: 'Bucket Hat', url: 'https://www.ilovehana.com/categories/hats/new-category.html' },
  { slug: 'panama-hat', name: 'Panama Hat', url: 'https://www.ilovehana.com/categories/hats/panama-hat.html' },
  { slug: 'straw-hat', name: 'Straw Hat', url: 'https://www.ilovehana.com/hat-wholeslae-women/' },
  { slug: 'headband', name: 'Headband', url: 'https://www.ilovehana.com/headband-wholesale-hair-bow-supplies/headband.html' },
  { slug: 'scarves-and-blankets', name: 'Scarves and Blankets', url: 'https://www.ilovehana.com/wholesale-Scarf-Scarves-sheap/' },
  { slug: 'blanket', name: 'Blanket', url: 'https://www.ilovehana.com/categories/scarves/blanket.html' },
  { slug: 'infinity-scarves', name: 'Infinity Scarves', url: 'https://www.ilovehana.com/wholesale-infinity-scarf-scarves-loof/infinity/' },
  { slug: 'oblong-scarves', name: 'Oblong Scarves', url: 'https://www.ilovehana.com/wholesale-scarf-oblong/oblong/' },
  { slug: 'satin-scarves', name: 'Satin Scarves', url: 'https://www.ilovehana.com/wholesale-scarf-scarves-satin/satin/' },
  { slug: 'gloves', name: 'Gloves', url: 'https://www.ilovehana.com/glove-wholeslae/' },
  { slug: 'socks-slippers', name: 'Socks and Slippers', url: 'https://www.ilovehana.com/socks-wholesale/' },
  { slug: 'leg-arm-warmer', name: 'Leg and Arm Warmer', url: 'https://www.ilovehana.com/categories/hat-and-glove/leg-arm-warmer.html' },
  { slug: 'slippers', name: 'Slippers', url: 'https://www.ilovehana.com/categories/socks/shoes.html' },
  { slug: 'socks-winter', name: 'Socks (Winter)', url: 'https://www.ilovehana.com/categories/socks-and-slippers/socks-winter.html' },
  { slug: 'socks-spandex', name: 'Socks (Spandex)', url: 'https://www.ilovehana.com/spandex-socks-wholesale/' },
  { slug: 'socks-sports', name: 'Socks (Sports)', url: 'https://www.ilovehana.com/sports-socks-wholesale/' },
  { slug: 'socks-children', name: 'Socks (Children)', url: 'https://www.ilovehana.com/socks-children-wholesale/' },
  { slug: 'bag', name: 'Bag', url: 'https://www.ilovehana.com/categories/bag/wallet.html' },
  { slug: 'handbag', name: 'Handbag', url: 'https://www.ilovehana.com/categories/bag/beach-bag.html' },
  { slug: 'clutch', name: 'Clutch', url: 'https://www.ilovehana.com/categories/bag/clutch.html' },
  { slug: 'pouch-wallet', name: 'Pouch & Wallet', url: 'https://www.ilovehana.com/clutch-wholesale-Bag/' },
  { slug: 'bag-strap', name: 'Bag Strap', url: 'https://www.ilovehana.com/categories/bag/bag-strap.html' },
  { slug: 'tumbler', name: 'Tumbler', url: 'https://www.ilovehana.com/categories/tumbler.html' },
  { slug: 'tops', name: 'Tops', url: 'https://www.ilovehana.com/categories/wrap/candigans-kimonos.html' },
  { slug: 't-shirts', name: 'T-Shirts', url: 'https://www.ilovehana.com/categories/tops/t.html' },
  { slug: 'cardigan-kimono', name: 'Cardigan and Kimono', url: 'https://www.ilovehana.com/wholesale-Wrap-kimono-poncho-vest/' },
  { slug: 'ponchos-vest', name: 'Ponchos and Vest', url: 'https://www.ilovehana.com/categories/wrap/jackets-vests.html' },
  { slug: 'beach-towel', name: 'Beach Towel', url: 'https://www.ilovehana.com/categories/tops/beach-towel.html' },
  { slug: 'basic-tops', name: 'Basic Tops', url: 'https://www.ilovehana.com/women-Top-wholeslae/' },
  { slug: 'dress', name: 'Dress', url: 'https://www.ilovehana.com/dress-wholesale/' },
  { slug: 'bottoms', name: 'Bottoms', url: 'https://www.ilovehana.com/categories/bottoms.html' },
  { slug: 'leggings', name: 'Leggings', url: 'https://www.ilovehana.com/legging-wholesale/' },
  { slug: 'sarong', name: 'Sarong', url: 'https://www.ilovehana.com/categories/bottoms/sarong.html' },
  { slug: 'pants', name: 'Pants', url: 'https://www.ilovehana.com/women-pants-wholesale/' },
  { slug: 'shorts', name: 'Shorts', url: 'https://www.ilovehana.com/women-shorts-wholesale/' },
  { slug: 'skirts', name: 'Skirts', url: 'https://www.ilovehana.com/categories/bottoms/skirts.html' },
  { slug: 'intimates', name: 'Intimates', url: 'https://www.ilovehana.com/categories/intimates.html' },
  { slug: 'bra', name: 'Bra', url: 'https://www.ilovehana.com/wholesale-Bra-Cheap-pushup-underwear/' },
  { slug: 'bra-bc', name: 'Bra (B/C Cup)', url: 'https://www.ilovehana.com/B-C-cup-bra-wholesale/bra-B-C/' },
  { slug: 'intimate-accessory', name: 'Accessory (Intimate)', url: 'https://www.ilovehana.com/wholesale-bra-accessories/accessories/' },
  { slug: 'panty', name: 'Panty', url: 'https://www.ilovehana.com/panty-panties-wholesale-underwear/' },
  { slug: 'panty-spandex', name: 'Panty (Spandex)', url: 'https://www.ilovehana.com/panty-spandex-wholesale/' },
  { slug: 'mens-underwear', name: 'Men\'s Underwear', url: 'https://www.ilovehana.com/panty-panties-wholesale/mens-underwear.html' },
  { slug: 'children-underwear', name: 'Children Underwear', url: 'https://www.ilovehana.com/children-underwear-wholesale/' },
  { slug: 'children-apparel', name: 'Children Apparel', url: 'https://www.ilovehana.com/children-apparel-wholesale/' },
  { slug: 'lingerie', name: 'Lingerie', url: 'https://www.ilovehana.com/lingerie-women-wholesale/' },
  { slug: 'sexy-lingerie', name: 'Sexy Lingerie', url: 'https://www.ilovehana.com/lingerie-packaged-women-whoesale/' },
  { slug: 'bodyshaper', name: 'Bodyshaper', url: 'https://www.ilovehana.com/bodyshaper-women-wholesale/' },
  { slug: 'hosiery', name: 'Hosiery', url: 'https://www.ilovehana.com/hosiery-wholesale/' },
  { slug: 'accessory', name: 'Accessory', url: 'https://www.ilovehana.com/accessory-wholesale/' },
  { slug: 'belts', name: 'Belts', url: 'https://www.ilovehana.com/categories/accessory/belts.html' },
  { slug: 'earrings', name: 'Earrings', url: 'https://www.ilovehana.com/categories/accessory/earrings.html' },
  { slug: 'hair-accessory', name: 'Hair Accessory', url: 'https://www.ilovehana.com/hair-accessory-wholesale/' },
  { slug: 'keychain', name: 'Keychain', url: 'https://www.ilovehana.com/categories/accessory/keychain.html' },
  { slug: 'headband-dz', name: 'Headband (DZ)', url: 'https://www.ilovehana.com/headband-wholesale/' },
  { slug: 'ponytail-dz', name: 'Ponytail (DZ)', url: 'https://www.ilovehana.com/accessory-hair-scrunch-wholesale/' },
  { slug: 'hair-clip-dz', name: 'Hair Clip (DZ)', url: 'https://www.ilovehana.com/accessory-hair-pin-wholesale/' },
  { slug: 'earring-dz', name: 'Earring (DZ)', url: 'https://www.ilovehana.com/accessory/accessory-dz-wholesale/' },
  { slug: 'necklace-bracelet-dz', name: 'Necklace & Bracelet (DZ)', url: 'https://www.ilovehana.com/accessory-necklace-bracelet-wholesale/' },
  { slug: 'bow-dz', name: 'Bow (DZ)', url: 'https://www.ilovehana.com/accessory-bow-wholesale/' },
  { slug: 'accessory-dz', name: 'Accessory (DZ)', url: 'https://www.ilovehana.com/accessory-fashion-wholesale/' },
  { slug: 'sale', name: 'Sale', url: 'https://www.ilovehana.com/categories/sale-1.html' },
  { slug: 'necklace', name: 'Necklace', url: 'https://www.ilovehana.com/necklace-earing-set-wholesale/' },
  { slug: 'bracelet', name: 'Bracelet', url: 'https://www.ilovehana.com/jewerly/bracelet-wholesale/' },
];

// ---- helpers --------------------------------------------------------------

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const decodeHtml = (s) =>
  s
    .replace(/&#x27;|&#39;/gi, "'")
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&nbsp;/g, ' ');

const slugify = (s) =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

function extractCards(html) {
  const cards = [];
  for (const m of html.matchAll(/<article[^>]*class="card[^>]*>([\s\S]*?)<\/article>/g)) {
    const b = m[1];
    const urlM =
      b.match(/class="card-figure__link"[\s\S]*?href="([^"]+)"/) ||
      b.match(/href="(https:\/\/www\.ilovehana\.com\/[^"]+)"/);
    const imgM = b.match(/data-src="([^"]+)"/);
    const nameM = b.match(/class="card-title"[\s\S]*?<a[^>]*>([\s\S]*?)<\/a>/);
    const url = (urlM?.[1] || '').split('?')[0].replace(/\/$/, '');
    const name = (nameM?.[1] || '').replace(/<[^>]+>/g, '').trim();
    if (!name || !url || !imgM?.[1]) continue;
    cards.push({ url, name: decodeHtml(name), img: imgM[1] });
  }
  return cards;
}

async function fetchPage(url, pageNum) {
  const fullUrl = pageNum === 1 ? url : url + (url.includes('?') ? '&' : '?') + `page=${pageNum}`;
  for (let attempt = 1; attempt <= RETRIES; attempt++) {
    try {
      const res = await fetch(fullUrl, { headers: { 'User-Agent': USER_AGENT }, redirect: 'follow' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const html = await res.text();
      const cards = extractCards(html);
      const totalPagesM = html.match(/Page 1 of (\d+)/);
      const totalPages = totalPagesM ? parseInt(totalPagesM[1], 10) : 1;
      return { html, cards, totalPages };
    } catch (err) {
      if (attempt < RETRIES) {
        console.log(`  retry ${attempt}/${RETRIES} ${fullUrl}: ${err.message}`);
        await sleep(1000 * attempt);
      } else {
        console.log(`  FAILED ${fullUrl}: ${err.message}`);
        return { html: '', cards: [], totalPages: 1 };
      }
    }
  }
  return { html: '', cards: [], totalPages: 1 };
}

// ---- crawl ----------------------------------------------------------------

async function main() {
  const allProducts = [];
  const allCategories = [];
  const seenUrls = new Set();
  let totalFetches = 0;

  // Pre-populate already-scraped pages
  // (homepage, beanie, scarf, cap, gloves were already scraped)
  console.log('Starting crawl of', CATEGORIES.length, 'categories...\n');

  for (const cat of CATEGORIES) {
    console.log(`[${cat.slug}] ${cat.name}`);
    console.log(`  fetching ${cat.url}`);

    const { cards, totalPages } = await fetchPage(cat.url, 1);
    totalFetches++;

    let allCards = [...cards];
    console.log(`  page 1: ${cards.length} products, ${totalPages} pages total`);

    // Cache category info
    allCategories.push({
      slug: cat.slug,
      name: cat.name,
      image: cards.length > 0 ? cards[0].img : '',
    });

    // Fetch remaining pages
    for (let p = 2; p <= totalPages; p++) {
      await sleep(DELAY_MS);
      console.log(`  page ${p}...`);
      const result = await fetchPage(cat.url, p);
      totalFetches++;
      allCards.push(...result.cards);
      console.log(`  page ${p}: ${result.cards.length} products`);
      // If a page returns 0 cards, stop pagination
      if (result.cards.length === 0) break;
    }

    // Dedupe by URL within this category
    const seen = new Set();
    for (const card of allCards) {
      if (seen.has(card.url)) continue;
      seen.add(card.url);
      const slug = slugify(card.url.split('/').filter(Boolean).pop() || card.name);
      allProducts.push({
        slug,
        name: card.name,
        category: cat.slug,
        image: card.img,
        url: card.url,
      });
      seenUrls.add(card.url);
    }

    console.log(`  → ${allProducts.length} unique products in category\n`);
    await sleep(DELAY_MS);
  }

  // Write output
  const out = {
    generatedAt: new Date().toISOString(),
    totalCategories: allCategories.length,
    totalProducts: allProducts.length,
    totalFetches,
    categories: allCategories,
    products: allProducts,
  };

  writeFileSync(resolve(DATA_DIR, 'crawled-categories.json'), JSON.stringify(allCategories, null, 1));
  writeFileSync(resolve(DATA_DIR, 'crawled-products.json'), JSON.stringify(allProducts, null, 1));
  console.log('='.repeat(50));
  console.log(`Done!`);
  console.log(`  Categories: ${allCategories.length}`);
  console.log(`  Products:   ${allProducts.length}`);
  console.log(`  Fetches:    ${totalFetches}`);
  console.log(`  Output:     ${DATA_DIR}/`);
}

main().catch(console.error);