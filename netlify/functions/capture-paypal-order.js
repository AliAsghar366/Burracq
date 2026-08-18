// Netlify Function: capture a PayPal order after buyer approval.
// Called by the storefront after the buyer approves payment in PayPal.
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

    const orderId = String(body.orderId || '').trim();
    if (!orderId) {
      return json(400, { error: 'Missing orderId' });
    }

    const token = await getAccessToken();
    const capture = await paypalFetch(`/v2/checkout/orders/${orderId}/capture`, {
      token,
      method: 'POST',
      body: {},
    });

    const payment =
      capture.purchase_units?.[0]?.payments?.captures?.[0] ?? null;

    return json(200, {
      status: capture.status,
      orderId: capture.id,
      captureId: payment?.id ?? null,
      payerEmail: capture.payer?.email_address ?? null,
      amount: payment?.amount
        ? `${payment.amount.currency_code} ${payment.amount.value}`
        : null,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return json(500, { error: msg });
  }
}
