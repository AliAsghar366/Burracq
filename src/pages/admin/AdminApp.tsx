import { useState, type FormEvent } from 'react';
import {
  checkAdminPassword,
  endAdminSession,
  isAdminSessionActive,
  startAdminSession,
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
  const [error, setError] = useState(false);
  const [busy, setBusy] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(false);
    const ok = await checkAdminPassword(password);
    setBusy(false);
    if (ok) {
      startAdminSession();
      onSuccess();
    } else {
      setError(true);
    }
  };

  return (
    <div className="admin-login-wrap">
      <form className="admin-login" onSubmit={submit}>
        <img src="/logo.png" className="logo-img admin-login-logo" alt="BURACQ" />
        <h1>BURACQ Admin</h1>
        <p className="admin-login-sub">Restricted area — sign in to continue.</p>
        <label className="field">
          <span>Password</span>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoFocus
            placeholder="••••••••••"
          />
        </label>
        {error && <p className="form-msg error">Incorrect password. Try again.</p>}
        <button type="submit" className="btn btn-primary btn-block" disabled={busy}>
          {busy ? 'Checking…' : 'Sign In'}
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
          <img src="/logo.png" className="logo-img" alt="BURACQ" />
          <strong>BURACQ Admin</strong>
        </div>
        <div className="admin-header-actions">
          <a href="/" className="admin-link" onClick={(e) => e.preventDefault()}>
            ← Back to store
          </a>
          <button
            type="button"
            className="btn btn-outline-dark btn-quick"
            onClick={() => {
              endAdminSession();
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
