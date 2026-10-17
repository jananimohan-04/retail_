/* Order detail — mirrors legacy orderDetail. Reused by super orders via the back prop. */
import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api, fmt, imgFallback } from '../../api';
import { statusBadge, Empty, Skeleton, toast } from '../../components/ui';

const FLOW = ['Pending', 'Confirmed', 'Processing', 'Ready for Dispatch', 'Shipped', 'Delivered', 'Cancelled'];

export default function OrderDetail({ back = '/admin/orders' }) {
  const { id } = useParams();
  const [o, setO] = useState(null);
  const [prods, setProds] = useState([]);
  const [err, setErr] = useState('');
  const [st, setSt] = useState('');
  const [busy, setBusy] = useState(false);
  const [updErr, setUpdErr] = useState('');

  function load() {
    api.get('/api/orders/' + id).then((d) => { setO(d); setSt(d.status); setErr(''); }).catch((e) => setErr(e.message));
    api.get('/api/products').then((d) => setProds(Array.isArray(d) ? d : (d.rows || []))).catch(() => {});
  }

  useEffect(load, [id]); // eslint-disable-line react-hooks/exhaustive-deps

  if (err && !o) return <Empty icon="📭" title={'Order ' + id + ' not found.'} sub={err} />;
  if (!o) return <Skeleton h={260} />;

  const byId = {};
  prods.forEach((p) => { byId[p.id] = p; });
  const items = (o.items || []).map((i) => ({ ...i, p: byId[i.pid] || { name: i.pid, sku: i.pid, uom: 'Pc', images: [] } }));
  const n = items.reduce((a, i) => a + (i.qty || 0), 0);

  function update() {
    setBusy(true);
    setUpdErr('');
    api.patch('/api/orders/' + o.id + '/status', { status: st })
      .then((d) => { setO(d); setSt(d.status); toast(o.id + ' → ' + d.status, '🧾'); })
      .catch((e) => { setUpdErr(e.message || 'Update failed'); toast(e.message, '⚠️'); })
      .finally(() => setBusy(false));
  }

  return (
    <>
      <div className="section-head">
        <h2>{o.id} {statusBadge(o.status)}</h2>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-ghost btn-sm" onClick={() => window.print()}>🖨️ Print summary</button>
          <Link className="btn btn-ghost btn-sm" to={back}>← Back</Link>
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1.3fr .7fr', gap: 14 }}>
        <div className="card"><div className="card-pad">
          <h3 style={{ marginTop: 0 }}>Line items ({n})</h3>
          {items.map((i, ix) => (
            <div className="cart-line" key={ix}>
              <img src={(i.p.images || [])[0] || ''} alt="" onError={(e) => { e.currentTarget.src = imgFallback(i.pid, 200, 200); }} style={{ width: 80, height: 80, borderRadius: 8, objectFit: 'cover' }} />
              <div><b>{i.p.name}</b><div className="hint">{i.p.sku || i.pid} • Qty {i.qty} {i.p.uom || ''} × {fmt(i.price)}</div></div>
              <b>{fmt(i.qty * i.price)}</b>
            </div>
          ))}
          <div style={{ borderTop: '1px dashed var(--line)', paddingTop: 12, display: 'grid', gap: 6, fontSize: 14 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Subtotal</span><b>{fmt(o.total)}</b></div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>GST</span><span>As per invoice</span></div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 17 }}><span><b>Total</b></span><b>{fmt(o.total)}</b></div>
          </div>
        </div></div>
        <div>
          <div className="card"><div className="card-pad">
            <h3 style={{ marginTop: 0 }}>Customer & delivery</h3>
            <b>{o.companyName || o.customer}</b>
            <div className="hint">{o.contact || o.customer} • {o.mobile}{o.poRef ? ' • PO ' + o.poRef : ''}</div>
            <p style={{ fontSize: 13.5 }}>{o.address || o.city}</p>
            <div className="field">
              <label>Update status (valid transitions only)</label>
              <select value={st} onChange={(e) => setSt(e.target.value)}>
                {FLOW.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            {updErr && <p className="ferr">⚠️ {updErr}</p>}
            <button className="btn btn-primary btn-sm" disabled={busy} onClick={update}>{busy ? 'Updating…' : 'Update status'}</button>
          </div></div>
          <div className="card" style={{ marginTop: 14 }}><div className="card-pad">
            <h3 style={{ marginTop: 0 }}>Status history</h3>
            {(o.history || [[o.status, o.date]]).map((h, ix) => (
              <div key={ix} style={{ display: 'flex', gap: 10, padding: '7px 0', fontSize: 13 }}>
                <span>●</span><b>{h[0]}</b><span className="hint" style={{ marginLeft: 'auto' }}>{h[1]}</span>
              </div>
            ))}
          </div></div>
        </div>
      </div>
    </>
  );
}
