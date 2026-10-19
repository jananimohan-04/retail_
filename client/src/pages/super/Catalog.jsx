/* Global cross-company catalog — route /super/catalog.
   Data: GET /api/catalog (query: companyId/cat/brand/visible/avail/archived/q/page/limit). */
import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api, fmt, imgFallback } from '../../api';
import { PageHead, DataTable, Pager, Empty, Skeleton, statusBadge } from '../../components/ui';
import { asRows } from './_shared';

const LIMIT = 8;

export default function Catalog() {
  const [page, setPage] = useState(1);
  const [data, setData] = useState({ rows: [], total: 0 });
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const d = await api.get(`/api/catalog?page=${page}&limit=${LIMIT}`);
      const n = asRows(d);
      setData({ rows: n.rows, total: n.total });
      setErr('');
    } catch (e) {
      setErr(e.message || 'Failed to load catalog');
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => { load(); }, [load]);

  return (
    <>
      <PageHead title="Global Catalog" />
      <div className="card"><div className="card-pad">
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
