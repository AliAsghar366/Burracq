import { createClient, type SupabaseClient } from '@supabase/supabase-js';

// Supabase project credentials. Values come from the environment when set,
// otherwise fall back to the project keys.
const supabaseUrl =
  import.meta.env.VITE_SUPABASE_URL || 'https://yoqznxksqxtmgjnwjwgl.supabase.co';
const supabaseKey =
  import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_AWW_6_o5mHCmJad-TsOslQ_1XnhPIOk';

export const supabase: SupabaseClient = createClient(supabaseUrl, supabaseKey);

/**
 * Expected table: `orders` with columns matching the order payload below.
 * Note: the publishable key only works if Row Level Security allows inserts
 * (or the table has no restrictive policies).
 */
export interface OrderPayload {
  order_id: string;
  items: Array<Record<string, unknown>>;
  total_items: number;
  subtotal: number;
  bill: number;
  name: string;
  address: string;
  city: string;
  customer: {
    name: string;
    address: string;
    city: string;
    zip: string;
    phone: string;
  };
  payment_method?: 'cod' | 'paypal' | null;
}

export async function saveOrderToSupabase(
  order: OrderPayload
): Promise<{ ok: boolean; error?: string }> {
  try {
    const { error } = await supabase.from('orders').insert([order]);
    if (error) return { ok: false, error: error.message };
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : String(err) };
  }
}

// ---------------------------------------------------------------------------
// Admin: orders, order status, viewer analytics
// ---------------------------------------------------------------------------

export type OrderStatus = 'placed' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled';

export const ORDER_STATUSES: OrderStatus[] = ['placed', 'confirmed', 'shipped', 'delivered', 'cancelled'];

export interface OrderItem {
  slug: string;
  name: string;
  price: number;
  image?: string;
  qty: number;
}

export interface AdminOrder {
  id?: number;
  order_id: string;
  items: OrderItem[];
  total_items: number | null;
  subtotal: number | null;
  bill: number | null;
  name: string;
  address: string;
  city: string;
  customer?: {
    name?: string;
    address?: string;
    city?: string;
    zip?: string;
    phone?: string;
  } | null;
  payment_method?: 'cod' | 'paypal' | null;
  status?: OrderStatus | null;
  created_at?: string | null;
}

export interface AnalyticsView {
  id?: number;
  path: string;
  region?: string | null;
  session_id?: string | null;
  user_agent?: string | null;
  viewed_at?: string | null;
}

interface QueryResult<T> {
  ok: boolean;
  data?: T[];
  error?: string;
  statusMissing?: boolean;
}

function isColumnMissing(err: { code?: string; message?: string } | null): boolean {
  return !!err && (err.code === '42703' || /does not exist/i.test(err.message || ''));
}

function isTableMissing(err: { code?: string; message?: string } | null): boolean {
  return !!err && (err.code === 'PGRST205' || /not find the table/i.test(err.message || ''));
}

/** Fetch all orders, newest first. Falls back gracefully if `status` column is missing. */
export async function fetchOrders(): Promise<QueryResult<AdminOrder>> {
  try {
    // Request the status column explicitly so we can detect when the
    // setup SQL (scripts/setup-supabase.sql) hasn't been run yet.
    let q = supabase
      .from('orders')
      .select('order_id,created_at,items,total_items,subtotal,bill,name,address,city,customer,status,payment_method')
      .order('created_at', { ascending: false })
      .order('order_id', { ascending: false });
    let { data, error } = await q;
    if (error && isColumnMissing(error)) {
      // status column not added yet — retry without it.
      ({ data, error } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false })
        .order('order_id', { ascending: false }));
      if (!error) {
        return { ok: true, data: data as AdminOrder[], statusMissing: true };
      }
    }
    if (error) return { ok: false, error: error.message };
    return { ok: true, data: data as AdminOrder[] };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : String(err) };
  }
}

export async function updateOrderStatus(
  orderId: string,
  status: OrderStatus
): Promise<{ ok: boolean; error?: string }> {
  try {
    const { error } = await supabase
      .from('orders')
      .update({ status })
      .eq('order_id', orderId);
    if (error) return { ok: false, error: error.message };
    // Append to the status history log (best effort).
    await supabase
      .from('order_status_log')
      .insert([{ order_id: orderId, status }]);
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : String(err) };
  }
}

export async function fetchViews(): Promise<QueryResult<AnalyticsView>> {
  try {
    const { data, error } = await supabase
      .from('analytics_views')
      .select('*')
      .order('viewed_at', { ascending: false })
      .limit(20000);
    if (error) return { ok: false, error: error.message };
    return { ok: true, data: data as AnalyticsView[] };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : String(err) };
  }
}

/** Record a page view (best effort — never blocks the UI). */
export async function insertView(view: {
  path: string;
  region?: string;
  session_id?: string;
  user_agent?: string;
}): Promise<{ ok: boolean; error?: string }> {
  try {
    const { error } = await supabase.from('analytics_views').insert([view]);
    if (error) return { ok: false, error: error.message };
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : String(err) };
  }
}

export { isTableMissing };
