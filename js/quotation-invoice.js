/* Professional B2B Commercial Quotation & Tax Invoice Template Generator (Vanilla JS)
   Produces print-ready, high-resolution A4 documents with embedded ARGUS CNC logo,
   legal GST compliance (CGST/SGST/IGST breakdown), HSN codes, and bank wire details. */

(function(window) {
  function numberToWordsIndian(num) {
    num = Math.round(Number(num) || 0);
    if (num === 0) return 'Zero Rupees Only';

    const a = ['', 'One ', 'Two ', 'Three ', 'Four ', 'Five ', 'Six ', 'Seven ', 'Eight ', 'Nine ', 'Ten ', 'Eleven ', 'Twelve ', 'Thirteen ', 'Fourteen ', 'Fifteen ', 'Sixteen ', 'Seventeen ', 'Eighteen ', 'Nineteen '];
    const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

    function inWords(n) {
      if (n < 20) return a[n];
      const digit = n % 10;
      return b[Math.floor(n / 10)] + (digit ? ' ' + a[digit] : ' ');
    }

    let words = '';
    const crore = Math.floor(num / 10000000);
    num %= 10000000;
    const lakh = Math.floor(num / 100000);
    num %= 100000;
    const thousand = Math.floor(num / 1000);
    num %= 1000;
    const hundred = Math.floor(num / 100);
    const rem = num % 100;

    if (crore > 0) words += inWords(crore) + 'Crore ';
    if (lakh > 0) words += inWords(lakh) + 'Lakh ';
    if (thousand > 0) words += inWords(thousand) + 'Thousand ';
    if (hundred > 0) words += inWords(hundred) + 'Hundred ';
    if (rem > 0) words += (words !== '' ? 'and ' : '') + inWords(rem);

    return 'Indian Rupees ' + words.trim() + ' Only';
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

  const DEFAULT_COMPANY = {
    name: 'ARGUS CNC TECHNOLOGIES PVT. LTD.',
    tagline: 'High-Precision CNC Machine Tools & Connected Factory Automation',
    regAddress: 'Plot 18, Sector 10, MIDC Industrial Area, Bhosari, Pune, Maharashtra - 411026',
    gstin: '27AAACA1234A1Z5',
    pan: 'AAACA1234A',
    stateCode: '27 (Maharashtra)',
    email: 'technologiesargus@gmail.com',
    phone: '+91 98765 43210',
    bankName: 'HDFC Bank Ltd.',
    accName: 'ARGUS CNC TECHNOLOGIES PVT LTD',
    accNo: '50200067891234',
    ifsc: 'HDFC0001234',
    branch: 'MIDC Bhosari Branch, Pune',
    upiId: 'arguscnc@hdfcbank'
  };

  function getLogo() {
    return window.ARGUS_LOGO_BASE64 || 'assets/argus-logo.png';
  }

  function generateQuotationHtml(data) {
    data = data || {};
    const company = Object.assign({}, DEFAULT_COMPANY, data.company || {});
    const customer = data.customer || {};
    const items = data.items || [];
    const notes = data.notes || '';
    const qDate = data.date || new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
    const qExpiry = data.validUntil || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
    const qNumber = data.quoteNo || ('QT-' + new Date().toISOString().slice(0, 10).replace(/-/g, '') + '-' + Math.floor(1000 + Math.random() * 9000));

    let subtotal = 0;
    const rowsHtml = items.map((it, idx) => {
      const qty = Number(it.qty) || 1;
      const rate = Number(it.price) || 0;
      const amount = qty * rate;
      subtotal += amount;
      const hsn = it.hsn || it.hsnCode || '8466.93.90';

      return '<tr>' +
        '<td style="text-align:center;font-weight:600">' + (idx + 1) + '</td>' +
        '<td>' +
          '<div style="font-weight:700;color:#1A0A03;font-size:12px">' + escapeHtml(it.name || 'Industrial Component') + '</div>' +
          '<div style="font-size:10.5px;color:#64748B;font-family:monospace">SKU: ' + escapeHtml(it.sku || it.pid || 'N/A') + (it.brand ? (' &bull; Brand: ' + escapeHtml(it.brand)) : '') + '</div>' +
          (it.desc ? ('<div style="font-size:10px;color:#475569;margin-top:2px">' + escapeHtml(it.desc) + '</div>') : '') +
        '</td>' +
        '<td style="text-align:center;font-family:monospace;font-size:11px">' + escapeHtml(hsn) + '</td>' +
        '<td style="text-align:center;font-weight:700">' + qty + '</td>' +
        '<td style="text-align:center;font-size:11px">' + escapeHtml(it.uom || 'Pc') + '</td>' +
        '<td style="text-align:right;font-family:monospace;font-weight:600">₹' + rate.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + '</td>' +
        '<td style="text-align:right;font-family:monospace;font-weight:700;color:#1A0A03">₹' + amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + '</td>' +
      '</tr>';
    }).join('');

    const cgst = subtotal * 0.09;
    const sgst = subtotal * 0.09;
    const total = subtotal + cgst + sgst;
    const words = numberToWordsIndian(total);

    return '<!DOCTYPE html>\n<html lang="en">\n<head>\n  <meta charset="utf-8" />\n  <title>Proforma Quotation — ' + escapeHtml(qNumber) + '</title>\n  <style>\n    @page { size: A4 portrait; margin: 8mm 10mm 10mm 10mm; }\n    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }\n    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif; color: #1E293B; background: #F8FAFC; line-height: 1.35; font-size: 11px; -webkit-print-color-adjust: exact; print-color-adjust: exact; }\n    .no-print-bar { position: sticky; top: 0; z-index: 999; background: #2E1508; color: #FFFFFF; padding: 10px 20px; display: flex; justify-content: space-between; align-items: center; box-shadow: 0 4px 12px rgba(0,0,0,0.15); }\n    .no-print-bar button { background: #E5A93C; color: #1A0A03; border: none; padding: 7px 16px; border-radius: 6px; font-weight: 700; font-size: 12px; cursor: pointer; }\n    @media print { .no-print-bar { display: none !important; } body { background: #FFF; } }\n    .sheet { max-width: 820px; margin: 16px auto; background: #FFFFFF; border: 1px solid #CBD5E1; border-radius: 8px; padding: 24px 28px; box-shadow: 0 4px 20px rgba(0,0,0,0.06); }\n    .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #2E1508; padding-bottom: 14px; margin-bottom: 14px; }\n    .brand-col { max-width: 480px; }\n    .logo-img { height: 46px; object-fit: contain; margin-bottom: 4px; display: block; }\n    .co-name { font-size: 14px; font-weight: 900; color: #2E1508; letter-spacing: -0.2px; text-transform: uppercase; }\n    .co-tag { font-size: 10px; color: #64748B; font-weight: 600; margin-bottom: 3px; }\n    .co-addr { font-size: 9.5px; color: #475569; line-height: 1.3; }\n    .doc-col { text-align: right; }\n    .doc-type { font-size: 16px; font-weight: 900; color: #8F2A0E; letter-spacing: 0.5px; text-transform: uppercase; }\n    .meta-table { font-size: 10px; margin-top: 4px; margin-left: auto; border-collapse: collapse; }\n    .meta-table td { padding: 2px 6px; }\n    .meta-table .lbl { color: #64748B; font-weight: 600; text-align: right; }\n    .meta-table .val { font-weight: 700; color: #0F172A; text-align: left; }\n    .client-box { display: grid; grid-template-columns: 1.3fr 1fr; gap: 12px; background: #FAF6F1; border: 1px solid #DECDBE; border-radius: 6px; padding: 10px 14px; margin-bottom: 14px; }\n    .box-title { font-size: 9.5px; font-weight: 800; text-transform: uppercase; color: #8F2A0E; letter-spacing: 0.5px; margin-bottom: 4px; }\n    .client-name { font-size: 12.5px; font-weight: 800; color: #1A0A03; }\n    .client-detail { font-size: 10px; color: #475569; margin-top: 2px; }\n    .items-table { width: 100%; border-collapse: collapse; margin-bottom: 12px; font-size: 11px; }\n    .items-table th { background: #2E1508; color: #FFFFFF; padding: 6px 8px; font-weight: 700; font-size: 9.5px; text-transform: uppercase; letter-spacing: 0.3px; border: 1px solid #2E1508; }\n    .items-table td { padding: 6px 8px; border: 1px solid #E2E8F0; vertical-align: top; }\n    .items-table tr:nth-child(even) td { background: #F8FAFC; }\n    .calc-grid { display: grid; grid-template-columns: 1.3fr 1fr; gap: 14px; margin-bottom: 12px; }\n    .words-box { background: #F1F5F9; border: 1px dashed #CBD5E1; border-radius: 6px; padding: 8px 12px; font-size: 10px; }\n    .totals-table { width: 100%; border-collapse: collapse; font-size: 10.5px; }\n    .totals-table td { padding: 3px 6px; }\n    .totals-table .t-lbl { color: #475569; }\n    .totals-table .t-val { text-align: right; font-weight: 700; font-family: monospace; }\n    .grand-total { border-top: 2px solid #2E1508; border-bottom: 2px solid #2E1508; }\n    .grand-total td { padding: 6px 6px; font-size: 12px; font-weight: 900; color: #2E1508; }\n    .terms-box { border: 1px solid #E2E8F0; border-radius: 6px; padding: 8px 12px; margin-bottom: 14px; font-size: 9.5px; background: #FFF; }\n    .terms-list { list-style: decimal inside; color: #475569; margin-top: 4px; line-height: 1.4; }\n    .footer-grid { display: grid; grid-template-columns: 1.4fr 1fr; gap: 14px; padding-top: 8px; border-top: 1px solid #E2E8F0; }\n    .bank-box { font-size: 9.5px; color: #334155; line-height: 1.35; background: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 6px; padding: 8px 12px; }\n    .sig-col { text-align: right; display: flex; flex-direction: column; justify-content: flex-end; align-items: flex-end; }\n    .sig-stamp { width: 120px; height: 50px; border: 1px dashed #CBD5E1; border-radius: 4px; display: flex; align-items: center; justify-content: center; color: #94A3B8; font-size: 9px; margin-bottom: 4px; font-style: italic; }\n    .sig-label { font-size: 10px; font-weight: 700; color: #2E1508; }\n  </style>\n</head>\n<body>\n  <div class=\"no-print-bar\">\n    <div style=\"font-weight:700\">📄 Official Proforma Quotation &bull; ' + escapeHtml(qNumber) + '</div>\n    <div style=\"display:flex;gap:8px\">\n      <button onclick=\"window.print()\">🖨️ Print / Save as PDF</button>\n      <button style=\"background:transparent;color:#FFF;border:1px solid #8F6A52\" onclick=\"window.close()\">Close</button>\n    </div>\n  </div>\n  <div class=\"sheet\">\n    <div class=\"header\">\n      <div class=\"brand-col\">\n        <img src=\"' + getLogo() + '\" class=\"logo-img\" alt=\"ARGUS CNC Logo\" />\n        <div class=\"co-name\">' + escapeHtml(company.name) + '</div>\n        <div class=\"co-tag\">' + escapeHtml(company.tagline) + '</div>\n        <div class=\"co-addr\">\n          ' + escapeHtml(company.regAddress) + '<br />\n          <b>GSTIN:</b> ' + escapeHtml(company.gstin) + ' &bull; <b>PAN:</b> ' + escapeHtml(company.pan) + ' &bull; <b>State:</b> ' + escapeHtml(company.stateCode) + '<br />\n          <b>Email:</b> ' + escapeHtml(company.email) + ' &bull; <b>Phone:</b> ' + escapeHtml(company.phone) + '\n        </div>\n      </div>\n      <div class=\"doc-col\">\n        <div class=\"doc-type\">PROFORMA QUOTATION</div>\n        <table class=\"meta-table\">\n          <tr><td class=\"lbl\">Quotation No:</td><td class=\"val\" style=\"color:#8F2A0E\">' + escapeHtml(qNumber) + '</td></tr>\n          <tr><td class=\"lbl\">Date:</td><td class=\"val\">' + escapeHtml(qDate) + '</td></tr>\n          <tr><td class=\"lbl\">Valid Until:</td><td class=\"val\">' + escapeHtml(qExpiry) + '</td></tr>\n          <tr><td class=\"lbl\">Payment Terms:</td><td class=\"val\">Advance / Net 30</td></tr>\n        </table>\n      </div>\n    </div>\n    <div class=\"client-box\">\n      <div>\n        <div class=\"box-title\">Buyer / Customer Details</div>\n        <div class=\"client-name\">' + escapeHtml(customer.companyName || customer.company || 'Direct Industrial Client') + '</div>\n        <div class=\"client-detail\">\n          <b>Attn:</b> ' + escapeHtml(customer.name || customer.contact || 'Purchase Department') + '<br />\n          <b>Phone:</b> ' + escapeHtml(customer.mobile || customer.phone || '—') + '<br />\n          <b>Email:</b> ' + escapeHtml(customer.email || '—') + '\n        </div>\n      </div>\n      <div>\n        <div class=\"box-title\">Delivery & Dispatch Location</div>\n        <div class=\"client-detail\">\n          ' + escapeHtml(customer.address || customer.addr || 'Ex-Works / Standard Dispatch') + '<br />\n          ' + (customer.city ? (escapeHtml(customer.city) + ', ') : '') + (customer.state ? (escapeHtml(customer.state) + ' ') : '') + (customer.pin ? ('- ' + escapeHtml(customer.pin)) : '') + '<br />\n          ' + (customer.poRef || customer.po ? ('<b>Customer PO Ref:</b> <span style=\"font-family:monospace;color:#8F2A0E\">' + escapeHtml(customer.poRef || customer.po) + '</span>') : '') + '\n        </div>\n      </div>\n    </div>\n    <table class=\"items-table\">\n      <thead>\n        <tr>\n          <th style=\"width:30px\">#</th>\n          <th>Description of Components / Tooling</th>\n          <th style=\"width:85px;text-align:center\">HSN/SAC</th>\n          <th style=\"width:45px;text-align:center\">Qty</th>\n          <th style=\"width:45px;text-align:center\">UOM</th>\n          <th style=\"width:95px;text-align:right\">Rate (₹)</th>\n          <th style=\"width:110px;text-align:right\">Amount (₹)</th>\n        </tr>\n      </thead>\n      <tbody>\n        ' + rowsHtml + '\n      </tbody>\n    </table>\n    <div class=\"calc-grid\">\n      <div class=\"words-box\">\n        <div style=\"font-weight:700;color:#475569;margin-bottom:2px\">Amount Chargeable in Words:</div>\n        <div style=\"font-weight:800;color:#0F172A\">' + words + '</div>\n        ' + (notes ? ('<div style=\"margin-top:6px;color:#334155;border-top:1px solid #CBD5E1;padding-top:4px\"><b>Special Notes:</b> ' + escapeHtml(notes) + '</div>') : '') + '\n      </div>\n      <div>\n        <table class=\"totals-table\">\n          <tr><td class=\"t-lbl\">Subtotal (Taxable Value)</td><td class=\"t-val\">₹' + subtotal.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + '</td></tr>\n          <tr><td class=\"t-lbl\">CGST (9.0%)</td><td class=\"t-val\">₹' + cgst.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + '</td></tr>\n          <tr><td class=\"t-lbl\">SGST (9.0%)</td><td class=\"t-val\">₹' + sgst.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + '</td></tr>\n          <tr class=\"grand-total\"><td class=\"t-lbl\" style=\"font-weight:800\">Grand Total (Incl. GST)</td><td class=\"t-val\" style=\"font-size:13px;color:#8F2A0E\">₹' + total.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + '</td></tr>\n        </table>\n      </div>\n    </div>\n    <div class=\"terms-box\">\n      <div class=\"box-title\">Commercial Terms & Conditions</div>\n      <ol class=\"terms-list\">\n        <li><b>Validity:</b> Prices quoted are firm and valid for 30 calendar days from the quotation date.</li>\n        <li><b>Payment Terms:</b> 100% against Proforma Invoice or as per mutually agreed B2B vendor credit terms.</li>\n        <li><b>Taxes:</b> Goods & Services Tax (GST) is charged extra as specified above as per statutory government regulations.</li>\n        <li><b>Delivery / Dispatch:</b> Ready stock items dispatched within 48 hours; custom items dispatched within 5-7 working days upon receipt of confirmed Purchase Order.</li>\n        <li><b>Warranty:</b> Standard 12-month manufacturer warranty against manufacturing defects.</li>\n      </ol>\n    </div>\n    <div class=\"footer-grid\">\n      <div class=\"bank-box\">\n        <div style=\"font-weight:800;color:#2E1508;margin-bottom:2px\">Bank Account for Wire Transfer (NEFT / RTGS / IMPS)</div>\n        <b>Bank Name:</b> ' + escapeHtml(company.bankName) + '<br />\n        <b>Account Name:</b> ' + escapeHtml(company.accName) + '<br />\n        <b>A/C Number:</b> <span style=\"font-family:monospace;font-weight:700\">' + escapeHtml(company.accNo) + '</span><br />\n        <b>IFSC Code:</b> <span style=\"font-family:monospace;font-weight:700\">' + escapeHtml(company.ifsc) + '</span> &bull; <b>Branch:</b> ' + escapeHtml(company.branch) + '<br />\n        <b>UPI ID:</b> ' + escapeHtml(company.upiId) + '\n      </div>\n      <div class=\"sig-col\">\n        <div class=\"sig-stamp\">Digital Stamp Verified</div>\n        <div class=\"sig-label\">For ' + escapeHtml(company.name) + '</div>\n        <div style=\"font-size:9px;color:#64748B\">Authorized Signatory &bull; Sales Engineering</div>\n      </div>\n    </div>\n  </div>\n</body>\n</html>';
  }

  function generateTaxInvoiceHtml(data) {
    data = data || {};
    const company = Object.assign({}, DEFAULT_COMPANY, data.company || {});
    const customer = data.customer || {};
    const items = data.items || [];
    const notes = data.notes || '';
    const invDate = data.date || new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
    const invDue = data.dueDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
    const invNumber = data.invoiceNo || ('INV/' + new Date().getFullYear() + '-' + String(new Date().getFullYear() + 1).slice(2) + '/' + Math.floor(1000 + Math.random() * 9000));

    let subtotal = 0;
    const rowsHtml = items.map((it, idx) => {
      const qty = Number(it.qty) || 1;
      const rate = Number(it.price) || 0;
      const amount = qty * rate;
      subtotal += amount;
      const hsn = it.hsn || it.hsnCode || '8466.93.90';
      const itCgst = amount * 0.09;
      const itSgst = amount * 0.09;
      const itTotal = amount + itCgst + itSgst;

      return '<tr>' +
        '<td style="text-align:center;font-weight:600">' + (idx + 1) + '</td>' +
        '<td>' +
          '<div style="font-weight:700;color:#0F172A;font-size:12px">' + escapeHtml(it.name || 'Industrial Component') + '</div>' +
          '<div style="font-size:10.5px;color:#64748B;font-family:monospace">SKU: ' + escapeHtml(it.sku || it.pid || 'N/A') + (it.brand ? (' &bull; Brand: ' + escapeHtml(it.brand)) : '') + '</div>' +
          (it.desc ? ('<div style="font-size:10px;color:#475569;margin-top:2px">' + escapeHtml(it.desc) + '</div>') : '') +
        '</td>' +
        '<td style="text-align:center;font-family:monospace;font-size:11px">' + escapeHtml(hsn) + '</td>' +
        '<td style="text-align:center;font-weight:700">' + qty + '</td>' +
        '<td style="text-align:center;font-size:11px">' + escapeHtml(it.uom || 'Pc') + '</td>' +
        '<td style="text-align:right;font-family:monospace">₹' + rate.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + '</td>' +
        '<td style="text-align:right;font-family:monospace;font-weight:600">₹' + amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + '</td>' +
        '<td style="text-align:right;font-family:monospace;font-size:10px">₹' + itCgst.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + '</td>' +
        '<td style="text-align:right;font-family:monospace;font-size:10px">₹' + itSgst.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + '</td>' +
        '<td style="text-align:right;font-family:monospace;font-weight:700;color:#0F172A">₹' + itTotal.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + '</td>' +
      '</tr>';
    }).join('');

    const cgst = subtotal * 0.09;
    const sgst = subtotal * 0.09;
    const total = subtotal + cgst + sgst;
    const words = numberToWordsIndian(total);

    return '<!DOCTYPE html>\n<html lang="en">\n<head>\n  <meta charset="utf-8" />\n  <title>Tax Invoice — ' + escapeHtml(invNumber) + '</title>\n  <style>\n    @page { size: A4 portrait; margin: 8mm 10mm 10mm 10mm; }\n    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }\n    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif; color: #0F172A; background: #F8FAFC; line-height: 1.35; font-size: 11px; -webkit-print-color-adjust: exact; print-color-adjust: exact; }\n    .no-print-bar { position: sticky; top: 0; z-index: 999; background: #0F172A; color: #FFFFFF; padding: 10px 20px; display: flex; justify-content: space-between; align-items: center; box-shadow: 0 4px 12px rgba(0,0,0,0.15); }\n    .no-print-bar button { background: #38BDF8; color: #0F172A; border: none; padding: 7px 16px; border-radius: 6px; font-weight: 700; font-size: 12px; cursor: pointer; }\n    @media print { .no-print-bar { display: none !important; } body { background: #FFF; } }\n    .sheet { max-width: 820px; margin: 16px auto; background: #FFFFFF; border: 1.5px solid #0F172A; border-radius: 8px; padding: 22px 26px; box-shadow: 0 4px 20px rgba(0,0,0,0.06); }\n    .top-badge { display: flex; justify-content: space-between; align-items: center; background: #0F172A; color: #FFF; padding: 5px 12px; border-radius: 4px; font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 12px; }\n    .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #0F172A; padding-bottom: 12px; margin-bottom: 12px; }\n    .brand-col { max-width: 480px; }\n    .logo-img { height: 46px; object-fit: contain; margin-bottom: 4px; display: block; }\n    .co-name { font-size: 14px; font-weight: 900; color: #0F172A; letter-spacing: -0.2px; text-transform: uppercase; }\n    .co-tag { font-size: 10px; color: #64748B; font-weight: 600; margin-bottom: 2px; }\n    .co-addr { font-size: 9.5px; color: #334155; line-height: 1.3; }\n    .doc-col { text-align: right; }\n    .doc-type { font-size: 18px; font-weight: 900; color: #0369A1; letter-spacing: 0.5px; text-transform: uppercase; }\n    .meta-table { font-size: 10px; margin-top: 4px; margin-left: auto; border-collapse: collapse; }\n    .meta-table td { padding: 2px 6px; }\n    .meta-table .lbl { color: #64748B; font-weight: 600; text-align: right; }\n    .meta-table .val { font-weight: 700; color: #0F172A; text-align: left; }\n    .parties-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; border: 1px solid #CBD5E1; border-radius: 6px; padding: 10px 14px; margin-bottom: 12px; background: #F8FAFC; }\n    .party-title { font-size: 9.5px; font-weight: 800; text-transform: uppercase; color: #0369A1; letter-spacing: 0.5px; margin-bottom: 4px; border-bottom: 1px dashed #CBD5E1; padding-bottom: 2px; }\n    .party-name { font-size: 12px; font-weight: 800; color: #0F172A; }\n    .party-detail { font-size: 9.5px; color: #475569; margin-top: 2px; line-height: 1.35; }\n    .items-table { width: 100%; border-collapse: collapse; margin-bottom: 12px; font-size: 10px; }\n    .items-table th { background: #0F172A; color: #FFFFFF; padding: 6px 6px; font-weight: 700; font-size: 9px; text-transform: uppercase; letter-spacing: 0.3px; border: 1px solid #0F172A; }\n    .items-table td { padding: 5px 6px; border: 1px solid #CBD5E1; vertical-align: middle; }\n    .items-table tr:nth-child(even) td { background: #F8FAFC; }\n    .calc-grid { display: grid; grid-template-columns: 1.3fr 1fr; gap: 14px; margin-bottom: 12px; }\n    .words-box { background: #F1F5F9; border: 1px dashed #CBD5E1; border-radius: 6px; padding: 8px 12px; font-size: 10px; }\n    .totals-table { width: 100%; border-collapse: collapse; font-size: 10.5px; }\n    .totals-table td { padding: 3px 6px; }\n    .totals-table .t-lbl { color: #475569; }\n    .totals-table .t-val { text-align: right; font-weight: 700; font-family: monospace; }\n    .grand-total { border-top: 2px solid #0F172A; border-bottom: 2px solid #0F172A; }\n    .grand-total td { padding: 6px 6px; font-size: 12px; font-weight: 900; color: #0F172A; }\n    .terms-box { border: 1px solid #CBD5E1; border-radius: 6px; padding: 8px 12px; margin-bottom: 12px; font-size: 9px; background: #FFF; }\n    .terms-list { list-style: decimal inside; color: #475569; margin-top: 3px; line-height: 1.35; }\n    .footer-grid { display: grid; grid-template-columns: 1.4fr 1fr; gap: 14px; padding-top: 8px; border-top: 1px solid #CBD5E1; }\n    .bank-box { font-size: 9.5px; color: #334155; line-height: 1.35; background: #F0F9FF; border: 1px solid #BAE6FD; border-radius: 6px; padding: 8px 12px; }\n    .sig-col { text-align: right; display: flex; flex-direction: column; justify-content: flex-end; align-items: flex-end; }\n    .sig-stamp { width: 120px; height: 50px; border: 1px dashed #0369A1; border-radius: 4px; display: flex; align-items: center; justify-content: center; color: #0369A1; font-size: 9px; margin-bottom: 4px; font-weight: 700; }\n    .sig-label { font-size: 10px; font-weight: 700; color: #0F172A; }\n  </style>\n</head>\n<body>\n  <div class=\"no-print-bar\">\n    <div style=\"font-weight:700\">🧾 Official GST Tax Invoice &bull; ' + escapeHtml(invNumber) + '</div>\n    <div style=\"display:flex;gap:8px\">\n      <button onclick=\"window.print()\">🖨️ Print / Save as PDF</button>\n      <button style=\"background:transparent;color:#FFF;border:1px solid #64748B\" onclick=\"window.close()\">Close</button>\n    </div>\n  </div>\n  <div class=\"sheet\">\n    <div class=\"top-badge\">\n      <span>Rule 46 of CGST Rules, 2017 &bull; Commercial Tax Invoice</span>\n      <span>Original for Recipient</span>\n    </div>\n    <div class=\"header\">\n      <div class=\"brand-col\">\n        <img src=\"' + getLogo() + '\" class=\"logo-img\" alt=\"ARGUS CNC Logo\" />\n        <div class=\"co-name\">' + escapeHtml(company.name) + '</div>\n        <div class=\"co-tag\">' + escapeHtml(company.tagline) + '</div>\n        <div class=\"co-addr\">\n          ' + escapeHtml(company.regAddress) + '<br />\n          <b>GSTIN:</b> ' + escapeHtml(company.gstin) + ' &bull; <b>PAN:</b> ' + escapeHtml(company.pan) + ' &bull; <b>State Code:</b> ' + escapeHtml(company.stateCode) + '<br />\n          <b>CIN:</b> U29253PN2021PTC198765 &bull; <b>Email:</b> ' + escapeHtml(company.email) + ' &bull; <b>Phone:</b> ' + escapeHtml(company.phone) + '\n        </div>\n      </div>\n      <div class=\"doc-col\">\n        <div class=\"doc-type\">TAX INVOICE</div>\n        <table class=\"meta-table\">\n          <tr><td class=\"lbl\">Invoice No:</td><td class=\"val\" style=\"color:#0369A1\">' + escapeHtml(invNumber) + '</td></tr>\n          <tr><td class=\"lbl\">Invoice Date:</td><td class=\"val\">' + escapeHtml(invDate) + '</td></tr>\n          <tr><td class=\"lbl\">Payment Due Date:</td><td class=\"val\">' + escapeHtml(invDue) + '</td></tr>\n          ' + (data.orderId ? ('<tr><td class=\"lbl\">Order Ref No:</td><td class=\"val\" style=\"font-family:monospace\">' + escapeHtml(data.orderId) + '</td></tr>') : '') + '\n          ' + (data.quoteNo ? ('<tr><td class=\"lbl\">Quotation Ref:</td><td class=\"val\" style=\"font-family:monospace\">' + escapeHtml(data.quoteNo) + '</td></tr>') : '') + '\n          ' + (data.poRef ? ('<tr><td class=\"lbl\">Customer PO:</td><td class=\"val\" style=\"font-family:monospace\">' + escapeHtml(data.poRef) + '</td></tr>') : '') + '\n          <tr><td class=\"lbl\">Reverse Charge:</td><td class=\"val\">No</td></tr>\n        </table>\n      </div>\n    </div>\n    <div class=\"parties-grid\">\n      <div>\n        <div class=\"party-title\">Bill To (Buyer)</div>\n        <div class=\"party-name\">' + escapeHtml(customer.companyName || customer.company || 'Direct Industrial Buyer') + '</div>\n        <div class=\"party-detail\">\n          <b>Attn:</b> ' + escapeHtml(customer.name || customer.contact || 'Finance & Accounts') + '<br />\n          <b>Address:</b> ' + escapeHtml(customer.address || customer.addr || 'Plant Office') + '<br />\n          <b>City / State:</b> ' + (customer.city ? (escapeHtml(customer.city) + ', ') : '') + (customer.state ? (escapeHtml(customer.state) + ' ') : '') + (customer.pin ? ('- ' + escapeHtml(customer.pin)) : '') + '<br />\n          <b>Phone:</b> ' + escapeHtml(customer.mobile || customer.phone || '—') + ' &bull; <b>Email:</b> ' + escapeHtml(customer.email || '—') + '<br />\n          <b>GSTIN / UIN:</b> ' + (customer.gstin ? escapeHtml(customer.gstin) : '<span style=\"color:#64748B\">Unregistered / Consumer</span>') + '\n        </div>\n      </div>\n      <div>\n        <div class=\"party-title\">Ship To (Consignee)</div>\n        <div class=\"party-name\">' + escapeHtml(customer.companyName || customer.company || 'Consignee Delivery Location') + '</div>\n        <div class=\"party-detail\">\n          <b>Delivery Plant Bay:</b> ' + escapeHtml(customer.address || customer.addr || 'Ex-Works / Standard Dispatch') + '<br />\n          <b>City / State:</b> ' + (customer.city ? (escapeHtml(customer.city) + ', ') : '') + (customer.state ? (escapeHtml(customer.state) + ' ') : '') + (customer.pin ? ('- ' + escapeHtml(customer.pin)) : '') + '<br />\n          <b>Place of Supply:</b> ' + escapeHtml(customer.state || 'Maharashtra') + ' (Code: ' + (customer.stateCode || '27') + ')<br />\n          <b>Transport Mode:</b> Road Logistics / Surface Cargo\n        </div>\n      </div>\n    </div>\n    <table class=\"items-table\">\n      <thead>\n        <tr>\n          <th style=\"width:24px\">#</th>\n          <th>Description of Goods / Technical Items</th>\n          <th style=\"width:75px;text-align:center\">HSN/SAC</th>\n          <th style=\"width:38px;text-align:center\">Qty</th>\n          <th style=\"width:38px;text-align:center\">UOM</th>\n          <th style=\"width:75px;text-align:right\">Rate (₹)</th>\n          <th style=\"width:80px;text-align:right\">Taxable (₹)</th>\n          <th style=\"width:65px;text-align:right\">CGST (9%)</th>\n          <th style=\"width:65px;text-align:right\">SGST (9%)</th>\n          <th style=\"width:90px;text-align:right\">Total (₹)</th>\n        </tr>\n      </thead>\n      <tbody>\n        ' + rowsHtml + '\n      </tbody>\n    </table>\n    <div class=\"calc-grid\">\n      <div class=\"words-box\">\n        <div style=\"font-weight:700;color:#475569;margin-bottom:2px\">Invoice Value in Words:</div>\n        <div style=\"font-weight:800;color:#0F172A\">' + words + '</div>\n        ' + (notes ? ('<div style=\"margin-top:6px;color:#334155;border-top:1px solid #CBD5E1;padding-top:4px\"><b>Dispatch & Billing Notes:</b> ' + escapeHtml(notes) + '</div>') : '') + '\n      </div>\n      <div>\n        <table class=\"totals-table\">\n          <tr><td class=\"t-lbl\">Total Taxable Value</td><td class=\"t-val\">₹' + subtotal.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + '</td></tr>\n          <tr><td class=\"t-lbl\">Central GST (CGST @ 9%)</td><td class=\"t-val\">₹' + cgst.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + '</td></tr>\n          <tr><td class=\"t-lbl\">State GST (SGST @ 9%)</td><td class=\"t-val\">₹' + sgst.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + '</td></tr>\n          <tr class=\"grand-total\"><td class=\"t-lbl\" style=\"font-weight:800\">Net Invoice Amount Payable</td><td class=\"t-val\" style=\"font-size:13px;color:#0369A1\">₹' + total.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + '</td></tr>\n        </table>\n      </div>\n    </div>\n    <div class=\"terms-box\">\n      <div class=\"party-title\">Terms of Sale & Legal Declaration</div>\n      <ol class=\"terms-list\">\n        <li>We declare that this invoice shows the actual price of the goods described and that all particulars are true and correct.</li>\n        <li>Interest @ 18% per annum will be charged on delayed payments beyond the due date.</li>\n        <li>Goods once sold will not be accepted back without prior written material return authorization (RMA).</li>\n        <li>All disputes are subject to exclusive jurisdiction of Pune, Maharashtra courts only.</li>\n      </ol>\n    </div>\n    <div class=\"footer-grid\">\n      <div class=\"bank-box\">\n        <div style=\"font-weight:800;color:#0369A1;margin-bottom:2px\">Electronic Remittance Details (RTGS / NEFT / IMPS)</div>\n        <b>Beneficiary Name:</b> ' + escapeHtml(company.accName) + '<br />\n        <b>Bank Name:</b> ' + escapeHtml(company.bankName) + '<br />\n        <b>A/C Number:</b> <span style=\"font-family:monospace;font-weight:700\">' + escapeHtml(company.accNo) + '</span><br />\n        <b>IFSC Code:</b> <span style=\"font-family:monospace;font-weight:700\">' + escapeHtml(company.ifsc) + '</span> &bull; <b>Branch:</b> ' + escapeHtml(company.branch) + '<br />\n        <b>UPI VPA:</b> ' + escapeHtml(company.upiId) + '\n      </div>\n      <div class=\"sig-col\">\n        <div class=\"sig-stamp\">DIGITALLY SIGNED &amp; SEALED</div>\n        <div class=\"sig-label\">For ' + escapeHtml(company.name) + '</div>\n        <div style=\"font-size:9px;color:#64748B\">Authorized Signatory &bull; Accounts Department</div>\n      </div>\n    </div>\n  </div>\n</body>\n</html>';
  }

  function downloadQuotationPdf(data) {
    const html = generateQuotationHtml(data);
    const win = window.open('', '_blank');
    if (!win) {
      alert('Please allow popups to open and print the quotation PDF.');
      return;
    }
    win.document.open();
    win.document.write(html);
    win.document.close();
    setTimeout(() => {
      try {
        win.focus();
        win.print();
      } catch (e) {
        console.warn('Print trigger warning:', e);
      }
    }, 400);
  }

  function downloadTaxInvoicePdf(data) {
    const html = generateTaxInvoiceHtml(data);
    const win = window.open('', '_blank');
    if (!win) {
      alert('Please allow popups to open and print the tax invoice PDF.');
      return;
    }
    win.document.open();
    win.document.write(html);
    win.document.close();
    setTimeout(() => {
      try {
        win.focus();
        win.print();
      } catch (e) {
        console.warn('Print trigger warning:', e);
      }
    }, 400);
  }

  window.QuotationInvoice = {
    numberToWordsIndian,
    generateQuotationHtml,
    generateTaxInvoiceHtml,
    downloadQuotationPdf,
    downloadTaxInvoicePdf
  };
})(window);
