/* Store order detail — mirrors legacy orderDetail (store variant): no admin status editor. */
import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api, fmt } from '../../api';
import { Empty, Skeleton, statusBadge } from '../../components/ui';
import { asList } from './Home';

export default function OrderDetail() {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [missing, setMissing] = useState(false);
  const [products, setProducts] = useState([]);

  useEffect(() => { window.scrollTo(0, 0); }, [id]);
  useEffect(() => {
    setOrder(null); setMissing(false);
    api.get('/api/orders/' + id).then(setOrder).catch(() => setMissing(true));
    api.get('/api/products').then((d) => setProducts(asList(d))).catch(() => {});
  }, [id]);

  if (missing) return <Empty icon="📭" title={`Order ${id} not found.`} />;
  if (order === null) return <Skeleton h={280} />;
  const o = order;
  const prodById = (pid) => products.find((p) => p.id === pid) || { name: pid, sku: pid, uom: 'Pc', images: ['https://picsum.photos/seed/' + pid + '/200/200'] };
  const items = (o.items || []).map((i) => ({ ...i, p: prodById(i.pid) }));

  return (
    <>
      <div className="section-head">
        <h2>{o.id} {statusBadge(o.status)}</h2>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-ghost btn-sm" onClick={() => window.print()}>🖨️ Print summary</button>
          <Link className="btn btn-ghost btn-sm" to="/store/orders">← Back</Link>
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1.3fr .7fr', gap: 14 }} className="dash2">
        <div className="card"><div className="card-pad">
          <h3 style={{ marginTop: 0 }}>Line items ({items.reduce((a, i) => a + i.qty, 0)})</h3>
          {items.map((i) => (
            <div key={i.pid} className="cart-line">
              <img src={(i.p.images || [])[0] || ''} onError={(e) => { e.currentTarget.src = `https://picsum.photos/seed/${i.pid}/200/200`; }} style={{ width: 80, height: 80, borderRadius: 8, objectFit: 'cover' }} alt={i.p.name} />
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
          </div></div>
          <div className="card" style={{ marginTop: 14 }}><div className="card-pad">
            <h3 style={{ marginTop: 0 }}>Status history</h3>
            {(o.history || [[o.status, o.date]]).map((h, i) => (
              <div key={i} style={{ display: 'flex', gap: 10, padding: '7px 0', fontSize: 13 }}>
                <span>●</span><b>{h[0]}</b><span className="hint" style={{ marginLeft: 'auto' }}>{h[1]}</span>
              </div>
            ))}
          </div></div>
        </div>
      </div>
    </>
  );
}
