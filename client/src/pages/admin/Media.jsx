/* Company media library — product-image grid from own catalog. Mirrors legacy vMedia. */
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api, imgFallback } from '../../api';
import { PageHead, Empty, Skeleton } from '../../components/ui';

export default function Media() {
  const [prods, setProds] = useState(null);
  const [err, setErr] = useState('');

  useEffect(() => {
    let on = true;
    api.get('/api/products').then((d) => { if (on) setProds(Array.isArray(d) ? d : (d.rows || [])); }).catch((e) => { if (on) setErr(e.message); });
    return () => { on = false; };
  }, []);

  if (err && !prods) return <Empty icon="⚠️" title={err} sub="Could not reach the backend." />;
  if (!prods) return <Skeleton h={220} />;

  const cells = prods.flatMap((p) => ((p.images || []).slice(0, 2)).map((u) => ({ p, u })));

  return (
    <>
      <PageHead
        title="Media library"
        actions={<Link className="btn btn-primary btn-sm" to="/admin/products/new">+ Upload via product</Link>}
      />
      <div className="card"><div className="card-pad">
        <div className="prod-grid" style={{ gridTemplateColumns: 'repeat(3,1fr)' }}>
          {cells.length ? cells.map(({ p, u }, i) => (
            <div className="prod" key={p.id + '-' + i}>
              <div className="prod-img"><img src={u} alt={p.name} loading="lazy" onError={(e) => { e.currentTarget.src = imgFallback(p.sku || p.id); }} /></div>
              <div className="prod-body"><b style={{ fontSize: 13 }}>{p.name}</b><span className="hint">{p.sku || ''} • primary image</span></div>
            </div>
          )) : <div className="empty" style={{ gridColumn: '1/-1', padding: 32, textAlign: 'center' }}><div className="big">🖼️</div><p className="hint">No product media uploaded yet for this company.</p></div>}
        </div>
        <p className="hint">Company-scoped media. Videos stream with lazy loading + error fallback on the product page.</p>
      </div></div>
    </>
  );
}
