/* Store product detail — Professional Industrial Catalog Showcase.
   Features high-resolution gallery with photo captions (title/description),
   technical specs tables, PDF datasheet cards, and video showcases. */
import { useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import { api, imgFallback } from '../../api';
import { useAuth } from '../../auth';
import { Empty, Skeleton } from '../../components/ui';
import { ProdCard, RfqModal, addToCart, asList, availBadge, priceHtml } from './Home';
import {
  ArrowLeft, Check, Copy, Download, ExternalLink, FileText,
  Film, Layers, MonitorPlay, Package, ShieldCheck, Sparkles, BookOpen
} from 'lucide-react';

/* youtube watch/shorts/embed url → video id (null when not a YouTube link) */
const ytId = (u) => {
  const m = String(u || '').match(/(?:youtube\.com\/(?:watch\?v=|shorts\/|embed\/|live\/)|youtu\.be\/)([\w-]{5,})/i);
  return m ? m[1] : null;
};

export default function Product() {
  const { id } = useParams();
  const { me } = useAuth();
  const nav = useNavigate();
  const loc = useLocation();

  const [p, setP] = useState(null);
  const [missing, setMissing] = useState(false);
  const [cats, setCats] = useState([]);
  const [companyProds, setCompanyProds] = useState([]);
  const [activeMediaIndex, setActiveMediaIndex] = useState(0);
  const [qty, setQty] = useState(1);
  const [rfq, setRfq] = useState(null);
  const [activeTab, setActiveTab] = useState('specs'); // 'specs' | 'docs' | 'videos' | 'overview'
  const [copiedSku, setCopiedSku] = useState(false);

  useEffect(() => { window.scrollTo(0, 0); }, [id]);

  useEffect(() => {
    setP(null);
    setMissing(false);
    setActiveMediaIndex(0);
    api.get('/api/products/' + id).then((d) => {
      setP(d);
      setQty(Math.min(d.moq || 1, 10));
    }).catch(() => setMissing(true));
    api.get('/api/products').then((d) => setCompanyProds(asList(d))).catch(() => {});
    api.get('/api/categories').then((d) => setCats(asList(d))).catch(() => {});
  }, [id]);

  /* Reconcile media assets */
  const { images, docs, videos, yts, allVisualMedia } = useMemo(() => {
    if (!p) return { images: [], docs: [], videos: [], yts: [], allVisualMedia: [] };
    const rawMedia = Array.isArray(p.media) ? p.media : [];

    /* Images */
    let imgs = rawMedia.filter((m) => m.type === 'image');
    if (!imgs.length && Array.isArray(p.images) && p.images.length) {
      imgs = p.images.map((u, i) => ({
        id: `img-${i}`,
        type: 'image',
        url: u,
        title: '',
        description: '',
        alt: p.name
      }));
    }

    /* Documents */
    const dc = rawMedia.filter((m) => m.type === 'document');

    /* Local Videos */
    let vids = rawMedia.filter((m) => m.type === 'video');
    if (!vids.length && p.video) {
      vids = [{ id: 'video-main', type: 'video', url: p.video, title: 'Product Video', description: '' }];
    }

    /* YouTube Videos */
    let ytList = rawMedia.filter((m) => m.type === 'youtube');
    if (!ytList.length && p.youtube) {
      ytList = [{ id: 'yt-main', type: 'youtube', url: p.youtube, title: 'YouTube Video', description: '' }];
    }

    /* Visual media list for the top gallery (images first, then videos, then youtube) */
    const visual = [...imgs, ...vids, ...ytList];
    return { images: imgs, docs: dc, videos: vids, yts: ytList, allVisualMedia: visual };
  }, [p]);

  if (missing) return <Empty icon="🔍" title="Product not found in catalog." />;
  if (p === null) return <Skeleton h={400} />;

  const catName = (cid) => ((cats.find((c) => c.id === cid) || {}).name || cid);
  const rel = companyProds.filter((x) => x.category === p.category && x.id !== p.id && x.visible).slice(0, 4);
  const stepQty = (d) => setQty((v) => Math.max(1, Math.min(99, v + d)));
  const refresh = () => nav(loc.pathname + loc.search, { replace: true });

  const activeMedia = allVisualMedia[activeMediaIndex] || allVisualMedia[0] || null;
  const specs = Object.entries(p.specs || {}).filter(([k]) => String(k).trim());

  const copySku = () => {
    navigator.clipboard.writeText(p.sku || p.id);
    setCopiedSku(true);
    setTimeout(() => setCopiedSku(false), 2000);
  };

  const buyBox = p.price == null
    ? (
      <div className="rounded-xl border border-amber-300 bg-amber-50/70 p-4">
        <div className="flex items-center gap-2 text-amber-900 font-extrabold text-sm">
          <Sparkles className="w-4 h-4 text-amber-600" />
          <span>Industrial Quotation Required</span>
        </div>
        <p className="text-xs text-amber-800 mt-1 mb-3 leading-relaxed">
          This precision item is priced on request based on order quantity, custom tolerances, and warehouse batch availability.
        </p>
        <button
          className="btn btn-coral w-full font-bold shadow-xs py-2 text-sm cursor-pointer"
          type="button"
          onClick={() => setRfq(p)}
        >
          Request Technical Quotation →
        </button>
      </div>
    )
    : p.stock <= 0
      ? (
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
          <div className="font-extrabold text-slate-800 text-sm">Currently Out of Stock</div>
          <p className="text-xs text-slate-500 mt-1 mb-3 leading-relaxed">
            Check production lead times or submit an indent request directly to manufacturing.
          </p>
          <button
            className="btn btn-dark w-full font-bold shadow-xs py-2 text-sm cursor-pointer"
            type="button"
            onClick={() => setRfq(p)}
          >
            Check Batch Availability
          </button>
        </div>
      )
      : (
        <div className="space-y-3">
          <div className="flex items-center gap-3 flex-wrap">
            <span className="qty flex items-center border border-slate-300 rounded-lg overflow-hidden bg-white">
              <button type="button" className="px-3 py-1.5 hover:bg-slate-100 font-bold text-slate-700 cursor-pointer" onClick={() => stepQty(-1)}>−</button>
              <span className="px-4 py-1.5 font-mono font-bold text-slate-900 min-w-[36px] text-center">{qty}</span>
              <button type="button" className="px-3 py-1.5 hover:bg-slate-100 font-bold text-slate-700 cursor-pointer" onClick={() => stepQty(1)}>+</button>
            </span>
            <span className="text-xs text-slate-600">
              <b className="font-mono text-slate-900">{p.stock} {p.uom || 'units'}</b> available
              {(p.moq || 1) > 1 && <span className="text-slate-400"> • MOQ {p.moq}</span>}
            </span>
          </div>
          <div className="flex gap-2.5">
            <button
              className="btn btn-primary flex-1 py-2 text-xs sm:text-sm font-bold shadow-xs cursor-pointer"
              type="button"
              onClick={() => { if (addToCart(p, qty)) refresh(); }}
            >
              Add to Cart
            </button>
            <button
              className="btn btn-coral flex-1 py-2 text-xs sm:text-sm font-bold shadow-xs cursor-pointer"
              type="button"
              onClick={() => { if (addToCart(p, qty, { silent: true })) nav('/store/cart'); }}
            >
              Buy Now →
            </button>
          </div>
        </div>
      );

  return (
    <div className="space-y-4 max-w-7xl mx-auto pb-8">
      {/* Back to Catalog Breadcrumb */}
      <div className="flex items-center justify-between gap-2">
        <Link className="btn btn-ghost btn-sm text-xs text-slate-600 hover:text-slate-900 flex items-center gap-1.5" to="/store/listing">
          <ArrowLeft className="w-3.5 h-3.5" /> Back to industrial catalog
        </Link>
        <span className="text-xs text-slate-400 hidden sm:inline">
          Catalog ID: <code className="font-mono text-slate-600">{p.id}</code>
        </span>
      </div>

      {/* Main Industrial Catalog Hero Card */}
      <div className="rounded-2xl border border-slate-200/90 bg-white p-4 sm:p-6 shadow-2xs">
        <div className="grid lg:grid-cols-12 gap-6 lg:gap-8 items-start">
          {/* Left Column: Visual Gallery Showcase (7 of 12 cols) */}
          <div className="lg:col-span-7 flex flex-col space-y-3">
            {/* Main Display Stage */}
            <div className="w-full aspect-[4/3] rounded-2xl border border-slate-200 bg-slate-50/70 overflow-hidden relative flex items-center justify-center shadow-inner">
              {activeMedia?.type === 'youtube' && ytId(activeMedia.url) ? (
                <iframe
                  className="w-full h-full"
                  src={`https://www.youtube.com/embed/${ytId(activeMedia.url)}?autoplay=1`}
                  title={activeMedia.title || 'Product Video'}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              ) : activeMedia?.type === 'video' ? (
                <video
                  src={activeMedia.url}
                  controls
                  autoPlay
                  className="w-full h-full object-contain bg-black"
                />
              ) : activeMedia?.url ? (
                <img
                  src={activeMedia.url}
                  onError={(e) => { e.currentTarget.src = imgFallback(p.sku || p.id, 700, 525); }}
                  alt={activeMedia.title || activeMedia.alt || p.name}
                  className="w-full h-full object-contain p-2"
                />
              ) : (
                <div className="text-center text-slate-400 p-6">
                  <Package className="w-12 h-12 mx-auto mb-2 text-slate-300" />
                  <p className="text-xs">No media preview available</p>
                </div>
              )}
            </div>

            {/* Industrial Photo Caption Callout */}
            {activeMedia && (activeMedia.title || activeMedia.description || activeMedia.alt) && (
              <div className="p-3.5 rounded-xl bg-slate-900 text-white shadow-xs border border-slate-800">
                {activeMedia.title && (
                  <div className="text-xs font-bold text-white flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-orange-500 flex-shrink-0" />
                    <span>{activeMedia.title}</span>
                  </div>
                )}
                {(activeMedia.description || activeMedia.alt) && (
                  <div className="text-[12px] text-slate-300 mt-1 leading-relaxed">
                    {activeMedia.description || activeMedia.alt}
                  </div>
                )}
              </div>
            )}

            {/* Thumbnails Carousel / Strip */}
            {allVisualMedia.length > 1 && (
              <div className="flex gap-2 overflow-x-auto pb-1 pt-1">
                {allVisualMedia.map((m, idx) => {
                  const isSel = idx === activeMediaIndex;
                  const isYt = m.type === 'youtube';
                  const isVid = m.type === 'video';
                  const yid = isYt ? ytId(m.url) : null;
                  const thumb = isYt && yid ? `https://img.youtube.com/vi/${yid}/hqdefault.jpg` : m.url;

                  return (
                    <button
                      key={m.id || idx}
                      type="button"
                      onClick={() => setActiveMediaIndex(idx)}
                      className={`w-16 h-16 sm:w-20 sm:h-20 rounded-xl border-2 overflow-hidden flex-shrink-0 relative transition-all cursor-pointer bg-white ${
                        isSel
                          ? 'border-orange-500 ring-2 ring-orange-200 scale-102'
                          : 'border-slate-200 opacity-75 hover:opacity-100 hover:border-slate-300'
                      }`}
                      title={m.title || (isYt ? 'YouTube Video' : 'Product Photo')}
                    >
                      {isVid ? (
                        <div className="w-full h-full flex flex-col items-center justify-center bg-slate-900 text-white">
                          <Film className="w-6 h-6 text-slate-300" />
                          <span className="text-[8px] font-bold mt-0.5">VIDEO</span>
                        </div>
                      ) : (
                        <img src={thumb} alt="" className="w-full h-full object-cover" />
                      )}
                      {isYt && (
                        <span className="absolute bottom-0 inset-x-0 bg-red-600 text-white text-[7.5px] font-black uppercase text-center py-0.5">
                          ▶ YouTube
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Right Column: Commercial Identity & Purchase Box (5 of 12 cols) */}
          <div className="lg:col-span-5 flex flex-col space-y-4">
            <div>
              <div className="flex items-center gap-2 flex-wrap mb-1.5">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wide bg-slate-100 text-slate-700 border border-slate-200">
                  {catName(p.category)}
                </span>
                {availBadge(p)}
              </div>

              <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight leading-snug">
                {p.name}
              </h1>

              {/* SKU, MPN, Brand Row */}
              <div className="flex items-center gap-2 flex-wrap text-xs text-slate-500 mt-1.5">
                <button
                  type="button"
                  onClick={copySku}
                  className="inline-flex items-center gap-1 font-mono font-bold text-slate-800 bg-slate-100 hover:bg-slate-200 px-2 py-0.5 rounded transition-colors cursor-pointer"
                  title="Click to copy SKU"
                >
                  <span>SKU: {p.sku || p.id}</span>
                  {copiedSku ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3 text-slate-400" />}
                </button>
                {p.mpn && <span className="font-mono">MPN: <b>{p.mpn}</b></span>}
                {p.brand && <span>Brand: <b className="text-slate-800">{p.brand}</b></span>}
              </div>
            </div>

            {/* Short Description Feature Highlight */}
            {p.short && (
              <div className="p-3 rounded-xl bg-orange-50/60 border border-orange-200/80 text-xs text-slate-800 font-medium leading-relaxed">
                {p.short}
              </div>
            )}

            {/* Commercial Price Display */}
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/90">
              <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
                Commercial Price
              </div>
              <div>{priceHtml(p, true)}</div>
            </div>

            {/* ERP Inventory & Supply Chain Facts */}
            <div className="grid grid-cols-2 gap-2 p-3 rounded-xl bg-slate-50/70 border border-slate-200 text-xs">
              <div>
                <span className="text-[10.5px] text-slate-400 font-bold uppercase">Unit of Measure</span>
                <div className="font-bold text-slate-800 mt-0.5">{p.uom || 'Pc'}</div>
              </div>
              <div>
                <span className="text-[10.5px] text-slate-400 font-bold uppercase">Minimum Order Qty</span>
                <div className="font-mono font-bold text-slate-800 mt-0.5">{p.moq || 1} {p.uom || 'units'}</div>
              </div>
              <div>
                <span className="text-[10.5px] text-slate-400 font-bold uppercase">Stock Location</span>
                <div className="font-mono font-bold text-slate-800 mt-0.5">{p.warehouse || 'Central Warehouse'}</div>
              </div>
              <div>
                <span className="text-[10.5px] text-slate-400 font-bold uppercase">Dispatch Lead Time</span>
                <div className="font-bold text-slate-800 mt-0.5">{p.leadTime || 'Immediate Dispatch'}</div>
              </div>
            </div>

            {/* Purchase / RFQ Action */}
            <div className="pt-1">
              {buyBox}
            </div>

            {/* Catalog Guarantees */}
            <div className="pt-2 border-t border-slate-100 space-y-1 text-[11px] text-slate-500">
              <div className="flex items-center gap-1.5 text-slate-600">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>Verified live inventory from ERP database</span>
              </div>
              <div className="flex items-center gap-1.5 text-slate-600">
                <FileText className="w-3.5 h-3.5 text-blue-600" />
                <span>Official GST tax invoice issued with shipment</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Industrial Engineering Catalog Modules (Tabs) */}
      <div className="rounded-2xl border border-slate-200/90 bg-white shadow-2xs overflow-hidden">
        {/* Navigation Tabs Bar */}
        <div className="flex items-center gap-1 p-2 bg-slate-50 border-b border-slate-200/90 overflow-x-auto">
          {[
            { id: 'specs', label: 'Technical Specifications', count: specs.length, icon: Layers },
            { id: 'docs', label: 'Datasheets & Documents', count: docs.length, icon: FileText },
            { id: 'videos', label: 'Videos & Demonstrations', count: videos.length + yts.length, icon: MonitorPlay },
            { id: 'overview', label: 'Overview & Applications', icon: BookOpen }
          ].map((tab) => {
            const Icon = tab.icon;
            const isSel = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`px-3 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-2 cursor-pointer ${
                  isSel
                    ? 'bg-white text-slate-900 shadow-xs border border-slate-200'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isSel ? 'text-orange-600' : 'text-slate-400'}`} />
                <span>{tab.label}</span>
                {tab.count !== undefined && (
                  <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                    isSel ? 'bg-orange-100 text-orange-800 font-extrabold' : 'bg-slate-200/80 text-slate-600'
                  }`}>
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Tab 1: Technical Specifications Table */}
        {activeTab === 'specs' && (
          <div className="p-4 sm:p-6">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="text-sm font-extrabold text-slate-900">Engineering Parameters &amp; Specifications</h3>
                <p className="text-xs text-slate-500">Dimensions, material grades, tolerance ranges, and tooling standards.</p>
              </div>
            </div>

            {specs.length > 0 ? (
              <div className="overflow-x-auto rounded-xl border border-slate-200">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-50 border-b border-slate-200 text-[10px] uppercase font-bold text-slate-500 tracking-wider">
                    <tr>
                      <th className="px-4 py-2.5 w-1/3">Parameter</th>
                      <th className="px-4 py-2.5">Catalog Value</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {specs.map(([k, v], idx) => (
                      <tr key={k} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}>
                        <td className="px-4 py-2.5 font-bold text-slate-700 bg-slate-50/30">{k}</td>
                        <td className="px-4 py-2.5 font-mono text-slate-900 font-semibold">{v}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="rounded-xl border-2 border-dashed border-slate-200 p-8 text-center text-slate-400 text-xs">
                No custom parameters specified. Complete engineering dimensional drawing available via RFQ request.
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Technical Documents & PDF Datasheets */}
        {activeTab === 'docs' && (
          <div className="p-4 sm:p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-extrabold text-slate-900">Downloadable Technical Documents</h3>
                <p className="text-xs text-slate-500">Official product brochures, dimensional diagrams, and material certificates.</p>
              </div>
            </div>

            {docs.length > 0 ? (
              <div className="grid md:grid-cols-2 gap-3.5">
                {docs.map((d) => (
                  <div key={d.id} className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/40 hover:bg-white hover:border-slate-300 hover:shadow-xs transition-all flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-rose-50 border border-rose-200 flex items-center justify-center flex-shrink-0 text-rose-600 font-black text-xs">
                      PDF
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-bold text-slate-900 truncate">
                        {d.title || 'Technical Datasheet'}
                      </div>
                      {d.description ? (
                        <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-2 leading-relaxed">
                          {d.description}
                        </p>
                      ) : (
                        <p className="text-[11px] text-slate-400 mt-0.5">
                          Complete technical specification sheet
                        </p>
                      )}
                      <div className="mt-2">
                        <a
                          href={d.url}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-600 hover:text-blue-800 hover:underline"
                        >
                          <Download className="w-3 h-3" /> Download PDF Datasheet
                        </a>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-xl border-2 border-dashed border-slate-200 p-8 text-center text-slate-400 text-xs">
                No downloadable PDF documents attached to this product yet.
              </div>
            )}
          </div>
        )}

        {/* Tab 3: Videos & Demonstrations */}
        {activeTab === 'videos' && (
          <div className="p-4 sm:p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-extrabold text-slate-900">Application Videos &amp; Demonstrations</h3>
                <p className="text-xs text-slate-500">Live machining trials, setup tutorials, and product demonstrations.</p>
              </div>
            </div>

            {(yts.length > 0 || videos.length > 0) ? (
              <div className="grid md:grid-cols-2 gap-5">
                {yts.filter((y) => ytId(y.url)).map((y) => (
                  <div key={y.id} className="rounded-xl border border-slate-200 overflow-hidden bg-white shadow-2xs">
                    <iframe
                      className="w-full aspect-video"
                      src={`https://www.youtube.com/embed/${ytId(y.url)}`}
                      title={y.title || 'Product Video'}
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                    <div className="p-3">
                      <div className="text-xs font-extrabold text-slate-900">
                        {y.title || 'Application Demonstration'}
                      </div>
                      {y.description && (
                        <p className="text-[11px] text-slate-600 mt-1 leading-relaxed">
                          {y.description}
                        </p>
                      )}
                    </div>
                  </div>
                ))}

                {videos.map((v) => (
                  <div key={v.id} className="rounded-xl border border-slate-200 overflow-hidden bg-white shadow-2xs">
                    <video src={v.url} controls className="w-full aspect-video bg-black" />
                    <div className="p-3">
                      <div className="text-xs font-extrabold text-slate-900">
                        {v.title || 'Product Demonstration Video'}
                      </div>
                      {v.description && (
                        <p className="text-[11px] text-slate-600 mt-1 leading-relaxed">
                          {v.description}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-xl border-2 border-dashed border-slate-200 p-8 text-center text-slate-400 text-xs">
                No video demonstrations attached yet.
              </div>
            )}
          </div>
        )}

        {/* Tab 4: Overview & Applications */}
        {activeTab === 'overview' && (
          <div className="p-4 sm:p-6">
            <h3 className="text-sm font-extrabold text-slate-900 mb-2">Product Description &amp; Industrial Applications</h3>
            <div className="text-xs sm:text-sm text-slate-700 whitespace-pre-wrap leading-relaxed max-w-4xl">
              {p.desc || 'No detailed description provided.'}
            </div>
          </div>
        )}
      </div>

      {/* Related Products in Category */}
      {rel.length > 0 && (
        <div className="pt-2">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-black text-slate-900 uppercase tracking-wide">
              Related Equipment in {catName(p.category)}
            </h2>
            <Link className="text-xs font-bold text-orange-600 hover:underline" to={`/store/listing?cat=${p.category}`}>
              View all in category →
            </Link>
          </div>
          <div className="prod-grid grid grid-cols-2 md:grid-cols-4 gap-4">
            {rel.map((r) => (
              <ProdCard
                key={r.id}
                p={r}
                catName={catName}
                onAdd={(x) => { if (addToCart(x)) refresh(); }}
                onRfq={setRfq}
              />
            ))}
          </div>
        </div>
      )}

      {/* RFQ Modal */}
      {rfq && (
        <RfqModal
          p={rfq}
          me={me}
          onClose={() => setRfq(null)}
          onDone={() => { setRfq(null); nav('/store/quotes'); }}
        />
      )}
    </div>
  );
}
