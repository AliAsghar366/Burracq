// Build script: reads crawled product/category JSON (from scripts/data/) and
// generates src/data/catalog.ts with all categories and products.
// Usage: node scripts/build-catalog.mjs
//
// Retail conversion:
//  - Supplier pack quantities (e.g. "(12pairs)", "6pcs", "(DZ)") are converted
//    to a single purchasable unit; the pack size is kept as backend metadata
//    ('packSize').
//  - Prices are derived from landed cost (supplier unit cost + inbound
//    shipping estimate) at ~2.5-3x, rounded to .99 retail price points.
//  - Supplier SKU/model codes are moved out of titles into a 'sku' field.
//  - Titles and descriptions are rewritten as original retail copy.

import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';

const CATEGORIES_JSON = 'scripts/data/crawled-categories.json';
const PRODUCTS_JSON = 'scripts/data/crawled-products.json';
const HOME_GRIDS_JSON = 'scripts/data/home-grids.json';
const HANA_VARIATIONS_JSON = 'scripts/data/hana-variations.json';

const categories = JSON.parse(readFileSync(CATEGORIES_JSON, 'utf8'));
// Drop products sold as multi-pair packs (e.g. "(6 pairs)", "(12pairs)").
// BURRACQ sells single units only, so anything named as a pair bundle is removed.
const PAIR_NAME_RE = /\bpairs?\b|\d+pairs?/i;
const rawProducts = JSON.parse(readFileSync(PRODUCTS_JSON, 'utf8')).filter(
  (p) => !PAIR_NAME_RE.test(p.name)
);

// Real wholesale prices scraped from the original supplier site
// (scripts/fetch-prices.mjs). Map of product URL -> pack price.
let realPrices = {};
try {
  realPrices = JSON.parse(readFileSync('scripts/data/crawled-prices.json', 'utf8'));
} catch {
  // price file not built yet
}

// Per-product variations (colors + image galleries) crawled from the
// supplier's product pages (scripts/hana-crawl.mjs). Map of product URL ->
// { colors: string[], gallery: string[], title }. The gallery filenames
// usually contain the color token (e.g. "DJE310806-GOLD"), so each color can
// be paired with its own photo.
let hanaVariations = {};
try {
  hanaVariations = JSON.parse(readFileSync(HANA_VARIATIONS_JSON, 'utf8'));
} catch {
  // variations file not built yet
}

// ---- retail pricing -------------------------------------------------------
// Landed cost = supplier unit cost + inbound shipping/per-item costs.
// Every item shows two prices:
//  - compareAtPrice ("was"/real price) = landed cost x 3.7
//  - price (discounted price)           = landed cost x 2.7
// Both are rounded to a .99 retail price point.
const INBOUND_FACTOR = 1.1; // estimated inbound shipping + per-item costs
const RETAIL_MULTIPLIER = 2.7; // discounted price multiplier
const REAL_PRICE_MULTIPLIER = 3.7; // compare-at ("was") price multiplier
const PRICE_FLOOR = 4.99;

const PACK_RE = /\((\d+)\s*(?:pc|pcs|pair|pairs|piece|pieces|dozen|dz|pack|packs|cards)\)/i;

function packSizeOf(name) {
  let size = 1;
  const m = name.match(PACK_RE);
  if (m) {
    const n = parseInt(m[1], 10);
    size = /(?:dozen|dz)/i.test(m[0]) ? n * 12 : n;
  } else if (/\b(?:dz|dozen)\b/i.test(name)) {
    // e.g. "HEADBAND-EHB1558 (DZ)", "Dozen-UHW-4194D" — priced per dozen.
    size = 12;
  } else {
    // Loose markers like "6pcs Lace Trim...", "12pairs Winter Socks..."
    const loose = name.match(/(?:^|\s)(\d+)\s*(?:pc|pcs|pairs?|pieces?)\s/i);
    if (loose) size = parseInt(loose[1], 10);
  }
  // e.g. "_3PCSET (6pack)" — each pack contains a 3-piece set.
  const setM = name.match(/(\d+)\s*PCSET/i);
  if (setM) size *= parseInt(setM[1], 10);
  return size;
}

function charmPrice(amount) {
  return Number(Math.max(PRICE_FLOOR, Math.ceil(amount - 0.01) + 0.99).toFixed(2));
}

function retailPriceFor(wholesale, packSize) {
  const unitCost = (wholesale || 0) / packSize;
  const landed = unitCost * INBOUND_FACTOR;
  const price = charmPrice(landed * RETAIL_MULTIPLIER);
  let compareAtPrice = charmPrice(landed * REAL_PRICE_MULTIPLIER);
  // Keep the compare-at price visibly higher than the selling price.
  if (compareAtPrice <= price) compareAtPrice = Number((price + 1).toFixed(2));
  return {
    price,
    compareAtPrice,
    unitCost: Number(unitCost.toFixed(2)),
    landed: Number(landed.toFixed(2)),
  };
}

// ---- retail titles / SKUs ------------------------------------------------
const SMALL_WORDS = new Set([
  'a', 'an', 'the', 'and', 'or', 'nor', 'but', 'of', 'for', 'to', 'in', 'on',
  'at', 'by', 'with', 'from', 'up', 'as', 'per',
]);

function toTitleCase(s) {
  return s
    .toLowerCase()
    .split(/\s+/)
    .map((w, i, arr) =>
      i > 0 && i < arr.length - 1 && SMALL_WORDS.has(w) ? w : w.charAt(0).toUpperCase() + w.slice(1)
    )
    .join(' ');
}

// Extract the supplier model code from the end of a name. Walks dash positions
// from the end and returns the first code-like tail (letters + digits, ending
// in digits), e.g. JG580, G-1932, G442, JCL6031K, UAHB2089BK, SKA-0049.
// Digit-only codes (e.g. "Bra-68856") are accepted when preceded by a real word.
function skuOf(name) {
  let end = name.length;
  for (;;) {
    const idx = Math.max(
      name.lastIndexOf('-', end - 1),
      name.lastIndexOf('\u2013', end - 1),
      name.lastIndexOf('\u2014', end - 1)
    );
    if (idx === -1) return '';
    const tail = name.slice(idx + 1, end).trim();
    if (
      /^[A-Z0-9][A-Z0-9-]*\d{2,6}[A-Z0-9]*$/i.test(tail) &&
      /[A-Za-z]/.test(tail) &&
      /\d{2,}/.test(tail)
    ) {
      return tail;
    }
    if (/^\d{3,}$/.test(tail)) {
      const wordM = name.slice(0, idx).match(/([A-Za-z]+)$/);
      if (wordM) {
        const charBefore = name[idx - wordM[1].length - 1];
        if (charBefore === undefined || /\s/.test(charBefore)) return tail;
      }
    }
    // Codes that end in letters (e.g. "3001WT 8-10-12" kids tank tops) —
    // accept a single token with a 3+ digit run when it ends the name.
    const noSizes = tail.replace(/\s+[\d-]+$/, '');
    if (
      /^[A-Za-z0-9_]+$/.test(noSizes) &&
      /\d{3,}/.test(noSizes) &&
      /[A-Za-z]/.test(noSizes) &&
      noSizes.length >= 4
    ) {
      return noSizes;
    }
    end = idx;
  }
}

function retailNameOf(raw, sku) {
  let n = raw
    .replace(PACK_RE, '')
    .replace(/\(\s*dz\s*\)/i, '')
    .replace(/\s*\([a-z0-9-]+\)\s*$/i, '') // trailing (color)/(size) variants
    .replace(/^\d+\s*(?:pc|pcs|pairs?|pieces?)\s+/i, '')
    .replace(/^C\.C\s+/i, '')
    .replace(/\s{2,}/g, ' ')
    .trim();
  // Remove the supplier model code from the end (plain string op).
  if (sku) {
    const idx = n.lastIndexOf(sku);
    if (idx > 0) n = n.slice(0, idx).replace(/[\s-–—]+$/, '');
  }
  // Multi-segment SKUs (e.g. "CAP-KIDS-BT-1002") can leave a lone segment
  // like "-KIDS" behind — drop one trailing hyphenated word in that case.
  if (sku.includes('-') && /[-–—]\s*[A-Za-z]+$/.test(n)) {
    n = n.replace(/[-–—]\s*[A-Za-z]+$/, '').trim();
  }
  // Drop leftover lowercase code/color suffixes (e.g. -tcm0243-mexico,
  // -pgn-c, "-hat-20a metallic", "-3001wt 8-10-12", "-291307 2t-4t spiderman")
  // that sit after words.
  n = n
    .replace(/-[a-z0-9_]+(?:-[a-z0-9_]+)+$/i, '')
    .replace(/-[a-z0-9_-]*\d[a-z0-9_-]*\s+[a-z0-9_-]+(?:\s+[a-z0-9_-]+)*$/i, '')
    .replace(/-[a-z0-9_]*\d[a-z0-9_-]*$/i, '')
    .replace(/\s*-?(?:newbornghat|glovem|sbhb)$/i, '')
    .replace(/[\s-–—]+$/, '')
    .trim();
  // Repeated-word suffix (e.g. "BABY GLOVE-BABY" -> "BABY GLOVE",
  // "...TOP-BABY-TANK TOP" -> "...TOP"). Loop until stable.
  let prev;
  do {
    prev = n;
    n = n
      .replace(/-([a-z]+)(?: [a-z]+)*$/i, (m, w) =>
        new RegExp(`\\b${w}\\b`, 'i').test(n.slice(0, n.lastIndexOf(m))) ? '' : m
      )
      .replace(/[\s-–—]+$/, '')
      .trim();
  } while (n !== prev);
  // Common supplier phrasing -> retail phrasing.
  n = n
    .replace(/\bTwo Tone Colors\b/gi, 'Two-Tone')
    .replace(/\bTwo Tone\b/gi, 'Two-Tone')
    .replace(/\bSolid Color\b/gi, 'Solid');
  return toTitleCase(n);
}

// ---- color variants -------------------------------------------------------
// The supplier lists each color as its own product, named like
// "RIBBED SOLID BEANIE-JH272-GRAY" (description + code + color). We group
// products that share the same SKU so the product page can offer a color
// swatch for every variant, each loading its own image.
const JUNK_TAILS = new Set([
  'ASSORTED', 'COLOR', 'MAIN', 'MODEL', 'IMAGE', 'FRONT', 'BACK', 'SIDE', 'VIEW',
  'KIDS', 'POM', 'BACKGROUND', 'NEW', 'HOT', 'SALE', 'ONE', 'SIZE', 'FREE',
  'BULK', 'MIX', 'MIXED', 'LOT', 'PACK', 'STYLE', 'WHOLESALE',
  'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'J', 'M', 'S', 'L', 'X', 'XL', 'XS',
  'XXL', 'XXXL', 'W', 'K', 'T', 'U', 'V', 'Y', 'Z',
]);

/**
 * Extract the color/style label that follows the SKU in the raw supplier
 * name (e.g. "-GRAY" in "RIBBED SOLID BEANIE-JH272-GRAY"). Returns null
 * when the tail is a size, pack marker, or otherwise not a real label.
 */
function colorTailOf(rawName, sku) {
  if (!sku) return null;
  const idx = rawName.lastIndexOf(sku);
  if (idx < 0) return null;
  let tail = rawName
    .slice(idx + sku.length)
    .replace(PACK_RE, '')
    .replace(/^[\s\-–—_:.]+/, '')
    .replace(/[\s\-–—_:.]+$/, '')
    .replace(/-(MODEL|MAIN|IMAGE|PRODUCT|FRONT|BACK|SIDE|VIEW|ALT)\d*$/i, '')
    .trim();
  tail = tail.toUpperCase();
  if (!/^[A-Z]{2,}$/.test(tail)) return null;
  if (JUNK_TAILS.has(tail)) return null;
  return tail.charAt(0) + tail.slice(1).toLowerCase();
}

// Names that are only supplier codes fall back to a generic retail name.
const NAME_FALLBACKS = {
  'headband-dz': 'Classic Headband',
  'ponytail-dz': 'Classic Ponytail',
  'hair-clip-dz': 'Classic Hair Clip',
  'earring-dz': 'Classic Earrings',
  'necklace-bracelet-dz': 'Classic Necklace & Bracelet Set',
  'bow-dz': 'Classic Hair Bow',
  'accessory-dz': 'Everyday Accessory',
  keychain: 'Everyday Keychain',
  'cc-scarf': 'Classic Knit Scarf',
  'cc-beanie': 'Classic Knit Beanie',
  'cc-hat': 'Classic Knit Hat',
  'cc-cap': 'Classic Cap',
  'cc-gloves': 'Classic Knit Gloves',
  'cc-headband': 'Classic Knit Headband',
  'cc-slippers': 'Cozy Slippers',
  socks: 'Everyday Socks',
  panty: "Kids' Panties",
  'children-apparel': "Kids' Apparel",
  'children-underwear': "Kids' Underwear",
  beanie: 'Classic Knit Beanie',
  'scarves-and-blankets': 'Classic Scarf',
  'infinity-scarves': 'Classic Infinity Scarf',
  gloves: 'Everyday Knit Gloves',
  'socks-slippers': 'Cozy Everyday Socks',
  'socks-spandex': 'Everyday Socks',
  'socks-children': "Kids' Socks",
  'cardigan-kimono': 'Everyday Cardigan',
  bottoms: 'Everyday Bottoms',
  leggings: 'Everyday Leggings',
  intimates: 'Everyday Intimates',
  bra: 'Everyday Bra',
  'intimate-accessory': 'Everyday Accessory',
  'panty-spandex': 'Everyday Panties',
  lingerie: 'Everyday Lingerie',
  hosiery: 'Everyday Hosiery',
  accessory: 'Everyday Accessory',
  earrings: 'Everyday Earrings',
  'hair-accessory': 'Everyday Hair Accessory',
};

// ---- retail category names / taglines ------------------------------------
const RETAIL_CATEGORY_NAMES = {
  cc: 'The Edit',
  'cc-beanie': 'Beanies',
  'cc-kids': 'Kids',
  'cc-scarf': 'Scarves',
  'cc-gloves': 'Gloves',
  'cc-hat': 'Hats',
  'cc-headband': 'Headbands',
  'cc-cap': 'Caps',
  'cc-slippers': 'Slippers',
  'cc-accessories': 'Accessories',
  new: 'New Arrivals',
  'patriotic-pride': 'Patriotic Collection',
  hats: 'Hats',
  'baseball-cap': 'Baseball Caps',
  'cowboy-hats': 'Cowboy Hats',
  beanie: 'Beanies',
  'kids-hats': "Kids' Hats",
  beret: 'Berets',
  fedora: 'Fedoras',
  'bucket-hat': 'Bucket Hats',
  'panama-hat': 'Panama Hats',
  'straw-hat': 'Straw Hats',
  headband: 'Headbands',
  'scarves-and-blankets': 'Scarves & Blankets',
  blanket: 'Blankets',
  'infinity-scarves': 'Infinity Scarves',
  'oblong-scarves': 'Oblong Scarves',
  'satin-scarves': 'Satin Scarves',
  gloves: 'Gloves',
  'socks-slippers': 'Socks & Slippers',
  'leg-arm-warmer': 'Leg & Arm Warmers',
  slippers: 'Slippers',
  'socks-winter': 'Winter Socks',
  'socks-spandex': 'Socks',
  'socks-sports': 'Sports Socks',
  'socks-children': "Kids' Socks",
  bag: 'Bags',
  handbag: 'Handbags',
  clutch: 'Clutches',
  'pouch-wallet': 'Pouches & Wallets',
  'bag-strap': 'Bag Straps',
  tumbler: 'Tumblers',
  tops: 'Tops',
  't-shirts': 'T-Shirts',
  'cardigan-kimono': 'Cardigans & Kimonos',
  'ponchos-vest': 'Ponchos & Vests',
  'beach-towel': 'Beach Towels',
  'basic-tops': 'Basic Tops',
  dress: 'Dresses',
  bottoms: 'Bottoms',
  leggings: 'Leggings',
  sarong: 'Sarongs',
  pants: 'Pants',
  shorts: 'Shorts',
  skirts: 'Skirts',
  intimates: 'Intimates',
  bra: 'Bras',
  'bra-bc': 'Bras (B/C Cup)',
  'intimate-accessory': 'Intimate Accessories',
  panty: 'Panties',
  'panty-spandex': 'Panties',
  'mens-underwear': "Men's Underwear",
  'children-underwear': "Kids' Underwear",
  'children-apparel': "Kids' Apparel",
  lingerie: 'Lingerie',
  'sexy-lingerie': 'Lingerie',
  bodyshaper: 'Body Shapers',
  hosiery: 'Hosiery',
  accessory: 'Accessories',
  belts: 'Belts',
  earrings: 'Earrings',
  'hair-accessory': 'Hair Accessories',
  keychain: 'Keychains',
  'headband-dz': 'Headbands',
  'ponytail-dz': 'Ponytails',
  'hair-clip-dz': 'Hair Clips',
  'earring-dz': 'Earrings',
  'necklace-bracelet-dz': 'Necklaces & Bracelets',
  'bow-dz': 'Bows',
  'accessory-dz': 'Accessories',
  sale: 'Sale',
  necklace: 'Necklaces',
  bracelet: 'Bracelets',
  women: 'Women',
};

const RETAIL_TAGLINES = {
  new: 'Fresh styles just dropped — new finds added regularly.',
  women: 'Everything you love to wear — tops, dresses, bottoms and more.',
  hats: 'Caps, beanies, cowboy hats and more to top off every look.',
  bag: 'Carry your everyday essentials in style.',
  accessory: 'The finishing touches — jewelry, belts, hair accessories and more.',
  sale: 'Markdowns on favorite styles — while stock lasts.',
  'scarves-and-blankets': 'Soft layers and cozy throws for every season.',
  gloves: 'Warm, touchscreen-friendly gloves for everyday wear.',
  'socks-slippers': 'Cozy socks and slippers for home and everyday comfort.',
  intimates: 'Comfortable, everyday essentials made to feel as good as they look.',
  tumbler: 'Everyday drinkware in fun styles.',
};

function retailTagline(slug, retailName) {
  return RETAIL_TAGLINES[slug] || `${retailName} — fresh styles at prices you'll love.`;
}

// ---- original retail descriptions ----------------------------------------
const DESCRIPTION_OPENERS = {
  beanie: 'A cozy, everyday essential that keeps you warm and on-trend.',
  'cc-beanie': 'A cozy, everyday essential that keeps you warm and on-trend.',
  hats: 'A stylish, everyday essential that finishes any outfit.',
  'cc-hat': 'A stylish, everyday essential that finishes any outfit.',
  gloves: 'Soft, warm and ready for your everyday errands.',
  'cc-gloves': 'Soft, warm and ready for your everyday errands.',
  'oblong-scarves': 'A soft, versatile layer for chilly days and polished looks.',
  'infinity-scarves': 'A soft, versatile layer for chilly days and polished looks.',
  'satin-scarves': 'A soft, versatile layer for chilly days and polished looks.',
  'scarves-and-blankets': 'A soft, versatile layer for chilly days and cozy nights.',
  'cc-scarf': 'A soft, versatile layer for chilly days and polished looks.',
  blanket: 'A soft, cozy layer for chilly evenings at home or on the go.',
  bag: 'Carry your everyday essentials in style.',
  handbag: 'Carry your everyday essentials in style.',
  clutch: 'A sleek, compact style for evenings out and on-the-go days.',
  'pouch-wallet': 'Keep your everyday essentials organized and close at hand.',
  'bag-strap': 'A quick way to give your favorite bag a fresh look.',
  tumbler: 'Keep your drinks close in a style you love.',
  'socks-slippers': 'Cozy comfort for every step of your day.',
  slippers: 'Cozy comfort for relaxing at home.',
  'socks-winter': 'Warm, cozy socks made for cold days.',
  'socks-spandex': 'Everyday socks with comfort and stretch in mind.',
  'socks-sports': 'Everyday socks built for activity and all-day wear.',
  'socks-children': 'Fun, comfortable socks made for little feet.',
  'leg-arm-warmer': 'Extra warmth for the cooler months, in a stylish finish.',
  tops: 'An easy, everyday essential that goes with everything.',
  't-shirts': 'A versatile everyday essential in a soft, comfy fit.',
  'cardigan-kimono': 'A soft, easy layer for everyday outfits.',
  'ponchos-vest': 'A cozy layer that adds effortless style.',
  'beach-towel': 'Bright, absorbent and ready for sunnier days.',
  'basic-tops': 'An easy, everyday essential that goes with everything.',
  dress: 'An easy, flattering style for everyday wear.',
  bottoms: 'Comfortable, everyday styles that move with you.',
  leggings: 'Everyday comfort with a flattering fit.',
  sarong: 'A versatile cover-up for the beach, pool or warmer days.',
  pants: 'Comfortable, everyday styles that move with you.',
  shorts: 'An easy, breezy essential for warmer days.',
  skirts: 'An easy, everyday style with a feminine finish.',
  intimates: 'Comfortable, everyday essentials made to feel as good as they look.',
  bra: 'Comfortable, everyday support you can rely on.',
  'bra-bc': 'Comfortable, everyday support you can rely on.',
  'intimate-accessory': 'The little extras that complete your everyday essentials.',
  panty: 'Everyday comfort in soft, breathable fabrics.',
  'panty-spandex': 'Everyday comfort with a smooth, stretchy fit.',
  'mens-underwear': 'Everyday comfort in soft, breathable fabrics.',
  'children-underwear': 'Soft, comfortable essentials made for kids.',
  'children-apparel': 'Play-ready styles made for kids.',
  lingerie: 'Stylish comfort for every day.',
  'sexy-lingerie': 'Stylish comfort for every day.',
  bodyshaper: 'Everyday shaping with comfort in mind.',
  hosiery: 'Everyday legwear in soft, comfortable fabrics.',
  accessory: 'The perfect finishing touch for any outfit.',
  belts: 'A simple way to finish and define any outfit.',
  earrings: 'A quick, easy way to dress up any look.',
  'hair-accessory': 'A fun, easy way to finish any hairstyle.',
  keychain: 'A little everyday style you can carry anywhere.',
  'headband-dz': 'A fun, easy way to finish any hairstyle.',
  'ponytail-dz': 'A fun, easy way to finish any hairstyle.',
  'hair-clip-dz': 'A fun, easy way to finish any hairstyle.',
  'earring-dz': 'A quick, easy way to dress up any look.',
  'necklace-bracelet-dz': 'A quick, easy way to dress up any look.',
  'bow-dz': 'A fun, easy way to finish any hairstyle.',
  'accessory-dz': 'The perfect finishing touch for any outfit.',
  necklace: 'A quick, easy way to dress up any look.',
  bracelet: 'A quick, easy way to dress up any look.',
  'patriotic-pride': 'Show your spirit in everyday style.',
  cc: 'A curated mix of everyday favorites.',
  'cc-kids': 'Play-ready styles made for kids.',
  'cc-cap': 'A fresh, everyday cap to top off any look.',
  'cc-headband': 'A fun, easy way to finish any hairstyle.',
  'cc-slippers': 'Cozy comfort for relaxing at home.',
  'cc-accessories': 'The perfect finishing touch for any outfit.',
  sale: 'A favorite style at a great price.',
  new: 'Fresh from the latest drop — new styles added regularly.',
};

// Categories where "one size fits most" does not apply.
const SIZED_CATEGORIES = new Set([
  'bag', 'handbag', 'clutch', 'pouch-wallet', 'bag-strap', 'tumbler', 'belts',
  'earrings', 'hair-accessory', 'keychain', 'necklace', 'bracelet',
  'necklace-bracelet-dz', 'bow-dz', 'earring-dz', 'hair-clip-dz', 'accessory-dz',
  'accessory', 'intimate-accessory', 'cc-accessories', 'beach-towel',
]);

function buildDescription(name, category) {
  const lines = [
    name,
    DESCRIPTION_OPENERS[category] || 'A fresh, everyday find — easy to wear, easy to love.',
  ];
  if (!SIZED_CATEGORIES.has(category)) lines.push('One size fits most.');
  lines.push('Available in assorted colors and styles.');
  return lines.join('<br/>');
}

// ---- build product list ---------------------------------------------------
// Keep EVERY category listing, in crawl order. The original site lists products
// in page order (page 1 first, then page 2…), so crawl order == original order.
// A product may appear in several categories; each appearance is kept so every
// category page shows the exact same products, in the same order, as the original.
const products = rawProducts.map((p, i) => {
  const real = realPrices[p.url];
  const wholesale = real != null && real > 0 ? real : Number(((i % 8) * 1.5 + 7.99).toFixed(2));
  const packSize = packSizeOf(p.name);
  // Strip the pack suffix first so the SKU (which sits before it) is found.
  const bareName = p.name.replace(PACK_RE, '').trim();
  const sku = skuOf(bareName);
  let name = retailNameOf(p.name, sku);
  // Fallback for names that are nothing but supplier codes
  // (e.g. "Dozen-UHW-4194D") or got cleaned down to nothing.
  if (
    name.replace(/[^A-Za-z]/g, '').length < 3 ||
    /dozen/i.test(name) ||
    /^children$/i.test(name) ||
    /^[A-Za-z]+-[A-Za-z]+$/.test(name)
  ) {
    name = NAME_FALLBACKS[p.category] || 'Everyday Style';
  }
  const { price, compareAtPrice } = retailPriceFor(wholesale, packSize);
  const colorLabel = colorTailOf(p.name, sku);
  return {
    slug: p.slug,
    url: p.url,
    name,
    sku,
    packSize,
    category: p.category,
    price,
    compareAtPrice,
    image: p.image,
    description: buildDescription(name, p.category),
    colorLabel,
  };
});

// Group products by SKU (case-insensitive) so color variants can be linked.
const bySku = new Map();
for (const p of products) {
  if (!p.sku) continue;
  const key = p.sku.toUpperCase();
  if (!bySku.has(key)) bySku.set(key, []);
  bySku.get(key).push(p);
}

/** Color/style variants for a product: same SKU, different color, deduped. */
function variantsFor(p) {
  const group = p.sku ? bySku.get(p.sku.toUpperCase()) : undefined;
  if (!group) return [];
  const seen = new Set();
  const out = [];
  for (const sibling of group) {
    if (!sibling.colorLabel || seen.has(sibling.slug)) continue;
    seen.add(sibling.slug);
    out.push({ label: sibling.colorLabel, image: sibling.image, slug: sibling.slug });
  }
  return out;
}

/** Find the gallery image whose filename contains the color label. */
function colorImageOf(gallery, colorLabel) {
  const norm = colorLabel.toUpperCase().replace(/[\s\-–—_.]/g, '');
  if (norm.length < 3) return '';
  for (const img of gallery) {
    const file = decodeURIComponent(img.split('/').pop() || '')
      .toUpperCase()
      .replace(/[\s\-–—_.]/g, '');
    if (file.includes(norm)) return img;
  }
  return '';
}

// Color/style tokens used in supplier image filenames (e.g. "JCL6287-BEIGE-1",
// "68849M-RED-01"). Used to give single-color products a real color swatch.
const FILENAME_COLORS = new Set([
  'BLACK', 'WHITE', 'GRAY', 'GREY', 'BROWN', 'BEIGE', 'CREAM', 'PINK', 'ROSE',
  'RED', 'MAROON', 'BURGUNDY', 'NAVY', 'BLUE', 'SKY', 'TEAL', 'GREEN', 'OLIVE',
  'PURPLE', 'LAVENDER', 'LILAC', 'YELLOW', 'GOLD', 'ORANGE', 'KHAKI', 'TAN',
  'CAMEL', 'CHARCOAL', 'HEATHER', 'NATURAL', 'IVORY', 'MUSTARD', 'COBALT',
  'CORAL', 'FUCHSIA', 'MINT', 'SAGE', 'SLATE', 'WINE', 'MAUVE', 'PEACH',
  'SILVER', 'TURQUOISE', 'AQUA', 'RUST', 'BRICK', 'BLUSH', 'COGNAC', 'MOCHA',
  'TAUPE', 'CHOCOLATE', 'COFFEE', 'ESPRESSO', 'CARAMEL', 'OATMEAL', 'LINEN',
  'SAND', 'BONE', 'ECRU', 'CHAMPAGNE', 'COPPER', 'BRONZE', 'DENIM', 'PLAID',
  'STRIPE', 'FLORAL', 'LEOPARD', 'CAMO', 'MULTI', 'ASSORTED', 'MIX', 'MIXED',
]);

function titleLabel(s) {
  return s.charAt(0) + s.slice(1).toLowerCase();
}

/** Extract a color token from an image filename, e.g. "JCL6287-BEIGE-1" -> Beige. */
function colorFromFilename(image) {
  if (!image) return '';
  const file = decodeURIComponent(image.split('/').pop() || '')
    .split('?')[0]
    .replace(/\.[a-z]+$/i, '')
    .toUpperCase();
  const tokens = file.split(/[-_ ]+/);
  for (const t of tokens) {
    if (FILENAME_COLORS.has(t)) return titleLabel(t);
  }
  for (let i = 0; i < tokens.length - 1; i++) {
    const combo = `${tokens[i]}-${tokens[i + 1]}`;
    if (FILENAME_COLORS.has(combo)) return titleLabel(combo);
  }
  return '';
}

// Pass 1: compute variants for every product. This reads each sibling's
// colorLabel, so the internal fields must NOT be deleted until every
// product's variants have been built (deleting mid-loop made later
// duplicate entries of the same SKU lose their siblings' variants).
for (const p of products) {
  const variants = variantsFor(p);
  const seenLabels = new Set(variants.map((v) => v.label.toLowerCase()));
  // Add the supplier's per-product color options (each color is an
  // in-page variant on this same product, with its own gallery photo).
  const hana = hanaVariations[p.url];
  if (hana && Array.isArray(hana.colors) && hana.colors.length > 0) {
    const gallery = hana.gallery || [];
    for (const color of hana.colors) {
      const label = String(color).trim();
      if (!label) continue;
      const key = label.toLowerCase();
      if (seenLabels.has(key)) continue;
      seenLabels.add(key);
      variants.push({
        label,
        image: colorImageOf(gallery, label) || p.image,
        slug: p.slug, // same product — the image is swapped in place
      });
    }
  }
  // Products with no color data still get a swatch so every product page
  // shows a color selector: derive the color from the image filename when
  // possible, otherwise a neutral "One Color" label.
  if (variants.length === 0) {
    variants.push({
      label: colorFromFilename(p.image) || 'One Color',
      image: p.image,
      slug: p.slug,
    });
  }
  p.variants = variants;
}

// Pass 2: strip internal-only fields now that all variants are computed.
for (const p of products) {
  delete p.colorLabel;
  delete p.url;
}

const enrichedCategories = categories.map((c) => {
  const retailName = RETAIL_CATEGORY_NAMES[c.slug] || toTitleCase(c.name);
  return {
    slug: c.slug,
    name: retailName,
    tagline: retailTagline(c.slug, retailName),
    image: c.image || products.find((p) => p.category === c.slug)?.image || '',
  };
});

// The C.C umbrella category has no products of its own — reuse the beanie image.
const cc = enrichedCategories.find((c) => c.slug === 'cc');
if (cc && !cc.image) {
  cc.image = enrichedCategories.find((c) => c.slug === 'cc-beanie')?.image || '';
}

// Virtual "Women" category: unions all women's apparel + intimates categories
// so the WOMEN nav item shows the full women's range.
const WOMEN_CATEGORIES = [
  'tops', 't-shirts', 'cardigan-kimono', 'ponchos-vest', 'beach-towel',
  'basic-tops', 'dress', 'bottoms', 'leggings', 'sarong', 'pants', 'shorts',
  'skirts', 'intimates', 'bra', 'bra-bc', 'intimate-accessory', 'panty',
  'panty-spandex', 'lingerie', 'sexy-lingerie', 'bodyshaper', 'hosiery',
];
enrichedCategories.push({
  slug: 'women',
  name: 'Women',
  tagline: RETAIL_TAGLINES.women,
  image: enrichedCategories.find((c) => c.slug === 'tops')?.image || '',
});

// Homepage product grids as they appear on the original site.
let homeGrids = { featured: [], popular: [], new: [] };
try {
  homeGrids = JSON.parse(readFileSync(HOME_GRIDS_JSON, 'utf8'));
} catch {
  // optional
}

// Keep only home-grid slugs that still exist in the final catalog
// (pair-pack products filtered out above may no longer be present).
const finalSlugs = new Set(products.map((p) => p.slug));
const cleanHomeGrids = {};
for (const key of ['featured', 'popular', 'new']) {
  cleanHomeGrids[key] = (homeGrids[key] || []).filter((slug) => finalSlugs.has(slug));
}

// ---- emit catalog.ts ------------------------------------------------------
const catJson = JSON.stringify(enrichedCategories, null, 1);
const prodJson = JSON.stringify(products, null, 1);
const womenJson = JSON.stringify(WOMEN_CATEGORIES);

const out = `// AUTO-GENERATED by scripts/build-catalog.mjs from scripts/data/crawled-*.json
// Do not edit by hand. Re-run 'node scripts/build-catalog.mjs' after re-crawling.
//
// Retail conversion notes:
//  - 'price' is the discounted retail price for ONE unit (supplier pack
//    quantities are divided out). 'compareAtPrice' is the compare-at ("was")
//    price. 'packSize' keeps the supplier pack count as backend metadata for
//    inventory management. 'sku' is the supplier model number.
//  - Discounted price = landed cost x 2.7; compare-at = landed cost x 3.7,
//    rounded to .99 retail price points.

export interface Category {
  slug: string;
  name: string;
  tagline: string;
  image: string;
}

export interface ProductVariant {
  label: string;
  image: string;
  slug: string;
}

export interface Product {
  slug: string;
  name: string;
  sku: string;
  packSize: number;
  category: string;
  price: number;
  compareAtPrice: number | null;
  image: string;
  description: string;
  variants: ProductVariant[];
}

export const categories: Category[] = ${catJson};

export const products: Product[] = ${prodJson};

export const getCategory = (slug: string) => categories.find((c) => c.slug === slug);

export const getProduct = (slug: string) => products.find((p) => p.slug === slug);

// Categories that make up the virtual "Women" landing page.
const WOMEN_CATEGORIES = ${womenJson};

export const productsByCategory = (slug: string) => {
  const list =
    slug === 'cc'
      ? products.filter((p) => p.category === 'cc' || p.category.startsWith('cc-'))
      : slug === 'women'
        ? products.filter((p) => WOMEN_CATEGORIES.includes(p.category))
        : products.filter((p) => p.category === slug);
  // The cc umbrella unions several categories — drop cross-category duplicates.
  const seen = new Set<string>();
  return list.filter((p) => (seen.has(p.slug) ? false : (seen.add(p.slug), true)));
};

export const featuredProducts = products.slice(0, 12);

export const homeSections = {
  featured: ${JSON.stringify(cleanHomeGrids.featured)},
  popular: ${JSON.stringify(cleanHomeGrids.popular)},
  new: ${JSON.stringify(cleanHomeGrids.new)},
};
`;

mkdirSync('src/data', { recursive: true });
writeFileSync('src/data/catalog.ts', out);
console.log(
  `wrote src/data/catalog.ts: ${products.length} product entries, ` +
    `${products.filter((p) => p.packSize > 1).length} pack-quantity items converted to single units, ` +
    `${enrichedCategories.length} categories`
);
