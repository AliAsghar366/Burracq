import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useCart, validateCheckout, type PaymentMethod } from '../context/CartContext';
import PayPalButton from '../components/PayPalButton';
import { isPayPalEnabled } from '../lib/paypal';

export default function CartPage() {
  const {
    items,
    totalItems,
    subtotal,
    shipping,
    total,
    updateQty,
    removeItem,
    checkout,
    setCheckoutField,
    placeOrder,
    lastOrder,
  } = useCart();
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);
  const [payment, setPayment] = useState<PaymentMethod>('cod');

  const paypalEnabled = isPayPalEnabled();

  const handlePlaceOrder = () => {
    const res = placeOrder('cod');
    setMessage({ ok: res.ok, text: res.message });
  };

  const handlePayPalSuccess = () => {
    const res = placeOrder('paypal');
    if (res.ok) {
      setMessage({ ok: true, text: `Payment received — ${res.message}` });
    } else {
      setMessage({ ok: false, text: res.message });
    }
  };

  if (lastOrder && items.length === 0) {
    const paidOnline = lastOrder.paymentMethod === 'paypal';
    return (
      <section className="container section order-confirm">
        <span className="confirm-icon">✓</span>
        <h1>Order placed</h1>
        <p>
          Order <strong>{lastOrder.id}</strong> — {lastOrder.totalItems} items, total{' '}
          <strong>${lastOrder.total.toFixed(2)}</strong> (incl. shipping).
        </p>
        <p>
          {paidOnline ? (
            <>
              Your payment via <strong>PayPal</strong> has been received and confirmed. We'll
              contact you shortly to arrange delivery.
            </>
          ) : (
            <>
              You chose <strong>Cash on Delivery</strong> — keep ${lastOrder.total.toFixed(2)}{' '}
              ready when your order arrives. We'll contact you shortly to confirm your order and
              arrange delivery.
            </>
          )}
        </p>
        <Link to="/" className="btn btn-primary">
          Continue shopping
        </Link>
      </section>
    );
  }

  if (items.length === 0) {
    return (
      <section className="container section empty-cart">
        <h1>Your cart is empty</h1>
        <p>Browse the catalog and add products to get started — no account needed.</p>
        <Link to="/" className="btn btn-primary">
          Start shopping
        </Link>
      </section>
    );
  }

  const fields: Array<{ key: keyof typeof checkout; label: string; placeholder: string }> = [
    { key: 'name', label: 'Full name', placeholder: 'Full name' },
    { key: 'address', label: 'Address', placeholder: 'Street address' },
    { key: 'city', label: 'City', placeholder: 'City' },
    { key: 'zip', label: 'ZIP / postal code', placeholder: 'ZIP / postal code' },
    { key: 'phone', label: 'Contact number', placeholder: 'Contact number' },
  ];

  return (
    <section className="container section">
      <h1>Shopping Cart</h1>

      <div className="cart-layout">
        <div className="cart-items">
          {items.map((item) => (
            <div className="cart-item" key={item.slug}>
              <Link to={`/product/${item.slug}`} className="cart-item-media">
                <img src={item.image} alt={item.name} />
              </Link>
              <div className="cart-item-info">
                <Link to={`/product/${item.slug}`} className="cart-item-name">
                  {item.name}
                </Link>
                <p className="cart-item-price">${item.price.toFixed(2)}</p>
                <div className="stepper">
                  <button type="button" onClick={() => updateQty(item.slug, item.qty - 1)}>
                    −
                  </button>
                  <input
                    type="number"
                    min={1}
                    value={item.qty}
                    onChange={(e) => updateQty(item.slug, Math.max(1, Number(e.target.value) || 1))}
                    aria-label={`Quantity of ${item.name}`}
                  />
                  <button type="button" onClick={() => updateQty(item.slug, item.qty + 1)}>
                    +
                  </button>
                </div>
                <button type="button" className="link-remove" onClick={() => removeItem(item.slug)}>
                  Remove
                </button>
              </div>
              <p className="cart-item-total">${(item.qty * item.price).toFixed(2)}</p>
            </div>
          ))}
        </div>

        <aside className="cart-summary">
          <h2>Order Summary</h2>
          <div className="summary-row">
            <span>Items ({totalItems})</span>
            <span>${subtotal.toFixed(2)}</span>
          </div>
          <div className="summary-row">
            <span>Shipping</span>
            <span>{shipping === 0 ? 'FREE' : `$${shipping.toFixed(2)}`}</span>
          </div>
          <div className="summary-row total">
            <span>Total</span>
            <span>${total.toFixed(2)}</span>
          </div>
          <p className="summary-note">Free shipping on orders of $100 or more.</p>

          <h2 className="checkout-title">Delivery Details</h2>
          {fields.map((f) => (
            <label key={f.key} className="field">
              <span>{f.label}</span>
              <input
                type={f.key === 'phone' ? 'tel' : 'text'}
                value={checkout[f.key]}
                placeholder={f.placeholder}
                onChange={(e) => setCheckoutField(f.key, e.target.value)}
              />
            </label>
          ))}

          <h2 className="checkout-title">Payment Method</h2>
          <div className="payment-options" role="radiogroup" aria-label="Payment method">
            <label className={`payment-option${payment === 'cod' ? ' selected' : ''}`}>
              <input
                type="radio"
                name="payment"
                value="cod"
                checked={payment === 'cod'}
                onChange={() => setPayment('cod')}
              />
              <span className="payment-option-body">
                <span className="payment-option-title">Cash on Delivery</span>
                <span className="payment-option-desc">
                  Pay when your order arrives. No card or account needed.
                </span>
              </span>
            </label>

            {paypalEnabled && (
              <label className={`payment-option${payment === 'paypal' ? ' selected' : ''}`}>
                <input
                  type="radio"
                  name="payment"
                  value="paypal"
                  checked={payment === 'paypal'}
                  onChange={() => setPayment('paypal')}
                />
                <span className="payment-option-body">
                  <span className="payment-option-title">PayPal</span>
                  <span className="payment-option-desc">
                    Pay online now — secure PayPal checkout.
                  </span>
                </span>
              </label>
            )}
          </div>

          {payment === 'cod' ? (
            <>
              <button
                type="button"
                className="btn btn-primary btn-lg btn-block"
                onClick={handlePlaceOrder}
              >
                Place Order — Pay on Delivery
              </button>
              <p className="summary-note">
                No payment now. We'll contact you to confirm your order before dispatch.
              </p>
            </>
          ) : (
            <div className="paypal-section">
              {validateCheckout(checkout) === null ? (
                <PayPalButton
                  amount={total}
                  onSuccess={handlePayPalSuccess}
                  onError={(msg) => setMessage({ ok: false, text: msg })}
                />
              ) : (
                <p className="summary-note paypal-hint">
                  Fill in your delivery details above to pay with PayPal.
                </p>
              )}
            </div>
          )}

          {message && (
            <p className={message.ok ? 'form-msg ok' : 'form-msg error'}>{message.text}</p>
          )}

          <p className="summary-note">
            Pay online with PayPal or choose Cash on Delivery. See our{' '}
            <Link to="/shipping-policy">Shipping Policy</Link> and{' '}
            <Link to="/returns">Return &amp; Refund Policy</Link>.
          </p>
        </aside>
      </div>
    </section>
  );
}
