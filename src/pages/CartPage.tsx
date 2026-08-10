import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';

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

  const handlePlaceOrder = () => {
    const res = placeOrder();
    setMessage({ ok: res.ok, text: res.message });
  };

  if (lastOrder && items.length === 0) {
    return (
      <section className="container section order-confirm">
        <span className="confirm-icon">✓</span>
        <h1>Order placed</h1>
        <p>
          Order <strong>{lastOrder.id}</strong> — {lastOrder.totalItems} items, total{' '}
          <strong>${lastOrder.total.toFixed(2)}</strong> (incl. shipping).
        </p>
        <p>We'll contact you shortly to confirm your order and arrange delivery.</p>
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
          <p className="summary-note">Free shipping on orders over $300.</p>
          <p className="summary-note">No account or sign-up required.</p>

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

          <button type="button" className="btn btn-primary btn-lg btn-block" onClick={handlePlaceOrder}>
            Place Order
          </button>
          {message && (
            <p className={message.ok ? 'form-msg ok' : 'form-msg error'}>{message.text}</p>
          )}
          <p className="summary-note">
            Payment will be handled securely at the next step.
          </p>
        </aside>
      </div>
    </section>
  );
}
