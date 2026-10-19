/* Store listing — mirrors legacy vListing: filters/sort/search semantics. */
import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { ShoppingBag } from 'lucide-react';
import { api } from '../../api';
import { useAuth } from '../../auth';
import { Skeleton, PageHero } from '../../components/ui';
import { ProdCard, RfqModal, addToCart, asList } from './Home';

export default function Listing() {
  const { me } = useAuth();
  const nav = useNavigate();
  const loc = useLocation();
  const [params, setParams] = useSearchParams();
  const [products, setProducts] = useState(null);
  const [cats, setCats] = useState([]);
  const [rfq, setRfq] = useState(null);

  const [cat, setCat] = useState(params.get('cat') || 'all');
  const [brand, setBrand] = useState('all');
  const [sort, setSort] = useState('new');
  const [avail, setAvail] = useState('all');
  const [minP, setMinP] = useState('');
  const [maxP, setMaxP] = useState('');
  const q = params.get('q') || '';

  useEffect(() => { window.scrollTo(0, 0); }, []);
  useEffect(() => {
    api.get('/api/products').then((d) => setProducts(asList(d))).catch(() => setProducts([]));
    api.get('/api/categories').then((d) => setCats(asList(d))).catch(() => {});
  }, []);
  useEffect(() => {
    setCat(params.get('cat') || 'all');
  }, [params]);

  const brands = useMemo(() => [...new Set((products || []).map((p) => p.brand).filter(Boolean))], [products]);

  const onAdd = (p) => {
    if (addToCart(p)) nav(loc.pathname + loc.search, { replace: true });
  };
  const clearF = () => {
    setCat('all'); setBrand('all'); setSort('new'); setAvail('all'); setMinP(''); setMaxP('');
    setParams({});
  };

  if (products === null) return <Skeleton h={320} />;
  const catName = (id) => ((cats.find((c) => c.id === id) || {}).name || id);
  let ps = products.filter((p) => p.visible);
  const ql = q.toLowerCase();
  if (cat !== 'all') ps = ps.filter((p) => p.category === cat);
  if (brand !== 'all') ps = ps.filter((p) => p.brand === brand);
  if (avail === 'in') ps = ps.filter((p) => p.stock > 0 && p.price != null);
  if (avail === 'rfq') ps = ps.filter((p) => p.price == null || p.stock <= 0);
  if (q) ps = ps.filter((p) => [p.name, p.short, p.desc, p.sku, p.brand, p.mpn].filter(Boolean).join(' ').toLowerCase().includes(ql));
  if (minP !== '') ps = ps.filter((p) => p.price != null && p.price >= Number(minP));
  if (maxP !== '') ps = ps.filter((p) => p.price != null && p.price <= Number(maxP));
  if (sort === 'price-asc') ps.sort((a, b) => (a.price ?? Infinity) - (b.price ?? Infinity));
  else if (sort === 'price-desc') ps.sort((a, b) => (b.price ?? -1) - (a.price ?? -1));
  else if (sort === 'name') ps.sort((a, b) => a.name.localeCompare(b.name));
  else if (sort === 'avail') ps.sort((a, b) => ((b.stock > 0) - (a.stock > 0)));
  else ps.sort((a, b) => String(b.created).localeCompare(String(a.created)));

  return (
    <>
      <PageHero
        title={`Industrial Catalog (${ps.length} SKUs)`}
        subtitle="Search SKU, MPN, industrial brand, technical compatibility, and inventory status."
        icon={ShoppingBag}
        badgeText="Industrial Storefront"
        badgeColor="orange"
        gradient="from-orange-500 via-amber-500 to-red-500"
      />
      <div className="card"><div className="card-pad">
        <div className="toolbar">
          <select value={cat} onChange={(e) => setCat(e.target.value)}>
            <option value="all">All categories</option>
            {cats.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <select value={brand} onChange={(e) => setBrand(e.target.value)}>
            <option value="all">All brands</option>
            {brands.map((b) => <option key={b} value={b}>{b}</option>)}
          </select>
          <select value={sort} onChange={(e) => setSort(e.target.value)}>
            <option value="new">Recently added</option>
            <option value="name">Name A–Z</option>
            <option value="price-asc">Price: low → high</option>
            <option value="price-desc">Price: high → low</option>
            <option value="avail">Availability</option>
          </select>
          <select value={avail} onChange={(e) => setAvail(e.target.value)}>
            <option value="all">All availability</option>
            <option value="in">In stock (priced)</option>
            <option value="rfq">Quotation / indent</option>
          </select>
          <input type="number" placeholder="Min ₹" style={{ maxWidth: 110 }} value={minP} onChange={(e) => setMinP(e.target.value)} />
          <input type="number" placeholder="Max ₹" style={{ maxWidth: 110 }} value={maxP} onChange={(e) => setMaxP(e.target.value)} />
          {q ? <span className="hint">“{q}” <button className="btn btn-ghost btn-sm" onClick={clearF}>Clear</button></span> : null}
        </div>
        {ps.length
          ? <div className="prod-grid">{ps.map((p) => <ProdCard key={p.id} p={p} catName={catName} onAdd={onAdd} onRfq={setRfq} />)}</div>
          : <div className="empty"><div className="big">🔩</div><b>No matching SKUs</b><p>Try a different SKU, brand or category.</p><button className="btn btn-ghost btn-sm" onClick={clearF}>Clear filters</button></div>}
      </div></div>
      {rfq && <RfqModal p={rfq} me={me} onClose={() => setRfq(null)} onDone={() => { setRfq(null); nav('/store/quotes'); }} />}
    </>
  );
}
