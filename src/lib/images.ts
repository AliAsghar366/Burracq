// Image helpers for the supplier CDN (BigCommerce stencil).
//
// Product images are stored at "stencil/900x900/...". Grid cards don't need
// that much resolution — requesting a smaller stencil size makes every
// product image load faster and use less bandwidth.

const STENCIL_RE = /\/stencil\/\d+x\d+\//;

// A compact image URL for grid cards (450px is plenty for a thumbnail).
export const cardImageOf = (url: string): string =>
  STENCIL_RE.test(url) ? url.replace(STENCIL_RE, '/stencil/450x450/') : url;

// The full-resolution image URL for the product page.
export const fullImageOf = (url: string): string =>
  STENCIL_RE.test(url) ? url.replace(STENCIL_RE, '/stencil/900x900/') : url;
