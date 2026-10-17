/* Company store settings — GET + PUT /api/settings. Mirrors legacy vSettings fields with modern Tailwind UI. */
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Settings as SettingsIcon, Save, Building2, Percent, 
  Hash, AlertTriangle, Megaphone, Loader2, CheckCircle2 
} from 'lucide-react';
import { api } from '../../api';
import { useAuth } from '../../auth';
import { Skeleton, toast } from '../../components/ui';

export default function Settings() {
  const { me } = useAuth();
  const [coName, setCoName] = useState('');
  const [f, setF] = useState(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  useEffect(() => {
    let on = true;
    api.get('/api/settings')
      .then((s) => {
        if (!on) return;
        setF({
          storeName: s.storeName || '', 
          warehouse: s.warehouse || 'WH-Pune-01',
          taxPct: s.taxPct != null ? s.taxPct : 18, 
          orderPrefix: s.orderPrefix || 'ORD-',
          quotePrefix: s.quotePrefix || 'Q-', 
          lowStockThreshold: s.lowStockThreshold != null ? s.lowStockThreshold : 10,
          announcement: s.announcement || 'GST invoice on all orders • Bulk pricing on request'
        });
      })
      .catch((e) => { if (on) setErr(e.message); });

    if (me && me.companyId) {
      api.get('/api/companies/' + me.companyId)
        .then((c) => { if (on && c) { setCoName(c.name || ''); } })
        .catch(() => {});
    }
    return () => { on = false; };
  }, [me && me.companyId]);

  if (err && !f) {
    return (
      <div className="bg-white rounded-2xl border border-red-200 p-8 text-center max-w-lg mx-auto">
        <p className="text-red-500 font-bold mb-1">Failed to load settings</p>
        <p className="text-xs text-slate-500">{err}</p>
      </div>
    );
  }

  if (!f) return <Skeleton h={320} />;

  const S = (k) => (e) => setF((p) => ({ ...p, [k]: e.target.value }));

  function publish() {
    setBusy(true);
    setErr('');
    api.put('/api/settings', {
      storeName: f.storeName || ((coName || (me && me.companyId) || '') + ' Industrial Store'),
      warehouse: f.warehouse || '', 
      taxPct: Number(f.taxPct || 0), 
      orderPrefix: f.orderPrefix || '',
      quotePrefix: f.quotePrefix || '', 
      lowStockThreshold: Number(f.lowStockThreshold || 0), 
      announcement: f.announcement || ''
    })
      .then(() => toast('Store settings updated and published', '⚙️'))
      .catch((e) => { setErr(e.message || 'Publish failed'); toast(e.message, '⚠️'); })
      .finally(() => setBusy(false));
  }

  const titlePrefix = coName || (me && me.companyId) || 'Company';

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <SettingsIcon className="w-6 h-6 text-blue-600" /> Storefront & Operational Settings
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Configured for <b className="text-slate-800">{titlePrefix}</b> commercial storefront
          </p>
        </div>
        <button 
          type="button" 
          disabled={busy} 
          onClick={publish}
          className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold text-xs rounded-xl transition-all shadow-sm cursor-pointer"
        >
          {busy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
          {busy ? 'Publishing…' : 'Publish Settings'}
        </button>
      </div>

      {/* Main Settings Card */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-6 sm:p-8 shadow-xs space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div className="space-y-1.5 sm:col-span-2">
            <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5 text-slate-400" /> Public Store Title
            </label>
            <input 
              type="text" 
              value={f.storeName} 
              onChange={S('storeName')} 
              placeholder={`${titlePrefix} Industrial Store`}
              className="w-full px-3.5 py-2.5 text-sm bg-slate-50 hover:bg-white focus:bg-white border border-slate-200 focus:border-blue-500 rounded-xl outline-hidden transition-all"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5 text-slate-400" /> Default Warehouse Node
            </label>
            <input 
              type="text" 
              value={f.warehouse} 
              onChange={S('warehouse')} 
              placeholder="WH-Pune-01"
              className="w-full px-3.5 py-2.5 text-sm bg-slate-50 hover:bg-white focus:bg-white border border-slate-200 focus:border-blue-500 rounded-xl outline-hidden transition-all"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
              <Percent className="w-3.5 h-3.5 text-slate-400" /> Standard GST Tax Rate (%)
            </label>
            <input 
              type="number" 
              value={f.taxPct} 
              onChange={S('taxPct')} 
              className="w-full px-3.5 py-2.5 text-sm bg-slate-50 hover:bg-white focus:bg-white border border-slate-200 focus:border-blue-500 rounded-xl outline-hidden transition-all"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
              <Hash className="w-3.5 h-3.5 text-slate-400" /> Order Number Prefix
            </label>
            <input 
              type="text" 
              value={f.orderPrefix} 
              onChange={S('orderPrefix')} 
              placeholder="ORD-"
              className="w-full px-3.5 py-2.5 text-sm bg-slate-50 hover:bg-white focus:bg-white border border-slate-200 focus:border-blue-500 rounded-xl outline-hidden transition-all font-mono"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
              <Hash className="w-3.5 h-3.5 text-slate-400" /> Quotation Prefix
            </label>
            <input 
              type="text" 
              value={f.quotePrefix} 
              onChange={S('quotePrefix')} 
              placeholder="Q-"
              className="w-full px-3.5 py-2.5 text-sm bg-slate-50 hover:bg-white focus:bg-white border border-slate-200 focus:border-blue-500 rounded-xl outline-hidden transition-all font-mono"
            />
          </div>

          <div className="space-y-1.5 sm:col-span-2">
            <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5 text-slate-400" /> Low-Stock Trigger Threshold
            </label>
            <input 
              type="number" 
              value={f.lowStockThreshold} 
              onChange={S('lowStockThreshold')} 
              className="w-full px-3.5 py-2.5 text-sm bg-slate-50 hover:bg-white focus:bg-white border border-slate-200 focus:border-blue-500 rounded-xl outline-hidden transition-all"
            />
            <span className="text-[11px] text-slate-400 block">
              Items with stock at or below this count will trigger automated warning badges on the dashboard.
            </span>
          </div>

          <div className="space-y-1.5 sm:col-span-2">
            <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
              <Megaphone className="w-3.5 h-3.5 text-slate-400" /> Storefront Announcement Banner
            </label>
            <input 
              type="text" 
              value={f.announcement} 
              onChange={S('announcement')} 
              placeholder="GST invoice on all orders • Bulk pricing on request"
              className="w-full px-3.5 py-2.5 text-sm bg-slate-50 hover:bg-white focus:bg-white border border-slate-200 focus:border-blue-500 rounded-xl outline-hidden transition-all"
            />
          </div>
        </div>

        {err && (
          <p className="text-xs text-red-600 font-semibold bg-red-50 p-3 rounded-xl border border-red-200">
            ⚠️ {err}
          </p>
        )}

        <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
          <span>Changes take effect immediately across all storefront sessions.</span>
          <button 
            type="button" 
            disabled={busy} 
            onClick={publish}
            className="font-bold text-blue-600 hover:underline"
          >
            Save changes
          </button>
        </div>
      </div>
    </div>
  );
}
