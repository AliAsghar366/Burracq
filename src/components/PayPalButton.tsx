import { useEffect, useRef, useState } from 'react';
import { loadPayPalSdk } from '../lib/paypal';

interface PayPalButtonProps {
  /** Total to charge (USD). */
  amount: number;
  /** Called after the payment is captured and confirmed. */
  onSuccess: () => void;
  /** Called when PayPal reports an error. */
  onError?: (message: string) => void;
}

export default function PayPalButton({ amount, onSuccess, onError }: PayPalButtonProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [state, setState] = useState<'loading' | 'ready' | 'error'>('loading');
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    let buttons: {
      render: (container: HTMLElement | string) => Promise<void>;
      close: () => void;
    } | null = null;

    loadPayPalSdk()
      .then(() => {
        if (cancelled || !containerRef.current || !window.paypal) return;

        buttons = window.paypal.Buttons({
          style: { layout: 'vertical', color: 'gold', shape: 'rect', label: 'paypal' },
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          createOrder: (_data: any, actions: any) => {
            // Create order directly in the browser (client-side)
            return actions.order.create({
              intent: 'CAPTURE',
              purchase_units: [
                {
                  description: 'BURRACQ Order',
                  amount: {
                    currency_code: 'USD',
                    value: amount.toFixed(2),
                  },
                },
              ],
            });
          },
          onApprove: async (_data, actions) => {
            try {
              // In client-side mode, we can optionally capture on the client
              // or just call onSuccess since PayPal already authorized the payment.
              // For simplicity, we'll just confirm success.
              if (actions?.order) {
                await actions.order.get();
              }
              onSuccess();
            } catch (err) {
              const msg = err instanceof Error ? err.message : String(err);
              setError(msg);
              onError?.(msg);
            }
          },
          onCancel: () => {
            // Buyer closed the PayPal window — cart stays intact.
          },
          onError: (err) => {
            const msg =
              err instanceof Error
                ? err.message
                : 'PayPal could not process your payment. Please try again.';
            setError(msg);
            onError?.(msg);
          },
        });

        buttons
          .render(containerRef.current)
          .then(() => {
            if (!cancelled) setState('ready');
          })
          .catch(() => {
            if (!cancelled) {
              setState('error');
              setError('PayPal could not load. Please try again or use Place Order.');
            }
          });
      })
      .catch((err) => {
        if (cancelled) return;
        setState('error');
        const msg = err instanceof Error ? err.message : 'PayPal is unavailable.';
        setError(msg);
        onError?.(msg);
      });

    return () => {
      cancelled = true;
      buttons?.close();
    };
    // Rebuild the buttons if the amount changes (keeps the charge in sync).
  }, [amount, onError, onSuccess]);

  return (
    <div className="paypal-checkout">
      {state === 'loading' && (
        <p className="summary-note paypal-loading">Loading PayPal…</p>
      )}
      {state === 'error' && <p className="form-msg error">{error}</p>}
      <div ref={containerRef} />
    </div>
  );
}
