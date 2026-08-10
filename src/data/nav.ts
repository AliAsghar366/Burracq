// Top-level category navigation, matching the original site's sub-nav.
// Items with `children` open a dropdown of sub-sections, exactly like the
// original site's mega menu (labels and order copied from ilovehana.com).
export interface SubNavItem {
  label: string;
  to: string;
  children?: { label: string; to: string }[];
}

export const SUB_NAV: SubNavItem[] = [
  {
    label: 'New',
    to: '/category/new',
    children: [{ label: 'Patriotic Pride Collection', to: '/category/patriotic-pride' }],
  },
  {
    label: 'C.C',
    to: '/category/cc',
    children: [
      { label: 'C.C Beanie', to: '/category/cc-beanie' },
      { label: 'C.C Kids', to: '/category/cc-kids' },
      { label: 'C.C Scarf', to: '/category/cc-scarf' },
      { label: 'C.C Gloves', to: '/category/cc-gloves' },
      { label: 'C.C Hat', to: '/category/cc-hat' },
      { label: 'C.C Headband', to: '/category/cc-headband' },
      { label: 'C.C Cap', to: '/category/cc-cap' },
      { label: 'C.C Slippers', to: '/category/cc-slippers' },
      { label: 'C.C Accessories', to: '/category/cc-accessories' },
    ],
  },
  {
    label: 'Hats',
    to: '/category/hats',
    children: [
      { label: 'Baseball Cap', to: '/category/baseball-cap' },
      { label: 'Cowboy Hats', to: '/category/cowboy-hats' },
      { label: 'Beanie', to: '/category/beanie' },
      { label: 'Kids Hats and Beanies', to: '/category/kids-hats' },
      { label: 'Beret', to: '/category/beret' },
      { label: 'Fedora', to: '/category/fedora' },
      { label: 'Bucket Hat', to: '/category/bucket-hat' },
      { label: 'Panama Hat', to: '/category/panama-hat' },
      { label: 'Straw Hat', to: '/category/straw-hat' },
      { label: 'Headband', to: '/category/headband' },
    ],
  },
  {
    label: 'Scarves and Blankets',
    to: '/category/scarves-and-blankets',
    children: [
      { label: 'Blanket', to: '/category/blanket' },
      { label: 'Infinity Scarves', to: '/category/infinity-scarves' },
      { label: 'Oblong Scarves', to: '/category/oblong-scarves' },
      { label: 'Satin Scarves', to: '/category/satin-scarves' },
    ],
  },
  { label: 'Gloves', to: '/category/gloves' },
  {
    label: 'Socks and Slippers',
    to: '/category/socks-slippers',
    children: [
      { label: 'Leg and Arm Warmer', to: '/category/leg-arm-warmer' },
      { label: 'Slippers', to: '/category/slippers' },
      { label: 'Socks (Winter)', to: '/category/socks-winter' },
      { label: 'Socks (Spandex)', to: '/category/socks-spandex' },
      { label: 'Socks (Sports)', to: '/category/socks-sports' },
      { label: 'Socks (Children)', to: '/category/socks-children' },
    ],
  },
  {
    label: 'Bag',
    to: '/category/bag',
    children: [
      { label: 'Handbag', to: '/category/handbag' },
      { label: 'Clutch', to: '/category/clutch' },
      { label: 'Pouch & Wallet', to: '/category/pouch-wallet' },
      { label: 'Bag Strap', to: '/category/bag-strap' },
    ],
  },
  { label: 'Tumbler', to: '/category/tumbler' },
  {
    label: 'Tops',
    to: '/category/tops',
    children: [
      { label: 'T-Shirts', to: '/category/t-shirts' },
      { label: 'Cardigan and Kimono', to: '/category/cardigan-kimono' },
      { label: 'Ponchos and Vest', to: '/category/ponchos-vest' },
      { label: 'Beach Towel', to: '/category/beach-towel' },
      { label: 'Basic', to: '/category/basic-tops' },
      { label: 'Dress', to: '/category/dress' },
    ],
  },
  {
    label: 'Bottoms',
    to: '/category/bottoms',
    children: [
      { label: 'Leggings', to: '/category/leggings' },
      { label: 'Sarong', to: '/category/sarong' },
      { label: 'Pants', to: '/category/pants' },
      { label: 'Shorts', to: '/category/shorts' },
      { label: 'Skirts', to: '/category/skirts' },
    ],
  },
  {
    label: 'Intimates',
    to: '/category/intimates',
    children: [
      { label: 'Bra', to: '/category/bra' },
      { label: 'Panty', to: '/category/panty' },
      { label: 'Lingerie', to: '/category/lingerie' },
    ],
  },
  {
    label: 'Accessory',
    to: '/category/accessory',
    children: [
      { label: 'Belts', to: '/category/belts' },
      { label: 'Earrings', to: '/category/earrings' },
      { label: 'Hair Accessory', to: '/category/hair-accessory' },
      { label: 'Keychain', to: '/category/keychain' },
      { label: 'Headband (DZ)', to: '/category/headband-dz' },
      { label: 'Ponytail (DZ)', to: '/category/ponytail-dz' },
      { label: 'Hair Clip (DZ)', to: '/category/hair-clip-dz' },
      { label: 'Earring (DZ)', to: '/category/earring-dz' },
      { label: 'Necklace & Bracelet (DZ)', to: '/category/necklace-bracelet-dz' },
      { label: 'Bow (DZ)', to: '/category/bow-dz' },
      { label: 'Accessory (DZ)', to: '/category/accessory-dz' },
    ],
  },
  {
    label: 'Sale',
    to: '/category/sale',
    children: [
      { label: 'Necklace', to: '/category/necklace' },
      { label: 'Bracelet', to: '/category/bracelet' },
    ],
  },
];
