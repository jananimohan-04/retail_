/* Product media library — route /super/media.
   Filters: company / product / type. Gallery grid with upload (file input →
   POST /api/uploads multipart then POST /api/media), replace, delete,
   reorder, set-primary, visibility. */
import { useCallback, useEffect, useState } from 'react';
import { api, imgFallback, uploadFiles } from '../../api';
import { PageHead, Pager, Field, Modal, Confirm, Empty, Skeleton, toast } from '../../components/ui';
import { asRows, fetchCompanyOptions } from './_shared';
import { MediaUploadModal } from './CompanyDetail';

const LIMIT = 8;

export default function Media() {
  const [cos, setCos] = useState([]);
  const [products, setProducts] = useState([]);
  const [companyId, setCompanyId] = useState('all');
  const [productId, setProductId] = useState('all');
  const [type, setType] = useState('all');
  const [page, setPage] = useState(1);
  const [data, setData] = useState({ rows: [], total: 0 });
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState('');
  const [uploading, setUploading] = useState(false);
  const [upProducts, setUpProducts] = useState([]);
  const [replacing, setReplacing] = useState(null);
  const [del, setDel] = useState(null);

  useEffect(() => { fetchCompanyOptions().then(setCos).catch(() => {}); }, []);

  useEffect(() => {
    const cid = companyId === 'all' ? null : companyId;
    api.get('/api/products' + (cid ? '?companyId=' + cid : '')).then((d) => {
      setProducts(asRows(d).rows);
      setProductId((cur) => (cur !== 'all' && !asRows(d).rows.some((p) => p.id === cur) ? 'all' : cur));
    }).catch(() => {});
  }, [companyId]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const p = new URLSearchParams({ page, limit: LIMIT });
      if (companyId !== 'all') p.set('companyId', companyId);
      if (productId !== 'all') p.set('productId', productId);
      if (type !== 'all') p.set('type', type);
      const d = await api.get('/api/media?' + p);
      const n = asRows(d);
      setData({ rows: n.rows, total: n.total });
      setErr('');
    } catch (e) {
      setErr(e.message || 'Failed to load media');
    } finally {
      setLoading(false);
    }
  }, [companyId, productId, type, page]);
  useEffect(() => { load(); }, [load]);

  const reset = (fn) => (v) => { fn(v); setPage(1); };

  async function patch(m, body, msg) {
    try { await api.patch('/api/media/' + m.id, body); if (msg) toast(msg, '🖼️'); load(); }
    catch (e) { toast(e.message, '⚠️'); }
  }
  async function move(m, dir) {
    const ordered = [...data.rows].sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));
    const i = ordered.findIndex((x) => x.id === m.id);
    const j = i + dir;
    if (j < 0 || j >= ordered.length) return;
    try {
      await api.patch('/api/media/' + ordered[j].id, { sortOrder: m.sortOrder || 0 });
      await api.patch('/api/media/' + m.id, { sortOrder: ordered[j].sortOrder || 0 });
      load();
    } catch (e) { toast(e.message, '⚠️'); }
  }
  async function remove(m) {
    try { await api.del('/api/media/' + m.id); setDel(null); toast('Media deleted', '🖼️'); load(); }
    catch (e) { toast(e.message, '⚠️'); }
  }

  return (
    <>
      <PageHead eyebrow="CNCFORGE ERP • SUPER ADMIN" title="Product Media" desc="Company-scoped media index — binaries stay in Storage, metadata here."
        actions={<button className="btn btn-primary btn-sm" onClick={() => {
          const cid = companyId === 'all' ? '' : companyId;
          setUpProducts(cid ? products : []);
          setUploading(cid || 'pick');
        }}>+ Upload media</button>} />
      <div className="card"><div className="card-pad">
        <div className="toolbar">
          <select value={companyId} onChange={(e) => reset(setCompanyId)(e.target.value)}>
            <option value="all">All companies</option>
            {cos.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <select value={productId} onChange={(e) => reset(setProductId)(e.target.value)}>
            <option value="all">All products</option>
            {products.map((p) => <option key={p.id} value={p.id}>{p.sku || p.id} — {p.name}</option>)}
          </select>
          <select value={type} onChange={(e) => reset(setType)(e.target.value)}>
            <option value="all">All types</option>
            <option value="image">Images</option>
            <option value="video">Videos</option>
          </select>
        </div>
        {loading ? <Skeleton h={220} /> : err ? <Empty title={'⚠️ ' + err} /> : (
          <>
            <div className="prod-grid" style={{ gridTemplateColumns: 'repeat(4,1fr)' }}>
              {data.rows.map((m) => (
                <div className="prod" key={m.id}>
                  <div className="prod-img">
                    {m.type === 'video'
                      ? <video src={m.url} controls style={{ width: '100%', height: '100%' }} />
                      : <img src={m.url} onError={(e) => { e.target.src = imgFallback('media', 400, 300); }} alt="" />}
                  </div>
                  <div className="prod-body">
                    <b style={{ fontSize: 12 }}>{m.sku || m.productId}{m.primary ? ' • primary' : ''}</b>
                    <span className="hint">{m.productName || ''}</span>
                    <span className="hint">{m.companyName || m.companyId} • {m.type}{m.visible === false ? ' • hidden' : ''}</span>
                    <div className="prod-actions" style={{ flexWrap: 'wrap' }}>
                      <button className="btn btn-ghost btn-sm" onClick={() => patch(m, { primary: true }, 'Primary updated')}>Primary</button>
                      <button className="btn btn-ghost btn-sm" onClick={() => patch(m, { visible: !(m.visible !== false) }, 'Visibility updated')}>{m.visible !== false ? 'Hide' : 'Show'}</button>
                    </div>
                    <div className="prod-actions" style={{ flexWrap: 'wrap' }}>
                      <button className="btn btn-ghost btn-sm" onClick={() => move(m, -1)}>↑</button>
                      <button className="btn btn-ghost btn-sm" onClick={() => move(m, 1)}>↓</button>
                      <button className="btn btn-ghost btn-sm" onClick={() => setReplacing(m)}>Replace</button>
                      <button className="btn btn-ghost btn-sm" onClick={() => setDel(m)}>Delete</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            {!data.rows.length && <Empty icon="🖼️" title="No media yet" sub="Upload product images or video for any company." />}
            <Pager total={data.total} page={page} limit={LIMIT} onPage={setPage} />
          </>
        )}
      </div></div>
      {uploading === 'pick' && (
        <Modal title="＋ Upload media" onClose={() => setUploading(false)}>
          <Field label="Company" req hint="Media is company-scoped — pick the owning company first.">
            <select id="up_company_pick" onChange={(e) => {
              const cid = e.target.value;
              if (!cid) return;
              api.get('/api/products?companyId=' + cid).then((d) => setUpProducts(asRows(d).rows)).catch(() => {});
              setUploading(cid);
            }} value="">
              <option value="">— Select company —</option>
              {cos.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </Field>
        </Modal>
      )}
      {uploading && uploading !== 'pick' && (
        <MediaUploadModal
          key={uploading}
          companyId={uploading}
          products={uploading === companyId ? products : upProducts}
          onClose={() => setUploading(false)}
          onSaved={() => { setUploading(false); load(); }}
        />
      )}
      {replacing && <ReplaceModal m={replacing} onClose={() => setReplacing(null)} onSaved={() => { setReplacing(null); load(); }} />}
      {del && (
        <Confirm title="Delete media" body={`Delete this ${del.type} (${del.sku || del.productId})? The product record is updated too.`}
          okLabel="Delete" danger onCancel={() => setDel(null)} onOk={() => remove(del)} />
      )}
    </>
  );
}

function ReplaceModal({ m, onClose, onSaved }) {
  const [file, setFile] = useState(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  async function save() {
    if (!file) { setErr('Choose a replacement file.'); return; }
    setBusy(true);
    try {
      const urls = await uploadFiles([file]);
      await api.patch('/api/media/' + m.id, { url: urls[0] });
      toast('Media replaced', '🖼️');
      onSaved();
    } catch (e) { setErr(e.message); setBusy(false); }
  }
  return (
    <Modal title="Replace media" onClose={onClose}>
      <p className="hint" style={{ marginTop: 0 }}>{m.sku || m.productId} • current: {m.url}</p>
      <Field label="Replacement file" req><input type="file" accept="image/*,video/*" onChange={(e) => setFile(e.target.files[0] || null)} /></Field>
      {err && <div className="hint" style={{ color: '#DC2626' }}>{err}</div>}
      <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 12 }}>
        <button className="btn btn-ghost btn-sm" onClick={onClose}>Cancel</button>
        <button className="btn btn-primary btn-sm" disabled={busy} onClick={save}>{busy ? 'Replacing…' : 'Replace'}</button>
      </div>
    </Modal>
  );
}
