/* Platform Dashboard — route /super/dashboard. All metrics from GET /api/stats/platform. */
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api, fmt } from '../../api';
import { PageHead, Kpi, DataTable, Bars, Empty, Skeleton, statusBadge } from '../../components/ui';

const ST_COLORS = {
  Pending: '#D97706', Confirmed: '#2563EB', Processing: '#7C3AED', 'Ready for Dispatch': '#C026D3',
  Shipped: '#0891B2', Delivered: '#16A34A', Cancelled: '#DC2626',
  Quoted: '#2563EB', Accepted: '#16A34A', Rejected: '#DC2626'
};

export default function Dashboard() {
  const [s, setS] = useState(null);
  const [err, setErr] = useState('');

  useEffect(() => {
    api.get('/api/stats/platform').then((d) => { setS(d); setErr(''); }).catch((e) => setErr(e.message || 'Failed to load platform stats'));
  }, []);

  if (err) return <Empty icon="⚠️" title={'⚠️ ' + err} />;
  if (!s) return <Skeleton h={320} />;

  return (
    <>
      <div className="section-head">
        <div>
          <p className="hint" style={{ margin: 0 }}>CNCFORGE ERP • SUPER ADMIN</p>
          <h2 style={{ fontSize: 22 }}>Platform Dashboard</h2>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <Link className="btn btn-ghost btn-sm" to="/super/audit">Audit trail</Link>
          <Link className="btn btn-primary btn-sm" to="/super/companies/new">+ New company</Link>
        </div>
      </div>
      <div className="stat-grid">
        <Kpi to="#/super/companies?tab=companies" value={s.companies} label="Total companies" sub={`${s.activeCompanies} active • ${s.suspendedCompanies} suspended`} grad="linear-gradient(135deg,#172554,#2563EB)" />
        <Kpi to="#/super/companies?tab=admins" value={s.admins} label="Company admins" sub="across all companies" grad="linear-gradient(135deg,#6D28D9,#7C3AED)" />
        <Kpi to="#/super/companies?tab=users" value={s.salesUsers} label="Sales users" sub="procurement teams" grad="linear-gradient(135deg,#0E7490,#0EA5E9)" />
        <Kpi to="#/super/catalog" value={s.products} label="Industrial SKUs" sub={`${s.visibleProducts} visible in stores`} grad="linear-gradient(135deg,#9A3412,#F97316)" />
        <Kpi to="#/super/categories" value={s.categories} label="Global categories" sub="CNC catalog taxonomy" grad="linear-gradient(135deg,#92400E,#D97706)" />
        <Kpi to="#/super/orders" value={s.orders} label="Total orders" sub={`${s.pendingOrders} pending action`} grad="linear-gradient(135deg,#14532D,#16A34A)" />
        <Kpi to="#/super/orders?status=Pending" value={s.pendingOrders} label="Pending orders" sub="needs processing" grad="linear-gradient(135deg,#065F46,#10B981)" />
        <Kpi to="#/super/quotes" value={s.quotes} label="Quotation requests" sub={`${s.openQuotes} open RFQs`} grad="linear-gradient(135deg,#1E3A8A,#38BDF8)" />
        <Kpi to="#/super/orders" value={fmt(s.gmv)} label="Order value" sub="all companies, live rows" grad="linear-gradient(135deg,#0B1533,#334155)" />
      </div>
      <div className="grid2" style={{ marginTop: 14 }}>
        <div className="card"><div className="card-pad">
          <h3 style={{ margin: '0 0 10px', fontSize: 15 }}>Order status distribution</h3>
          <Bars items={(s.orderStatus || []).map((o) => ({ label: o.status, value: o.count, color: ST_COLORS[o.status] || '#64748B' }))} />
        </div></div>
        <div className="card"><div className="card-pad">
          <h3 style={{ margin: '0 0 10px', fontSize: 15 }}>Products per category</h3>
          <Bars items={(s.categoryDist || []).map((c) => ({ label: (c.icon ? c.icon + ' ' : '') + c.name, value: c.products }))} color="linear-gradient(135deg,#9A3412,#F97316)" />
        </div></div>
        <div className="card"><div className="card-pad">
          <h3 style={{ margin: '0 0 10px', fontSize: 15 }}>Order activity (last 14 days)</h3>
          {(s.orderActivity || []).length
            ? <Bars items={s.orderActivity.map((o) => ({ label: String(o.date).slice(5), value: o.count }))} color="linear-gradient(135deg,#14532D,#16A34A)" />
            : <div className="empty" style={{ padding: 18 }}>No orders in this window.</div>}
        </div></div>
        <div className="card"><div className="card-pad">
          <h3 style={{ margin: '0 0 10px', fontSize: 15 }}>Company growth</h3>
          {(s.companyGrowth || []).length
            ? <Bars items={s.companyGrowth.map((o) => ({ label: o.month, value: o.count }))} color="linear-gradient(135deg,#6D28D9,#7C3AED)" />
            : <div className="empty" style={{ padding: 18 }}>Not enough data yet.</div>}
        </div></div>
      </div>
      <div className="card" style={{ marginTop: 14 }}>
        <div className="card-pad">
          <PageHead title="Companies" actions={<Link className="btn btn-ghost btn-sm" to="/super/companies">Manage all →</Link>} />
          <DataTable
            rowKey={(r) => r.id}
            empty="No companies yet."
            cols={[
              { key: 'co', label: 'Company', render: (c) => <><b>{c.logo} {c.name}</b><div className="hint">{c.code} • {c.city}</div></> },
              { key: 'ind', label: 'Industry', render: (c) => c.industry || '—' },
              { key: 'st', label: 'Status', render: (c) => statusBadge(c.status === 'active' ? 'Delivered' : 'Cancelled') },
              { key: 'u', label: 'Users', render: (c) => c.users },
              { key: 'p', label: 'SKUs', render: (c) => c.products },
              {
                key: 'o', label: 'Orders',
                render: (c) => <>{c.orders}{c.pending ? <span className="status s-pending"> {c.pending} pend</span> : null}</>
              },
              { key: 'rev', label: 'Revenue', render: (c) => <b>{fmt(c.revenue)}</b> },
              { key: 'open', label: '', render: (c) => <Link className="btn btn-ghost btn-sm" to={'/super/companies/' + c.id}>Open →</Link> }
            ]}
            rows={s.byCompany || []}
          />
          <p className="hint">Every metric on this page is computed from live database rows.</p>
        </div>
      </div>
    </>
  );
}
