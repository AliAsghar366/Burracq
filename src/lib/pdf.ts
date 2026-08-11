import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { AdminOrder } from './supabase';

export function formatDate(iso?: string | null): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

export function money(n: number | null | undefined): string {
  return `$${Number(n || 0).toFixed(2)}`;
}

export function ordersToPdf(orders: AdminOrder[], title = 'All Orders'): void {
  const doc = new jsPDF();
  doc.setFontSize(16);
  doc.setTextColor(20, 20, 26);
  doc.text('BURRACQ — Order Report', 14, 16);
  doc.setFontSize(10);
  doc.setTextColor(118, 118, 127);
  doc.text(`${title} · Generated ${new Date().toLocaleString()} · ${orders.length} order(s)`, 14, 23);
  autoTable(doc, {
    startY: 30,
    head: [['Order #', 'Date', 'Customer', 'City', 'Items', 'Total', 'Status']],
    body: orders.map((o) => [
      o.order_id,
      formatDate(o.created_at),
      o.name || '—',
      o.city || '—',
      String(o.total_items ?? o.items?.length ?? 0),
      money(o.bill),
      o.status || 'placed',
    ]),
    styles: { fontSize: 9 },
    headStyles: { fillColor: [223, 0, 114] },
  });
  doc.save('burracq-orders.pdf');
}

export function orderToPdf(order: AdminOrder): void {
  const doc = new jsPDF();
  doc.setFontSize(16);
  doc.setTextColor(20, 20, 26);
  doc.text('BURRACQ — Order Detail', 14, 16);
  doc.setFontSize(10);
  doc.setTextColor(118, 118, 127);
  doc.text(
    `${order.order_id} · ${formatDate(order.created_at)} · Status: ${order.status || 'placed'}`,
    14,
    23
  );

  const customer = order.customer || {};
  doc.setFontSize(11);
  doc.setTextColor(20, 20, 26);
  doc.text('Customer', 14, 38);
  doc.setFontSize(10);
  doc.setTextColor(61, 61, 69);
  doc.text(order.name || customer.name || '—', 14, 44);
  doc.text([order.address || customer.address || '', order.city || customer.city || ''].join(', '), 14, 50);
  if (customer.zip) doc.text(`ZIP: ${customer.zip}`, 14, 56);
  if (customer.phone) doc.text(`Phone: ${customer.phone}`, 14, 62);

  autoTable(doc, {
    startY: 72,
    head: [['Item', 'SKU', 'Qty', 'Price']],
    body: (order.items || []).map((it) => [
      it.name || it.slug || '—',
      it.slug || '—',
      String(it.qty ?? 1),
      money(it.price),
    ]),
    styles: { fontSize: 9 },
    headStyles: { fillColor: [223, 0, 114] },
  });

  const y = (doc as unknown as { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY || 120;
  doc.setFontSize(11);
  doc.setTextColor(20, 20, 26);
  doc.text(
    `Total: ${money(order.bill)} (${order.total_items ?? (order.items || []).reduce((n, i) => n + (i.qty || 1), 0)} items)`,
    14,
    y + 12
  );
  doc.save(`burracq-order-${order.order_id}.pdf`);
}
