/* Company orders — mirrors legacy vOrdersAdmin. Server-side search + status + pagination. */
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api, fmt } from '../../api';
import { PageHead, DataTable, statusBadge, Empty, Skeleton, Pager } from '../../components/ui';

const STATUSES = ['all', 'Pending', 'Confirmed', 'Processing', 'Ready for Dispatch', 'Shipped', 'Delivered', 'Cancelled'];

function norm(d) {
  if (!d) return { rows: [], total: 0, page: 1, limit: 8 };
  if (Array.isArray(d)) return { rows: d, total: d.length, page: 1, limit: 8 };
  return { rows: d.rows || [], total: d.total != null ? d.total : (d.rows || []).length, page: d.page || 1, limit: d.limit || 8 };
}

export default function Orders() {
  const [q, setQ] = useState('');
  const [deb, setDeb] = useState('');
  const [status, setStatus] = useState('all');
  const [page, setPage] = useState(1);
  const [data, setData] = useState(null);

  useEffect(() => {
    const t = setTimeout(() => { setDeb(q); setPage(1); }, 300);
    return () => clearTimeout(t);
  }, [q]);

  useEffect(() => {
    let on = true;
    const qs = new URLSearchParams({ page, limit: 8 });
    if (deb) qs.set('q', deb);
    if (status && status !== 'all') qs.set('status', status);
    api.get('/api/orders?' + qs.toString()).then((d) => { if (on) setData({ ...norm(d), err: '' }); }).catch((e) => { if (on) setData({ rows: [], total: 0, page: 1, limit: 8, err: e.message }); });
    return () => { on = false; };
  }, [page, deb, status]);

  if (!data) return <Skeleton h={220} />;
  if (data.err && !data.rows.length) return <Empty icon="⚠️" title={data.err} sub="Could not reach the backend." />;

  return (
    <>
      <PageHead
        title={'Orders (' + data.total + ') • ERP sales-order linked'}
        actions={<button className="btn btn-ghost btn-sm" onClick={() => window.print()}>🖨️ Print</button>}
      />
      <div className="card"><div className="card-pad">
        <div className="toolbar">
          <input placeholder="Search order / company / PO ref…" value={q} onChange={(e) => setQ(e.target.value)} />
          <select value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }}>
            {STATUSES.map((s) => <option key={s} value={s}>{s === 'all' ? 'All statuses' : s}</option>)}
          </select>
        </div>
        <DataTable
          empty="No orders found for this company."
          rowKey={(r) => r.id}
          cols={[
            {
              key: 'o', label: 'Order', render: (o) => (
                <div><Link to={'/admin/orders/' + o.id}><b>{o.id}</b></Link><div className="hint">{o.date}{o.poRef ? ' • ' + o.poRef : ''}</div></div>)
            },
            { key: 'su', label: 'Sales user', render: (o) => o.salesUser || '—' },
            {
              key: 'c', label: 'Customer', render: (o) => (
                <div>{o.companyName || o.customer}<div className="hint">{o.mobile} • {o.city}</div></div>)
            },
            { key: 'n', label: 'Items', render: (o) => (o.items || []).reduce((a, i) => a + (i.qty || 0), 0) },
            { key: 't', label: 'Total', render: (o) => <b>{fmt(o.total)}</b> },
            { key: 's', label: 'Status', render: (o) => statusBadge(o.status) }
          ]}
          rows={data.rows}
        />
        <Pager total={data.total} page={data.page} limit={data.limit} onPage={setPage} />
      </div></div>
    </>
  );
}
