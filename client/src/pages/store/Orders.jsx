/* Store orders — mirrors legacy vMyOrders: company order list with thumbs/totals/statuses. */
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api, fmt } from '../../api';
import { Empty, Skeleton, statusBadge } from '../../components/ui';
import { asList } from './Home';

export default function Orders() {
  const [orders, setOrders] = useState(null);
  const [products, setProducts] = useState([]);

  useEffect(() => { window.scrollTo(0, 0); }, []);
  useEffect(() => {
    api.get('/api/orders').then((d) => setOrders(asList(d))).catch(() => setOrders([]));
    api.get('/api/products').then((d) => setProducts(asList(d))).catch(() => {});
  }, []);

  if (orders === null) return <Skeleton h={220} />;
  const prodById = (id) => products.find((p) => p.id === id);
  return (
    <>
      <div className="section-head"><h2>My orders ({orders.length})</h2><Link className="btn btn-ghost btn-sm" to="/store/listing">+ New indent</Link></div>
      <div className="card"><div className="card-pad">
        {orders.map((o) => {
          const f = prodById((o.items || [])[0] && o.items[0].pid) || { images: ['https://picsum.photos/seed/x/100/100'] };
          return (
            <Link key={o.id} to={'/store/orders/' + o.id} className="cart-line">
              <img src={(f.images || [])[0] || ''} onError={(e) => { e.currentTarget.src = 'https://picsum.photos/seed/x/100/100'; }} style={{ width: 64, height: 64, borderRadius: 8, objectFit: 'cover' }} alt="" />
              <div>
                <b>{o.id}</b>
                <div className="hint">{o.date} • {(o.items || []).reduce((a, i) => a + i.qty, 0)} items • {o.companyName || o.customer}{o.poRef ? ' • ' + o.poRef : ''}</div>
              </div>
              <div style={{ textAlign: 'right' }}><b>{fmt(o.total)}</b><div>{statusBadge(o.status)}</div></div>
            </Link>
          );
        })}
        {orders.length ? null : <Empty title="No orders yet." />}
      </div></div>
    </>
  );
}
