import { useState, type FormEvent } from 'react';
import {
  signInAdmin,
  signOutAdmin,
  isAdminSessionActive,
} from '../../lib/adminAuth';
import AdminDashboard from './AdminDashboard';
import AdminOrders from './AdminOrders';
import AdminAnalytics from './AdminAnalytics';

type Tab = 'dashboard' | 'orders' | 'analytics';

const TABS: { key: Tab; label: string }[] = [
  { key: 'dashboard', label: 'Dashboard' },
  { key: 'orders', label: 'Orders' },
  { key: 'analytics', label: 'Analytics' },
];

function AdminLogin({ onSuccess }: { onSuccess: () => void }) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    const result = await signInAdmin(password);
    setBusy(false);
    if (result.ok) {
      onSuccess();
    } else {
      setError('Incorrect password. Try again.');
    }
  };

  return (
    <div className="admin-login-wrap">
      <form className="admin-login" onSubmit={submit}>
        <h1 className="admin-login-title">
          <img src="/brand-wordmark.svg" className="login-wordmark" alt="BURACQ" />
          <span>Admin</span>
        </h1>
        <p className="admin-login-sub">Restricted area — sign in to continue.</p>
        <label className="field">
          <span>Password</span>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoFocus
            placeholder="••••••••••"
            required
          />
        </label>
        {error && <p className="form-msg error">{error}</p>}
        <button type="submit" className="btn btn-primary btn-block" disabled={busy}>
          {busy ? 'Signing in…' : 'Sign In'}
        </button>
      </form>
    </div>
  );
}

export default function AdminApp() {
  const [authed, setAuthed] = useState(isAdminSessionActive());
  const [tab, setTab] = useState<Tab>('dashboard');

  if (!authed) {
    return <AdminLogin onSuccess={() => setAuthed(true)} />;
  }

  return (
    <div className="admin">
      <header className="admin-header container">
        <div className="admin-brand">
          <img src="/logo.svg" className="logo-mark" alt="" aria-hidden="true" />
          <img src="/brand-wordmark.svg" className="logo-wordmark admin-wordmark" alt="BURACQ" />
          <strong>Admin</strong>
        </div>
        <div className="admin-header-actions">
          <a href="/" className="admin-link" onClick={(e) => e.preventDefault()}>
            ← Back to store
          </a>
          <button
            type="button"
            className="btn btn-outline-dark btn-quick"
            onClick={() => {
              signOutAdmin();
              setAuthed(false);
            }}
          >
            Log out
          </button>
        </div>
      </header>

      <nav className="admin-tabs container" aria-label="Admin sections">
        {TABS.map((t) => (
          <button
            key={t.key}
            type="button"
            className={`admin-tab${tab === t.key ? ' active' : ''}`}
            onClick={() => setTab(t.key)}
          >
            {t.label}
          </button>
        ))}
      </nav>

      <main className="container admin-main">
        {tab === 'dashboard' && <AdminDashboard />}
        {tab === 'orders' && <AdminOrders />}
        {tab === 'analytics' && <AdminAnalytics />}
      </main>
    </div>
  );
}
