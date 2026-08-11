// Admin access control.
//
// NOTE: this is a client-side gate — the password hash lives in the browser
// bundle, so it keeps casual visitors out but is NOT real security. For a
// truly protected admin, replace this with Supabase Auth (email/password
// sign-in against an admins table with Row Level Security). See README.

import { sha256 } from './sha256';

// sha256('burracq1214')
const ADMIN_PASSWORD_HASH = 'dcd871a38e4d1bba16846e23f6c04a6dc9bc18b910c97a960b085b874e795295';

const SESSION_KEY = 'burracq-admin-session';
const SESSION_TTL_MS = 12 * 60 * 60 * 1000; // 12 hours

export async function checkAdminPassword(password: string): Promise<boolean> {
  try {
    const hash = await sha256(password);
    return hash === ADMIN_PASSWORD_HASH;
  } catch {
    return false;
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
