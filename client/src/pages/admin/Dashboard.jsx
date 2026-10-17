/* Company admin dashboard — mirrors legacy vAdminDash exactly. */
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api, fmt, imgFallback } from '../../api';
import { useAuth } from '../../auth';
import { PageHead, statusBadge, Empty, Skeleton } from '../../components/ui';

export default function Dashboard() {
  const { me } = useAuth();
  const [stats, setStats] = useState(null);
  const [orders, setOrders] = useState(null);
  const [prods, setProds] = useState(null);
  const [coName, setCoName] = useState('');
  const [err, setErr] = useState('');

  useEffect(() => {
    let on = true;
    api.get('/api/stats/company').then((s) => { if (on) setStats(s); }).catch((e) => { if (on) setErr(e.message); });
    api.get('/api/orders?page=1&limit=4').then((o) => { if (on) setOrders(Array.isArray(o) ? o : (o.rows || [])); }).catch((e) => { if (on) setErr(e.message); });
    api.get('/api/products').then((p) => { if (on) setProds(Array.isArray(p) ? p : (p.rows || [])); }).catch((e) => { if (on) setErr(e.message); });
    if (me && me.companyId) api.get('/api/companies/' + me.companyId).then((c) => { if (on && c) setCoName(c.name || ''); }).catch(() => {});
    return () => { on = false; };
  }, [me && me.companyId]); // eslint-disable-line react-hooks/exhaustive-deps

  if (err && !stats && !orders && !prods) return <Empty icon="⚠️" title={err} sub="Could not reach the backend." />;
  if (!stats && !orders && !prods) return <Skeleton h={220} />;

  const ps = prods || [];
  const os = orders || [];
  const skuN = stats ? stats.products : ps.length;
  const visN = stats ? stats.visible : ps.filter((p) => p.visible).length;
  const rfqN = stats ? stats.quotationOnly : ps.filter((p) => p.price == null).length;
  const ordN = stats ? stats.orders : os.length;
  const pend = stats ? stats.pending : os.filter((o) => o.status === 'Pending').length;
  const openQ = stats ? stats.openQuotes : 0;
  const rev = stats ? stats.revenue : os.reduce((a, o) => a + (o.total || 0), 0);
  const del = stats ? stats.delivered : os.filter((o) => o.status === 'Delivered').length;
  const low = ps.filter((p) => p.stock <= 15);

  return (
    <>
      <PageHead
        title={(coName || (me && me.companyId) || 'Company') + ' — Industrial Store'}
        actions={<Link className="btn btn-primary btn-sm" to="/admin/products/new">+ Add product</Link>}
      />
      <div className="stat-grid">
        <div className="kpi k1"><h3>{skuN}</h3><p>SKUs in catalog</p><small>{visN} visible • {rfqN} quotation-only</small></div>
        <div className="kpi k4"><h3>{ordN}</h3><p>Orders</p><small>{pend} pending • {openQ} open RFQs</small></div>
        <div className="kpi k3"><h3>{fmt(rev)}</h3><p>Order value</p><small>{del} delivered</small></div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1.4fr .8fr', gap: 14 }}>
        <div className="card"><div className="card-pad">
          <div className="section-head" style={{ marginTop: 0 }}><h2>Recent orders</h2><Link className="btn btn-ghost btn-sm" to="/admin/orders">View all →</Link></div>
          <div className="table-wrap"><table><tbody>
            <tr><th>Order</th><th>Customer</th><th>Total</th><th>Status</th></tr>
            {os.length ? os.slice(0, 4).map((o) => (
              <tr key={o.id}>
                <td><Link to={'/admin/orders/' + o.id}><b>{o.id}</b></Link><div className="hint">{o.date}</div></td>
                <td>{o.companyName || o.customer}</td>
                <td><b>{fmt(o.total)}</b></td>
                <td>{statusBadge(o.status)}</td>
              </tr>
            )) : <tr><td colSpan="4"><div className="empty">No orders placed yet for this company.</div></td></tr>}
          </tbody></table></div>
        </div></div>
        <div className="card"><div className="card-pad">
          <h2 style={{ margin: '0 0 8px', fontSize: 16 }}>Low stock alerts</h2>
          {low.length ? low.map((p) => (
            <div key={p.id} style={{ display: 'flex', gap: 10, alignItems: 'center', padding: '9px 0', borderTop: '1px solid #F1F5F9' }}>
              <img className="thumb" src={(p.images || [])[0] || ''} alt="" onError={(e) => { e.currentTarget.src = imgFallback(p.sku || p.id, 100, 100); }} />
              <div><b style={{ fontSize: 13 }}>{p.name}</b><div className="hint">{p.sku || ''} • {p.stock} {p.uom || ''} left • {p.warehouse || ''}</div></div>
              <Link className="btn btn-ghost btn-sm" style={{ marginLeft: 'auto' }} to={'/admin/products/edit/' + p.id}>Restock</Link>
            </div>
          )) : <p className="hint">Stock levels healthy or catalog empty.</p>}
        </div></div>
      </div>
    </>
  );
}
