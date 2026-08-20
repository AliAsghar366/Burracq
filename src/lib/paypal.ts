// Client-side PayPal helpers.
//
// This implementation creates orders directly from the browser using the
// PayPal JavaScript SDK. No server-side functions needed — only the Client ID.

// PayPal client ID — must be set in .env (see .env.example).
// This is a public/client-side key (not a secret), but should still be
// configured via environment variables rather than hardcoded.
const clientId = import.meta.env.VITE_PAYPAL_CLIENT_ID as string | undefined;

/** Whether PayPal checkout is available (a client ID is configured). */
export function isPayPalEnabled(): boolean {
  return Boolean(clientId);
}

function sdkUrl(): string {
  // Always use live PayPal
  return `https://www.paypal.com/sdk/js?client-id=${encodeURIComponent(clientId!)}&currency=USD&intent=capture`;
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

/** 
 * Create a PayPal order directly from the client side.
 * Returns the order ID to be used with onApprove.
 */
export async function createPayPalOrder(_amount: number): Promise<string> {
  // We'll return a placeholder — the actual order creation happens in the PayPalButton component
  // using the SDK's actions.order.create() method which handles everything client-side.
  return '';
}

/** 
 * Confirm (capture) an approved PayPal order.
 * In client-side mode, this is handled by the SDK's onApprove callback.
 */
export async function capturePayPalOrder(
  _orderId: string
): Promise<{ status?: string; captureId?: string | null; payerEmail?: string | null }> {
  // This function is not used in client-side mode
  return { status: 'completed' };
}

// Minimal typings for the PayPal JS SDK globals.
declare global {
  interface Window {
    paypal?: {
      Buttons: (options: {
        style?: Record<string, unknown>;
        createOrder: (data: unknown, actions: {
          order: {
            create: (order: {
              intent: string;
              purchase_units: Array<{
                description?: string;
                amount: {
                  currency_code: string;
                  value: string;
                  breakdown?: {
                    item_total?: { currency_code: string; value: string };
                    shipping?: { currency_code: string; value: string };
                  };
                };
                items?: Array<{
                  name: string;
                  unit_amount: { currency_code: string; value: string };
                  quantity: string;
                  category?: string;
                }>;
              }>;
            }) => Promise<string>;
          };
        }) => Promise<string>;
        onApprove: (
          data: { orderID: string },
          actions?: {
            order: {
              get: () => Promise<{
                id: string;
                payer?: {
                  email_address?: string;
                  name?: {
                    given_name?: string;
                    surname?: string;
                  };
                };
              }>;
            };
          }
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
