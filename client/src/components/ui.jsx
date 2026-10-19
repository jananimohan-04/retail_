/* Shared UI components with Framer Motion animations & Lucide icons */
import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, AlertTriangle, CheckCircle2, Info, ChevronLeft, 
  ChevronRight, ArrowRight, ShieldAlert, Sparkles 
} from 'lucide-react';

/* ---------- Toast Notification Bus ---------- */
let pushToast = () => {};

export function toast(msg, icon = 'ℹ️') {
  pushToast({ id: Date.now() + Math.random(), msg, icon });
}

export function ToastHost() {
  const [toasts, setToasts] = useState([]);

  useEffect(() => {
    pushToast = (t) => {
      setToasts((prev) => [...prev, t]);
      setTimeout(() => {
        setToasts((prev) => prev.filter((x) => x.id !== t.id));
      }, 3500);
    };
  }, []);

  return (
    <div className="fixed bottom-5 right-5 z-[300] flex flex-col gap-2.5 max-w-sm w-full pointer-events-none p-4">
      <AnimatePresence>
        {toasts.map((t) => (
          <motion.div
            key={t.id}
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, x: 40, scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 400, damping: 28 }}
            className="pointer-events-auto flex items-center gap-3 px-4 py-3 bg-slate-900/95 backdrop-blur-md text-white rounded-2xl shadow-xl border border-slate-700/60 text-xs font-semibold"
          >
            <span className="text-base flex-shrink-0">{t.icon}</span>
            <span className="flex-1 leading-snug">{t.msg}</span>
            <button
              onClick={() => setToasts((prev) => prev.filter((x) => x.id !== t.id))}
              className="text-slate-400 hover:text-white p-1 rounded-lg transition-colors cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}

/* ---------- Status Badges ---------- */
const STATUS_STYLES = {
  Pending: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200/80', dot: 'bg-amber-500' },
  Confirmed: { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200/80', dot: 'bg-blue-500' },
  Processing: { bg: 'bg-indigo-50', text: 'text-indigo-700', border: 'border-indigo-200/80', dot: 'bg-indigo-500' },
  'Ready for Dispatch': { bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200/80', dot: 'bg-purple-500' },
  Shipped: { bg: 'bg-cyan-50', text: 'text-cyan-700', border: 'border-cyan-200/80', dot: 'bg-cyan-500' },
  Delivered: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200/80', dot: 'bg-emerald-500' },
  Cancelled: { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200/80', dot: 'bg-red-500' },
  Quoted: { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200/80', dot: 'bg-blue-500' },
  Accepted: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200/80', dot: 'bg-emerald-500' },
  Rejected: { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200/80', dot: 'bg-red-500' },
  active: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200/80', dot: 'bg-emerald-500' },
  suspended: { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200/80', dot: 'bg-red-500' }
};

export function StatusBadge({ status }) {
  const conf = STATUS_STYLES[status] || {
    bg: 'bg-slate-100',
    text: 'text-slate-700',
    border: 'border-slate-200',
    dot: 'bg-slate-400'
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold border tracking-wide uppercase ${conf.bg} ${conf.text} ${conf.border}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${conf.dot} ${status === 'Pending' ? 'animate-pulse' : ''}`} />
      <span>{status}</span>
    </span>
  );
}

export function statusBadge(status) {
  return <StatusBadge status={status} />;
}

/* ---------- Modal Dialog ---------- */
export function Modal({ title, onClose, wide, children }) {
  return (
    <div className="modal-backdrop fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        className={`modal bg-white rounded-2xl shadow-2xl border border-slate-200/80 w-full overflow-hidden my-auto max-h-[90vh] flex flex-col ${
          wide ? 'max-w-4xl' : 'max-w-xl'
        }`}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
          <h3 className="font-extrabold text-slate-900 text-sm tracking-tight">{title}</h3>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="p-6 overflow-y-auto flex-1">{children}</div>
      </motion.div>
    </div>
  );
}

/* ---------- Tab Switcher ---------- */
export function Tabs({ tabs = [], active, onTab, onChange }) {
  const handler = onTab || onChange || (() => {});
  return (
    <div className="flex items-center gap-1.5 p-1 bg-slate-100/90 rounded-2xl w-fit border border-slate-200/80 mb-5 overflow-x-auto max-w-full">
      {tabs.map((t) => {
        const id = Array.isArray(t) ? t[0] : (typeof t === 'string' ? t : t.id);
        const label = Array.isArray(t) ? t[1] : (typeof t === 'string' ? t : (t.label || t.name));
        const isActive = active === id;
        return (
          <button
            key={id}
            type="button"
            onClick={() => handler(id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              isActive
                ? 'bg-white text-slate-900 shadow-xs border border-slate-200/60'
                : 'text-slate-500 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
          >
            <span>{label}</span>
          </button>
        );
      })}
    </div>
  );
}

/* ---------- Confirm Dialog ---------- */
export function Confirm({ title, body, okLabel = 'Confirm', danger = false, busy = false, onCancel, onOk }) {
  return (
    <Modal title={title} onClose={onCancel}>
      <div className="space-y-4">
        <div className="flex items-start gap-3">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${danger ? 'bg-red-50 text-red-600' : 'bg-blue-50 text-blue-600'}`}>
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div className="text-xs text-slate-600 leading-relaxed pt-1" dangerouslySetInnerHTML={{ __html: body }} />
        </div>
        <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-100">
          <button
            type="button"
            onClick={onCancel}
            disabled={busy}
            className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onOk}
            disabled={busy}
            className={`px-4 py-2 rounded-xl text-xs font-bold text-white transition-all shadow-sm cursor-pointer disabled:opacity-50 ${
              danger ? 'bg-red-600 hover:bg-red-700' : 'bg-blue-600 hover:bg-blue-700'
            }`}
          >
            {busy ? 'Processing…' : okLabel}
          </button>
        </div>
      </div>
    </Modal>
  );
}

/* ---------- Page Header ---------- */
export function PageHead({ title, eyebrow, desc, actions }) {
  return (
    <div className="flex items-start justify-between gap-4 flex-wrap pb-2 border-b border-slate-200/80 mb-3.5">
      <div>
        {eyebrow && <div className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400 mb-1">{eyebrow}</div>}
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">{title}</h1>
        {desc && <p className="text-xs text-slate-500 mt-1 max-w-2xl">{desc}</p>}
      </div>
      {actions && <div className="flex items-center gap-2.5 flex-wrap">{actions}</div>}
    </div>
  );
}

/* ---------- Empty State ---------- */
export function Empty({ icon = '📭', title = 'No records found', sub, action }) {
  return (
    <div className="py-16 px-4 text-center max-w-md mx-auto">
      <div className="text-4xl mb-3">{icon}</div>
      <h3 className="font-bold text-slate-900 text-sm mb-1">{title}</h3>
      {sub && <p className="text-xs text-slate-500 mb-4">{sub}</p>}
      {action}
    </div>
  );
}

/* ---------- Skeleton Loader ---------- */
export function Skeleton({ h = 200, count = 1 }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          style={{ height: h }}
          className="w-full bg-gradient-to-r from-slate-100 via-slate-200/60 to-slate-100 rounded-2xl animate-pulse"
        />
      ))}
    </div>
  );
}

/* ---------- Pagination Controls ---------- */
export function Pager({ total, page = 1, limit = 8, onPage }) {
  const pages = Math.max(1, Math.ceil(total / limit));
  if (pages <= 1) return null;

  return (
    <div className="flex items-center justify-between gap-4 pt-4 border-t border-slate-100 text-xs">
      <div className="text-slate-500">
        Showing <span className="font-bold text-slate-800 font-mono">{(page - 1) * limit + 1}</span>–
        <span className="font-bold text-slate-800 font-mono">{Math.min(page * limit, total)}</span> of{' '}
        <span className="font-bold text-slate-800 font-mono">{total}</span>
      </div>
      <div className="flex items-center gap-1.5">
        <button
          onClick={() => onPage(page - 1)}
          disabled={page <= 1}
          className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        <span className="px-3 font-semibold text-slate-700">
          Page {page} of {pages}
        </span>
        <button
          onClick={() => onPage(page + 1)}
          disabled={page >= pages}
          className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

/* ---------- Data Table ---------- */
export function DataTable({ cols, rows = [], rowKey = (r, i) => r.id || i, empty = 'No items found.' }) {
  if (!rows || !rows.length) {
    return <div className="text-center py-12 text-xs text-slate-400">{empty}</div>;
  }

  return (
    <div className="overflow-x-auto rounded-2xl border border-slate-200/80 bg-white shadow-2xs">
      <table className="w-full text-left text-xs">
        <thead className="bg-slate-50/80 border-b border-slate-200/80 text-[10px] uppercase font-bold text-slate-500 tracking-wider">
          <tr>
            {cols.map((c) => (
              <th key={c.key} className="px-4 py-3 font-bold">
                {c.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {rows.map((r, i) => (
            <tr key={rowKey(r, i)} className="hover:bg-slate-50/80 transition-colors">
              {cols.map((c) => (
                <td key={c.key} className="px-4 py-3 text-slate-700 align-middle">
                  {c.render ? c.render(r) : r[c.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/* ---------- Distribution Bars ---------- */
export function Bars({ items, color = '#2563EB' }) {
  if (!items || !items.length) {
    return <div className="text-center py-6 text-xs text-slate-400">Not enough data yet.</div>;
  }
  const mx = Math.max(...items.map((r) => r.value), 1);
  return (
    <div className="space-y-2">
      {items.map((r, i) => (
        <div key={i} className="grid grid-cols-[140px_1fr_48px] gap-3 items-center text-xs">
          <span className="truncate text-slate-600 font-medium" title={r.label}>
            {r.label}
          </span>
          <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${Math.max(3, (r.value / mx) * 100)}%`,
                backgroundColor: r.color || color
              }}
            />
          </div>
          <span className="text-right font-bold font-mono text-slate-800">{r.value}</span>
        </div>
      ))}
    </div>
  );
}

/* ---------- Form Field ---------- */
export function Field({ label, req, hint, full, children }) {
  return (
    <div className={`space-y-1.5 ${full ? 'sm:col-span-2' : ''}`}>
      {label && (
        <label className="text-xs font-bold text-slate-700 flex items-center gap-1">
          <span>{label}</span>
          {req && <span className="text-red-500">*</span>}
        </label>
      )}
      {children}
      {hint && <span className="text-[11px] text-slate-400 block">{hint}</span>}
    </div>
  );
}

/* ---------- KPI Metric Tile ---------- */
export function Kpi({ to, onClick, value, label, sub, grad, compact = false }) {
  const content = (
    <div
      onClick={onClick}
      style={{ background: grad || 'linear-gradient(135deg,#172554,#2563EB)' }}
      className={`rounded-xl text-white shadow-xs hover:shadow-md transition-all flex flex-col justify-between ${
        onClick ? 'cursor-pointer hover:scale-[1.015] active:scale-[0.98]' : ''
      } ${compact ? 'p-2 min-h-[58px]' : 'p-2.5 sm:p-3 min-h-[64px]'}`}
    >
      <div className="flex items-baseline justify-between gap-1">
        <div className="text-xl sm:text-2xl font-black font-mono tracking-tight leading-none">{value}</div>
      </div>
      <div className="mt-1 min-w-0">
        <div className="text-[11px] sm:text-xs font-bold opacity-90 truncate leading-tight">{label}</div>
        {sub && <div className="text-[9.5px] sm:text-[10px] opacity-75 mt-0.5 truncate leading-tight">{sub}</div>}
      </div>
    </div>
  );

  if (to) {
    return <a href={to} className="block transition-transform hover:-translate-y-0.5">{content}</a>;
  }
  return content;
}
