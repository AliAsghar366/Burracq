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
