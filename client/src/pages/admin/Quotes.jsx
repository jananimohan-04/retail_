/* Company RFQs — mirrors legacy vQuotesAdmin + quoteModal/quoteSave. */
import { useEffect, useState } from 'react';
import { api, fmt } from '../../api';
import { PageHead, DataTable, Field, statusBadge, Modal, Empty, Skeleton, Pager, toast } from '../../components/ui';

const STATUSES = ['all', 'Pending', 'Quoted', 'Accepted', 'Rejected', 'Cancelled'];

function norm(d) {
  if (!d) return { rows: [], total: 0, page: 1, limit: 8 };
  if (Array.isArray(d)) return { rows: d, total: d.length, page: 1, limit: 8 };
  return { rows: d.rows || [], total: d.total != null ? d.total : (d.rows || []).length, page: d.page || 1, limit: d.limit || 8 };
}

export default function Quotes() {
  const [status, setStatus] = useState('all');
  const [page, setPage] = useState(1);
  const [data, setData] = useState(null);
  const [resp, setResp] = useState(null); // quotation being answered
  const [rStatus, setRStatus] = useState('Quoted');
  const [rPrice, setRPrice] = useState('');
  const [rNote, setRNote] = useState('');
  const [rErr, setRErr] = useState('');
  const [rBusy, setRBusy] = useState(false);

  function load() {
    const qs = new URLSearchParams({ page, limit: 8 });
    if (status && status !== 'all') qs.set('status', status);
    api.get('/api/quotations?' + qs.toString()).then((d) => setData({ ...norm(d), err: '' })).catch((e) => setData({ rows: [], total: 0, page: 1, limit: 8, err: e.message }));
  }

  useEffect(load, [page, status]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!data) return <Skeleton h={220} />;
  if (data.err && !data.rows.length) return <Empty icon="⚠️" title={data.err} sub="Could not reach the backend." />;

  function openRespond(q) {
    setResp(q);
    setRStatus(q.status || 'Quoted');
    setRPrice(q.quotePrice != null ? q.quotePrice : '');
    setRNote(q.adminNote || '');
    setRErr('');
  }

  async function saveResponse() {
    const body = { status: rStatus || 'Quoted', quotePrice: (rPrice === '' ? null : Number(rPrice)), adminNote: rNote || '' };
    setRBusy(true);
    setRErr('');
    try {
      await api.patch('/api/quotations/' + resp.id, body);
      toast(resp.id + ' updated', '📝');
      setResp(null);
      load();
    } catch (e) {
      setRErr(e.message || 'Save failed');
    } finally {
      setRBusy(false);
    }
  }

  return (
    <>
      <PageHead title={'Quotation requests (' + data.total + ')'} desc="Reuses ERP quotation workflow" />
      <div className="card"><div className="card-pad">
        <div className="toolbar">
          <select value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }}>
            {STATUSES.map((s) => <option key={s} value={s}>{s === 'all' ? 'All statuses' : s}</option>)}
          </select>
        </div>
        <DataTable
          empty="No quotation requests found for this company."
          rowKey={(r) => r.id}
          cols={[
            { key: 'q', label: 'RFQ', render: (q) => (<div><b>{q.id}</b><div className="hint">{q.date}</div></div>) },
            {
              key: 'p', label: 'Product', render: (q) => (
                <div><b>{q.productName || q.pid}</b><div className="hint">{q.sku || ''} • {q.companyName || ''}</div><div className="hint">Tech: {q.techReq || '—'}</div></div>)
            },
            { key: 'qty', label: 'Qty', render: (q) => q.qty },
            { key: 'by', label: 'Requested by', render: (q) => (<div>{q.requestedBy}<div className="hint">{q.mobile || ''}</div></div>) },
            {
              key: 'quote', label: 'Quote', render: (q) => (
                <div>{q.quotePrice != null ? <b>{fmt(q.quotePrice)}</b> : '—'}<div className="hint">{q.adminNote || ''}</div></div>)
            },
            { key: 's', label: 'Status', render: (q) => statusBadge(q.status) },
            { key: 'a', label: 'Action', render: (q) => (<button className="btn btn-ghost btn-sm" onClick={() => openRespond(q)}>Respond</button>) }
          ]}
          rows={data.rows}
        />
        <Pager total={data.total} page={data.page} limit={data.limit} onPage={setPage} />
      </div></div>
      {resp && (
        <Modal title={'Respond — ' + resp.id} onClose={() => setResp(null)}>
          <Field label="Status">
            <select value={rStatus} onChange={(e) => setRStatus(e.target.value)}>
              {['Pending', 'Quoted', 'Accepted', 'Rejected', 'Cancelled'].map((s) => <option key={s}>{s}</option>)}
            </select>
          </Field>
          <Field label="Quoted unit price (₹, optional)"><input type="number" value={rPrice} onChange={(e) => setRPrice(e.target.value)} /></Field>
          <Field label="Note for requester"><input value={rNote} onChange={(e) => setRNote(e.target.value)} placeholder="e.g. Imported, 3-week lead time" /></Field>
          {rErr && <p className="ferr">⚠️ {rErr}</p>}
          <button className="btn btn-primary" style={{ width: '100%' }} disabled={rBusy} onClick={saveResponse}>{rBusy ? 'Saving…' : 'Save response'}</button>
        </Modal>
      )}
    </>
  );
}
