// Main retail navigation for BURRACQ.
// Items with `children` open a dropdown of sub-sections.
export interface SubNavItem {
  label: string;
  to: string;
  children?: { label: string; to: string }[];
}

export const SUB_NAV: SubNavItem[] = [
  {
    label: 'New',
    to: '/category/new',
    children: [{ label: 'Patriotic Collection', to: '/category/patriotic-pride' }],
  },
  {
    label: 'Women',
    to: '/category/women',
    children: [
      { label: 'Tops', to: '/category/tops' },
      { label: 'Dresses', to: '/category/dress' },
      { label: 'T-Shirts', to: '/category/t-shirts' },
      { label: 'Cardigans & Kimonos', to: '/category/cardigan-kimono' },
      { label: 'Ponchos & Vests', to: '/category/ponchos-vest' },
      { label: 'Basic Tops', to: '/category/basic-tops' },
      { label: 'Bottoms', to: '/category/bottoms' },
      { label: 'Leggings', to: '/category/leggings' },
      { label: 'Pants', to: '/category/pants' },
      { label: 'Shorts', to: '/category/shorts' },
      { label: 'Skirts', to: '/category/skirts' },
      { label: 'Sarongs', to: '/category/sarong' },
      { label: 'Intimates', to: '/category/intimates' },
      { label: 'Bras', to: '/category/bra' },
      { label: 'Panties', to: '/category/panty' },
      { label: 'Lingerie', to: '/category/lingerie' },
      { label: 'Body Shapers', to: '/category/bodyshaper' },
    ],
  },
  {
    label: 'Hats',
    to: '/category/hats',
    children: [
      { label: 'Beanies', to: '/category/beanie' },
      { label: 'Baseball Caps', to: '/category/baseball-cap' },
      { label: 'Cowboy Hats', to: '/category/cowboy-hats' },
      { label: "Kids' Hats", to: '/category/kids-hats' },
      { label: 'Berets', to: '/category/beret' },
      { label: 'Fedoras', to: '/category/fedora' },
      { label: 'Bucket Hats', to: '/category/bucket-hat' },
      { label: 'Panama Hats', to: '/category/panama-hat' },
      { label: 'Straw Hats', to: '/category/straw-hat' },
      { label: 'Headbands', to: '/category/headband' },
    ],
  },
  {
    label: 'Bags',
    to: '/category/bag',
    children: [
      { label: 'Handbags', to: '/category/handbag' },
      { label: 'Clutches', to: '/category/clutch' },
      { label: 'Pouches & Wallets', to: '/category/pouch-wallet' },
      { label: 'Bag Straps', to: '/category/bag-strap' },
    ],
  },
  {
    label: 'Accessories',
    to: '/category/accessory',
    children: [
      { label: 'Scarves & Blankets', to: '/category/scarves-and-blankets' },
      { label: 'Gloves', to: '/category/gloves' },
      { label: 'Socks & Slippers', to: '/category/socks-slippers' },
      { label: 'Earrings', to: '/category/earrings' },
      { label: 'Belts', to: '/category/belts' },
      { label: 'Hair Accessories', to: '/category/hair-accessory' },
      { label: 'Keychains', to: '/category/keychain' },
      { label: 'Necklaces', to: '/category/necklace' },
      { label: 'Bracelets', to: '/category/bracelet' },
      { label: 'Tumblers', to: '/category/tumbler' },
    ],
  },
  {
    label: 'Sale',
    to: '/category/sale',
    children: [
      { label: 'Necklaces', to: '/category/necklace' },
      { label: 'Bracelets', to: '/category/bracelet' },
    ],
  },
];
