import { useEffect, useMemo, useState } from 'react';
import { fetchViews, type AnalyticsView } from '../../lib/supabase';
import { SetupHint } from './AdminDashboard';

export default function AdminAnalytics() {
  const [views, setViews] = useState<AnalyticsView[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | undefined>();
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [days, setDays] = useState(14);

  const load = async () => {
    setLoading(true);
    const res = await fetchViews();
    setLoading(false);
    if (res.ok) setViews(res.data || []);
    else setError(res.error);
  };

  useEffect(() => {
    load();
  }, []);

  const filtered = useMemo(() => {
    return views.filter((v) => {
      if (!v.viewed_at) return true;
      const t = new Date(v.viewed_at).getTime();
      if (from && t < new Date(`${from}T00:00:00`).getTime()) return false;
      if (to && t > new Date(`${to}T23:59:59`).getTime()) return false;
      return true;
    });
  }, [views, from, to]);

  const daily = useMemo(() => {
    const map = new Map<string, number>();
    const sessions = new Map<string, Set<string>>();
    for (const v of filtered) {
      if (!v.viewed_at) continue;
      const day = v.viewed_at.slice(0, 10);
      map.set(day, (map.get(day) || 0) + 1);
      if (v.session_id) {
        const set = sessions.get(day) || new Set<string>();
        set.add(v.session_id);
        sessions.set(day, set);
      }
    }
    const daysArr = [...map.entries()].sort((a, b) => a[0].localeCompare(b[0]));
    const last = daysArr.slice(-days);
    const max = Math.max(1, ...last.map(([, n]) => n));
    return last.map(([day, count]) => ({
      day,
      count,
      sessions: sessions.get(day)?.size || 0,
      pct: (count / max) * 100,
    }));
  }, [filtered, days]);

  const pages = useMemo(() => {
    const map = new Map<string, number>();
    for (const v of filtered) map.set(v.path || '/', (map.get(v.path || '/') || 0) + 1);
    return [...map.entries()]
      .map(([path, count]) => ({ path, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 12);
  }, [filtered]);

  const regions = useMemo(() => {
    const map = new Map<string, number>();
    for (const v of filtered) {
      const r = v.region || 'Unknown';
      map.set(r, (map.get(r) || 0) + 1);
    }
    return [...map.entries()]
      .map(([region, count]) => ({ region, count }))
      .sort((a, b) => b.count - a.count);
  }, [filtered]);

  const uniqueSessions = useMemo(
    () => new Set(filtered.map((v) => v.session_id).filter(Boolean)).size,
    [filtered]
  );
  const maxRegion = Math.max(1, ...regions.map((r) => r.count));
  const maxPage = Math.max(1, ...pages.map((p) => p.count));

  return (
    <div className="admin-analytics">
      <div className="admin-toolbar">
        <h1>Analytics</h1>
        <button type="button" className="btn btn-outline-dark btn-quick" onClick={load} disabled={loading}>
          {loading ? 'Loading…' : 'Refresh'}
        </button>
      </div>

      {error && <SetupHint message={error} />}

      <div className="admin-filters">
        <label className="admin-date">
          From <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
        </label>
        <label className="admin-date">
          To <input type="date" value={to} onChange={(e) => setTo(e.target.value)} />
        </label>
        <select value={days} onChange={(e) => setDays(Number(e.target.value))} aria-label="Days shown">
          <option value={7}>Last 7 days</option>
          <option value={14}>Last 14 days</option>
          <option value={30}>Last 30 days</option>
          <option value={365}>All</option>
        </select>
      </div>

      <div className="kpi-grid">
        <div className="kpi-card">
          <span className="kpi-value">{filtered.length}</span>
          <span className="kpi-label">Page Views</span>
        </div>
        <div className="kpi-card">
          <span className="kpi-value">{uniqueSessions}</span>
          <span className="kpi-label">Unique Visitors</span>
        </div>
        <div className="kpi-card">
          <span className="kpi-value">{regions.length}</span>
          <span className="kpi-label">Regions</span>
        </div>
      </div>

      <div className="admin-grid-2">
        <section className="admin-panel">
          <h2>Views per Day</h2>
          {daily.length === 0 ? (
            <p className="admin-empty">No views in this period.</p>
          ) : (
            <div className="daily-chart">
              {daily.map((d) => (
                <div className="daily-bar-col" key={d.day} title={`${d.day}: ${d.count} views, ${d.sessions} visitors`}>
                  <div className="daily-bar" style={{ height: `${Math.max(d.pct, 3)}%` }} />
                  <span className="daily-label">{d.day.slice(5)}</span>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="admin-panel">
          <h2>Top Pages</h2>
          {pages.length === 0 ? (
            <p className="admin-empty">No data yet.</p>
          ) : (
            pages.map((p) => (
              <div className="region-row" key={p.path}>
                <span className="region-name mono">{p.path}</span>
                <div className="region-bar">
                  <div className="region-fill" style={{ width: `${(p.count / maxPage) * 100}%` }} />
                </div>
                <span className="region-count">{p.count}</span>
              </div>
            ))
          )}
        </section>
      </div>

      <section className="admin-panel">
        <h2>Visitor Regions</h2>
        {regions.length === 0 ? (
          <p className="admin-empty">No data yet — visits are tracked automatically from the storefront.</p>
        ) : (
          regions.map((r) => (
            <div className="region-row" key={r.region}>
              <span className="region-name">{r.region}</span>
              <div className="region-bar">
                <div className="region-fill" style={{ width: `${(r.count / maxRegion) * 100}%` }} />
              </div>
              <span className="region-count">{r.count}</span>
            </div>
          ))
        )}
      </section>
    </div>
  );
}
