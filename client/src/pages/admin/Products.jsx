/* Company catalog — mirrors legacy vProducts + toggleVis. Server-scoped to own company. */
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api, fmt, imgFallback } from '../../api';
import { PageHead, DataTable, Empty, Skeleton, Pager, Confirm, toast } from '../../components/ui';

function norm(d) {
  if (!d) return { rows: [], total: 0, page: 1, limit: 8 };
  if (Array.isArray(d)) return { rows: d, total: d.length, page: 1, limit: 8 };
  return { rows: d.rows || [], total: d.total != null ? d.total : (d.rows || []).length, page: d.page || 1, limit: d.limit || 8 };
}

export default function Products() {
  const [q, setQ] = useState('');
  const [deb, setDeb] = useState('');
  const [page, setPage] = useState(1);
  const [data, setData] = useState(null);
  const [tick, setTick] = useState(0);
  const [delTarget, setDelTarget] = useState(null);
  const [delBusy, setDelBusy] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => { setDeb(q); setPage(1); }, 300);
    return () => clearTimeout(t);
  }, [q]);

  useEffect(() => {
    let on = true;
    const qs = new URLSearchParams({ page, limit: 8 });
    if (deb) qs.set('q', deb);
    api.get('/api/products?' + qs.toString()).then((d) => { if (on) setData({ ...norm(d), err: '' }); }).catch((e) => { if (on) setData({ rows: [], total: 0, page: 1, limit: 8, err: e.message }); });
    return () => { on = false; };
  }, [page, deb, tick]);

  function toggleVis(p) {
    api.patch('/api/products/' + p.id + '/visibility', { visible: !p.visible })
      .then(() => { toast('Visibility updated', '👁️'); setTick((t) => t + 1); })
      .catch((e) => toast(e.message, '⚠️'));
  }

  if (!data) return <Skeleton h={220} />;
  if (data.err && !data.rows.length) return <Empty icon="⚠️" title={data.err} sub="Could not reach the backend." />;

  return (
    <>
      <PageHead
        title={'Industrial catalog (' + data.total + ' SKUs)'}
        actions={<><Link className="btn btn-ghost btn-sm" to="/admin/media">Media library</Link> <Link className="btn btn-primary btn-sm" to="/admin/products/new">+ Add product</Link></>}
      />
      <div className="card"><div className="card-pad">
        <div className="toolbar"><input placeholder="Search name, SKU, brand, MPN…" value={q} onChange={(e) => setQ(e.target.value)} /></div>
        {data.total === 0 && !deb
          ? <div className="empty" style={{ padding: 32, textAlign: 'center' }}><div className="big">📦</div><h3>No products in catalog</h3><p className="hint">Your company catalog is empty. Click "+ Add product" above to create your first SKU.</p></div>
          : <>
            <DataTable
              empty="No products match your search."
              rowKey={(r) => r.id}
              cols={[
                {
                  key: 'p', label: 'Product', render: (p) => (
                    <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                      <img className="thumb" src={(p.images || [])[0] || ''} alt="" onError={(e) => { e.currentTarget.src = imgFallback(p.sku || p.id, 100, 100); }} />
                      <div><b>{p.name}</b><div className="hint">{p.sku || p.id}{p.mpn ? ' • MPN ' + p.mpn : ''}</div></div>
                    </div>)
                },
                { key: 'brand', label: 'Brand', render: (p) => p.brand || '—' },
                {
                  key: 'price', label: 'Price', render: (p) => (p.price != null
                    ? <span><b>{fmt(p.price)}</b> <span className="hint">/ {p.uom || 'Pc'}</span></span>
                    : <span className="status s-ready">RFQ</span>)
                },
                {
                  key: 'stock', label: 'Stock', render: (p) => (
                    <span>{p.stock <= 10 ? <b style={{ color: '#D97706' }}>{p.stock} low</b> : p.stock} <span className="hint">{p.uom || ''}</span></span>)
                },
                {
                  key: 'vis', label: 'Visible', render: (p) => (
                    <button className={'status ' + (p.visible ? 's-active' : 's-cancelled')} onClick={() => toggleVis(p)}>{p.visible ? 'Visible' : 'Hidden'}</button>)
                },
                {
                  key: 'act', label: 'Actions', render: (p) => (
                    <div style={{ display: 'flex', gap: 6 }}>
                      <Link className="btn btn-ghost btn-sm" to={'/admin/products/edit/' + p.id}>Edit</Link>
                      <button className="btn btn-ghost btn-sm text-rose-600 hover:text-rose-700" onClick={() => setDelTarget(p)} title="Delete product">🗑️</button>
                    </div>
                  )
                }
              ]}
              rows={data.rows}
            />
            <Pager total={data.total} page={data.page} limit={data.limit} onPage={setPage} />
          </>}
      </div></div>
      {delTarget && (
        <Confirm
          title="Delete Product"
          body={`Are you sure you want to permanently delete SKU <b>${delTarget.sku || delTarget.id}</b> (${delTarget.name})? This cannot be undone.`}
          okLabel="Delete Permanently"
          danger
          busy={delBusy}
          onCancel={() => setDelTarget(null)}
          onOk={async () => {
            setDelBusy(true);
            try {
              await api.del('/api/products/' + delTarget.id);
              toast('Product deleted', '🗑️');
              setDelTarget(null);
              setTick((t) => t + 1);
            } catch (e) {
              toast('Delete failed: ' + e.message, '⚠️');
            } finally {
              setDelBusy(false);
            }
          }}
        />
      )}
    </>
  );
}
