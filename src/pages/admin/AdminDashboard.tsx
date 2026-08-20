import { useEffect, useMemo, useState } from 'react';
import {
  fetchOrders,
  fetchViews,
  ORDER_STATUSES,
  type AdminOrder,
  type AnalyticsView,
} from '../../lib/supabase';
import { formatDate, money } from '../../lib/pdf';

interface LoadState {
  loading: boolean;
  orders: AdminOrder[];
  views: AnalyticsView[];
  orderError?: string;
  viewError?: string;
}

export default function AdminDashboard() {
  const [state, setState] = useState<LoadState>({ loading: true, orders: [], views: [] });
  const [reload, setReload] = useState(0);

  useEffect(() => {
    let alive = true;
    setState((s) => ({ ...s, loading: true }));
    (async () => {
      const [o, v] = await Promise.all([fetchOrders(), fetchViews()]);
      if (!alive) return;
      setState({
        loading: false,
        orders: o.ok ? (o.data || []) : [],
        views: v.ok ? (v.data || []) : [],
        orderError: o.ok ? undefined : o.error,
        viewError: v.ok ? undefined : v.error,
      });
    })();
    return () => {
      alive = false;
    };
  }, [reload]);

  // Auto-refresh every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      (async () => {
        const [o, v] = await Promise.all([fetchOrders(), fetchViews()]);
        setState((s) => ({
          ...s,
          orders: o.ok ? (o.data || s.orders) : s.orders,
          views: v.ok ? (v.data || s.views) : s.views,
          orderError: o.ok ? undefined : o.error,
          viewError: v.ok ? undefined : v.error,
        }));
      })();
    }, 30_000);
    return () => clearInterval(interval);
  }, []);

  const stats = useMemo(() => {
    const orders = state.orders;
    const views = state.views;
    const uniqueSessions = new Set(views.map((v) => v.session_id).filter(Boolean)).size;
    const pageViews = views.length;
    const revenue = orders.reduce((n, o) => n + Number(o.bill || 0), 0);
    const orderCount = orders.length;
    const conversion = uniqueSessions > 0 ? (orderCount / uniqueSessions) * 100 : 0;

    // Order stage funnel
    const byStatus: Record<string, number> = {};
    for (const s of ORDER_STATUSES) byStatus[s] = 0;
    for (const o of orders) {
      const st = o.status || 'placed';
      byStatus[st] = (byStatus[st] || 0) + 1;
    }
    const funnel = (['placed', 'confirmed', 'shipped', 'delivered'] as const).map((stage) => {
      const count = byStatus[stage] || 0;
      const total = orders.length || 1;
      return { stage, count, pct: (count / total) * 100 };
    });
    const cancelled = byStatus.cancelled || 0;

    // Regions
    const regionCounts = new Map<string, number>();
    for (const v of views) {
      const r = v.region || 'Unknown';
      regionCounts.set(r, (regionCounts.get(r) || 0) + 1);
    }
    const regions = [...regionCounts.entries()]
      .map(([region, count]) => ({ region, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8);

    return { uniqueSessions, pageViews, revenue, orderCount, conversion, funnel, cancelled, regions };
  }, [state.orders, state.views]);

  const kpis = [
    { label: 'Unique Visitors', value: String(stats.uniqueSessions) },
    { label: 'Page Views', value: String(stats.pageViews) },
    { label: 'Orders', value: String(stats.orderCount) },
    { label: 'Revenue', value: money(stats.revenue) },
    { label: 'Order Conversion', value: `${stats.conversion.toFixed(1)}%` },
  ];

  return (
    <div className="admin-dashboard">
      {state.orderError && <SetupHint message={state.orderError} />}
      {state.viewError && <SetupHint message={state.viewError} />}

      <div className="admin-toolbar">
        <h1>Dashboard</h1>
        <button type="button" className="btn btn-outline-dark btn-quick" onClick={() => setReload((r) => r + 1)}>
          {state.loading ? 'Loading…' : 'Refresh'}
        </button>
      </div>

      <div className="kpi-grid">
        {kpis.map((k) => (
          <div className="kpi-card" key={k.label}>
            <span className="kpi-value">{k.value}</span>
            <span className="kpi-label">{k.label}</span>
          </div>
        ))}
      </div>

      <div className="admin-grid-2">
        <section className="admin-panel">
          <h2>Order Stages</h2>
          {state.orders.length === 0 ? (
            <p className="admin-empty">No orders yet.</p>
          ) : (
            <>
              {stats.funnel.map((f, i) => (
                <div className="funnel-row" key={f.stage}>
                  <div className="funnel-top">
                    <span className="funnel-stage">
                      {i === 0 ? 'Placed' : `→ ${f.stage[0].toUpperCase()}${f.stage.slice(1)}`}
                    </span>
                    <span className="funnel-count">
                      {f.count} <small>({f.pct.toFixed(0)}%)</small>
                    </span>
                  </div>
                  <div className="funnel-bar">
                    <div className="funnel-fill" style={{ width: `${Math.max(f.pct, 2)}%` }} />
                  </div>
                  {i < stats.funnel.length - 1 && (
                    <div className="funnel-drop">
                      {f.count > 0
                        ? `${Math.max(0, 100 - (stats.funnel[i + 1].count / f.count) * 100).toFixed(0)}% drop to next stage`
                        : '—'}
                    </div>
                  )}
                </div>
              ))}
              {stats.cancelled > 0 && (
                <p className="funnel-cancelled">Cancelled: {stats.cancelled} order(s)</p>
              )}
            </>
          )}
        </section>

        <section className="admin-panel">
          <h2>Visitor Regions</h2>
          {state.views.length === 0 ? (
            <p className="admin-empty">No analytics yet — visit the storefront to start tracking.</p>
          ) : (
            <>
              {stats.regions.map((r) => (
                <div className="region-row" key={r.region}>
                  <span className="region-name">{r.region}</span>
                  <div className="region-bar">
                    <div
                      className="region-fill"
                      style={{ width: `${(r.count / stats.pageViews) * 100}%` }}
                    />
                  </div>
                  <span className="region-count">{r.count}</span>
                </div>
              ))}
              <a href="/analytics" onClick={(e) => e.preventDefault()} className="link-more">
                Full analytics →
              </a>
            </>
          )}
        </section>
      </div>

      <section className="admin-panel">
        <h2>Recent Orders</h2>
        {state.orders.length === 0 ? (
          <p className="admin-empty">No orders yet.</p>
        ) : (
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Order</th>
                  <th>Date</th>
                  <th>Customer</th>
                  <th>Total</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {state.orders.slice(0, 6).map((o) => (
                  <tr key={o.order_id}>
                    <td className="mono">{o.order_id}</td>
                    <td>{formatDate(o.created_at)}</td>
                    <td>
                      {o.name || o.customer?.name || '—'}
                      {o.city || o.customer?.city ? <span className="muted"> · {o.city || o.customer?.city}</span> : null}
                    </td>
                    <td>{money(o.bill)}</td>
                    <td>
                      <span className={`status-pill status-${o.status || 'placed'}`}>
                        {o.status || 'placed'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

export function SetupHint({ message }: { message: string }) {
  return (
    <div className="admin-setup-hint">
      <strong>Supabase setup needed.</strong> {message} — run the SQL in{' '}
      <code>scripts/setup-supabase.sql</code> (see README) to create the tables and policies.
    </div>
  );
}
