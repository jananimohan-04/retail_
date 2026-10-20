/* Product sharing & PDF export utilities for vanilla frontend (port 4000)
   Handles single or multi-product sharing via:
   1. WhatsApp (rich markdown with image previews and PDF download links)
   2. Email (formatted plain text / mailto link with specs, pricing, and document links)
   3. PDF (high-resolution print-ready industrial catalog datasheet with embedded images, specs table, and clickable PDF document download chips)
*/
(function(window) {
  function getProductMedia(p) {
    if (!p) return { images: [], docs: [], videos: [] };

    const rawImages = Array.isArray(p.images) ? [...p.images] : [];
    const mediaList = Array.isArray(p.media) ? p.media : [];

    const docs = [];
    const videos = [];

    mediaList.forEach(m => {
      if (!m || !m.url) return;
      const url = String(m.url);
      const type = String(m.type || '').toLowerCase();

      if (type === 'document' || type === 'pdf' || /\.pdf($|\?)/i.test(url)) {
        docs.push({
          id: m.id || url,
          title: m.title || m.name || url.split('/').pop().replace(/\.pdf$/i, '') || 'Datasheet',
          url: m.url,
          description: m.description || ''
        });
      } else if (type === 'video' || type === 'youtube' || /\.(mp4|webm)($|\?)/i.test(url) || /youtube\.com|youtu\.be/i.test(url)) {
        videos.push({
          id: m.id || url,
          title: m.title || 'Video',
          url: m.url
        });
      } else if (type === 'image' || /\.(jpe?g|png|gif|webp|avif|svg)($|\?)/i.test(url)) {
        if (!rawImages.includes(url)) rawImages.push(url);
      }
    });

    if (Array.isArray(p.documents)) {
      p.documents.forEach(d => {
        const u = typeof d === 'string' ? d : d.url;
        if (u && !docs.some(x => x.url === u)) {
          docs.push({
            id: d.id || u,
            title: d.title || d.name || u.split('/').pop() || 'Document',
            url: u,
            description: d.description || ''
          });
        }
      });
    }

    return {
      images: rawImages.filter(Boolean),
      docs,
      videos
    };
  }

  function escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function formatProductsWhatsApp(products, companyName) {
    companyName = companyName || 'ARGUS CNC';
    if (!products || !products.length) return '';
    const dateStr = new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
    const count = products.length;

    let msg = '*' + companyName + ' — Industrial Product Catalog*\n';
    msg += '_Selected SKUs (' + count + ') • Generated: ' + dateStr + '_\n';
    msg += '─────────────────────────\n\n';

    products.forEach((p, idx) => {
      const media = getProductMedia(p);
      const images = media.images;
      const docs = media.docs;
      msg += '*' + (idx + 1) + '. ' + (p.name || 'Industrial Product') + '*\n';
      msg += '• *SKU:* `' + (p.sku || p.id || 'N/A') + '`\n';
      if (p.brand) msg += '• *Brand:* ' + p.brand + '\n';
      if (p.mpn) msg += '• *MPN:* ' + p.mpn + '\n';
      if (p.category) msg += '• *Category:* ' + p.category + '\n';

      if (p.price != null && p.price !== '') {
        const formattedPrice = '₹' + Number(p.price).toLocaleString('en-IN');
        msg += '• *Price:* ' + formattedPrice + (p.uom ? ' / ' + p.uom : ' / Pc') + '\n';
      } else {
        msg += '• *Price:* Quotation on Request (RFQ)\n';
      }

      if (p.stock != null) {
        msg += '• *Availability:* ' + (p.stock > 0 ? (p.stock + ' in stock') : 'Made to Order / Lead Time') + '\n';
      }
      if (p.moq) msg += '• *MOQ:* ' + p.moq + ' ' + (p.uom || 'units') + '\n';

      if (p.specs && typeof p.specs === 'object') {
        const specEntries = Object.entries(p.specs).filter(([k, v]) => v != null && v !== '');
        if (specEntries.length) {
          msg += '• *Key Specs:*\n';
          specEntries.slice(0, 4).forEach(([k, v]) => {
            msg += '   - ' + k + ': ' + v + '\n';
          });
        }
      }

      if (images.length) {
        msg += '• *Image Preview:* ' + images[0] + '\n';
      }

      if (docs.length) {
        msg += '• *Technical PDF / Datasheet:*\n';
        docs.forEach(d => {
          msg += '   📄 ' + d.title + ': ' + d.url + '\n';
        });
      }

      msg += '\n';
    });

    msg += '─────────────────────────\n';
    msg += 'For official quotes, technical consultations, or volume orders, please reply directly to this message or contact us.\n';
    msg += '*' + companyName + '*';

    return msg;
  }

  function formatProductsEmail(products, companyName) {
    companyName = companyName || 'ARGUS CNC';
    if (!products || !products.length) return { subject: '', body: '' };

    const count = products.length;
    const skuList = products.map(p => p.sku || p.name).slice(0, 3).join(', ') + (count > 3 ? (' +' + (count - 3) + ' more') : '');
    const subject = 'Industrial Product Catalog & Datasheets (' + count + ' SKU' + (count > 1 ? 's' : '') + ': ' + skuList + ') - ' + companyName;

    let body = 'Dear Customer,\n\nPlease find the technical specifications, pricing, and attached datasheets for the selected industrial product(s) from ' + companyName + ':\n\n';
    body += '============================================================\n';

    products.forEach((p, idx) => {
      const media = getProductMedia(p);
      const images = media.images;
      const docs = media.docs;
      body += '[' + (idx + 1) + '] ' + (p.name || 'Industrial SKU') + '\n';
      body += 'SKU: ' + (p.sku || p.id || 'N/A') + '\n';
      if (p.brand) body += 'Brand: ' + p.brand + '\n';
      if (p.mpn) body += 'MPN: ' + p.mpn + '\n';
      if (p.category) body += 'Category: ' + p.category + '\n';

      if (p.price != null && p.price !== '') {
        const formattedPrice = '₹' + Number(p.price).toLocaleString('en-IN');
        body += 'Price: ' + formattedPrice + ' / ' + (p.uom || 'Pc') + '\n';
      } else {
        body += 'Price: Quotation on Request (RFQ)\n';
      }

      if (p.stock != null) body += 'Stock: ' + p.stock + ' ' + (p.uom || 'units') + '\n';
      if (p.moq) body += 'Minimum Order Quantity (MOQ): ' + p.moq + '\n';
      if (p.desc) body += 'Description: ' + p.desc + '\n';

      if (p.specs && typeof p.specs === 'object') {
        const specEntries = Object.entries(p.specs).filter(([k, v]) => v != null && v !== '');
        if (specEntries.length) {
          body += 'Technical Specifications:\n';
          specEntries.forEach(([k, v]) => {
            body += '  - ' + k + ': ' + v + '\n';
          });
        }
      }

      if (images.length) {
        body += 'Product Images:\n';
        images.forEach((img, i) => {
          body += '  - Image ' + (i + 1) + ': ' + img + '\n';
        });
      }

      if (docs.length) {
        body += 'Attached PDF Datasheets / Drawings:\n';
        docs.forEach(d => {
          body += '  - [PDF] ' + d.title + ': ' + d.url + '\n';
        });
      }

      body += '\n------------------------------------------------------------\n\n';
    });

    body += 'If you require CAD files, custom machining tolerances, or a formal GST quotation, please feel free to reach out.\n\nBest regards,\n' + companyName + ' Sales & Engineering Team\n';

    return { subject, body };
  }

  function generateCatalogHtml(products, companyInfo) {
    companyInfo = companyInfo || {};
    const companyName = companyInfo.name || 'ARGUS CNC';
    const companyEmail = companyInfo.email || 'technologiesargus@gmail.com';
    const companyPhone = companyInfo.phone || '+91 98765 43210';
    const dateStr = new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });

    const productCardsHtml = products.map((p, idx) => {
      const media = getProductMedia(p);
      const images = media.images;
      const docs = media.docs;
      const mainImg = images[0] || 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=600&q=80';
      const subImages = images.slice(1, 4);

      let priceHtml = '';
      if (p.price != null && p.price !== '') {
        const formattedPrice = '₹' + Number(p.price).toLocaleString('en-IN');
        priceHtml = '<div class="price-box"><span class="price-val">' + formattedPrice + '</span> <span class="price-uom">/ ' + escapeHtml(p.uom || 'Pc') + '</span></div>';
      } else {
        priceHtml = '<div class="rfq-badge">Quotation On Request (RFQ)</div>';
      }

      let specsHtml = '';
      if (p.specs && typeof p.specs === 'object') {
        const entries = Object.entries(p.specs).filter(([k, v]) => v != null && v !== '');
        if (entries.length) {
          const rows = entries.map(([k, v]) => '<tr><td class="spec-k">' + escapeHtml(k) + '</td><td class="spec-v">' + escapeHtml(String(v)) + '</td></tr>').join('');
          specsHtml = '<div class="specs-section"><div class="section-title">Technical Specifications</div><table class="specs-table"><tbody>' + rows + '</tbody></table></div>';
        }
      }

      let docsHtml = '';
      if (docs.length) {
        const docChips = docs.map(d => '<a class="doc-chip" href="' + escapeHtml(d.url) + '" target="_blank" rel="noopener noreferrer"><svg class="pdf-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg><span class="doc-title">' + escapeHtml(d.title) + '</span><span class="doc-download">Download PDF &rarr;</span></a>').join('');
        docsHtml = '<div class="docs-section"><div class="section-title">Attached Technical Documents & Datasheets</div><div class="doc-grid">' + docChips + '</div></div>';
      }

      return '<div class="product-sheet"><div class="sheet-header"><div><span class="item-num">Item #' + (idx + 1) + '</span><h2 class="product-title">' + escapeHtml(p.name || 'Industrial Component') + '</h2><div class="meta-line"><span>SKU: <b>' + escapeHtml(p.sku || p.id) + '</b></span>' + (p.brand ? ('<span>&bull; Brand: <b>' + escapeHtml(p.brand) + '</b></span>') : '') + (p.mpn ? ('<span>&bull; MPN: <b>' + escapeHtml(p.mpn) + '</b></span>') : '') + (p.category ? ('<span>&bull; Category: <b>' + escapeHtml(p.category) + '</b></span>') : '') + '</div></div>' + priceHtml + '</div><div class="sheet-body"><div class="media-column"><div class="main-image-wrap"><img src="' + escapeHtml(mainImg) + '" alt="' + escapeHtml(p.name) + '" class="main-image" /></div>' + (subImages.length ? ('<div class="thumb-strip">' + subImages.map(img => '<img src="' + escapeHtml(img) + '" alt="" class="sub-image" />').join('') + '</div>') : '') + '</div><div class="details-column">' + (p.desc ? ('<div class="desc-text">' + escapeHtml(p.desc) + '</div>') : '') + '<div class="quick-meta-grid"><div class="quick-meta-item"><span class="qm-label">Availability</span><span class="qm-value ' + (p.stock > 0 ? 'text-green' : 'text-amber') + '">' + (p.stock > 0 ? (p.stock + ' In Stock') : 'Made to Order / RFQ') + '</span></div>' + (p.moq ? ('<div class="quick-meta-item"><span class="qm-label">Min. Order Qty (MOQ)</span><span class="qm-value">' + escapeHtml(String(p.moq)) + ' ' + escapeHtml(p.uom || 'units') + '</span></div>') : '') + (p.leadTime ? ('<div class="quick-meta-item"><span class="qm-label">Lead Time</span><span class="qm-value">' + escapeHtml(p.leadTime) + '</span></div>') : '') + '</div>' + specsHtml + docsHtml + '</div></div></div>';
    }).join('');

    return '<!DOCTYPE html>\n<html lang="en">\n<head>\n  <meta charset="utf-8" />\n  <title>' + escapeHtml(companyName) + ' — Industrial Product Catalog</title>\n  <style>\n    @page { size: A4 portrait; margin: 10mm 12mm 12mm 12mm; }\n    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }\n    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif; color: #1A0A03; background-color: #FFFFFF; line-height: 1.4; font-size: 11pt; -webkit-print-color-adjust: exact; print-color-adjust: exact; }\n    .no-print-bar { position: sticky; top: 0; z-index: 999; background: #2E1508; color: #FFFFFF; padding: 12px 24px; display: flex; justify-content: space-between; align-items: center; box-shadow: 0 4px 12px rgba(0,0,0,0.2); }\n    .no-print-bar button { background: #E5A93C; color: #1A0A03; border: none; padding: 8px 18px; border-radius: 6px; font-weight: 700; font-size: 13px; cursor: pointer; }\n    @media print { .no-print-bar { display: none !important; } }\n    .container { max-width: 960px; margin: 0 auto; padding: 16px 20px 40px; }\n    .catalog-header { display: flex; justify-content: space-between; align-items: flex-end; padding-bottom: 12px; margin-bottom: 24px; border-bottom: 3px solid #2E1508; }\n    .co-title { font-size: 22pt; font-weight: 900; color: #2E1508; letter-spacing: -0.5px; }\n    .co-sub { font-size: 10.5pt; color: #6B503E; font-weight: 600; }\n    .doc-meta { text-align: right; font-size: 9pt; color: #6B503E; }\n    .product-sheet { page-break-inside: avoid; break-inside: avoid; border: 1.5px solid #BAA794; border-radius: 10px; margin-bottom: 22px; background: #FFFFFF; overflow: hidden; }\n    .sheet-header { background: #DECDBE; border-bottom: 1.5px solid #BAA794; padding: 10px 16px; display: flex; justify-content: space-between; align-items: center; }\n    .item-num { display: inline-block; font-size: 8pt; font-weight: 800; text-transform: uppercase; background: #2E1508; color: #FFFFFF; padding: 2px 6px; border-radius: 4px; margin-bottom: 3px; }\n    .product-title { font-size: 14pt; font-weight: 800; color: #1A0A03; margin: 0 0 3px 0; }\n    .meta-line { font-size: 9pt; color: #5C3D2E; display: flex; gap: 8px; }\n    .price-box { text-align: right; }\n    .price-val { font-size: 16pt; font-weight: 900; color: #1A0A03; }\n    .price-uom { font-size: 9pt; color: #5C3D2E; }\n    .rfq-badge { font-size: 9pt; font-weight: 800; color: #B45309; background: #FEF3C7; padding: 4px 10px; border-radius: 6px; border: 1px solid #FCD34D; }\n    .sheet-body { display: grid; grid-template-columns: 240px 1fr; gap: 16px; padding: 14px 16px; }\n    .main-image-wrap { width: 100%; height: 200px; border: 1px solid #EAE0D5; border-radius: 8px; background: #FAF6F1; display: flex; align-items: center; justify-content: center; overflow: hidden; }\n    .main-image { max-width: 100%; max-height: 100%; object-fit: contain; }\n    .thumb-strip { display: flex; gap: 6px; margin-top: 6px; }\n    .sub-image { width: 48px; height: 48px; object-fit: cover; border-radius: 4px; border: 1px solid #EAE0D5; }\n    .desc-text { font-size: 9.5pt; color: #334155; margin-bottom: 10px; line-height: 1.45; }\n    .quick-meta-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(130px, 1fr)); gap: 8px; background: #FAF6F1; border: 1px solid #EAE0D5; border-radius: 6px; padding: 8px 12px; margin-bottom: 10px; }\n    .quick-meta-item { display: flex; flex-direction: column; }\n    .qm-label { font-size: 7.5pt; text-transform: uppercase; color: #78350F; font-weight: 700; }\n    .qm-value { font-size: 9.5pt; font-weight: 700; color: #1A0A03; }\n    .text-green { color: #15803D; }\n    .text-amber { color: #B45309; }\n    .specs-section, .docs-section { margin-top: 8px; }\n    .section-title { font-size: 8.5pt; font-weight: 800; text-transform: uppercase; letter-spacing: 0.5px; color: #5C3D2E; margin-bottom: 4px; border-bottom: 1px dashed #D4C2B0; padding-bottom: 2px; }\n    .specs-table { width: 100%; font-size: 8.5pt; border-collapse: collapse; }\n    .specs-table td { padding: 3px 6px; border-bottom: 1px solid #F1F5F9; }\n    .spec-k { width: 38%; font-weight: 600; color: #475569; }\n    .spec-v { font-weight: 700; color: #0F172A; }\n    .doc-grid { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 4px; }\n    .doc-chip { display: inline-flex; align-items: center; gap: 5px; background: #FFFBEB; border: 1px solid #FDE68A; color: #92400E; padding: 3px 8px; border-radius: 5px; font-size: 8pt; font-weight: 600; text-decoration: none; }\n    .pdf-icon { width: 12px; height: 12px; stroke: #DC2626; }\n    .catalog-footer { border-top: 1.5px solid #BAA794; padding-top: 12px; text-align: center; font-size: 8.5pt; color: #6B503E; margin-top: 20px; }\n  </style>\n</head>\n<body>\n  <div class="no-print-bar">\n    <div style="font-weight: 700; font-size: 14px;">📄 ' + escapeHtml(companyName) + ' &bull; ' + products.length + ' SKU Catalog Preview</div>\n    <div style="display: flex; gap: 8px;"><button onclick="window.print()">🖨️ Print / Save as PDF</button><button style="background: transparent; color: #FFF; border: 1px solid #8F6A52;" onclick="window.close()">Close</button></div>\n  </div>\n  <div class="container">\n    <div class="catalog-header"><div><div class="co-title">' + escapeHtml(companyName) + '</div><div class="co-sub">Industrial Machining & Component Catalog</div></div><div class="doc-meta"><div>Date: <b>' + dateStr + '</b></div><div>Total Items: <b>' + products.length + ' SKU' + (products.length > 1 ? 's' : '') + '</b></div><div>Contact: <b>' + escapeHtml(companyEmail) + '</b></div></div></div>\n    ' + productCardsHtml + '\n    <div class="catalog-footer"><div>Generated for client technical evaluation by ' + escapeHtml(companyName) + '.</div><div>Email: ' + escapeHtml(companyEmail) + ' | Phone: ' + escapeHtml(companyPhone) + '</div></div>\n  </div>\n</body>\n</html>';
  }

  function exportProductsPdf(products, companyInfo) {
    const html = generateCatalogHtml(products, companyInfo);
    const printWin = window.open('', '_blank');
    if (!printWin) {
      alert('Please allow popups to open and print the product catalog PDF.');
      return;
    }
    printWin.document.open();
    printWin.document.write(html);
    printWin.document.close();

    setTimeout(() => {
      try {
        printWin.focus();
        printWin.print();
      } catch (e) {
        console.warn('Print trigger warning:', e);
      }
    }, 400);
  }

  window.ProductShare = {
    getProductMedia,
    formatProductsWhatsApp,
    formatProductsEmail,
    generateCatalogHtml,
    exportProductsPdf
  };
})(window);
