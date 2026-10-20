import { useState } from 'react';
import {
  FileDown,
  Mail,
  MessageSquare,
  Copy,
  ExternalLink,
  FileText,
  Check
} from 'lucide-react';
import { Modal, toast } from './ui';
import {
  getProductMedia,
  exportProductsPdf,
  formatProductsEmail,
  formatProductsWhatsApp
} from '../utils/productShare';

export default function ProductShareModal({
  products = [],
  initialTab = 'pdf',
  companyInfo = {},
  onClose
}) {
  const companyName = companyInfo.name || companyInfo.companyName || 'ARGUS CNC';
  const companyEmail = companyInfo.email || 'technologiesargus@gmail.com';

  const [tab, setTab] = useState(initialTab);
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [copied, setCopied] = useState(false);

  const emailData = formatProductsEmail(products, companyName);
  const whatsAppData = formatProductsWhatsApp(products, companyName);

  const [subject, setSubject] = useState(emailData.subject);
  const [emailBody, setEmailBody] = useState(emailData.body);
  const [whatsAppText, setWhatsAppText] = useState(whatsAppData);

  const handleCopyText = (text, typeLabel) => {
    if (!text) return;
    navigator.clipboard.writeText(text).then(() => {
      toast(`${typeLabel} copied to clipboard!`, '📋');
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }).catch(() => {
      toast('Failed to copy to clipboard', '⚠️');
    });
  };

  const handleLaunchWhatsApp = () => {
    if (!whatsAppText) return;
    const cleanPhone = (phone || '').replace(/[^0-9]/g, '');
    let url = '';
    if (cleanPhone) {
      url = `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encodeURIComponent(whatsAppText)}`;
    } else {
      url = `https://api.whatsapp.com/send?text=${encodeURIComponent(whatsAppText)}`;
    }
    window.open(url, '_blank');
  };

  const handleLaunchEmail = () => {
    const to = (email || '').trim();
    const mailto = `mailto:${encodeURIComponent(to)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(emailBody)}`;
    window.location.href = mailto;
  };

  const handleExportPdfNow = () => {
    if (!products || !products.length) {
      toast('No products selected for PDF export', '⚠️');
      return;
    }
    exportProductsPdf(products, { name: companyName, email: companyEmail });
    toast(`Generating catalog PDF for ${products.length} SKU(s)…`, '📄');
  };

  return (
    <Modal
      title={`Share & Export Products (${products.length} SKU${products.length > 1 ? 's' : ''})`}
      wide
      onClose={onClose}
    >
      <div className="space-y-4">
        {/* TAB BUTTONS */}
        <div className="flex border-b border-[#BAA794] gap-2">
          <button
            type="button"
            onClick={() => setTab('pdf')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition-colors cursor-pointer ${
              tab === 'pdf'
                ? 'border-[#2E1508] text-[#2E1508] bg-[#F2E5D8]/50'
                : 'border-transparent text-[#6B503E] hover:text-[#1A0A03]'
            }`}
          >
            <FileDown className="w-4 h-4 text-rose-700" />
            PDF Catalog Booklet ({products.length})
          </button>
          <button
            type="button"
            onClick={() => setTab('whatsapp')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition-colors cursor-pointer ${
              tab === 'whatsapp'
                ? 'border-emerald-700 text-emerald-800 bg-emerald-50/50'
                : 'border-transparent text-[#6B503E] hover:text-[#1A0A03]'
            }`}
          >
            <MessageSquare className="w-4 h-4 text-emerald-600" />
            Share via WhatsApp
          </button>
          <button
            type="button"
            onClick={() => setTab('email')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition-colors cursor-pointer ${
              tab === 'email'
                ? 'border-sky-700 text-sky-800 bg-sky-50/50'
                : 'border-transparent text-[#6B503E] hover:text-[#1A0A03]'
            }`}
          >
            <Mail className="w-4 h-4 text-sky-600" />
            Share via Email
          </button>
        </div>

        {/* TAB 1: PDF EXPORT */}
        {tab === 'pdf' && (
          <div className="space-y-3.5">
            <div className="p-3.5 rounded-xl bg-[#F2E5D8] border border-[#BAA794] text-xs text-[#2E1508] leading-relaxed">
              <div className="font-bold text-sm mb-1 text-[#1A0A03]">
                Ready to Generate High-Res Catalog PDF
              </div>
              <p>
                Generates a clean, professional print-ready A4 datasheet containing high-resolution product photos, pricing, MOQ, stock availability, full technical specifications, and download links for attached documents.
              </p>
            </div>

            {/* Product summary chips */}
            <div className="max-h-56 overflow-y-auto space-y-2 p-2 rounded-xl bg-white border border-[#BAA794]">
              <div className="text-[11px] font-bold text-[#6B503E] uppercase tracking-wider px-1">
                Included Products ({products.length})
              </div>
              {products.map((p) => {
                const media = getProductMedia(p);
                return (
                  <div
                    key={p.id}
                    className="flex items-center justify-between p-2 rounded-lg bg-[#FAF6F1] border border-[#DECDBE] text-xs"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <img
                        src={media.images[0] || ''}
                        alt=""
                        className="w-9 h-9 rounded object-cover border border-[#DECDBE] flex-shrink-0"
                        onError={(e) => {
                          e.currentTarget.src = `https://picsum.photos/seed/${p.sku || p.id}/100/100`;
                        }}
                      />
                      <div className="truncate">
                        <div className="font-bold text-[#2E1508] truncate">{p.name}</div>
                        <div className="text-[11px] text-[#6B503E]">
                          SKU: {p.sku || p.id} • {p.brand || 'Argus'} • {p.price != null ? `₹${p.price.toLocaleString('en-IN')}` : 'RFQ'}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 flex-shrink-0 ml-2">
                      {media.docs.length > 0 && (
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-rose-100 text-rose-800 border border-rose-300">
                          {media.docs.length} PDF{media.docs.length > 1 ? 's' : ''}
                        </span>
                      )}
                      {media.images.length > 1 && (
                        <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-[#E4D5C7] text-[#2E1508]">
                          {media.images.length} photos
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}

              {/* PDF Documents Attached */}
              {(() => {
                const allDocs = products.flatMap((p) => getProductMedia(p).docs);
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
                onClick={onClose}
                className="btn btn-ghost btn-sm"
              >
                Close
              </button>
              <button
                type="button"
                onClick={handleExportPdfNow}
                className="btn btn-primary btn-sm bg-[#2E1508] hover:bg-[#432311] text-white border-none shadow-sm flex items-center gap-2 cursor-pointer px-4 py-2 font-bold"
              >
                <FileDown className="w-4 h-4" />
                Open & Download Catalog PDF
              </button>
            </div>
          </div>
        )}

        {/* TAB 2: WHATSAPP SHARE */}
        {tab === 'whatsapp' && (
          <div className="space-y-3.5">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-center">
              <div className="sm:col-span-2">
                <label className="text-xs font-bold text-[#2E1508] block mb-1">
                  Recipient Mobile / WhatsApp Number (optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. 919876543210 (with country code)"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
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
                value={whatsAppText}
                onChange={(e) => setWhatsAppText(e.target.value)}
                className="w-full text-xs font-mono p-3 rounded-xl border border-[#BAA794] bg-white text-[#1A0A03] leading-relaxed resize-y"
              />
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-[#BAA794]">
              <button
                type="button"
                onClick={handleExportPdfNow}
                className="btn btn-ghost btn-sm text-[#2E1508] border border-[#BAA794] flex items-center gap-1.5"
                title="Download the PDF booklet to attach in WhatsApp"
              >
                <FileDown className="w-4 h-4" />
                Download PDF to Attach
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleCopyText(whatsAppText, 'WhatsApp text')}
                  className="btn btn-ghost btn-sm text-[#2E1508] border border-[#BAA794] flex items-center gap-1.5 cursor-pointer"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  {copied ? 'Copied!' : 'Copy Text'}
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
        {tab === 'email' && (
          <div className="space-y-3.5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-[#2E1508] block mb-1">
                  Recipient Email (optional)
                </label>
                <input
                  type="email"
                  placeholder="client@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full text-xs p-2 rounded-lg border border-[#BAA794] bg-white text-[#1A0A03]"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-[#2E1508] block mb-1">
                  Subject Line
                </label>
                <input
                  type="text"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
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
                value={emailBody}
                onChange={(e) => setEmailBody(e.target.value)}
                className="w-full text-xs font-mono p-3 rounded-xl border border-[#BAA794] bg-white text-[#1A0A03] leading-relaxed resize-y"
              />
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-[#BAA794]">
              <button
                type="button"
                onClick={handleExportPdfNow}
                className="btn btn-ghost btn-sm text-[#2E1508] border border-[#BAA794] flex items-center gap-1.5"
                title="Download the PDF datasheet to attach to your email"
              >
                <FileDown className="w-3.5 h-3.5" />
                Download PDF to Attach
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleCopyText(`Subject: ${subject}\n\n${emailBody}`, 'Email text')}
                  className="btn btn-ghost btn-sm text-[#2E1508] border border-[#BAA794] flex items-center gap-1.5 cursor-pointer"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  {copied ? 'Copied!' : 'Copy Text'}
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
  );
}
