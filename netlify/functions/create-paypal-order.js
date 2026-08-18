// Netlify Function: create a PayPal order (intent CAPTURE).
// Called by the storefront when the buyer clicks the PayPal button.
import { getAccessToken, paypalFetch, json } from './_paypal.js';

export async function handler(event) {
  if (event.httpMethod !== 'POST') {
    return json(405, { error: 'Method Not Allowed' });
  }

  try {
    let body;
    try {
      body = JSON.parse(event.body || '{}');
    } catch {
      return json(400, { error: 'Invalid JSON body' });
    }

    const amount = Number(body.amount);
    if (!Number.isFinite(amount) || amount <= 0 || amount > 100000) {
      return json(400, { error: 'Invalid order amount' });
    }

    const token = await getAccessToken();
    const order = await paypalFetch('/v2/checkout/orders', {
      token,
      method: 'POST',
      body: {
        intent: 'CAPTURE',
        purchase_units: [
          {
            description: 'BURACQ order',
            amount: {
              currency_code: 'USD',
              value: amount.toFixed(2),
            },
          },
        ],
      },
    });

    return json(200, { id: order.id, status: order.status });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return json(500, { error: msg });
  }
}
