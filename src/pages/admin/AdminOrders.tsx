import { useEffect, useMemo, useState } from 'react';
import {
  fetchOrders,
  updateOrderStatus,
  ORDER_STATUSES,
  type AdminOrder,
  type OrderStatus,
} from '../../lib/supabase';
import { formatDate, money, orderToPdf, ordersToPdf } from '../../lib/pdf';
import { SetupHint } from './AdminDashboard';

const PAGE_SIZE = 25;

type SortKey = 'newest' | 'total_desc' | 'total_asc';

export default function AdminOrders() {
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | undefined>();
  const [statusMissing, setStatusMissing] = useState(false);

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [sort, setSort] = useState<SortKey>('newest');
  const [page, setPage] = useState(1);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [busyStatus, setBusyStatus] = useState<string | null>(null);
  const [notice, setNotice] = useState<{ ok: boolean; text: string } | null>(null);

  const load = async () => {
    setLoading(true);
    const res = await fetchOrders();
    setLoading(false);
    if (res.ok) {
      setOrders(res.data || []);
      setStatusMissing(!!res.statusMissing);
      setError(undefined);
    } else {
      setError(res.error);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    let list = orders.filter((o) => {
      if (statusFilter !== 'all' && (o.status || 'placed') !== statusFilter) return false;
      if (dateFrom && o.created_at && new Date(o.created_at) < new Date(`${dateFrom}T00:00:00`)) return false;
      if (dateTo && o.created_at && new Date(o.created_at) > new Date(`${dateTo}T23:59:59`)) return false;
      if (!q) return true;
      const customerName = o.name || o.customer?.name || '';
      const customerCity = o.city || o.customer?.city || '';
      const customerAddress = o.address || o.customer?.address || '';
      return [o.order_id, customerName, customerCity, customerAddress, o.customer?.phone, o.customer?.zip]
        .filter(Boolean)
        .some((f) => String(f).toLowerCase().includes(q));
    });
    switch (sort) {
      case 'total_desc':
        list = [...list].sort((a, b) => Number(b.bill || 0) - Number(a.bill || 0));
        break;
      case 'total_asc':
        list = [...list].sort((a, b) => Number(a.bill || 0) - Number(b.bill || 0));
        break;
      default:
        list = [...list].sort((a, b) => {
          const ta = a.created_at ? new Date(a.created_at).getTime() : 0;
          const tb = b.created_at ? new Date(b.created_at).getTime() : 0;
          return tb - ta;
        });
    }
    return list;
  }, [orders, search, statusFilter, dateFrom, dateTo, sort]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageItems = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const changeStatus = async (o: AdminOrder, status: OrderStatus) => {
    setBusyStatus(o.order_id);
    setNotice(null);
    const res = await updateOrderStatus(o.order_id, status);
    setBusyStatus(null);
    if (res.ok) {
      setOrders((prev) => prev.map((x) => (x.order_id === o.order_id ? { ...x, status } : x)));
      setNotice({ ok: true, text: `${o.order_id} → ${status}` });
    } else {
      setNotice({ ok: false, text: `Could not update status: ${res.error}` });
    }
  };

  return (
    <div className="admin-orders">
      <div className="admin-toolbar">
        <h1>Orders</h1>
        <div className="admin-toolbar-actions">
          <button
            type="button"
            className="btn btn-outline-dark btn-quick"
            onClick={load}
            disabled={loading}
          >
            {loading ? 'Loading…' : 'Refresh'}
          </button>
          <button
            type="button"
            className="btn btn-primary btn-quick"
            onClick={() => ordersToPdf(filtered, `${filtered.length} filtered order(s)`)}
            disabled={filtered.length === 0}
          >
            ⬇ Download PDF
          </button>
        </div>
      </div>

      {error && <SetupHint message={error} />}
      {statusMissing && (
        <div className="admin-setup-hint">
          <strong>Heads up:</strong> your orders table is missing columns the storefront and admin
          expect (including <code>status</code>). Run <code>scripts/setup-supabase.sql</code> in the
          Supabase SQL editor so new orders sync and status changes save.
        </div>
      )}
      {notice && <p className={notice.ok ? 'form-msg ok' : 'form-msg error'}>{notice.text}</p>}

      <div className="admin-filters">
        <input
          type="search"
          placeholder="Search order #, name, city, phone…"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          className="admin-search"
        />
        <select
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value);
            setPage(1);
          }}
          aria-label="Filter by status"
        >
          <option value="all">All statuses</option>
          {ORDER_STATUSES.map((s) => (
            <option key={s} value={s}>
              {s[0].toUpperCase() + s.slice(1)}
            </option>
          ))}
        </select>
        <label className="admin-date">
          From <input type="date" value={dateFrom} onChange={(e) => { setDateFrom(e.target.value); setPage(1); }} />
        </label>
        <label className="admin-date">
          To <input type="date" value={dateTo} onChange={(e) => { setDateTo(e.target.value); setPage(1); }} />
        </label>
        <select value={sort} onChange={(e) => setSort(e.target.value as SortKey)} aria-label="Sort orders">
          <option value="newest">Newest first</option>
          <option value="total_desc">Total: high → low</option>
          <option value="total_asc">Total: low → high</option>
        </select>
      </div>

      <p className="product-count">{filtered.length} order(s)</p>

      {pageItems.length === 0 ? (
        <p className="admin-empty">No orders match.</p>
      ) : (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Order #</th>
                <th>Date</th>
                <th>Customer</th>
                <th>Items</th>
                <th>Total</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {pageItems.map((o) => (
                <AdminOrderRow
                  key={o.order_id}
                  order={o}
                  expanded={expanded === o.order_id}
                  onToggle={() => setExpanded(expanded === o.order_id ? null : o.order_id)}
                  busy={busyStatus === o.order_id}
                  onStatus={(s) => changeStatus(o, s)}
                />
              ))}
            </tbody>
          </table>
        </div>
      )}

      {totalPages > 1 && (
        <div className="admin-pagination">
          <button
            type="button"
            className="btn btn-outline-dark btn-quick"
            disabled={page <= 1}
            onClick={() => setPage((p) => p - 1)}
          >
            ← Prev
          </button>
          <span>
            Page {page} of {totalPages}
          </span>
          <button
            type="button"
            className="btn btn-outline-dark btn-quick"
            disabled={page >= totalPages}
            onClick={() => setPage((p) => p + 1)}
          >
            Next →
          </button>
        </div>
      )}
    </div>
  );
}

function AdminOrderRow({
  order: o,
  expanded,
  onToggle,
  busy,
  onStatus,
}: {
  order: AdminOrder;
  expanded: boolean;
  onToggle: () => void;
  busy: boolean;
  onStatus: (s: OrderStatus) => void;
}) {
  return (
    <>
      <tr className="admin-order-row" onClick={onToggle}>
        <td className="mono">{o.order_id}</td>
        <td>{formatDate(o.created_at)}</td>
        <td>
          {o.name || o.customer?.name || '—'}
          {(o.city || o.customer?.city) ? <span className="muted"> · {o.city || o.customer?.city}</span> : null}
        </td>
        <td>{o.total_items ?? (o.items || []).length}</td>
        <td>{money(o.bill ?? (o.items || []).reduce((n, i) => n + (i.price || 0) * (i.qty || 1), 0))}</td>
        <td onClick={(e) => e.stopPropagation()}>
          <select
            className="status-select"
            value={o.status || 'placed'}
            disabled={busy}
            onChange={(e) => onStatus(e.target.value as OrderStatus)}
            aria-label={`Status of ${o.order_id}`}
          >
            {ORDER_STATUSES.map((s) => (
              <option key={s} value={s}>
                {s[0].toUpperCase() + s.slice(1)}
              </option>
            ))}
          </select>
        </td>
        <td>
          <button type="button" className="btn btn-outline-dark btn-quick" onClick={(e) => { e.stopPropagation(); orderToPdf(o); }}>
            PDF
          </button>
        </td>
      </tr>
      {expanded && (
        <tr className="admin-order-detail-row">
          <td colSpan={7}>
            <div className="admin-order-detail">
              <div>
                <h4>Items</h4>
                <ul className="admin-item-list">
                  {(o.items || []).map((it, i) => (
                    <li key={i}>
                      <span>{it.name || it.slug}</span>
                      <span className="muted">
                        ×{it.qty ?? 1} · {money(it.price)}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <h4>Shipping</h4>
                <p>
                  {o.address || o.customer?.address}
                  {o.city || o.customer?.city ? `, ${o.city || o.customer?.city}` : ''}
                </p>
                {(o.customer?.zip || o.customer?.phone) && (
                  <p className="muted">
                    {o.customer?.zip ? `ZIP ${o.customer.zip} · ` : ''}
                    {o.customer?.phone ? `Tel ${o.customer.phone}` : ''}
                  </p>
                )}
              </div>
            </div>
          </td>
        </tr>
      )}
    </>
  );
}
