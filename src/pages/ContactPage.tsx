import { useState } from 'react';

const CONTACT_EMAIL = 'hello@burracq.com';

export default function ContactPage() {
  const [form, setForm] = useState({ name: '', email: '', subject: 'Order question', message: '' });
  const [sent, setSent] = useState(false);

  const set = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [key]: e.target.value }));

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const subject = encodeURIComponent(`${form.subject}${form.name ? ` — ${form.name}` : ''}`);
    const body = encodeURIComponent(
      `${form.message}\n\n— ${form.name}\n${form.email}`
    );
    window.location.href = `mailto:${CONTACT_EMAIL}?subject=${subject}&body=${body}`;
    setSent(true);
  };

  return (
    <section className="container section info-page">
      <h1>Contact Us</h1>
      <p className="info-intro">
        Questions about an order, a product or a return? We&apos;re happy to help. We reply to most
        messages within 1&ndash;2 business days.
      </p>

      <form className="contact-form" onSubmit={onSubmit}>
        <label className="field">
          <span>Your name</span>
          <input type="text" value={form.name} onChange={set('name')} placeholder="Your name" required />
        </label>
        <label className="field">
          <span>Email address</span>
          <input type="email" value={form.email} onChange={set('email')} placeholder="you@example.com" required />
        </label>
        <label className="field">
          <span>Topic</span>
          <select value={form.subject} onChange={set('subject')}>
            <option>Order question</option>
            <option>Shipping</option>
            <option>Returns &amp; refunds</option>
            <option>Product question</option>
            <option>Something else</option>
          </select>
        </label>
        <label className="field">
          <span>Message</span>
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
    </section>
  );
}
