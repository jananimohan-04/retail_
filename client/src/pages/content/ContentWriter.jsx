/* Content Writer workspace — products that arrived from ERP Inventory are written up
   here (copy, specs, images, PDFs, video, YouTube) and then handed to Finance.
   Nothing on this screen publishes anything to Sales: submission alone never sets visible. */
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { api, uploadFiles, imgFallback } from '../../api';
import { PageHero, PageHead, Empty, Skeleton, Pager, Field, Modal, Confirm, toast } from '../../components/ui';
import {
  ArrowLeft, CheckCircle2, CircleAlert, FileText, Film, ImageIcon,
  Loader2, MonitorPlay, Package, Plus, Save, Send, Trash2, Upload, PenLine
} from 'lucide-react';

/* ---------------------------------------------------------------- stage chips */
const STAGE_STYLE = {
  content_pending: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' },
  content_in_progress: { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' },
  submitted_to_finance: { bg: 'bg-violet-50', text: 'text-violet-700', border: 'border-violet-200' },
  finance_review: { bg: 'bg-indigo-50', text: 'text-indigo-700', border: 'border-indigo-200' },
  returned_for_correction: { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200' },
  pricing_saved: { bg: 'bg-cyan-50', text: 'text-cyan-700', border: 'border-cyan-200' },
  published: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' }
};

export function StageBadge({ stage, label }) {
  let displayLabel = label;
  let customStyle = STAGE_STYLE[stage];

  if (['submitted_to_finance', 'finance_review', 'pricing_saved'].includes(stage)) {
    displayLabel = 'Waiting for Finance';
    customStyle = { bg: 'bg-indigo-50', text: 'text-indigo-700', border: 'border-indigo-200' };
  } else if (stage === 'content_pending') {
    displayLabel = 'Needs Content';
    customStyle = { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' };
  } else if (stage === 'content_in_progress') {
    displayLabel = 'In Progress';
    customStyle = { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' };
  } else if (stage === 'published') {
    displayLabel = 'Published';
    customStyle = { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' };
  } else if (stage === 'returned_for_correction') {
    displayLabel = 'Needs Correction';
    customStyle = { bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200' };
  }

  const s = customStyle || STAGE_STYLE[stage] || { bg: 'bg-slate-100', text: 'text-slate-600', border: 'border-slate-200' };
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wide border whitespace-nowrap ${s.bg} ${s.text} ${s.border}`}>
      {displayLabel || String(stage || '—').replace(/_/g, ' ')}
    </span>
  );
}

/* youtube watch/shorts/embed url → video id (null when not a YouTube link) */
export const ytId = (u) => {
  const m = String(u || '').match(/(?:youtube\.com\/(?:watch\?v=|shorts\/|embed\/|live\/)|youtu\.be\/)([\w-]{5,})/i);
  return m ? m[1] : null;
};

const fmtDate = (s) => (s ? new Date(s).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : '—');

/* ---------------------------------------------------------------- entry point */
export default function ContentWriter() {
  const { id } = useParams();
  return id ? <ContentEditor id={id} /> : <ContentQueue />;
}

/* ---------------------------------------------------------------- queue */
const TABS = [
  { id: 'all', label: 'All Products', stages: 'all' },
  { id: 'needs_content', label: 'Needs Content', stages: 'content_pending,returned_for_correction' },
  { id: 'content_in_progress', label: 'In Progress', stages: 'content_in_progress' },
  { id: 'published', label: 'Published', stages: 'submitted_to_finance,finance_review,pricing_saved,published' }
];

function ContentQueue() {
  const [data, setData] = useState(null);
  const [tab, setTab] = useState('all');
  const [q, setQ] = useState('');
  const [page, setPage] = useState(1);
  const [busy, setBusy] = useState(true);

  const load = useCallback(() => {
    setBusy(true);
    const stages = (TABS.find((t) => t.id === tab) || TABS[0]).stages;
    const p = new URLSearchParams({ page: String(page), limit: '10', stage: stages });
    if (q.trim()) p.set('q', q.trim());
    return api.get('/api/workflow?' + p.toString())
      .then((d) => setData(d || { rows: [], total: 0, counts: {} }))
      .catch((e) => toast(e.message, '⚠️'))
      .finally(() => setBusy(false));
  }, [page, tab, q]);

  useEffect(() => {
    const t = setTimeout(load, 200);
    return () => clearTimeout(t);
  }, [load]);

  const counts = (data && data.counts) || {};
  const rows = (data && data.rows) || [];

  const tabCount = (t) => {
    if (t.id === 'all') return (data && data.total) || 0;
    if (t.id === 'needs_content') return (counts.content_pending || 0) + (counts.returned_for_correction || 0);
    if (t.id === 'content_in_progress') return counts.content_in_progress || 0;
    if (t.id === 'published') return (counts.submitted_to_finance || 0) + (counts.finance_review || 0) + (counts.pricing_saved || 0) + (counts.published || 0);
    return 0;
  };

  return (
    <>
      <PageHero
        icon={PenLine}
        title="Content Writer Workspace"
        subtitle="Prepare marketing copy, technical specifications, CAD sheets, and multimedia assets before submission to Finance review."
        badgeText="Publishing Step 1"
        badgeColor="fuchsia"
        gradient="from-fuchsia-600 via-pink-600 to-purple-600"
        actions={<Link className="px-3.5 py-2 rounded-xl text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors" to="/finance">Finance queue →</Link>}
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <StatTile value={(data && data.total) || 0} label="All Products" sub="Full catalog overview" tone="blue" />
        <StatTile value={(counts.content_pending || 0) + (counts.returned_for_correction || 0)} label="Needs Content" sub="New from ERP awaiting copy" tone="amber" />
        <StatTile value={counts.content_in_progress || 0} label="In Progress" sub="Drafts currently being edited" tone="blue" />
        <StatTile value={(counts.submitted_to_finance || 0) + (counts.finance_review || 0) + (counts.pricing_saved || 0) + (counts.published || 0)} label="Published" sub={`${counts.published || 0} live · ${(counts.submitted_to_finance || 0) + (counts.finance_review || 0) + (counts.pricing_saved || 0)} waiting finance`} tone="emerald" />
      </div>

      <div className="flex items-center gap-3 flex-wrap mb-4">
        <div className="flex items-center gap-1.5 p-1 bg-slate-100/90 rounded-2xl border border-slate-200/80 overflow-x-auto max-w-full">
          {TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => { setTab(t.id); setPage(1); }}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer flex items-center gap-2 ${
                tab === t.id ? 'bg-white text-slate-900 shadow-xs border border-slate-200/60' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
            >
              <span>{t.label}</span>
              <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-mono ${tab === t.id ? 'bg-slate-100 text-slate-800' : 'bg-slate-200/70 text-slate-600'}`}>
                {tabCount(t)}
              </span>
            </button>
          ))}
        </div>
        <input
          value={q}
          onChange={(e) => { setQ(e.target.value); setPage(1); }}
          placeholder="Search name, SKU, brand…"
          className="flex-1 min-w-[200px] max-w-sm"
        />
      </div>

      {busy && !data ? (
        <Skeleton h={72} count={4} />
      ) : rows.length === 0 ? (
        <div className="rounded-2xl border border-slate-200/80 bg-white">
          <Empty
            icon="📦"
            title="Nothing in this queue"
            sub={tab === 'mine'
              ? 'New products appear here the moment the ERP assigns them to the Retail Store warehouse.'
              : 'No products currently match this stage.'}
          />
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-slate-200/80 bg-white shadow-2xs">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 border-b border-slate-200/80 text-[10px] uppercase font-bold text-slate-500 tracking-wider">
              <tr>
                <th className="px-4 py-3">Product</th>
                <th className="px-4 py-3">Category</th>
                <th className="px-4 py-3">Stock</th>
                <th className="px-4 py-3">Stage</th>
                <th className="px-4 py-3">Media</th>
                <th className="px-4 py-3">Content</th>
                <th className="px-4 py-3">Updated</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rows.map((p) => (
                <tr key={p.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="px-4 py-3 max-w-[280px]">
                    <div className="flex items-center gap-2.5">
                      <div className="w-10 h-10 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center flex-shrink-0 text-slate-400 overflow-hidden relative">
                        <Package className="w-5 h-5 text-slate-400" />
                        {(p.images || [])[0] && (
                          <img
                            src={p.images[0]}
                            alt=""
                            onError={(e) => { e.currentTarget.style.display = 'none'; }}
                            className="absolute inset-0 w-full h-full object-cover"
                          />
                        )}
                      </div>
                      <div className="min-w-0">
                        <div className="font-bold text-slate-900 truncate">{p.name}</div>
                        <div className="text-[11px] text-slate-500 font-mono truncate">{p.sku || p.id}{p.brand ? ' · ' + p.brand : ''}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-slate-600">{p.categoryName || p.category || '—'}</td>
                  <td className="px-4 py-3 font-mono font-bold text-slate-800">{p.stock ?? '—'}</td>
                  <td className="px-4 py-3"><StageBadge stage={p.workflow_stage} label={p.stageLabel} /></td>
                  <td className="px-4 py-3 text-slate-600 whitespace-nowrap">
                    {p.erp_synced && <span className="mr-1.5 text-[10px] font-extrabold uppercase text-slate-400 border border-slate-200 rounded px-1.5 py-0.5">ERP</span>}
                    {(p.mediaStats?.images || 0)} img · {(p.mediaStats?.documents || 0)} pdf · {(p.mediaStats?.youtube || 0)} yt
                  </td>
                  <td className="px-4 py-3">
                    {p.contentReady
                      ? <span className="inline-flex items-center gap-1 text-emerald-700 font-bold"><CheckCircle2 className="w-3.5 h-3.5" /> Ready</span>
                      : <span className="inline-flex items-center gap-1 text-amber-700 font-bold"><CircleAlert className="w-3.5 h-3.5" /> Incomplete</span>}
                  </td>
                  <td className="px-4 py-3 text-slate-500 whitespace-nowrap">{fmtDate(p.workflow_updated_at)}</td>
                  <td className="px-4 py-3 text-right">
                    <Link className="btn btn-ghost btn-sm" to={'/content/' + p.id}>
                      {p.workflow_stage === 'returned_for_correction' ? 'Fix & resubmit' : 'Open'}
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="px-4 pb-3"><Pager total={data.total} page={data.page} limit={data.limit} onPage={setPage} /></div>
        </div>
      )}
    </>
  );
}

function StatTile({ value, label, sub, tone }) {
  const tones = {
    amber: 'from-amber-500 to-orange-500',
    red: 'from-rose-500 to-red-500',
    blue: 'from-blue-500 to-indigo-500',
    emerald: 'from-emerald-500 to-teal-500'
  };
  return (
    <div className={`rounded-2xl p-4 text-white bg-gradient-to-br ${tones[tone] || tones.blue} shadow-xs min-h-[92px] flex flex-col justify-between`}>
      <div className="text-2xl font-black font-mono tracking-tight">{value}</div>
      <div>
        <div className="text-xs font-bold opacity-95">{label}</div>
        {sub && <div className="text-[10px] opacity-80 mt-0.5">{sub}</div>}
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------- editor */
function ContentEditor({ id }) {
  const nav = useNavigate();
  const [p, setP] = useState(null);
  const [err, setErr] = useState('');
  const [saving, setSaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [short, setShort] = useState('');
  const [desc, setDesc] = useState('');
  const [specs, setSpecs] = useState([]);
  const [staged, setStaged] = useState([]);   // { key, file, url, kind, title, alt, status, error }
  const [ytOpen, setYtOpen] = useState(false);
  const [ytUrl, setYtUrl] = useState('');
  const [ytTitle, setYtTitle] = useState('');
  const [preview, setPreview] = useState(false);
  const [confirmSubmit, setConfirmSubmit] = useState(false);

  const load = useCallback(() => {
    api.get('/api/workflow/' + id)
      .then((d) => {
        setP(d);
        setShort(d.short || '');
        setDesc(d.desc || '');
        const sp = d.specs && typeof d.specs === 'object' ? Object.entries(d.specs) : [];
        setSpecs(sp.length ? sp.map(([k, v]) => ({ k, v })) : [{ k: '', v: '' }]);
      })
      .catch((e) => setErr(e.message));
  }, [id]);

  useEffect(() => { load(); }, [load]);

  const media = useMemo(() => (p && Array.isArray(p.media) ? p.media : []), [p]);
  const images = media.filter((m) => m.type === 'image');
  const docs = media.filter((m) => m.type === 'document');
  const videos = media.filter((m) => m.type === 'video');
  const yts = media.filter((m) => m.type === 'youtube');
  const perm = (p && p.permissions) || {};

  /* ---- local file staging (uploaded on save, not before) ---- */
  function stageFiles(fileList) {
    const next = [];
    for (const f of Array.from(fileList || [])) {
      const isImg = /^image\//.test(f.type);
      const isVid = /^video\//.test(f.type);
      const isPdf = f.type === 'application/pdf';
      if (!isImg && !isVid && !isPdf) { toast(`${f.name}: only images, videos and PDFs can be uploaded`, '⚠️'); continue; }
      if (f.size > 50 * 1024 * 1024) { toast(`${f.name}: file must be under 50 MB`, '⚠️'); continue; }
      next.push({
        key: f.name + '-' + f.size + '-' + Math.random().toString(36).slice(2, 7),
        file: f,
        url: URL.createObjectURL(f),
        kind: isPdf ? 'document' : (isVid ? 'video' : 'image'),
        title: isPdf ? f.name.replace(/\.pdf$/i, '') : '',
        alt: '',
        status: 'ready'
      });
    }
    setStaged((s) => [...s, ...next]);
  }

  function dropStaged(key) {
    setStaged((s) => {
      const hit = s.find((x) => x.key === key);
      if (hit && hit.url.startsWith('blob:')) URL.revokeObjectURL(hit.url);
      return s.filter((x) => x.key !== key);
    });
  }

  /* ---- persist content + any staged uploads ---- */
  async function save({ silent } = {}) {
    setSaving(true);
    try {
      /* 1. copy + specs */
      const specObj = {};
      specs.forEach(({ k, v }) => { const key = String(k || '').trim(); if (key) specObj[key] = String(v || ''); });
      await api.put('/api/workflow/' + id + '/content', { short, desc, specs: specObj });

      /* 2. upload staged files, then register their metadata */
      const fresh = staged.filter((s) => s.status === 'ready' && s.file);
      if (fresh.length) {
        const urls = await uploadFiles(fresh.map((s) => s.file));
        for (let i = 0; i < fresh.length; i++) {
          setStaged((s) => s.map((x) => (x.key === fresh[i].key ? { ...x, status: 'uploading' } : x)));
          await api.post('/api/media', {
            productId: id,
            type: fresh[i].kind,
            url: urls[i],
            title: fresh[i].title || '',
            alt: fresh[i].alt || ''
          });
          setStaged((s) => s.map((x) => (x.key === fresh[i].key ? { ...x, status: 'done' } : x)));
        }
        setStaged((s) => s.filter((x) => x.status !== 'done'));
        if (!silent) toast('Media uploaded', '📎');
      }
      load();
      if (!silent) toast('Draft saved (moved to In Progress)', '💾');
    } catch (e) {
      setStaged((s) => s.map((x) => (x.status === 'uploading' ? { ...x, status: 'ready', error: e.message } : x)));
      toast(e.message, '⚠️');
    } finally { setSaving(false); }
  }

  async function addYoutube() {
    const u = ytUrl.trim();
    if (!ytId(u)) return toast('Enter a valid YouTube link (youtube.com/watch?v=… or youtu.be/…)', '⚠️');
    try {
      await api.post('/api/media', { productId: id, type: 'youtube', url: u, title: ytTitle.trim() });
      setYtUrl(''); setYtTitle(''); setYtOpen(false);
      toast('YouTube video attached', '▶️');
      load();
    } catch (e) { toast(e.message, '⚠️'); }
  }

  async function removeMedia(m) {
    try { await api.del('/api/media/' + m.id); toast('Media removed', '🗑'); load(); }
    catch (e) { toast(e.message, '⚠️'); }
  }

  async function submitToFinance() {
    setSubmitting(true);
    try {
      await save({ silent: true });
      await api.post('/api/workflow/' + id + '/submit', { note: '' });
      toast('Sent to Accounts / Finance team!', '📤');
      nav('/content');
    } catch (e) { toast(e.message, '⚠️'); }
    finally { setSubmitting(false); setConfirmSubmit(false); }
  }

  if (err) return <Empty icon="⚠️" title="Could not load product" sub={err} action={<Link className="btn btn-ghost btn-sm" to="/content">← Back to queue</Link>} />;
  if (!p) return <Skeleton h={90} count={5} />;

  const canSave = perm.canEditContent || perm.canStartContent;
  const stagedReady = staged.filter((s) => s.status === 'ready').length;

  return (
    <>
      <PageHead
        eyebrow={`Content Writer · ${p.categoryName || p.category || 'Uncategorised'}`}
        title={p.name}
        desc={`${p.sku || p.id}${p.brand ? ' · ' + p.brand : ''}${p.mpn ? ' · MPN ' + p.mpn : ''} · ${p.uom || 'Unit'} · Received from ${p.erp_synced ? 'ERP Inventory' : 'catalog'}`}
        actions={
          <>
            <Link className="btn btn-ghost btn-sm" to="/content"><ArrowLeft className="w-3.5 h-3.5" /> Queue</Link>
            <button className="btn btn-ghost btn-sm" type="button" onClick={() => setPreview(true)}>👁 Preview listing</button>
            {canSave && (
              <button className="btn btn-ghost btn-sm border border-slate-200" type="button" disabled={saving || submitting} onClick={() => save()}>
                {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                {saving ? 'Saving…' : 'Save draft'}
              </button>
            )}
            {canSave && (
              <button
                className="btn btn-primary btn-sm bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs"
                type="button"
                disabled={submitting || saving}
                onClick={() => setConfirmSubmit(true)}
              >
                {submitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                Send to Accounts / Finance
              </button>
            )}
          </>
        }
      />

      {/* status strip */}
      <div className="rounded-2xl border border-slate-200/80 bg-white p-4 mb-5 flex items-center gap-3 flex-wrap">
        <StageBadge stage={p.workflow_stage} label={p.stageLabel} />
        <span className="text-xs text-slate-500">Last updated {fmtDate(p.workflow_updated_at)}</span>
        {p.workflow_stage === 'returned_for_correction' && p.return_comment && (
          <div className="w-full mt-1 rounded-xl bg-red-50 border border-red-200 p-3 text-xs text-red-800">
            <b className="font-extrabold">Finance asked for a correction ({p.returned_by || 'Finance'}):</b> {p.return_comment}
          </div>
        )}
        {canSave && (
          <button
            className="btn btn-primary btn-sm ml-auto bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs"
            type="button"
            disabled={submitting || saving}
            onClick={() => setConfirmSubmit(true)}
          >
            <Send className="w-3.5 h-3.5" /> Send to Accounts / Finance
          </button>
        )}
      </div>

      <div className="grid lg:grid-cols-3 gap-5 items-start">
        {/* ------- main column ------- */}
        <div className="lg:col-span-2 space-y-5">
          <section className="rounded-2xl border border-slate-200/80 bg-white p-5">
            <h3 className="font-extrabold text-slate-900 text-sm mb-1">Sales copy</h3>
            <p className="text-[11px] text-slate-500 mb-4">Written by you — ERP updates can never overwrite this.</p>
            <div className="space-y-4">
              <Field label="Short description" hint="One line shown in listings. Max 400 characters.">
                <input value={short} maxLength={400} disabled={!canSave} onChange={(e) => setShort(e.target.value)} placeholder="e.g. O10mm 4-flute solid carbide end mill, AlCrN coated" />
              </Field>
              <Field label="Sales description" req hint="Shown on the product page. Plain text — no HTML.">
                <textarea rows={7} value={desc} disabled={!canSave} onChange={(e) => setDesc(e.target.value)} placeholder="Describe what the product does, who it is for, what is included and why it is worth the price…" />
              </Field>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-slate-700">Technical specifications <span className="text-red-500">*</span></span>
                  {canSave && (
                    <button className="btn btn-ghost btn-sm" type="button" onClick={() => setSpecs((s) => [...s, { k: '', v: '' }])}>
                      <Plus className="w-3.5 h-3.5" /> Add row
                    </button>
                  )}
                </div>
                <div className="space-y-2">
                  {specs.map((row, i) => (
                    <div key={i} className="flex gap-2">
                      <input className="flex-1" value={row.k} disabled={!canSave} placeholder="Specification" onChange={(e) => setSpecs((s) => s.map((r, j) => (j === i ? { ...r, k: e.target.value } : r)))} />
                      <input className="flex-[1.4]" value={row.v} disabled={!canSave} placeholder="Value" onChange={(e) => setSpecs((s) => s.map((r, j) => (j === i ? { ...r, v: e.target.value } : r)))} />
                      {canSave && (
                        <button className="btn btn-ghost btn-sm px-2" type="button" title="Remove" onClick={() => setSpecs((s) => s.filter((_, j) => j !== i))}>
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>

          {/* ------- media ------- */}
          <section className="rounded-2xl border border-slate-200/80 bg-white p-5">
            <div className="flex items-center justify-between mb-1">
              <h3 className="font-extrabold text-slate-900 text-sm">Media</h3>
              {canSave && (
                <div className="flex items-center gap-2">
                  <label className="btn btn-ghost btn-sm cursor-pointer">
                    <Upload className="w-3.5 h-3.5" /> Upload files
                    <input type="file" multiple accept="image/*,application/pdf,video/*" className="hidden" onChange={(e) => { stageFiles(e.target.files); e.target.value = ''; }} />
                  </label>
                  <button className="btn btn-ghost btn-sm" type="button" onClick={() => setYtOpen(true)}><MonitorPlay className="w-3.5 h-3.5" /> Add YouTube</button>
                </div>
              )}
            </div>
            <p className="text-[11px] text-slate-500 mb-4">Images, PDF brochures/spec sheets and videos. Files go to secure object storage — only the reference is saved.</p>

            <div className="space-y-4">
              <MediaGroup title={`Images (${images.length})`} icon={ImageIcon}>
                {images.map((m) => (
                  <figure key={m.id} className="relative group w-28">
                    <img src={m.url} alt={m.alt || m.title || ''} className="w-28 h-28 rounded-xl object-cover border border-slate-200" />
                    {m.primary && <span className="absolute top-1 left-1 text-[9px] font-extrabold uppercase bg-blue-600 text-white rounded px-1.5 py-0.5">Primary</span>}
                    {canSave && (
                      <button type="button" onClick={() => removeMedia(m)} className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity bg-white/95 rounded-lg p-1 text-red-600 hover:bg-red-50 cursor-pointer">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                    <figcaption className="text-[10px] text-slate-500 mt-1 truncate" title={m.alt || ''}>{m.alt || 'No description'}</figcaption>
                  </figure>
                ))}
                {staged.filter((s) => s.kind === 'image').map((s) => <StagedTile key={s.key} s={s} onDrop={dropStaged} />)}
                {!images.length && !staged.some((s) => s.kind === 'image') && <p className="text-xs text-slate-400">No images yet.</p>}
              </MediaGroup>

              <MediaGroup title={`Documents (${docs.length})`} icon={FileText}>
                {docs.map((m) => (
                  <div key={m.id} className="flex items-center gap-2 rounded-xl border border-slate-200 p-2.5 pr-3 w-full">
                    <FileText className="w-4 h-4 text-red-500 flex-shrink-0" />
                    <div className="min-w-0 flex-1">
                      <div className="text-xs font-bold text-slate-900 truncate">{m.title || 'Document'}</div>
                      <a href={m.url} target="_blank" rel="noreferrer" className="text-[11px] text-blue-600 hover:underline truncate block">Open / download</a>
                    </div>
                    {canSave && <button type="button" onClick={() => removeMedia(m)} className="text-slate-400 hover:text-red-600 cursor-pointer"><Trash2 className="w-3.5 h-3.5" /></button>}
                  </div>
                ))}
                {staged.filter((s) => s.kind === 'document').map((s) => <StagedTile key={s.key} s={s} onDrop={dropStaged} wide />)}
                {!docs.length && !staged.some((s) => s.kind === 'document') && <p className="text-xs text-slate-400">No brochures or spec sheets yet.</p>}
              </MediaGroup>

              <MediaGroup title={`Videos (${videos.length})`} icon={Film}>
                {videos.map((m) => (
                  <div key={m.id} className="flex items-center gap-2 rounded-xl border border-slate-200 p-2.5 pr-3 w-full">
                    <Film className="w-4 h-4 text-slate-500 flex-shrink-0" />
                    <div className="min-w-0 flex-1">
                      <div className="text-xs font-bold text-slate-900 truncate">{m.title || 'Video'}</div>
                      <a href={m.url} target="_blank" rel="noreferrer" className="text-[11px] text-blue-600 hover:underline truncate block">Open video</a>
                    </div>
                    {canSave && <button type="button" onClick={() => removeMedia(m)} className="text-slate-400 hover:text-red-600 cursor-pointer"><Trash2 className="w-3.5 h-3.5" /></button>}
                  </div>
                ))}
                {staged.filter((s) => s.kind === 'video').map((s) => <StagedTile key={s.key} s={s} onDrop={dropStaged} wide />)}
                {!videos.length && !staged.some((s) => s.kind === 'video') && <p className="text-xs text-slate-400">No uploaded videos yet.</p>}
              </MediaGroup>

              <MediaGroup title={`YouTube (${yts.length})`} icon={MonitorPlay}>
                {yts.map((m) => (
                  <div key={m.id} className="relative group w-40">
                    <img src={ytId(m.url) ? `https://img.youtube.com/vi/${ytId(m.url)}/hqdefault.jpg` : imgFallback(m.id, 320, 180)} alt={m.title || ''} className="w-40 h-24 rounded-xl object-cover border border-slate-200" />
                    <span className="absolute bottom-1 right-1 text-[9px] font-extrabold uppercase bg-red-600 text-white rounded px-1.5 py-0.5">▶ YouTube</span>
                    {canSave && (
                      <button type="button" onClick={() => removeMedia(m)} className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity bg-white/95 rounded-lg p-1 text-red-600 hover:bg-red-50 cursor-pointer">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                    <div className="text-[10px] text-slate-500 mt-1 truncate">{m.title || 'Untitled video'}</div>
                  </div>
                ))}
                {!yts.length && <p className="text-xs text-slate-400">No YouTube links yet.</p>}
              </MediaGroup>
            </div>

            {stagedReady > 0 && (
              <div className="mt-4 flex items-center justify-between rounded-xl bg-amber-50 border border-amber-200 px-3.5 py-2.5">
                <span className="text-xs text-amber-800 font-semibold">{stagedReady} file(s) ready to upload.</span>
                <button className="btn btn-primary btn-sm" type="button" disabled={saving} onClick={() => save()}>
                  {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />} Upload now
                </button>
              </div>
            )}
          </section>
        </div>

        {/* ------- side column: ERP facts + history ------- */}
        <div className="space-y-5">
          <section className="rounded-2xl border border-slate-200/80 bg-white p-5">
            <h3 className="font-extrabold text-slate-900 text-sm mb-3">From ERP Inventory</h3>
            <dl className="space-y-2 text-xs">
              <Fact k="SKU" v={p.sku || p.id} mono />
              <Fact k="Brand" v={p.brand || '—'} />
              <Fact k="MPN" v={p.mpn || '—'} mono />
              <Fact k="Category" v={p.categoryName || p.category || '—'} />
              <Fact k="Unit" v={p.uom || '—'} />
              <Fact k="MOQ" v={p.moq ?? '—'} mono />
              <Fact k="Lead time" v={p.leadTime || '—'} />
              <Fact k="Warehouse" v={p.warehouse || '—'} mono />
              <Fact k="Stock on hand" v={p.stock ?? '—'} mono strong />
              {p.erp_item_id && <Fact k="ERP product ID" v={p.erp_item_id} mono />}
              {p.erp_last_synced_at && <Fact k="ERP last sync" v={fmtDate(p.erp_last_synced_at)} />}
            </dl>
          </section>

          <section className="rounded-2xl border border-slate-200/80 bg-white p-5">
            <h3 className="font-extrabold text-slate-900 text-sm mb-3">Status history</h3>
            {(!p.workflow_history || !p.workflow_history.length)
              ? <p className="text-xs text-slate-400">No recorded actions yet.</p>
              : (
                <ol className="space-y-3">
                  {p.workflow_history.map((h) => (
                    <li key={h.id} className="text-xs border-l-2 border-slate-200 pl-3">
                      <div className="font-bold text-slate-800">{h.stage || String(h.to || '').replace(/_/g, ' ')}</div>
                      <div className="text-slate-500">{h.by || 'system'} · {fmtDate(h.ts)}</div>
                      {h.note && <div className="text-slate-600 mt-0.5">“{h.note}”</div>}
                    </li>
                  ))}
                </ol>
              )}
          </section>
        </div>
      </div>

      {/* ---- modals ---- */}
      {ytOpen && (
        <Modal title="▶ Add YouTube video" onClose={() => setYtOpen(false)}>
          <Field label="YouTube link" req hint="youtube.com/watch?v=… , youtu.be/… or a Shorts link.">
            <input value={ytUrl} onChange={(e) => setYtUrl(e.target.value)} placeholder="https://www.youtube.com/watch?v=…" />
          </Field>
          <Field label="Video title">
            <input value={ytTitle} onChange={(e) => setYtTitle(e.target.value)} placeholder="e.g. Machining demo — 10mm end mill" />
          </Field>
          {ytId(ytUrl) && (
            <img src={`https://img.youtube.com/vi/${ytId(ytUrl)}/hqdefault.jpg`} alt="preview" className="mt-3 w-full max-w-xs rounded-xl border border-slate-200" />
          )}
          <div className="flex gap-2 justify-end mt-5">
            <button className="btn btn-ghost btn-sm" type="button" onClick={() => setYtOpen(false)}>Cancel</button>
            <button className="btn btn-primary btn-sm" type="button" onClick={addYoutube}>Attach video</button>
          </div>
        </Modal>
      )}

      {preview && <ListingPreview p={{ ...p, short, desc, specs: Object.fromEntries(specs.filter((r) => r.k.trim()).map((r) => [r.k, r.v])) }} images={images} docs={docs} videos={videos} yts={yts} staged={staged} onClose={() => setPreview(false)} />}

      {confirmSubmit && (
        <Confirm
          title="Send to Accounts / Finance?"
          body={`<b>${p.name}</b> will be sent to the Finance & Accounts team for pricing and approval. It will remain hidden from the storefront until approved.`}
          okLabel="Send to Accounts / Finance"
          busy={submitting}
          onCancel={() => setConfirmSubmit(false)}
          onOk={submitToFinance}
        />
      )}
    </>
  );
}

/* ---------------------------------------------------------------- small pieces */
function Fact({ k, v, mono, strong }) {
  return (
    <div className="flex items-start justify-between gap-3">
      <dt className="text-slate-500 flex-shrink-0">{k}</dt>
      <dd className={`text-right ${mono ? 'font-mono' : ''} ${strong ? 'font-extrabold text-slate-900' : 'font-semibold text-slate-800'} break-all`}>{v}</dd>
    </div>
  );
}

function MediaGroup({ title, icon: Icon, children }) {
  return (
    <div>
      <div className="flex items-center gap-1.5 mb-2 text-[11px] font-extrabold uppercase tracking-wide text-slate-500">
        <Icon className="w-3.5 h-3.5" /> {title}
      </div>
      <div className="flex flex-wrap gap-3">{children}</div>
    </div>
  );
}

function StagedTile({ s, onDrop, wide }) {
  const uploading = s.status === 'uploading';
  return (
    <div className={`relative rounded-xl border-2 border-dashed border-amber-300 bg-amber-50/50 p-2 ${wide ? 'w-full' : 'w-28'}`}>
      <button type="button" onClick={() => onDrop(s.key)} className="absolute top-1 right-1 bg-white/95 rounded-lg p-0.5 text-slate-500 hover:text-red-600 cursor-pointer" title="Remove">
        <Trash2 className="w-3 h-3" />
      </button>
      {s.kind === 'image' && <img src={s.url} alt="" className="w-full h-24 rounded-lg object-cover" />}
      <div className="text-[10px] text-slate-600 truncate mt-1" title={s.file && s.file.name}>{s.file ? s.file.name : 'file'}{uploading && ' · uploading…'}</div>
      {s.kind === 'document' && (
        <input className="mt-1 text-[10px]" value={s.title} placeholder="Document title" onChange={() => {}} readOnly />
      )}
    </div>
  );
}

/* ---------------------------------------------------------------- listing preview */
function ListingPreview({ p, images, docs, videos, yts, staged, onClose }) {
  const stagedImgs = staged.filter((s) => s.kind === 'image');
  const allImgs = [...images.map((i) => i.url), ...stagedImgs.map((s) => s.url)];
  const specs = Object.entries(p.specs || {}).filter(([k]) => k.trim());
  const ytsAll = [...yts, ...staged.filter((s) => s.kind === 'youtube')];
  return (
    <Modal wide title="👁 Listing preview — exactly what a Salesperson will see" onClose={onClose}>
      <div className="grid md:grid-cols-2 gap-6">
        <div>
          {allImgs.length
            ? <img src={allImgs[0]} alt={p.alt || p.name} className="w-full aspect-[4/3] object-cover rounded-2xl border border-slate-200" />
            : <div className="w-full aspect-[4/3] rounded-2xl border-2 border-dashed border-slate-200 flex items-center justify-center text-slate-400 text-xs">No image yet</div>}
          {allImgs.length > 1 && (
            <div className="flex gap-2 mt-2 overflow-x-auto">
              {allImgs.slice(1).map((u, i) => <img key={i} src={u} alt="" className="w-16 h-16 rounded-lg object-cover border border-slate-200 flex-shrink-0" />)}
            </div>
          )}
          {ytsAll.filter((y) => ytId(y.url)).slice(0, 1).map((y) => (
            <iframe key={y.id || y.url} className="mt-3 w-full aspect-video rounded-2xl border border-slate-200" src={`https://www.youtube.com/embed/${ytId(y.url)}`} title={y.title || 'Product video'} allowFullScreen />
          ))}
        </div>
        <div>
          <h2 className="text-xl font-black text-slate-900 tracking-tight">{p.name}</h2>
          {p.short && <p className="text-sm text-slate-600 mt-1">{p.short}</p>}
          <div className="text-2xl font-black text-slate-900 mt-3">On request</div>
          <div className="text-[11px] text-slate-500">Price is set by Finance after approval.</div>

          {specs.length > 0 && (
            <table className="w-full text-xs mt-4 border border-slate-200 rounded-xl overflow-hidden">
              <tbody className="divide-y divide-slate-100">
                {specs.map(([k, v]) => (
                  <tr key={k}><td className="px-3 py-2 bg-slate-50 font-bold text-slate-700 w-1/2">{k}</td><td className="px-3 py-2 text-slate-800 font-mono">{v}</td></tr>
                ))}
              </tbody>
            </table>
          )}

          <div className="mt-4 text-xs text-slate-700 whitespace-pre-wrap leading-relaxed">{p.desc || 'No description written yet.'}</div>

          {(docs.length > 0 || staged.some((s) => s.kind === 'document')) && (
            <div className="mt-4">
              <div className="text-[11px] font-extrabold uppercase tracking-wide text-slate-500 mb-1">Documents</div>
              <ul className="space-y-1">
                {docs.map((d) => <li key={d.id} className="text-xs"><a className="text-blue-600 hover:underline" href={d.url} target="_blank" rel="noreferrer">📄 {d.title || 'Document'}</a></li>)}
                {staged.filter((s) => s.kind === 'document').map((s) => <li key={s.key} className="text-xs text-amber-700">📄 {s.title || s.file?.name} <span className="text-[10px]">(not uploaded yet)</span></li>)}
              </ul>
            </div>
          )}
          {videos.length > 0 && (
            <div className="mt-4">
              <div className="text-[11px] font-extrabold uppercase tracking-wide text-slate-500 mb-1">Videos</div>
              {videos.map((v) => <div key={v.id} className="mt-1"><video src={v.url} controls className="w-full max-w-sm rounded-xl" /></div>)}
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
}
