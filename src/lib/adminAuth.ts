// Admin access control — password only, no email.
// The password is verified server-side via Supabase RPC.
// Includes brute-force protection: max 5 attempts per 15 minutes.

import { supabase } from './supabase';

const SESSION_KEY = 'burracq-admin-session';
const SESSION_TTL_MS = 12 * 60 * 60 * 1000; // 12 hours

// Brute-force protection
const ATTEMPTS_KEY = 'burracq-admin-attempts';
const MAX_ATTEMPTS = 5;
const LOCKOUT_MS = 15 * 60 * 1000; // 15 minutes

function getAttempts(): { count: number; firstAt: number } {
  try {
    const raw = localStorage.getItem(ATTEMPTS_KEY);
    if (!raw) return { count: 0, firstAt: 0 };
    const data = JSON.parse(raw);
    // Reset if lockout period has passed
    if (Date.now() - data.firstAt > LOCKOUT_MS) {
      localStorage.removeItem(ATTEMPTS_KEY);
      return { count: 0, firstAt: 0 };
    }
    return data;
  } catch {
    return { count: 0, firstAt: 0 };
  }
}

function recordAttempt(): boolean {
  const attempts = getAttempts();
  if (attempts.count >= MAX_ATTEMPTS) return false; // locked out
  const newCount = attempts.count + 1;
  localStorage.setItem(
    ATTEMPTS_KEY,
    JSON.stringify({ count: newCount, firstAt: attempts.firstAt || Date.now() })
  );
  return true;
}

function clearAttempts() {
  localStorage.removeItem(ATTEMPTS_KEY);
}

/**
 * Verify the admin password server-side via Supabase RPC.
 * Rate-limited: max 5 failed attempts per 15 minutes.
 */
export async function signInAdmin(
  password: string
): Promise<{ ok: boolean; error?: string; locked?: boolean }> {
  // Check lockout
  const attempts = getAttempts();
  if (attempts.count >= MAX_ATTEMPTS) {
    const remaining = Math.ceil((LOCKOUT_MS - (Date.now() - attempts.firstAt)) / 60000);
    return {
      ok: false,
      error: `Too many failed attempts. Try again in ${remaining} minute${remaining !== 1 ? 's' : ''}.`,
      locked: true,
    };
  }

  try {
    const { data, error } = await supabase.rpc('verify_admin_password', {
      plain_password: password,
    });
    if (error) {
      return { ok: false, error: 'Connection failed. Please try again.' };
    }
    if (data === true) {
      clearAttempts();
      startAdminSession();
      return { ok: true };
    }
    // Failed — record attempt
    recordAttempt();
    const remaining = MAX_ATTEMPTS - getAttempts().count;
    return {
      ok: false,
      error: remaining > 0
        ? `Incorrect password. ${remaining} attempt${remaining !== 1 ? 's' : ''} remaining.`
        : 'Too many failed attempts. Locked out for 15 minutes.',
      locked: remaining <= 0,
    };
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
