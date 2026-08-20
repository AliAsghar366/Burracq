// Admin access control — password only, no email.
// The password is verified server-side via Supabase RPC.
// No password or hash ever appears in the JavaScript bundle.

import { supabase } from './supabase';

const SESSION_KEY = 'burracq-admin-session';
const SESSION_TTL_MS = 12 * 60 * 60 * 1000; // 12 hours

/**
 * Verify the admin password server-side via Supabase RPC.
 * The password is sent to the database function which compares
 * against the bcrypt hash — it never touches the JS bundle.
 */
export async function signInAdmin(
  password: string
): Promise<{ ok: boolean; error?: string }> {
  try {
    const { data, error } = await supabase.rpc('verify_admin_password', {
      plain_password: password,
    });
    if (error) {
      return { ok: false, error: 'Connection failed. Please try again.' };
    }
    if (data === true) {
      startAdminSession();
      return { ok: true };
    }
    return { ok: false, error: 'Incorrect password. Try again.' };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : 'Authentication failed',
    };
  }
}

export function startAdminSession() {
  sessionStorage.setItem(SESSION_KEY, String(Date.now() + SESSION_TTL_MS));
}

export function isAdminSessionActive(): boolean {
  try {
    const expiry = Number(sessionStorage.getItem(SESSION_KEY) || 0);
    return expiry > Date.now();
  } catch {
    return false;
  }
}

export function endAdminSession() {
  try {
    sessionStorage.removeItem(SESSION_KEY);
  } catch {
    // ignore
  }
}

export function signOutAdmin() {
  endAdminSession();
}
