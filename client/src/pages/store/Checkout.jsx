/* Store checkout — mirrors legacy vCheckout/ckBody: 2 steps, B2B validation, placeOrder. */
import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api, fmt, getCart, setCart } from '../../api';
import { Empty, Skeleton, toast } from '../../components/ui';
import { asList } from './Home';

export default function Checkout() {
  const nav = useNavigate();
  const [products, setProducts] = useState(null);
  const [step, setStep] = useState(1);
  const [busy, setBusy] = useState(false);
  const [company, setCompany] = useState('Sharma Auto Components Pvt Ltd');
  const [name, setName] = useState('Priya Sharma');
  const [mobile, setMobile] = useState('98765 43210');
  const [email, setEmail] = useState('purchase@sharmaauto.in');
  const [po, setPo] = useState('');
  const [pin, setPin] = useState('411026');
  const [addr, setAddr] = useState('Plot 44, MIDC Bhosari, Pune');
  const [city, setCity] = useState('Pune');
  const [state, setState] = useState('Maharashtra');
  const [notes, setNotes] = useState('');

  useEffect(() => { window.scrollTo(0, 0); }, []);
  useEffect(() => {
    api.get('/api/products').then((d) => setProducts(asList(d))).catch(() => setProducts([]));
  }, []);

  if (products === null) return <Skeleton h={220} />;
  const prodById = (id) => products.find((p) => p.id === id);
  const cart = getCart();
  if (!cart.length) {
    return <div className="empty"><div className="big">🧾</div>Cart empty — <Link to="/store/listing"><b>browse the catalog</b></Link> first.</div>;
  }
  const sub = cart.reduce((a, c) => { const p = prodById(c.pid); return a + (p && p.price != null ? p.price * c.qty : 0); }, 0);

  const goStep = (n) => {
    if (n === 2) {
      const req = [[company, 'Company'], [name, 'Contact'], [mobile, 'Mobile'], [pin, 'PIN'], [addr, 'Address']];
      for (const [v, l] of req) {
        if (!String(v || '').trim()) { toast(l + ' is required', '⚠️'); return; }
      }
    }
    setStep(n);
  };

  const placeOrder = async () => {
    setBusy(true);
    const payload = {
      customer: name, contact: name, companyName: company, mobile, address: addr || '—',
      city, poRef: po, items: cart.map((c) => ({ pid: c.pid, qty: c.qty }))
    };
    try {
      const o = await api.post('/api/orders', payload);
      setCart([]);
      toast('Order ' + o.id + ' submitted • stock reserved', '🏭');
      nav('/store/confirmation/' + o.id);
    } catch (e) {
      toast(e.message, '⚠️');
      setBusy(false);
    }
  };

  return (
    <>
      <div className="section-head"><h2>Checkout — purchase order</h2><Link className="btn btn-ghost btn-sm" to="/store/cart">← Back to cart</Link></div>
      <div className="steps">
        <div className={'step' + (step === 1 ? ' active' : '')}>1 • Company & delivery</div>
        <div className={'step' + (step === 2 ? ' active' : '')}>2 • Review indent</div>
      </div>
      {step === 1
        ? <div className="card"><div className="card-pad">
          <h3 style={{ marginTop: 0 }}>Company & delivery details</h3>
          <div className="form-grid">
            <div className="field"><label>Company name *</label><input value={company} onChange={(e) => setCompany(e.target.value)} /></div>
            <div className="field"><label>Contact person *</label><input value={name} onChange={(e) => setName(e.target.value)} /></div>
            <div className="field"><label>Mobile *</label><input value={mobile} onChange={(e) => setMobile(e.target.value)} /></div>
            <div className="field"><label>Email</label><input value={email} onChange={(e) => setEmail(e.target.value)} /></div>
            <div className="field"><label>PO reference (optional)</label><input value={po} onChange={(e) => setPo(e.target.value)} placeholder="e.g. PO/SAC/26/118" /></div>
            <div className="field"><label>PIN code *</label><input value={pin} onChange={(e) => setPin(e.target.value)} /></div>
            <div className="field full"><label>Delivery address *</label><textarea rows="2" value={addr} onChange={(e) => setAddr(e.target.value)} /></div>
            <div className="field"><label>City *</label><input value={city} onChange={(e) => setCity(e.target.value)} /></div>
            <div className="field"><label>State *</label><input value={state} onChange={(e) => setState(e.target.value)} /></div>
            <div className="field full"><label>Delivery instructions (optional)</label><input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="e.g. Unloading bay 2, contact security" /></div>
          </div>
          <button className="btn btn-primary" onClick={() => goStep(2)}>Review indent →</button>
        </div></div>
        : <div style={{ display: 'grid', gridTemplateColumns: '1.4fr .8fr', gap: 14 }} className="dash2">
          <div className="card"><div className="card-pad">
            <h3 style={{ marginTop: 0 }}>Review line items</h3>
            {cart.map((c) => {
              const p = prodById(c.pid) || { name: c.pid };
              return (
                <div key={c.pid} className="cart-line">
                  <img src={(p.images || [])[0] || ''} onError={(e) => { e.currentTarget.src = `https://picsum.photos/seed/${p.sku || c.pid}/200/200`; }} style={{ width: 60, height: 60, borderRadius: 8, objectFit: 'cover' }} alt={p.name} />
                  <div><b style={{ fontSize: 13 }}>{p.name}</b><div className="hint">{p.sku || ''} • {c.qty} {p.uom || ''} × {fmt(p.price)}</div></div>
                  <b>{fmt(p.price != null ? p.price * c.qty : null)}</b>
                </div>
              );
            })}
            <div style={{ display: 'flex', gap: 10 }}>
              <button className="btn btn-ghost btn-sm" onClick={() => goStep(1)}>← Edit details</button>
              <Link className="btn btn-ghost btn-sm" to="/store/cart">Edit cart</Link>
            </div>
          </div></div>
          <div className="card"><div className="card-pad">
            <h3 style={{ marginTop: 0 }}>Payable: {fmt(sub)}</h3>
            <p className="hint">Excl. GST — invoiced as per ERP. Order is recorded as <b>Pending</b>, not paid.</p>
            <button className="btn btn-coral" style={{ width: '100%' }} disabled={busy} onClick={placeOrder}>{busy ? 'Submitting…' : `Submit order • ${fmt(sub)}`}</button>
            <p className="hint">Double-click protected • server revalidates stock.</p>
          </div></div>
        </div>}
    </>
  );
}
