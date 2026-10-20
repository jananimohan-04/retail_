/* API bridge — tries same-origin /api (node backend), falls back to mock data.
   Backend: http://localhost:4000 serves frontend + API together. */
(() => {
  const B = window.Backend = { enabled: false, cache: { products: null, orders: null, companies: null, users: null, cats: null, quotes: null, pstats: null, media: null, audit: null, gsettings: null, catalog: null } };
  const ses = () => { try { return JSON.parse(localStorage.getItem('cncforge_session') || 'null'); } catch { return null; } };
  const authH = () => {
    const t = (window.Auth && window.Auth.token()) || null;
    const s = ses() || { role: 'sales_user', companyId: 'C-ARGUS', name: 'Argus User' };
    const cid = s.role === 'super_admin' ? (s.companyId || '') : (s.companyId || 'C-ARGUS');
    return {
      'Content-Type': 'application/json',
      'x-role': s.role || 'sales_user', 'x-company-id': cid, 'x-user-name': s.name || '',
      ...(t ? { 'Authorization': 'Bearer ' + t } : {})
    };
  };
  async function req(method, url, body) {
    const r = await fetch(url, { method, headers: authH(), body: body ? JSON.stringify(body) : undefined });
    const j = await r.json().catch(() => ({}));
    if (!r.ok) throw new Error(j.error || ('HTTP ' + r.status));
    return j.data;
  }
  B.api = { get: (u) => req('GET', u), post: (u, b) => req('POST', u, b), put: (u, b) => req('PUT', u, b), patch: (u, b) => req('PATCH', u, b), delete: (u) => req('DELETE', u), del: (u) => req('DELETE', u) };
  /* upload straight to Supabase Storage via signed URLs (works on Vercel, where request bodies are
     capped at 4.5 MB and the disk is wiped); falls back to the server upload when Storage isn't set up */
  const MAX_MB = 50;
  B.upload = async (files) => {
    files = [...files];
    for (const f of files) {
      if (!/^(image|video)\//.test(f.type || '')) throw new Error(f.name + ': only images and videos can be uploaded');
      if (f.size > MAX_MB * 1024 * 1024) throw new Error(`${f.name} is ${(f.size / 1048576).toFixed(1)} MB — max ${MAX_MB} MB`);
    }
    let signed = null;
    try {
      signed = await B.api.post('/api/uploads/sign', { files: files.map(f => ({ name: f.name, type: f.type, size: f.size })) });
    } catch (e) {
      if (!/not configured/i.test(e.message)) throw e;
    }
    if (!signed) return B.uploadViaServer(files);
    return Promise.all(files.map(async (f, i) => {
      const r = await fetch(signed[i].signedUrl, { method: 'PUT', headers: { 'Content-Type': f.type, 'cache-control': 'max-age=31536000', 'x-upsert': 'false' }, body: f });
      if (!r.ok) { const j = await r.json().catch(() => ({})); throw new Error(f.name + ': upload failed — ' + (j.message || j.error || ('HTTP ' + r.status))); }
      return signed[i].publicUrl;
    }));
  };
  B.uploadViaServer = async (files) => {
    const s = ses() || { role: 'sales_user', companyId: 'C-ARGUS', name: 'Argus User' };
    const t = (window.Auth && window.Auth.token()) || null;
    const cid = s.role === 'super_admin' ? (s.companyId || '') : (s.companyId || 'C-ARGUS');
    const fd = new FormData();
    [...files].forEach(f => fd.append('files', f));
    const r = await fetch('/api/uploads', { method: 'POST', headers: { 'x-role': s.role || 'sales_user', 'x-company-id': cid, 'x-user-name': s.name || '', ...(t ? { 'Authorization': 'Bearer ' + t } : {}) }, body: fd });
    const j = await r.json().catch(() => ({}));
    if (!r.ok) throw new Error(j.error || ('HTTP ' + r.status));
    return j.data;
  };
  B.refresh = async () => {
    // /api/health answers {ok:true} (no `data` field), so check it directly — going through
    // B.api.get() returned undefined and left the whole app stuck on offline mock data
    const h = await fetch('/api/health').then(r => r.ok ? r.json() : null).catch(() => null);
    if (!h || !h.ok) return false;
    B.enabled = true;
    const s = ses();
    const role = s?.role || 'sales_user';
    /* push records saved while offline, then drop them locally so they are never shown as "live" */
    if (role === 'company_admin' || role === 'super_admin') {
      try {
        const ov = JSON.parse(localStorage.getItem('cncforge_db_overrides_v2') || '{}');
        let dirty = false;
        if (Array.isArray(ov.users) && ov.users.length > 0) {
          if (await B.api.post('/api/users/sync-local', { users: ov.users }).catch(() => null)) { delete ov.users; dirty = true; }
        }
        if (Array.isArray(ov.products) && ov.products.length > 0) {
          if (await B.api.post('/api/products/sync-local', { products: ov.products }).catch(() => null)) { delete ov.products; dirty = true; }
        }
        if (dirty) localStorage.setItem('cncforge_db_overrides_v2', JSON.stringify(ov));
      } catch (e) { /* ignore */ }
    }
    const catUrl = (role === 'sales_user' && s?.companyId) ? '/api/categories/company/' + s.companyId : '/api/categories';
    const [products, orders, cats, quotes] = await Promise.all([
      B.api.get('/api/products').catch(() => null),
      B.api.get('/api/orders').catch(() => null),
      B.api.get(catUrl).catch(() => null),
      B.api.get('/api/quotations').catch(() => null)
    ]);
    if (products) B.cache.products = products;
    if (orders) B.cache.orders = orders;
    if (cats) B.cache.cats = cats;
    if (quotes) B.cache.quotes = quotes;
    if (role === 'super_admin') {
      const [companies, users, pstats, media, audit, gsettings, catalog] = await Promise.all([
        B.api.get('/api/companies').catch(() => null),
        B.api.get('/api/users').catch(() => null),
        B.api.get('/api/stats/platform').catch(() => null),
        B.api.get('/api/media?limit=200').catch(() => null),
        B.api.get('/api/audit?limit=100').catch(() => null),
        B.api.get('/api/settings/global').catch(() => null),
        B.api.get('/api/catalog?limit=200').catch(() => null)
      ]);
      if (companies) B.cache.companies = companies;
      if (users) B.cache.users = users;
      if (pstats) B.cache.pstats = pstats;
      if (media) B.cache.media = media.rows || media;
      if (audit) B.cache.audit = audit.rows || audit;
      if (gsettings) B.cache.gsettings = gsettings;
      if (catalog) B.cache.catalog = catalog.rows || catalog;
    } else {
      const [users, co, media] = await Promise.all([
        B.api.get('/api/users').catch(() => null),
        s?.companyId ? B.api.get('/api/companies/' + s.companyId).catch(() => null) : null,
        B.api.get('/api/media').catch(() => null)
      ]);
      if (users) B.cache.users = users;
      if (co) B.cache.companies = [co];
      if (media) B.cache.media = media.rows || media;
    }
    B.lastRefresh = Date.now();
    return true;
  };
  // boot before first render completes: reload once data arrives
  let bootDone;
  B.boot = new Promise(r => { bootDone = r; });
  document.addEventListener('DOMContentLoaded', async () => {
    try {
      const ok = await B.refresh();
      if (ok && window.App?.toast) {
        window.App.toast('Backend connected — live data', '🟢');
        // re-render with live data, unless the user already started filling a form
        if (!window.App._safeToRerender || window.App._safeToRerender()) window.App.rerender();
      }
    } catch { /* stay on mock data */ }
    bootDone();
  });
  /* writes must never fall back to "offline" just because the first handshake hasn't finished */
  B.ensureLive = async () => {
    if (B.enabled) return true;
    await B.boot;
    if (!B.enabled) await B.refresh().catch(() => false);
    return B.enabled;
  };
})();
