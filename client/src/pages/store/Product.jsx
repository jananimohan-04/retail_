/* Store product detail — mirrors legacy vProduct: gallery, specs, buy boxes, related. */
import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import { api } from '../../api';
import { useAuth } from '../../auth';
import { Empty, Skeleton } from '../../components/ui';
import { ProdCard, RfqModal, addToCart, asList, availBadge, priceHtml } from './Home';

/* youtube watch/shorts/embed url → video id (null when not a YouTube link) */
const ytId = (u) => {
  const m = String(u || '').match(/(?:youtube\.com\/(?:watch\?v=|shorts\/|embed\/|live\/)|youtu\.be\/)([\w-]{5,})/i);
  return m ? m[1] : null;
};

export default function Product() {
  const { id } = useParams();
  const { me } = useAuth();
  const nav = useNavigate();
  const loc = useLocation();
  const [p, setP] = useState(null);
  const [missing, setMissing] = useState(false);
  const [cats, setCats] = useState([]);
  const [companyProds, setCompanyProds] = useState([]);
  const [selImg, setSelImg] = useState(0);
  const [selVideo, setSelVideo] = useState(false);
  const [videoErr, setVideoErr] = useState(false);
  const [qty, setQty] = useState(1);
  const [rfq, setRfq] = useState(null);

  useEffect(() => { window.scrollTo(0, 0); }, [id]);
  useEffect(() => {
    setP(null); setMissing(false); setSelImg(0); setSelVideo(false); setVideoErr(false);
    api.get('/api/products/' + id).then((d) => {
      setP(d);
      setQty(Math.min(d.moq || 1, 10));
    }).catch(() => setMissing(true));
    api.get('/api/products').then((d) => setCompanyProds(asList(d))).catch(() => {});
    api.get('/api/categories').then((d) => setCats(asList(d))).catch(() => {});
  }, [id]);

  if (missing) return <Empty icon="🔍" title="Product not found." />;
  if (p === null) return <Skeleton h={320} />;

  const catName = (cid) => ((cats.find((c) => c.id === cid) || {}).name || cid);
  const rel = companyProds.filter((x) => x.category === p.category && x.id !== p.id && x.visible).slice(0, 4);
  const stepQty = (d) => setQty((v) => Math.max(1, Math.min(99, v + d)));
  const refresh = () => nav(loc.pathname + loc.search, { replace: true });

  const buyBox = p.price == null
    ? <div className="card" style={{ boxShadow: 'none', borderColor: '#FDBA74', background: '#FFFBEB' }}><div className="card-pad" style={{ padding: 14 }}>
      <b>Quotation required</b>
      <p className="hint" style={{ margin: '6px 0 12px' }}>This item is priced on request. Submit an RFQ with quantity and technical requirements.</p>
      <button className="btn btn-coral" style={{ width: '100%' }} onClick={() => setRfq(p)}>Request Quotation</button>
    </div></div>
    : p.stock <= 0
      ? <div className="card" style={{ boxShadow: 'none' }}><div className="card-pad" style={{ padding: 14 }}>
        <b>Currently out of stock</b>
        <p className="hint" style={{ margin: '6px 0 12px' }}>Check availability or raise an indent request.</p>
        <button className="btn btn-dark" style={{ width: '100%' }} onClick={() => setRfq(p)}>Check Availability</button>
      </div></div>
      : <>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginTop: 12, flexWrap: 'wrap' }}>
          <span className="qty"><button onClick={() => stepQty(-1)}>−</button><span>{qty}</span><button onClick={() => stepQty(1)}>+</button></span>
          <span className="hint">{p.stock} {p.uom || ''} available{(p.moq || 1) > 1 ? ' • MOQ ' + p.moq : ''}</span>
        </div>
        <div style={{ display: 'flex', gap: 10, marginTop: 12 }}>
          <button className="btn btn-primary" style={{ flex: 1 }} onClick={() => { if (addToCart(p, qty)) refresh(); }}>Add to Cart</button>
          <button className="btn btn-coral" style={{ flex: 1 }} onClick={() => { if (addToCart(p, qty, { silent: true })) nav('/store/cart'); }}>Buy Now →</button>
        </div>
      </>;

  return (
    <>
      <Link className="btn btn-ghost btn-sm" to="/store/listing">← Back to catalog</Link>
      <div className="card" style={{ marginTop: 12 }}><div className="card-pad">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 22 }} className="dash2">
          <div>
            <div className="gallery">
              <div className="thumbs">
                {(p.images || []).map((u, i) => (
                  <img key={i} src={u} onError={(e) => { e.currentTarget.src = `https://picsum.photos/seed/${p.sku || p.id}-${i}/200/200`; }} className={!selVideo && i === selImg ? 'sel' : ''} onClick={() => { setSelImg(i); setSelVideo(false); }} alt="" />
                ))}
                {p.video ? <video src={p.video} className={selVideo ? 'sel' : ''} onClick={() => setSelVideo(true)} /> : null}
              </div>
              <div className="main-media">
                {selVideo
                  ? <video src={p.video} controls autoPlay style={{ width: '100%' }} />
                  : <img src={(p.images || [])[selImg] || ''} onError={(e) => { e.currentTarget.src = `https://picsum.photos/seed/${p.sku || p.id}/700/525`; }} alt={p.name} />}
              </div>
            </div>
            {p.video
              ? (videoErr
                ? <p className="hint">⚠️ Video failed to load.</p>
                : <video src={p.video} controls preload="metadata" style={{ width: '100%', borderRadius: 10, marginTop: 12, background: '#000' }} onError={() => setVideoErr(true)} />)
              : null}
            {(p.media || []).filter((m) => m.type === 'youtube' && ytId(m.url)).map((m) => (
              <iframe
                key={m.id}
                src={'https://www.youtube.com/embed/' + ytId(m.url)}
                title={m.title || 'Product video'}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                style={{ width: '100%', aspectRatio: '16 / 9', borderRadius: 10, marginTop: 12, border: 'none', background: '#000' }}
              />
            ))}
            {(p.media || []).some((m) => m.type === 'document') ? (
              <div className="card" style={{ boxShadow: 'none', marginTop: 12 }}><div className="card-pad" style={{ padding: 14 }}>
                <b style={{ fontSize: 13 }}>Documents</b>
                <ul style={{ margin: '8px 0 0', padding: 0, listStyle: 'none', display: 'grid', gap: 6 }}>
                  {(p.media || []).filter((m) => m.type === 'document').map((m) => (
                    <li key={m.id}>
                      <a href={m.url} target="_blank" rel="noreferrer" style={{ fontSize: 13, fontWeight: 600 }}>
                        📄 {m.title || 'Product document'} <span className="hint">— open / download</span>
                      </a>
                    </li>
                  ))}
                </ul>
              </div></div>
            ) : null}
          </div>
          <div>
            <span className="pill">{catName(p.category)}</span> {availBadge(p)}
            <h1 style={{ margin: '10px 0 2px', fontSize: 24, letterSpacing: '-.01em' }}>{p.name}</h1>
            <p className="hint" style={{ margin: '0 0 4px' }}>SKU <b>{p.sku || p.id}</b>{p.mpn ? <> • MPN <b>{p.mpn}</b></> : null} • {p.brand || ''}</p>
            <div style={{ margin: '12px 0' }}>{priceHtml(p, true)}</div>
            <p style={{ fontSize: 13.5, lineHeight: 1.6 }}>{p.desc || ''}</p>
            <div className="card" style={{ boxShadow: 'none' }}><div className="card-pad" style={{ padding: 14 }}>
              <b style={{ fontSize: 13 }}>Technical specifications</b>
              <table className="spec-table" style={{ marginTop: 6 }}>
                <tbody>
                  {Object.entries(p.specs || {}).map(([k, v]) => <tr key={k}><td>{k}</td><td><b>{v}</b></td></tr>)}
                  {Object.keys(p.specs || {}).length ? null : <tr><td colSpan="2" className="hint">Refer to datasheet via RFQ.</td></tr>}
                </tbody>
              </table>
            </div></div>
            <div className="card" style={{ boxShadow: 'none', marginTop: 10 }}><div className="card-pad" style={{ padding: 14, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, fontSize: 12.5 }}>
              <div><span className="hint">Unit</span><br /><b>{p.uom || 'Pc'}</b></div>
              <div><span className="hint">MOQ</span><br /><b>{p.moq || 1}</b></div>
              <div><span className="hint">Warehouse</span><br /><b>{p.warehouse || '—'}</b></div>
              <div><span className="hint">Lead time</span><br /><b>{p.leadTime || '—'}</b></div>
            </div></div>
            <div style={{ marginTop: 4 }}>{buyBox}</div>
            <p className="hint">✓ Availability from ERP inventory • ✓ Server recomputes totals • ✓ GST invoice</p>
          </div>
        </div>
      </div></div>
      {rel.length ? (
        <><div className="section-head"><h2>Related in {catName(p.category)}</h2></div>
          <div className="prod-grid">{rel.map((r) => <ProdCard key={r.id} p={r} catName={catName} onAdd={(x) => { if (addToCart(x)) refresh(); }} onRfq={setRfq} />)}</div></>
      ) : null}
      {rfq && <RfqModal p={rfq} me={me} onClose={() => setRfq(null)} onDone={() => { setRfq(null); nav('/store/quotes'); }} />}
    </>
  );
}
