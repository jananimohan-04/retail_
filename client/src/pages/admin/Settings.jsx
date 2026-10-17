/* Company store settings — GET + PUT /api/settings. Mirrors legacy vSettings fields. */
import { useEffect, useState } from 'react';
import { api } from '../../api';
import { useAuth } from '../../auth';
import { PageHead, Field, Skeleton, toast } from '../../components/ui';

export default function Settings() {
  const { me } = useAuth();
  const [coName, setCoName] = useState('');
  const [f, setF] = useState(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  useEffect(() => {
    let on = true;
    api.get('/api/settings').then((s) => {
      if (!on) return;
      setF({
        storeName: s.storeName || '', warehouse: s.warehouse || 'WH-Pune-01',
        taxPct: s.taxPct != null ? s.taxPct : 18, orderPrefix: s.orderPrefix || 'ORD-',
        quotePrefix: s.quotePrefix || 'Q-', lowStockThreshold: s.lowStockThreshold != null ? s.lowStockThreshold : 10,
        announcement: s.announcement || 'GST invoice on all orders • Bulk pricing on request'
      });
    }).catch((e) => { if (on) setErr(e.message); });
    if (me && me.companyId) api.get('/api/companies/' + me.companyId).then((c) => { if (on && c) { setCoName(c.name || ''); } }).catch(() => {});
    return () => { on = false; };
  }, [me && me.companyId]); // eslint-disable-line react-hooks/exhaustive-deps

  if (err && !f) return <div className="empty">⚠️ {err}</div>;
  if (!f) return <Skeleton h={220} />;

  const S = (k) => (e) => setF((p) => ({ ...p, [k]: e.target.value }));

  function publish() {
    setBusy(true);
    setErr('');
    api.put('/api/settings', {
      storeName: f.storeName || ((coName || (me && me.companyId) || '') + ' Industrial Store'),
      warehouse: f.warehouse || '', taxPct: Number(f.taxPct || 0), orderPrefix: f.orderPrefix || '',
      quotePrefix: f.quotePrefix || '', lowStockThreshold: Number(f.lowStockThreshold || 0), announcement: f.announcement || ''
    })
      .then(() => toast('Settings published', '⚙️'))
      .catch((e) => { setErr(e.message || 'Publish failed'); toast(e.message, '⚠️'); })
      .finally(() => setBusy(false));
  }

  return (
    <>
      <PageHead
        title={'Store settings — ' + (coName || (me && me.companyId) || '')}
        actions={<button className="btn btn-primary btn-sm" disabled={busy} onClick={publish}>{busy ? 'Publishing…' : 'Publish'}</button>}
      />
      <div className="card"><div className="card-pad">
        <div className="form-grid">
          <Field label="Store name"><input value={f.storeName} onChange={S('storeName')} placeholder={(coName || 'Company') + ' Industrial Store'} /></Field>
          <Field label="Default warehouse"><input value={f.warehouse} onChange={S('warehouse')} /></Field>
          <Field label="Tax % (GST)"><input type="number" value={f.taxPct} onChange={S('taxPct')} /></Field>
          <Field label="Order prefix"><input value={f.orderPrefix} onChange={S('orderPrefix')} /></Field>
          <Field label="Quotation prefix"><input value={f.quotePrefix} onChange={S('quotePrefix')} /></Field>
          <Field label="Low-stock threshold"><input type="number" value={f.lowStockThreshold} onChange={S('lowStockThreshold')} /></Field>
          <Field full label="Storefront announcement"><input value={f.announcement} onChange={S('announcement')} /></Field>
        </div>
        {err && <p className="ferr" style={{ marginTop: 10 }}>⚠️ {err}</p>}
      </div></div>
    </>
  );
}
