import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { saveOrderToSupabase } from '../lib/supabase';
import { validateOrderPrices } from '../lib/orderValidation';

export interface CartItem {
  slug: string;
  name: string;
  price: number;
  image: string;
  qty: number;
}

export interface CheckoutInfo {
  name: string;
  address: string;
  city: string;
  zip: string;
  phone: string;
}

export type PaymentMethod = 'cod' | 'paypal';

export interface Order {
  id: string;
  items: CartItem[];
  totalItems: number;
  subtotal: number;
  shipping: number;
  total: number;
  info: CheckoutInfo;
  paymentMethod: PaymentMethod;
  createdAt: string;
}

interface CartContextValue {
  items: CartItem[];
  totalItems: number;
  subtotal: number;
  shipping: number;
  total: number;
  addToCart: (p: { slug: string; name: string; price: number; image: string }, qty?: number) => void;
  updateQty: (slug: string, qty: number) => void;
  removeItem: (slug: string) => void;
  clearCart: () => void;
  checkout: CheckoutInfo;
  setCheckoutField: (key: keyof CheckoutInfo, value: string) => void;
  placeOrder: (paymentMethod?: PaymentMethod) => { ok: boolean; message: string };
  lastOrder: Order | null;
}

const CartContext = createContext<CartContextValue | null>(null);

const CART_KEY = 'burracq-cart';
const ORDERS_KEY = 'burracq-orders';

function load<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

const emptyCheckout: CheckoutInfo = { name: '', address: '', city: '', zip: '', phone: '' };

const REQUIRED_FIELDS: Array<[keyof CheckoutInfo, string]> = [
  ['name', 'Full name'],
  ['address', 'Address'],
  ['city', 'City'],
  ['zip', 'ZIP / postal code'],
  ['phone', 'Contact number'],
];

/** Returns an error message for the first missing delivery field, or null. */
export function validateCheckout(checkout: CheckoutInfo): string | null {
  for (const [key, label] of REQUIRED_FIELDS) {
    if (!checkout[key].trim()) return `${label} is required.`;
  }
  return null;
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>(() => load<CartItem[]>(CART_KEY, []));
  const [checkout, setCheckout] = useState<CheckoutInfo>(() => load<CheckoutInfo>(ORDERS_KEY + '-draft', emptyCheckout));
  const [lastOrder, setLastOrder] = useState<Order | null>(null);

  useEffect(() => {
    localStorage.setItem(CART_KEY, JSON.stringify(items));
  }, [items]);

  useEffect(() => {
    localStorage.setItem(ORDERS_KEY + '-draft', JSON.stringify(checkout));
  }, [checkout]);

  const addToCart = (p: { slug: string; name: string; price: number; image: string }, qty = 1) => {
    setItems((prev) => {
      const existing = prev.find((i) => i.slug === p.slug);
      if (existing) {
        return prev.map((i) => (i.slug === p.slug ? { ...i, qty: i.qty + qty } : i));
      }
      return [...prev, { ...p, qty }];
    });
  };

  const updateQty = (slug: string, qty: number) => {
    setItems((prev) =>
      qty <= 0
        ? prev.filter((i) => i.slug !== slug)
        : prev.map((i) => (i.slug === slug ? { ...i, qty } : i))
    );
  };

  const removeItem = (slug: string) => setItems((prev) => prev.filter((i) => i.slug !== slug));
  const clearCart = () => setItems([]);

  const setCheckoutField = (key: keyof CheckoutInfo, value: string) =>
    setCheckout((prev) => ({ ...prev, [key]: value }));

  const totalItems = useMemo(() => items.reduce((n, i) => n + i.qty, 0), [items]);
  const subtotal = useMemo(() => items.reduce((n, i) => n + i.qty * i.price, 0), [items]);
  // Shipping: flat $8 fee, free on orders of $100 or more.
  const shipping = useMemo(() => (subtotal > 0 && subtotal < 100 ? 8 : 0), [subtotal]);
  const total = useMemo(() => subtotal + shipping, [subtotal, shipping]);

  const placeOrder = (paymentMethod: PaymentMethod = 'cod'): { ok: boolean; message: string } => {
    if (items.length === 0) return { ok: false, message: 'Your cart is empty.' };
    const missing = validateCheckout(checkout);
    if (missing) return { ok: false, message: missing };
    // Validate prices against catalog (prevents price tampering)
    const priceCheck = validateOrderPrices(items);
    if (!priceCheck.valid) return { ok: false, message: priceCheck.error || 'Invalid order.' };
    const order: Order = {
      id: `BQ-${Date.now().toString(36).toUpperCase()}`,
      items,
      totalItems,
      subtotal,
      shipping,
      total,
      info: checkout,
      paymentMethod,
      createdAt: new Date().toISOString(),
    };
    // Persist locally (source of truth) and sync to Supabase best-effort.
    const orders = load<Order[]>(ORDERS_KEY, []);
    localStorage.setItem(ORDERS_KEY, JSON.stringify([...orders, order]));
    saveOrderToSupabase({
      order_id: order.id,
      items: order.items.map((i) => ({
        slug: i.slug,
        name: i.name,
        price: i.price,
        image: i.image,
        qty: i.qty,
      })),
      total_items: order.totalItems,
      subtotal: order.subtotal,
      bill: order.total,
      name: order.info.name,
      address: order.info.address,
      city: order.info.city,
      customer: order.info,
      payment_method: order.paymentMethod,
    }).then((res) => {
      if (!res.ok) {
        // Table or RLS policy may not exist yet — order is still saved locally.
        console.warn('Supabase order sync skipped:', res.error);
      } else {
        console.log('Supabase order synced:', order.id);
      }
    });
    // TODO(stripe): redirect to Stripe Checkout session when integrated.
    setLastOrder(order);
    clearCart();
    return { ok: true, message: `Order ${order.id} placed. We'll contact you to confirm.` };
  };

  const value: CartContextValue = {
    items,
    totalItems,
    subtotal,
    shipping,
    total,
    addToCart,
    updateQty,
    removeItem,
    clearCart,
    checkout,
    setCheckoutField,
    placeOrder,
    lastOrder,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used inside <CartProvider>');
  return ctx;
}
