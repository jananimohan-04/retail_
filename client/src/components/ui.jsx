/* Shared UI primitives — class names defined in styles/components.css */
import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { fmt as fmtInr } from '../api';

export const fmt = fmtInr;

let toastPush = null;
export function toast(msg, icon = '✅') {
  if (toastPush) toastPush(msg, icon);
}
export function ToastHost() {
  const [items, setItems] = useState([]);
  useEffect(() => {
    toastPush = (msg, icon) => {
      const id = Date.now() + Math.random();
      setItems((p) => [...p, { id, msg, icon }]);
      setTimeout(() => {
        setItems((p) => p.map((t) => (t.id === id ? { ...t, out: true } : t)));
        setTimeout(() => setItems((p) => p.filter((t) => t.id !== id)), 300);
      }, 2600);
    };
    return () => { toastPush = null; };
  }, []);
  return createPortal(
    <div className="toast-wrap">{items.map((t) => (<div key={t.id} className={'toast' + (t.out ? ' out' : '')}><span>{t.icon}</span><span>{t.msg}</span></div>))}</div>,
    document.getElementById('toasts')
  );
}

const STATUS_CLASS = {
  Pending: 's-pending', Confirmed: 's-confirmed', Processing: 's-processing',
  'Ready for Dispatch': 's-ready', Shipped: 's-shipped', Delivered: 's-delivered',
  Cancelled: 's-cancelled', Quoted: 's-quoted', Accepted: 's-accepted', Rejected: 's-rejected'
};
export function statusBadge(s) {
  return <span className={'status ' + (STATUS_CLASS[s] || 's-pending')}>{s}</span>;
}

export function PageHead({ eyebrow, title, desc, actions }) {
  return (
    <div className="section-head">
      <div>{eyebrow && <p className="hint" style={{ margin: 0 }}>{eyebrow}</p>}
        <h2 style={eyebrow ? { fontSize: 22 } : undefined}>{title}</h2>
        {desc && <p className="hint" style={{ margin: '2px 0 0' }}>{desc}</p>}</div>
      {actions && <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>{actions}</div>}
    </div>
  );
}

export function Kpi({ to, onClick, value, label, sub, grad }) {
  const inner = (<><h3>{value}</h3><p>{label}</p><small>{sub}</small></>);
  if (to) return <a className="kpi" style={{ background: grad }} href={to}>{inner}</a>;
  if (onClick) return <button className="kpi" style={{ background: grad }} onClick={onClick}>{inner}</button>;
  return <div className="kpi" style={{ background: grad }}>{inner}</div>;
}

export function Empty({ icon = '📭', title = 'Nothing here', sub = '', action = null }) {
  return <div className="empty"><div className="big">{icon}</div><b>{title}</b>{sub && <p>{sub}</p>}{action}</div>;
}
export function Skeleton({ h = 180 }) {
  return <div className="card"><div className="card-pad"><div className="skel" style={{ minHeight: h }}></div><p className="hint">Loading live records…</p></div></div>;
}

export function Pager({ total, page, limit, onPage, live = true }) {
  const pages = Math.max(1, Math.ceil((total || 0) / (limit || 8)));
  return (
    <div className="pager">
      <span className="hint">{total || 0} record{(total || 0) === 1 ? '' : 's'} • page {page}/{pages}{live ? ' • live DB' : ''}</span>
      <button className="btn btn-ghost btn-sm" disabled={page <= 1} onClick={() => onPage(page - 1)}>← Prev</button>
      <button className="btn btn-ghost btn-sm" disabled={page >= pages} onClick={() => onPage(page + 1)}>Next →</button>
    </div>
  );
}

export function Field({ label, req, hint, error, children, full }) {
  return (
    <div className={'field' + (full ? ' full' : '')}>
      <label className={req ? 'req' : ''}>{label}</label>
      {children}
      {hint && <span className="hint">{hint}</span>}
      {error && <span className="ferr">{error}</span>}
    </div>
  );
}

export function Modal({ title, onClose, children, wide }) {
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    const fn = (e) => { if (e.key === 'Escape' && onClose) onClose(); };
    window.addEventListener('keydown', fn);
    return () => { document.body.style.overflow = ''; window.removeEventListener('keydown', fn); };
  }, [onClose]);
  return createPortal(
    <div className="modal-bg" onClick={(e) => { if (e.target === e.currentTarget && onClose) onClose(); }}>
      <div className={'modal' + (wide ? ' wide' : '')} role="dialog" aria-modal="true">
        <div className="modal-head"><span>{title}</span>{onClose && <button className="btn btn-ghost btn-sm" onClick={onClose}>✕</button>}</div>
        <div className="modal-body">{children}</div>
      </div>
    </div>,
    document.body
  );
}

export function Confirm({ title, body, okLabel = 'Confirm', danger, busy, onCancel, onOk }) {
  return (
    <Modal title={title} onClose={onCancel}>
      <p style={{ fontSize: 13.5, marginTop: 0 }} dangerouslySetInnerHTML={{ __html: body }}></p>
      <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 14 }}>
        <button className="btn btn-ghost btn-sm" onClick={onCancel}>Cancel</button>
        <button className={'btn btn-sm ' + (danger ? 'btn-danger' : 'btn-primary')} disabled={busy} onClick={onOk}>{busy ? 'Working…' : okLabel}</button>
      </div>
    </Modal>
  );
}

export function Tabs({ tabs, active, onTab }) {
  return (
    <div className="tabs">
      {tabs.map(([k, l]) => <button key={k} className={'tab' + (active === k ? ' active' : '')} onClick={() => onTab(k)}>{l}</button>)}
    </div>
  );
}

export function DataTable({ cols, rows, empty = 'No records match.', rowKey = (r, i) => i }) {
  if (!rows || !rows.length) return <div className="table-wrap"><table><tbody><tr><td><Empty title={empty} /></td></tr></tbody></table></div>;
  return (
    <div className="table-wrap">
      <table>
        <thead><tr>{cols.map((c) => <th key={c.key} className={c.num ? 'num' : ''}>{c.label}</th>)}</tr></thead>
        <tbody>{rows.map((r, i) => <tr key={rowKey(r, i)}>{cols.map((c) => <td key={c.key} className={c.num ? 'num' : ''}>{c.render ? c.render(r) : r[c.key]}</td>)}</tr>)}</tbody>
      </table>
    </div>
  );
}

export function Bars({ items, color = 'linear-gradient(135deg,#172554,#2563EB)' }) {
  if (!items || !items.length) return <div className="empty" style={{ padding: 18 }}>Not enough data yet.</div>;
  const mx = Math.max(...items.map((r) => r.value), 1);
  return (
    <div>{items.map((r, i) => (
      <div key={i} style={{ display: 'grid', gridTemplateColumns: '150px 1fr 44px', gap: 8, alignItems: 'center', padding: '4px 0', fontSize: 12 }}>
        <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{r.label}</span>
        <svg width="100%" height="12"><rect x="0" y="0" width={Math.max(2, (r.value / mx) * 100) + '%'} height="12" rx="3" fill={r.color || color} /></svg>
        <b style={{ textAlign: 'right' }}>{r.value}</b>
      </div>))}</div>
  );
}
