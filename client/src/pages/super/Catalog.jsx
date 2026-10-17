/* Global cross-company catalog — route /super/catalog.
   Data: GET /api/catalog (query: companyId/cat/brand/visible/avail/archived/q/page/limit). */
import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api, fmt, imgFallback } from '../../api';
import { PageHead, DataTable, Pager, Empty, Skeleton, statusBadge } from '../../components/ui';
import { asRows, fetchCompanyOptions } from './_shared';

const LIMIT = 8;

function useDebounced(value, ms = 280) {
  const [v, setV] = useState(value);
  useEffect(() => { const t = setTimeout(() => setV(value), ms); return () => clearTimeout(t); }, [value, ms]);
  return v;
}

export default function Catalog() {
  const [cos, setCos] = useState([]);
  const [cats, setCats] = useState([]);
  const [brands, setBrands] = useState([]);
  const [companyId, setCompanyId] = useState('all');
  const [cat, setCat] = useState('all');
  const [brand, setBrand] = useState('all');
  const [visible, setVisible] = useState('all');
  const [avail, setAvail] = useState('all');
  const [q, setQ] = useState('');
  const [createdAfter, setCreatedAfter] = useState('');
  const [page, setPage] = useState(1);
  const [data, setData] = useState({ rows: [], total: 0 });
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState('');
  const dq = useDebounced(q);

  useEffect(() => {
    fetchCompanyOptions().then(setCos).catch(() => {});
    api.get('/api/categories').then((d) => setCats(asRows(d).rows)).catch(() => {});
    api.get('/api/catalog?limit=200').then((d) => setBrands([...new Set(asRows(d).rows.map((p) => p.brand).filter(Boolean))])).catch(() => {});
  }, []);

  const resetPage = (fn) => (v) => { fn(v); setPage(1); };

  const load = useCallback(async () => {
    setLoading(true);
    try {
      // `created` has no backend query param: when set, pull a wide page and
      // filter/paginate client-side so counts stay correct.
      const wide = !!createdAfter;
      const p = new URLSearchParams({ page: wide ? 1 : page, limit: wide ? 200 : LIMIT });
      if (companyId !== 'all') p.set('companyId', companyId);
      if (cat !== 'all') p.set('cat', cat);
      if (brand !== 'all') p.set('brand', brand);
      if (visible !== 'all') p.set('visible', visible);
      if (avail !== 'all') p.set('avail', avail);
      if (dq) p.set('q', dq);
      const d = await api.get('/api/catalog?' + p);
      let n = asRows(d);
      if (wide) {
        const rows = n.rows.filter((r) => String(r.created || '') >= createdAfter);
        n = { rows: rows.slice((page - 1) * LIMIT, page * LIMIT), total: rows.length, page, limit: LIMIT };
      }
      setData({ rows: n.rows, total: n.total });
      setErr('');
    } catch (e) {
      setErr(e.message || 'Failed to load catalog');
    } finally {
      setLoading(false);
    }
  }, [companyId, cat, brand, visible, avail, dq, createdAfter, page]);

  useEffect(() => { load(); }, [load]);

  return (
    <>
      <PageHead eyebrow="CNCFORGE ERP • SUPER ADMIN" title="Global Catalog" desc="Every company's SKUs in one view — company stays attached to each row." />
      <div className="card"><div className="card-pad">
        <div className="toolbar">
          <input placeholder="🔍 Search name, SKU, brand, MPN…" value={q} onChange={(e) => { setQ(e.target.value); setPage(1); }} />
          <select value={companyId} onChange={(e) => resetPage(setCompanyId)(e.target.value)}>
            <option value="all">All companies</option>
            {cos.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <select value={cat} onChange={(e) => resetPage(setCat)(e.target.value)}>
            <option value="all">All categories</option>
            {cats.map((c) => <option key={c.id} value={c.id}>{c.icon} {c.name}</option>)}
          </select>
          <select value={brand} onChange={(e) => resetPage(setBrand)(e.target.value)}>
            <option value="all">All brands</option>
            {brands.map((b) => <option key={b} value={b}>{b}</option>)}
          </select>
          <select value={visible} onChange={(e) => resetPage(setVisible)(e.target.value)}>
            <option value="all">All visibility</option>
            <option value="true">Visible</option>
            <option value="false">Hidden</option>
          </select>
          <select value={avail} onChange={(e) => resetPage(setAvail)(e.target.value)}>
            <option value="all">All availability</option>
            <option value="in">In stock (priced)</option>
            <option value="rfq">Quotation / indent</option>
          </select>
          <input type="date" title="Created after" value={createdAfter} onChange={(e) => resetPage(setCreatedAfter)(e.target.value)} style={{ maxWidth: 170 }} />
          {createdAfter && <button className="btn btn-ghost btn-sm" onClick={() => { setCreatedAfter(''); setPage(1); }}>Clear date</button>}
        </div>
        {loading ? <Skeleton h={220} /> : err ? <Empty title={'⚠️ ' + err} /> : (
          <>
            <DataTable
              rowKey={(r) => r.id}
              empty="No SKUs match."
              cols={[
                {
                  key: 'p', label: 'Product', render: (p) => (
                    <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                      <img className="thumb" src={(p.images || [])[0] || ''} onError={(e) => { e.target.src = imgFallback(p.sku || p.id, 100, 100); }} alt="" />
                      <div><b>{p.name}</b><div className="hint">{p.sku || p.id}{p.mpn ? ' • MPN ' + p.mpn : ''}{p.archived ? ' • ARCHIVED' : ''}</div></div>
                    </div>
                  )
                },
                { key: 'co', label: 'Company', render: (p) => p.companyName || p.companyId },
                { key: 'b', label: 'Brand', render: (p) => p.brand || '—' },
                { key: 'pr', label: 'Price', render: (p) => p.price != null ? <b>{fmt(p.price)}</b> : <span className="status s-ready">RFQ</span> },
                { key: 's', label: 'Stock', render: (p) => p.stock },
                { key: 'v', label: 'Visibility', render: (p) => statusBadge(p.visible ? 'Delivered' : 'Cancelled') },
                { key: 'c', label: 'Created', render: (p) => <span className="hint">{p.created || '—'}</span> },
                {
                  key: 'a', label: 'Actions', render: (p) => (
                    <span style={{ whiteSpace: 'nowrap' }}>
                      <Link className="btn btn-ghost btn-sm" to={'/store/product/' + p.id}>View</Link>{' '}
                      <Link className="btn btn-ghost btn-sm" to={'/admin/products/edit/' + p.id}>Edit</Link>
                    </span>
                  )
                }
              ]}
              rows={data.rows}
            />
            <Pager total={data.total} page={page} limit={LIMIT} onPage={setPage} />
          </>
        )}
      </div></div>
    </>
  );
}
