/* Company catalog — Industrial catalog with single & multi-product selection,
   PDF datasheet export, WhatsApp formatting, and Email quotation sharing. */
import { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  Boxes,
  FileDown,
  Mail,
  MessageSquare,
  Share2,
  Copy,
  ExternalLink,
  FileText,
  Check,
  X
} from 'lucide-react';
import { api, fmt, imgFallback, getSession } from '../../api';
import { PageHero, DataTable, Empty, Skeleton, Pager, Confirm, toast, Modal } from '../../components/ui';
import {
  getProductMedia,
  exportProductsPdf,
  formatProductsEmail,
  formatProductsWhatsApp
} from '../../utils/productShare';

function norm(d) {
  if (!d) return { rows: [], total: 0, page: 1, limit: 8 };
  if (Array.isArray(d)) return { rows: d, total: d.length, page: 1, limit: 8 };
  return { rows: d.rows || [], total: d.total != null ? d.total : (d.rows || []).length, page: d.page || 1, limit: d.limit || 8 };
}

export default function Products() {
  const [q, setQ] = useState('');
  const [deb, setDeb] = useState('');
  const [page, setPage] = useState(1);
  const [data, setData] = useState(null);
  const [tick, setTick] = useState(0);
  const [delTarget, setDelTarget] = useState(null);
  const [delBusy, setDelBusy] = useState(false);

  // Selection state (keyed by product ID to persist across search / pagination)
  const [selectedMap, setSelectedMap] = useState({});

  // Share modal state
  const [shareModal, setShareModal] = useState(null);

  const session = useMemo(() => getSession() || {}, []);
  const companyName = session.companyName || 'ARGUS CNC';
  const companyEmail = session.email || 'technologiesargus@gmail.com';

  useEffect(() => {
    const t = setTimeout(() => { setDeb(q); setPage(1); }, 300);
    return () => clearTimeout(t);
  }, [q]);

  useEffect(() => {
    let on = true;
    const qs = new URLSearchParams({ page, limit: 8 });
    if (deb) qs.set('q', deb);
    api.get('/api/products?' + qs.toString())
      .then((d) => { if (on) setData({ ...norm(d), err: '' }); })
      .catch((e) => { if (on) setData({ rows: [], total: 0, page: 1, limit: 8, err: e.message }); });
    return () => { on = false; };
  }, [page, deb, tick]);

  function toggleVis(p) {
    api.patch('/api/products/' + p.id + '/visibility', { visible: !p.visible })
      .then(() => { toast('Visibility updated', '👁️'); setTick((t) => t + 1); })
      .catch((e) => toast(e.message, '⚠️'));
  }

  // Multi-selection helpers
  const rows = data?.rows || [];
  const selectedProducts = useMemo(() => Object.values(selectedMap), [selectedMap]);
  const selectedCount = selectedProducts.length;
  const allOnPage = rows.length > 0 && rows.every((r) => !!selectedMap[r.id]);
  const someOnPage = rows.some((r) => !!selectedMap[r.id]);

  const toggleSelect = (p) => {
    setSelectedMap((prev) => {
      const next = { ...prev };
      if (next[p.id]) {
        delete next[p.id];
      } else {
        next[p.id] = p;
      }
      return next;
    });
  };

  const toggleSelectAllPage = () => {
    setSelectedMap((prev) => {
      const next = { ...prev };
      if (allOnPage) {
        rows.forEach((r) => { delete next[r.id]; });
      } else {
        rows.forEach((r) => { next[r.id] = r; });
      }
      return next;
    });
  };

  const clearSelection = () => setSelectedMap({});

  // Open share modal with 1 or more products
  const openShareModal = (targetProducts, tab = 'pdf') => {
    if (!targetProducts || !targetProducts.length) return;
    const emailData = formatProductsEmail(targetProducts, companyName);
    const whatsAppData = formatProductsWhatsApp(targetProducts, companyName);

    setShareModal({
      products: targetProducts,
      tab,
      phone: '',
      email: '',
      subject: emailData.subject,
      body: emailData.body,
      whatsAppText: whatsAppData,
      copied: false
    });
  };

  const handleCopyText = (text, typeLabel) => {
    if (!text) return;
    navigator.clipboard.writeText(text).then(() => {
      toast(`${typeLabel} copied to clipboard!`, '📋');
      if (shareModal) setShareModal((prev) => ({ ...prev, copied: true }));
      setTimeout(() => {
        setShareModal((prev) => prev ? { ...prev, copied: false } : null);
      }, 2500);
    }).catch(() => {
      toast('Failed to copy to clipboard', '⚠️');
    });
  };

  const handleLaunchWhatsApp = () => {
    if (!shareModal || !shareModal.whatsAppText) return;
    const cleanPhone = (shareModal.phone || '').replace(/[^0-9]/g, '');
    let url = '';
    if (cleanPhone) {
      url = `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encodeURIComponent(shareModal.whatsAppText)}`;
    } else {
      url = `https://api.whatsapp.com/send?text=${encodeURIComponent(shareModal.whatsAppText)}`;
    }
    window.open(url, '_blank');
  };

  const handleLaunchEmail = () => {
    if (!shareModal) return;
    const to = (shareModal.email || '').trim();
    const mailto = `mailto:${encodeURIComponent(to)}?subject=${encodeURIComponent(shareModal.subject)}&body=${encodeURIComponent(shareModal.body)}`;
    window.location.href = mailto;
  };

  const handleExportPdfNow = (productsToExport) => {
    const list = productsToExport || (shareModal ? shareModal.products : selectedProducts);
    if (!list || !list.length) {
      toast('No products selected for PDF export', '⚠️');
      return;
    }
    exportProductsPdf(list, { name: companyName, email: companyEmail });
    toast(`Generating catalog PDF for ${list.length} SKU(s)…`, '📄');
  };

  if (!data) return <Skeleton h={220} />;
  if (data.err && !data.rows.length) return <Empty icon="⚠️" title={data.err} sub="Could not reach the backend." />;

  return (
    <>
      <PageHero
        title={'Industrial Catalog (' + data.total + ' SKUs)'}
        subtitle="Catalog inventory, pricing, stock levels, and visibility status."
        icon={Boxes}
        badgeText="Inventory Management"
        badgeColor="emerald"
        gradient="from-emerald-500 via-teal-600 to-green-600"
        actions={
          <>
            <Link className="btn btn-ghost btn-sm" to="/admin/media">Media library</Link>
            <Link className="btn btn-primary btn-sm bg-emerald-600 hover:bg-emerald-700 border-none shadow-sm shadow-emerald-600/30 text-white" to="/admin/products/new">+ Add product</Link>
          </>
        }
      />
      <div className="card"><div className="card-pad">
        <div className="toolbar"><input placeholder="Search name, SKU, brand, MPN…" value={q} onChange={(e) => setQ(e.target.value)} /></div>

        {/* Multi-Select Floating / Sticky Batch Actions Toolbar */}
        {selectedCount > 0 && (
          <div className="mb-3.5 p-3 rounded-xl bg-[#DECDBE] border border-[#BAA794] flex flex-wrap items-center justify-between gap-3 shadow-xs">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 animate-pulse" />
              <span className="text-xs font-bold text-[#1A0A03]">
                <b>{selectedCount}</b> {selectedCount === 1 ? 'product' : 'products'} selected
              </span>
              <button
                type="button"
                onClick={clearSelection}
                className="text-xs font-semibold text-[#78350F] hover:underline ml-2 cursor-pointer"
              >
                Clear selection
              </button>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <button
                type="button"
                onClick={() => openShareModal(selectedProducts, 'pdf')}
                className="btn btn-sm bg-[#2E1508] hover:bg-[#432311] text-white border-none shadow-xs font-bold flex items-center gap-1.5 cursor-pointer"
                title="Download selected SKUs as catalog PDF"
              >
                <FileDown className="w-3.5 h-3.5" />
                Download PDF ({selectedCount})
              </button>
              <button
                type="button"
                onClick={() => openShareModal(selectedProducts, 'whatsapp')}
                className="btn btn-sm bg-emerald-700 hover:bg-emerald-800 text-white border-none shadow-xs font-bold flex items-center gap-1.5 cursor-pointer"
                title="Share selected SKUs via WhatsApp"
              >
                <MessageSquare className="w-3.5 h-3.5" />
                Send WhatsApp ({selectedCount})
              </button>
              <button
                type="button"
                onClick={() => openShareModal(selectedProducts, 'email')}
                className="btn btn-sm bg-sky-800 hover:bg-sky-900 text-white border-none shadow-xs font-bold flex items-center gap-1.5 cursor-pointer"
                title="Send selected SKUs via Email"
              >
                <Mail className="w-3.5 h-3.5" />
                Send Email ({selectedCount})
              </button>
            </div>
          </div>
        )}

        {data.total === 0 && !deb
          ? <div className="empty" style={{ padding: 32, textAlign: 'center' }}><div className="big">📦</div><h3>No products in catalog</h3><p className="hint">Your company catalog is empty. Click "+ Add product" above to create your first SKU.</p></div>
          : <>
            <DataTable
              empty="No products match your search."
              rowKey={(r) => r.id}
              cols={[
                {
                  key: 'select',
                  label: (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <input
                        type="checkbox"
                        checked={allOnPage}
                        ref={(el) => { if (el) el.indeterminate = someOnPage && !allOnPage; }}
                        onChange={toggleSelectAllPage}
                        className="w-4 h-4 rounded cursor-pointer accent-[#2E1508]"
                        title={allOnPage ? "Deselect all on this page" : "Select all on this page"}
                      />
                    </div>
                  ),
                  render: (p) => (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <input
                        type="checkbox"
                        checked={!!selectedMap[p.id]}
                        onChange={() => toggleSelect(p)}
                        className="w-4 h-4 rounded cursor-pointer accent-[#2E1508]"
                        title={selectedMap[p.id] ? "Deselect SKU" : "Select SKU"}
                      />
                    </div>
                  )
                },
                {
                  key: 'p', label: 'Product', render: (p) => {
                    const { images, docs } = getProductMedia(p);
                    return (
                      <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                        <img className="thumb" src={images[0] || ''} alt="" onError={(e) => { e.currentTarget.src = imgFallback(p.sku || p.id, 100, 100); }} />
                        <div>
                          <b>{p.name}</b>
                          <div className="hint">{p.sku || p.id}{p.mpn ? ' • MPN ' + p.mpn : ''}</div>
                          {/* Attached Media Chips */}
                          <div style={{ display: 'flex', gap: 4, marginTop: 3 }}>
                            {docs.length > 0 && (
                              <span
                                className="inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded bg-rose-100 text-rose-800 border border-rose-300"
                                title={`Attached PDFs: ${docs.map(d => d.title).join(', ')}`}
                              >
                                📄 {docs.length} PDF{docs.length > 1 ? 's' : ''}
                              </span>
                            )}
                            {images.length > 1 && (
                              <span
                                className="inline-flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded bg-[#E4D5C7] text-[#2E1508]"
                                title={`${images.length} photos available`}
                              >
                                🖼️ {images.length}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  }
                },
                { key: 'brand', label: 'Brand', render: (p) => p.brand || '—' },
                {
                  key: 'price', label: 'Price', render: (p) => (p.price != null
                    ? <span><b>{fmt(p.price)}</b> <span className="hint">/ {p.uom || 'Pc'}</span></span>
                    : <span className="status s-ready">RFQ</span>)
                },
                {
                  key: 'stock', label: 'Stock', render: (p) => (
                    <span>{p.stock <= 10 ? <b style={{ color: '#D97706' }}>{p.stock} low</b> : p.stock} <span className="hint">{p.uom || ''}</span></span>)
                },
                {
                  key: 'vis', label: 'Visible', render: (p) => (
                    <button className={'status ' + (p.visible ? 's-active' : 's-cancelled')} onClick={() => toggleVis(p)}>{p.visible ? 'Visible' : 'Hidden'}</button>)
                },
                {
                  key: 'act', label: 'Actions', render: (p) => (
                    <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                      <button
                        className="btn btn-ghost btn-sm text-[#2E1508] hover:bg-[#DECDBE] border border-[#BAA794]/60 font-semibold flex items-center gap-1 cursor-pointer"
                        onClick={() => openShareModal([p], 'pdf')}
                        title="Share or Export this SKU (PDF / WhatsApp / Email)"
                      >
                        <Share2 className="w-3.5 h-3.5" />
                        Share
                      </button>
                      <Link className="btn btn-ghost btn-sm" to={'/admin/products/edit/' + p.id}>Edit</Link>
                      <button className="btn btn-ghost btn-sm text-rose-600 hover:text-rose-700 cursor-pointer" onClick={() => setDelTarget(p)} title="Delete product">🗑️</button>
                    </div>
                  )
                }
              ]}
              rows={data.rows}
            />
            <Pager total={data.total} page={data.page} limit={data.limit} onPage={setPage} />
          </>}
      </div></div>

      {/* Delete Confirmation Modal */}
      {delTarget && (
        <Confirm
          title="Delete Product"
          body={`Are you sure you want to permanently delete SKU <b>${delTarget.sku || delTarget.id}</b> (${delTarget.name})? This cannot be undone.`}
          okLabel="Delete Permanently"
          danger
          busy={delBusy}
          onCancel={() => setDelTarget(null)}
          onOk={async () => {
            setDelBusy(true);
            try {
              await api.del('/api/products/' + delTarget.id);
              toast('Product deleted', '🗑️');
              setDelTarget(null);
              setTick((t) => t + 1);
            } catch (e) {
              toast('Delete failed: ' + e.message, '⚠️');
            } finally {
              setDelBusy(false);
            }
          }}
        />
      )}

      {/* Product Share & PDF Export Modal */}
      {shareModal && (
        <Modal
          title={`Share & Export Products (${shareModal.products.length} SKU${shareModal.products.length > 1 ? 's' : ''})`}
          wide
          onClose={() => setShareModal(null)}
        >
          <div className="space-y-4">
            {/* Share Destination Tabs */}
            <div className="flex border-b border-[#BAA794] pb-2 gap-2">
              <button
                type="button"
                onClick={() => setShareModal((prev) => ({ ...prev, tab: 'pdf' }))}
                className={`px-4 py-2 text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer ${
                  shareModal.tab === 'pdf'
                    ? 'bg-[#2E1508] text-white shadow-xs'
                    : 'text-[#5C3D2E] hover:bg-[#DECDBE]'
                }`}
              >
                <FileDown className="w-4 h-4" />
                PDF Datasheet & Catalog
              </button>
              <button
                type="button"
                onClick={() => setShareModal((prev) => ({ ...prev, tab: 'whatsapp' }))}
                className={`px-4 py-2 text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer ${
                  shareModal.tab === 'whatsapp'
                    ? 'bg-emerald-700 text-white shadow-xs'
                    : 'text-[#5C3D2E] hover:bg-[#DECDBE]'
                }`}
              >
                <MessageSquare className="w-4 h-4" />
                WhatsApp Message
              </button>
              <button
                type="button"
                onClick={() => setShareModal((prev) => ({ ...prev, tab: 'email' }))}
                className={`px-4 py-2 text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer ${
                  shareModal.tab === 'email'
                    ? 'bg-sky-800 text-white shadow-xs'
                    : 'text-[#5C3D2E] hover:bg-[#DECDBE]'
                }`}
              >
                <Mail className="w-4 h-4" />
                Email Quotation
              </button>
            </div>

            {/* Selected Products Carousel / Chips Strip */}
            <div className="p-3 rounded-xl bg-[#F4EBE2] border border-[#BAA794]/80">
              <div className="text-[11px] font-bold uppercase tracking-wider text-[#5C3D2E] mb-2 flex items-center justify-between">
                <span>Selected Items ({shareModal.products.length}):</span>
                <span className="text-[10px] text-[#8F6A52]">Images, technical specs, and PDF datasheets automatically included</span>
              </div>
              <div className="flex gap-2.5 overflow-x-auto pb-1">
                {shareModal.products.map((p) => {
                  const { images, docs } = getProductMedia(p);
                  return (
                    <div
                      key={p.id}
                      className="flex-shrink-0 w-64 p-2 rounded-lg bg-white border border-[#D4C2B0] shadow-2xs flex gap-2.5 items-center"
                    >
                      <img
                        src={images[0] || ''}
                        alt=""
                        className="w-12 h-12 object-contain rounded bg-[#FAF6F1] border border-[#EAE0D5] flex-shrink-0"
                        onError={(e) => { e.currentTarget.src = imgFallback(p.sku || p.id, 60, 60); }}
                      />
                      <div className="min-w-0 flex-1 text-xs">
                        <div className="font-bold text-[#1A0A03] truncate" title={p.name}>{p.name}</div>
                        <div className="text-[11px] text-[#6B503E] truncate">SKU: {p.sku || p.id}</div>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className="font-extrabold text-[#2E1508]">
                            {p.price != null ? fmt(p.price) : 'RFQ'}
                          </span>
                          {docs.length > 0 && (
                            <span className="text-[9px] font-bold px-1 rounded bg-rose-100 text-rose-800 border border-rose-200">
                              📄 {docs.length} PDF
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* TAB 1: PDF EXPORT */}
            {shareModal.tab === 'pdf' && (
              <div className="space-y-4">
                <div className="p-4 rounded-xl bg-white border border-[#BAA794] space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="p-2.5 rounded-xl bg-[#2E1508] text-white">
                      <FileDown className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-[#1A0A03]">Print-Ready Industrial Catalog PDF</h4>
                      <p className="text-xs text-[#5C3D2E] mt-0.5 leading-relaxed">
                        Compiles an A4-formatted, high-resolution catalog and datasheet booklet.
                        Includes full technical specification tables, pricing/RFQ terms, warehouse stock levels,
                        high-DPI product photos, and clickable direct-download links to attached PDF datasheets.
                      </p>
                    </div>
                  </div>

                  {/* Attached Documents Inspector */}
                  {(() => {
                    const allDocs = shareModal.products.flatMap(p => getProductMedia(p).docs);
                    if (!allDocs.length) return null;
                    return (
                      <div className="mt-3 pt-3 border-t border-[#EAE0D5]">
                        <div className="text-xs font-bold text-[#2E1508] mb-2">
                          Attached PDF Documents & Drawings ({allDocs.length}):
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {allDocs.map((doc, idx) => (
                            <a
                              key={doc.id || idx}
                              href={doc.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center justify-between p-2 rounded-lg bg-[#FAF6F1] border border-[#DECDBE] hover:bg-[#F2E5D8] transition-colors text-xs text-[#2E1508]"
                            >
                              <span className="truncate font-semibold flex items-center gap-1.5">
                                <FileText className="w-3.5 h-3.5 text-rose-600 flex-shrink-0" />
                                {doc.title}
                              </span>
                              <ExternalLink className="w-3 h-3 text-[#78350F] flex-shrink-0 ml-1.5" />
                            </a>
                          ))}
                        </div>
                      </div>
                    );
                  })()}
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShareModal(null)}
                    className="btn btn-ghost btn-sm"
                  >
                    Close
                  </button>
                  <button
                    type="button"
                    onClick={() => handleExportPdfNow(shareModal.products)}
                    className="btn btn-primary btn-sm bg-[#2E1508] hover:bg-[#432311] text-white border-none shadow-sm flex items-center gap-2 cursor-pointer px-4 py-2 font-bold"
                  >
                    <FileDown className="w-4 h-4" />
                    Open & Download Catalog PDF
                  </button>
                </div>
              </div>
            )}

            {/* TAB 2: WHATSAPP SHARE */}
            {shareModal.tab === 'whatsapp' && (
              <div className="space-y-3.5">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-center">
                  <div className="sm:col-span-2">
                    <label className="text-xs font-bold text-[#2E1508] block mb-1">
                      Recipient Mobile / WhatsApp Number (optional)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. 919876543210 (with country code)"
                      value={shareModal.phone || ''}
                      onChange={(e) => setShareModal((prev) => ({ ...prev, phone: e.target.value }))}
                      className="w-full text-xs p-2 rounded-lg border border-[#BAA794] bg-white text-[#1A0A03]"
                    />
                  </div>
                  <div className="text-[11px] text-[#6B503E] pt-3">
                    If phone is omitted, WhatsApp will prompt you to pick a contact or chat.
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-bold text-[#2E1508]">
                      WhatsApp Message Preview & Text
                    </label>
                    <span className="text-[11px] text-[#6B503E]">
                      Formatted with WhatsApp *bold*, bullets, image URLs, and PDF links
                    </span>
                  </div>
                  <textarea
                    rows={10}
                    value={shareModal.whatsAppText}
                    onChange={(e) => setShareModal((prev) => ({ ...prev, whatsAppText: e.target.value }))}
                    className="w-full text-xs font-mono p-3 rounded-xl border border-[#BAA794] bg-white text-[#1A0A03] leading-relaxed resize-y"
                  />
                </div>

                <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-[#BAA794]">
                  <button
                    type="button"
                    onClick={() => handleExportPdfNow(shareModal.products)}
                    className="btn btn-ghost btn-sm text-[#2E1508] border border-[#BAA794] flex items-center gap-1.5"
                    title="Download the PDF booklet to attach in WhatsApp"
                  >
                    <FileDown className="w-3.5 h-3.5" />
                    Download PDF to Attach
                  </button>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleCopyText(shareModal.whatsAppText, 'WhatsApp text')}
                      className="btn btn-ghost btn-sm text-[#2E1508] border border-[#BAA794] flex items-center gap-1.5 cursor-pointer"
                    >
                      {shareModal.copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                      {shareModal.copied ? 'Copied!' : 'Copy Text'}
                    </button>
                    <button
                      type="button"
                      onClick={handleLaunchWhatsApp}
                      className="btn btn-primary btn-sm bg-emerald-700 hover:bg-emerald-800 text-white border-none shadow-sm flex items-center gap-2 cursor-pointer font-bold px-4 py-2"
                    >
                      <MessageSquare className="w-4 h-4" />
                      Open WhatsApp
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 3: EMAIL SHARE */}
            {shareModal.tab === 'email' && (
              <div className="space-y-3.5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold text-[#2E1508] block mb-1">
                      Recipient Email (optional)
                    </label>
                    <input
                      type="email"
                      placeholder="client@example.com"
                      value={shareModal.email || ''}
                      onChange={(e) => setShareModal((prev) => ({ ...prev, email: e.target.value }))}
                      className="w-full text-xs p-2 rounded-lg border border-[#BAA794] bg-white text-[#1A0A03]"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-[#2E1508] block mb-1">
                      Subject Line
                    </label>
                    <input
                      type="text"
                      value={shareModal.subject}
                      onChange={(e) => setShareModal((prev) => ({ ...prev, subject: e.target.value }))}
                      className="w-full text-xs p-2 rounded-lg border border-[#BAA794] bg-white text-[#1A0A03]"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-bold text-[#2E1508]">
                      Email Body Content
                    </label>
                    <span className="text-[11px] text-[#6B503E]">
                      Includes technical specs, image links, and downloadable PDF links
                    </span>
                  </div>
                  <textarea
                    rows={10}
                    value={shareModal.body}
                    onChange={(e) => setShareModal((prev) => ({ ...prev, body: e.target.value }))}
                    className="w-full text-xs font-mono p-3 rounded-xl border border-[#BAA794] bg-white text-[#1A0A03] leading-relaxed resize-y"
                  />
                </div>

                <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-[#BAA794]">
                  <button
                    type="button"
                    onClick={() => handleExportPdfNow(shareModal.products)}
                    className="btn btn-ghost btn-sm text-[#2E1508] border border-[#BAA794] flex items-center gap-1.5"
                    title="Download the PDF datasheet to attach to your email"
                  >
                    <FileDown className="w-3.5 h-3.5" />
                    Download PDF to Attach
                  </button>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleCopyText(`Subject: ${shareModal.subject}\n\n${shareModal.body}`, 'Email text')}
                      className="btn btn-ghost btn-sm text-[#2E1508] border border-[#BAA794] flex items-center gap-1.5 cursor-pointer"
                    >
                      {shareModal.copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                      {shareModal.copied ? 'Copied!' : 'Copy Text'}
                    </button>
                    <button
                      type="button"
                      onClick={handleLaunchEmail}
                      className="btn btn-primary btn-sm bg-sky-800 hover:bg-sky-900 text-white border-none shadow-sm flex items-center gap-2 cursor-pointer font-bold px-4 py-2"
                    >
                      <Mail className="w-4 h-4" />
                      Open Email Client (mailto:)
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </Modal>
      )}
    </>
  );
}
