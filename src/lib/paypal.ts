// Client-side PayPal helpers.
//
// The browser only ever sees the PUBLIC client ID (VITE_PAYPAL_CLIENT_ID).
// Order creation and capture are handled server-side by the Netlify
// Functions in /netlify/functions, which hold the secret.

const clientId = import.meta.env.VITE_PAYPAL_CLIENT_ID as string | undefined;
const env = (import.meta.env.VITE_PAYPAL_ENV as string | undefined) || 'live';

/** Whether PayPal checkout is available (a client ID is configured). */
export function isPayPalEnabled(): boolean {
  return Boolean(clientId);
}

function sdkUrl(): string {
  const base = env === 'sandbox' ? 'https://www.sandbox.paypal.com' : 'https://www.paypal.com';
  return `${base}/sdk/js?client-id=${encodeURIComponent(clientId!)}&currency=USD&intent=capture`;
}

let sdkPromise: Promise<void> | null = null;

/** Inject the PayPal JS SDK script once and resolve when it is ready. */
export function loadPayPalSdk(): Promise<void> {
  if (sdkPromise) return sdkPromise;

  sdkPromise = new Promise<void>((resolve, reject) => {
    if (typeof window === 'undefined' || !clientId) {
      reject(new Error('PayPal is not configured.'));
      return;
    }
    if (window.paypal?.Buttons) {
      resolve();
      return;
    }
    const existing = document.querySelector<HTMLScriptElement>('script[data-paypal-sdk]');
    if (existing) {
      existing.addEventListener('load', () => resolve(), { once: true });
      existing.addEventListener('error', () => reject(new Error('PayPal SDK failed to load.')), {
        once: true,
      });
      return;
    }
    const script = document.createElement('script');
    script.src = sdkUrl();
    script.async = true;
    script.dataset.paypalSdk = '';
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('PayPal SDK failed to load.'));
    document.head.appendChild(script);
  });

  return sdkPromise;
}

interface FunctionResponse {
  error?: string;
  id?: string;
}

/** Ask the server-side function to create a PayPal order. Returns the order id. */
export async function createPayPalOrder(amount: number): Promise<string> {
  const res = await fetch('/.netlify/functions/create-paypal-order', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ amount }),
  });
  const data: FunctionResponse = await res.json().catch(() => ({}));
  if (!res.ok || !data.id) {
    throw new Error(data.error || 'Could not start PayPal checkout. Please try again.');
  }
  return data.id;
}

/** Confirm (capture) an approved PayPal order server-side. */
export async function capturePayPalOrder(
  orderId: string
): Promise<{ status?: string; captureId?: string | null; payerEmail?: string | null }> {
  const res = await fetch('/.netlify/functions/capture-paypal-order', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ orderId }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || 'Could not confirm your payment. Please try again.');
  }
  return data;
}

// Minimal typings for the PayPal JS SDK globals.
declare global {
  interface Window {
    paypal?: {
      Buttons: (options: {
        style?: Record<string, unknown>;
        createOrder: () => Promise<string> | string;
        onApprove: (
          data: { orderID: string },
          actions?: unknown
        ) => Promise<void> | void;
        onCancel?: (data?: unknown) => void;
        onError?: (err?: unknown) => void;
      }) => {
        render: (container: HTMLElement | string) => Promise<void>;
        close: () => void;
      };
    };
  }
}
