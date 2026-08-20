/**
 * Order validation — prevents price tampering from the client side.
 * Validates that the order total matches the catalog prices.
 */

import { getProduct } from '../data/catalog';

interface OrderItem {
  slug: string;
  name: string;
  price: number;
  image: string;
  qty: number;
}

/**
 * Validates that order items match catalog prices.
 * Returns { valid: true } if prices match, or { valid: false, error } if tampered.
 */
export function validateOrderPrices(items: OrderItem[]): {
  valid: boolean;
  error?: string;
} {
  for (const item of items) {
    const product = getProduct(item.slug);
    if (!product) {
      return { valid: false, error: `Product "${item.name}" not found in catalog.` };
    }
    // Allow a small tolerance for floating point differences
    const expectedPrice = Math.round(product.price * 100);
    const actualPrice = Math.round(item.price * 100);
    if (expectedPrice !== actualPrice) {
      return {
        valid: false,
        error: `Price mismatch for "${item.name}". Expected $${product.price.toFixed(2)}, got $${item.price.toFixed(2)}.`,
      };
    }
  }
  return { valid: true };
}

/**
 * Validates checkout info is not empty.
 */
export function validateCheckoutInfo(info: {
  name: string;
  address: string;
  city: string;
  zip: string;
  phone: string;
}): { valid: boolean; error?: string } {
  if (!info.name.trim()) return { valid: false, error: 'Name is required.' };
  if (!info.address.trim()) return { valid: false, error: 'Address is required.' };
  if (!info.city.trim()) return { valid: false, error: 'City is required.' };
  if (!info.zip.trim()) return { valid: false, error: 'ZIP code is required.' };
  if (!info.phone.trim()) return { valid: false, error: 'Phone number is required.' };
  return { valid: true };
}
