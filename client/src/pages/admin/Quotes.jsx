/* Company RFQs — mirrors legacy vQuotesAdmin + quoteModal/quoteSave with modern Tailwind UI. */
import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FileText, Filter, MessageSquare, Check, X, 
  Send, Calendar, User, IndianRupee, Loader2 
} from 'lucide-react';
import { api, fmt } from '../../api';
import { statusBadge, Modal, Empty, Skeleton, Pager, toast } from '../../components/ui';

const STATUSES = ['all', 'Pending', 'Quoted', 'Accepted', 'Rejected', 'Cancelled'];

function norm(d) {
  if (!d) return { rows: [], total: 0, page: 1, limit: 8 };
  if (Array.isArray(d)) return { rows: d, total: d.length, page: 1, limit: 8 };
  return { 
    rows: d.rows || [], 
    total: d.total != null ? d.total : (d.rows || []).length, 
    page: d.page || 1, 
    limit: d.limit || 8 
  };
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
    api.get('/api/quotations?' + qs.toString())
      .then((d) => setData({ ...norm(d), err: '' }))
      .catch((e) => setData({ rows: [], total: 0, page: 1, limit: 8, err: e.message }));
  }

  useEffect(load, [page, status]);

  if (!data) return <Skeleton h={320} />;

  function openRespond(q) {
    setResp(q);
    setRStatus(q.status || 'Quoted');
    setRPrice(q.quotePrice != null ? q.quotePrice : '');
    setRNote(q.adminNote || '');
    setRErr('');
  }

  async function saveResponse() {
    const body = { 
      status: rStatus || 'Quoted', 
      quotePrice: (rPrice === '' ? null : Number(rPrice)), 
      adminNote: rNote || '' 
    };
    setRBusy(true);
    setRErr('');
    try {
      await api.patch('/api/quotations/' + resp.id, body);
      toast(resp.id + ' quote updated', '📝');
      setResp(null);
      load();
    } catch (e) {
      setRErr(e.message || 'Save failed');
    } finally {
      setRBusy(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <FileText className="w-6 h-6 text-blue-600" /> Quotation Requests (RFQs)
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            {data.total} requests • Industrial technical quotes & custom pricing pipeline
          </p>
        </div>
      </div>

      {/* Main Table Card */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-4">
        {/* Filter Toolbar */}
        <div className="flex items-center gap-3">
          <Filter className="w-4 h-4 text-slate-400" />
          <select 
            value={status} 
            onChange={(e) => { setStatus(e.target.value); setPage(1); }}
            className="px-3 py-2 text-xs bg-slate-50 border border-slate-200 focus:border-blue-500 rounded-xl outline-hidden"
          >
            {STATUSES.map((s) => (
              <option key={s} value={s}>{s === 'all' ? 'All RFQ Statuses' : s}</option>
            ))}
          </select>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-100 text-slate-400 uppercase tracking-wider text-[10px]">
                <th className="pb-3 font-bold">RFQ ID & Date</th>
                <th className="pb-3 font-bold">Target Product</th>
                <th className="pb-3 font-bold text-center">Qty</th>
                <th className="pb-3 font-bold">Requester</th>
                <th className="pb-3 font-bold">Quoted Unit Price</th>
                <th className="pb-3 font-bold">Status</th>
                <th className="pb-3 font-bold text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {data.rows.length ? data.rows.map((q) => (
                <tr key={q.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-3.5">
                    <span className="font-mono font-bold text-slate-900">{q.id}</span>
                    <div className="text-[11px] text-slate-400 mt-0.5 flex items-center gap-1">
                      <Calendar className="w-3 h-3" /> {q.date}
                    </div>
                  </td>

                  <td className="py-3.5">
                    <div className="font-bold text-slate-900">{q.productName || q.pid}</div>
                    <div className="text-[11px] text-slate-400 mt-0.5">
                      SKU: <span className="font-mono">{q.sku || '—'}</span>
                    </div>
                    {q.techReq && (
                      <div className="text-[11px] text-slate-600 bg-slate-50 px-2 py-0.5 rounded mt-1 border border-slate-100 max-w-xs truncate">
                        Tech: {q.techReq}
                      </div>
                    )}
                  </td>

                  <td className="py-3.5 text-center font-bold text-slate-800">
                    {q.qty}
                  </td>

                  <td className="py-3.5">
                    <div className="font-bold text-slate-900">{q.requestedBy}</div>
                    <div className="text-[11px] text-slate-400 mt-0.5">{q.mobile || '—'}</div>
                  </td>

                  <td className="py-3.5">
                    {q.quotePrice != null ? (
                      <div>
                        <span className="font-mono font-bold text-emerald-600 text-sm">{fmt(q.quotePrice)}</span>
                        {q.adminNote && <div className="text-[10px] text-slate-500 mt-0.5 max-w-xs truncate">{q.adminNote}</div>}
                      </div>
                    ) : (
                      <span className="text-slate-400 italic">Pending quote</span>
                    )}
                  </td>

                  <td className="py-3.5">
                    {statusBadge(q.status)}
                  </td>

                  <td className="py-3.5 text-right">
                    <button 
                      type="button" 
                      onClick={() => openRespond(q)}
                      className="inline-flex items-center gap-1 px-3 py-1 text-xs font-bold text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors cursor-pointer"
                    >
                      <MessageSquare className="w-3.5 h-3.5" /> Respond
                    </button>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    No quotation requests found for this company.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <Pager total={data.total} page={data.page} limit={data.limit} onPage={setPage} />
      </div>

      {/* Response Modal */}
      {resp && (
        <Modal title={'Respond to RFQ — ' + resp.id} onClose={() => setResp(null)}>
          <div className="space-y-4 pt-1">
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 text-xs">
              <span className="text-slate-500 block">Requested Product & Specs</span>
              <span className="font-bold text-slate-900">{resp.productName || resp.pid} (Qty: {resp.qty})</span>
              {resp.techReq && <div className="text-slate-600 mt-1">Req: {resp.techReq}</div>}
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">Lifecycle Status</label>
              <select 
                value={rStatus} 
                onChange={(e) => setRStatus(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 focus:border-blue-500 rounded-xl outline-hidden"
              >
                {['Pending', 'Quoted', 'Accepted', 'Rejected', 'Cancelled'].map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">Quoted Unit Price (₹, Excl. GST)</label>
              <input 
                type="number" 
                value={rPrice} 
                onChange={(e) => setRPrice(e.target.value)}
                placeholder="e.g. 4850"
                className="w-full px-3.5 py-2 text-xs bg-slate-50 hover:bg-white focus:bg-white border border-slate-200 focus:border-blue-500 rounded-xl outline-hidden transition-all"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">Official Note for Requester</label>
              <input 
                type="text" 
                value={rNote} 
                onChange={(e) => setRNote(e.target.value)}
                placeholder="e.g. Imported from Germany, 3-week lead time, MOQ 2"
                className="w-full px-3.5 py-2 text-xs bg-slate-50 hover:bg-white focus:bg-white border border-slate-200 focus:border-blue-500 rounded-xl outline-hidden transition-all"
              />
            </div>

            {rErr && (
              <p className="text-xs text-red-600 font-semibold bg-red-50 p-2.5 rounded-lg border border-red-200">
                ⚠️ {rErr}
              </p>
            )}

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button 
                type="button" 
                onClick={() => setResp(null)}
                className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-600 font-bold text-xs rounded-xl transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button 
                type="button" 
                disabled={rBusy} 
                onClick={saveResponse}
                className="inline-flex items-center gap-1.5 px-5 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold text-xs rounded-xl transition-all shadow-sm cursor-pointer"
              >
                {rBusy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                {rBusy ? 'Saving…' : 'Submit Response'}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
