/* Store quotes — mirrors legacy vMyQuotes: RFQs with quoted prices + admin notes. */
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api, fmt } from '../../api';
import { Empty, Skeleton, statusBadge } from '../../components/ui';
import { asList } from './Home';

export default function Quotes() {
  const [quotes, setQuotes] = useState(null);
  const [products, setProducts] = useState([]);

  useEffect(() => { window.scrollTo(0, 0); }, []);
  useEffect(() => {
    api.get('/api/quotations').then((d) => setQuotes(asList(d))).catch(() => setQuotes([]));
    api.get('/api/products').then((d) => setProducts(asList(d))).catch(() => {});
  }, []);

  if (quotes === null) return <Skeleton h={220} />;
  const prodById = (pid) => products.find((p) => p.id === pid) || { name: pid, sku: pid, images: [] };
  return (
    <>
      <div className="section-head"><h2>My quotation requests ({quotes.length})</h2><Link className="btn btn-ghost btn-sm" to="/store/listing">Browse catalog</Link></div>
      <div className="card"><div className="card-pad">
        {quotes.map((q) => {
          const p = prodById(q.pid);
          return (
            <div key={q.id} className="cart-line">
              <img src={(p.images || [])[0] || ''} onError={(e) => { e.currentTarget.src = `https://picsum.photos/seed/${q.pid}/100/100`; }} style={{ width: 64, height: 64, borderRadius: 8, objectFit: 'cover' }} alt={p.name} />
              <div>
                <b>{q.id} — {p.name}</b>
                <div className="hint">{p.sku || ''} • Qty {q.qty} • {q.date}</div>
                <div className="hint">{q.quotePrice != null ? 'Quoted: ' + fmt(q.quotePrice) : 'Awaiting quote'}{q.adminNote ? ' • ' + q.adminNote : ''}</div>
              </div>
              <div>{statusBadge(q.status)}</div>
            </div>
          );
        })}
        {quotes.length ? null : <Empty title="No RFQs yet." />}
      </div></div>
    </>
  );
}
