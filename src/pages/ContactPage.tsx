import { useState } from 'react';

export const CONTACT_EMAIL = 'burrackbyrw@gmail.com';
export const CONTACT_PHONE = '+1 (240) 615-6110';
const WHATSAPP_LINK = 'https://wa.me/12406156110';

export default function ContactPage() {
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    order: '',
    subject: 'Order question',
    message: '',
  });
  const [sent, setSent] = useState(false);

  const set =
    (key: keyof typeof form) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
      setForm((f) => ({ ...f, [key]: e.target.value }));

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const subject = encodeURIComponent(
      `${form.subject}${form.order ? ` — Order ${form.order}` : ''}`
    );
    const body = encodeURIComponent(
      [
        form.message,
        '',
        `— ${form.name}`,
        form.email,
        form.phone ? `Phone: ${form.phone}` : '',
        form.order ? `Order #: ${form.order}` : '',
      ]
        .filter(Boolean)
        .join('\n')
    );
    window.location.href = `mailto:${CONTACT_EMAIL}?subject=${subject}&body=${body}`;
    setSent(true);
  };

  return (
    <section className="container section info-page">
      <h1>We&rsquo;re Here to Help &mdash; 24/7</h1>
      <p className="info-intro">
        Have a question about a product, your order, shipping, returns, or anything else? The
        BURRACQ Customer Support Team is available 24 hours a day, 7 days a week to assist you.
      </p>

      <div className="contact-cards">
        <div className="contact-card">
          <span className="contact-card-label">Email</span>
          <a href={`mailto:${CONTACT_EMAIL}`} className="contact-card-value">
            {CONTACT_EMAIL}
          </a>
        </div>
        <div className="contact-card">
          <span className="contact-card-label">Phone</span>
          <a href="tel:+12406156110" className="contact-card-value">
            {CONTACT_PHONE}
          </a>
        </div>
        <div className="contact-card">
          <span className="contact-card-label">Customer Support</span>
          <span className="contact-card-value">24/7</span>
        </div>
      </div>

      <h2 className="contact-block-title">Connect With Us</h2>
      <p className="contact-block-sub">Follow or message BURRACQ on:</p>
      <div className="social-links">
        <a
          className="social-link"
          href={WHATSAPP_LINK}
          target="_blank"
          rel="noopener noreferrer"
        >
          WhatsApp
        </a>
        <a
          className="social-link"
          href="https://www.instagram.com/burracq"
          target="_blank"
          rel="noopener noreferrer"
        >
          Instagram
        </a>
        <a
          className="social-link"
          href="https://www.facebook.com/burracq"
          target="_blank"
          rel="noopener noreferrer"
        >
          Facebook
        </a>
        <a
          className="social-link"
          href="https://www.tiktok.com/@burracq"
          target="_blank"
          rel="noopener noreferrer"
        >
          TikTok
        </a>
      </div>

      <h2 className="contact-block-title">Send Us a Message</h2>
      <p className="contact-block-sub">
        You can also use the contact form below and our team will get back to you as soon as
        possible.
      </p>

      <form className="contact-form" onSubmit={onSubmit}>
        <label className="field">
          <span>
            Full Name <em>*</em>
          </span>
          <input
            type="text"
            value={form.name}
            onChange={set('name')}
            placeholder="Your name"
            required
          />
        </label>
        <label className="field">
          <span>
            Email Address <em>*</em>
          </span>
          <input
            type="email"
            value={form.email}
            onChange={set('email')}
            placeholder="you@example.com"
            required
          />
        </label>
        <label className="field">
          <span>Phone Number (Optional)</span>
          <input
            type="tel"
            value={form.phone}
            onChange={set('phone')}
            placeholder="+1 (555) 000-0000"
          />
        </label>
        <label className="field">
          <span>Order Number (if applicable)</span>
          <input
            type="text"
            value={form.order}
            onChange={set('order')}
            placeholder="e.g. BRQ-100234"
          />
        </label>
        <label className="field">
          <span>
            Subject <em>*</em>
          </span>
          <select value={form.subject} onChange={set('subject')} required>
            <option>Order question</option>
            <option>Shipping</option>
            <option>Returns &amp; refunds</option>
            <option>Product question</option>
            <option>Something else</option>
          </select>
        </label>
        <label className="field">
          <span>
            Message <em>*</em>
          </span>
          <textarea
            value={form.message}
            onChange={set('message')}
            placeholder="How can we help?"
            rows={5}
            required
          />
        </label>
        <button type="submit" className="btn btn-primary">
          Send Message
        </button>
        {sent && (
          <p className="form-msg ok">
            Your email app should have opened with your message ready to send. Prefer to write us
            directly? {CONTACT_EMAIL}
          </p>
        )}
      </form>

      <h2 className="contact-block-title">Order Support</h2>
      <p>
        For faster assistance with an existing order, please include your order number when
        contacting us.
      </p>

      <p className="contact-closing">
        <strong>BURRACQ</strong>
        <br />
        Shop with confidence. We&rsquo;re always here to help.
      </p>
    </section>
  );
}
