// Shared PayPal REST helpers for the Netlify Functions.
// These run server-side (Node 20) and keep PAYPAL_CLIENT_SECRET out of
// the browser bundle. The public client ID may be exposed; the secret must
// only ever live in the Netlify environment / local .env.

const ENV = 'sandbox';
const API_BASE = 'https://api-m.sandbox.paypal.com';

let tokenCache = { token: null, expiresAt: 0 };

/** Fetch a PayPal OAuth access token (cached until ~1 min before expiry). */
export async function getAccessToken() {
  if (tokenCache.token && Date.now() < tokenCache.expiresAt) {
    return tokenCache.token;
  }

  const clientId = 'EG8D_3W76SqZ45zSkUfU3LQfjMlX-fhJqFf8mwxjDXsbAH3woCoLf5bnLkIrmSiRJ58TvZwiyM2Z8q3c';
  const secret = 'BAAWurhXSkR0cvZGDKvx5s-TXrkz9cks0_CdOYjWIu90cw2v9O6U1qbR08o74PHmnnTzoPcZWW0zF11ATk';

  const res = await fetch(`${API_BASE}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Authorization: `Basic ${Buffer.from(`${clientId}:${secret}`).toString('base64')}`,
    },
    body: 'grant_type=client_credentials',
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg =
      data.error_description || data.error || `PayPal auth failed (${res.status})`;
    throw new Error(msg);
  }
  tokenCache = {
    token: data.access_token,
    expiresAt: Date.now() + (Number(data.expires_in || 1800) - 60) * 1000,
  };
  return tokenCache.token;
}

/** Authenticated request against the PayPal REST API. */
export async function paypalFetch(path, { token, method = 'GET', body } = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg =
      data.message ||
      data.details?.[0]?.description ||
      `PayPal request failed (${res.status})`;
    throw new Error(msg);
  }
  return data;
}

/** JSON response helper. */
export function json(statusCode, body) {
  return {
    statusCode,
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  };
}
