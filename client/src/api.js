/* API client — same Express endpoints, same payloads/shapes as the legacy frontend. */
const SES_KEY = 'cncforge_session';
const CART_KEY = 'cncforge_cart';

export function getSession() {
  try { return JSON.parse(localStorage.getItem(SES_KEY) || 'null'); } catch { return null; }
}
export function setSession(s) {
  if (s) localStorage.setItem(SES_KEY, JSON.stringify(s));
  else localStorage.removeItem(SES_KEY);
}
export function getCart() {
  try { return JSON.parse(localStorage.getItem(CART_KEY) || '[]'); } catch { return []; }
}
export function setCart(c) { localStorage.setItem(CART_KEY, JSON.stringify(c)); }
export function googleToken() {
  try { return sessionStorage.getItem('cncforge_gtoken') || null; } catch { return null; }
}
export function setGoogleToken(t) {
  try { if (t) sessionStorage.setItem('cncforge_gtoken', t); else sessionStorage.removeItem('cncforge_gtoken'); } catch { /* noop */ }
}

function headers() {
  const s = getSession() || { role: 'sales_user', companyId: 'C-ARGUS', name: 'Argus User' };
  const t = googleToken();
  const cid = s.role === 'super_admin' ? (s.companyId || '') : (s.companyId || 'C-ARGUS');
  return {
    'Content-Type': 'application/json',
    'x-role': s.role || 'sales_user',
    'x-company-id': cid,
    'x-user-name': s.name || '',
    ...(t ? { Authorization: 'Bearer ' + t } : {})
  };
}

async function req(method, url, body) {
  const r = await fetch(url, { method, headers: headers(), body: body ? JSON.stringify(body) : undefined });
  const j = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error((j && j.error) || ('HTTP ' + r.status));
  return j.data;
}

export const api = {
  get: (u) => req('GET', u),
  post: (u, b) => req('POST', u, b),
  put: (u, b) => req('PUT', u, b),
  patch: (u, b) => req('PATCH', u, b),
  del: (u) => req('DELETE', u)
};

export async function uploadFiles(files) {
  const s = getSession() || { role: 'sales_user', companyId: 'C-ARGUS', name: 'Argus User' };
  const t = googleToken();
  const cid = s.role === 'super_admin' ? (s.companyId || '') : (s.companyId || 'C-ARGUS');
  const fd = new FormData();
  [...files].forEach((f) => fd.append('files', f));
  const r = await fetch('/api/uploads', {
    method: 'POST',
    headers: {
      'x-role': s.role || 'sales_user',
      'x-company-id': cid,
      'x-user-name': s.name || '',
      ...(t ? { Authorization: 'Bearer ' + t } : {})
    },
    body: fd
  });
  const j = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error((j && j.error) || ('HTTP ' + r.status));
  return j.data;
}

export const fmt = (n) => (n == null ? 'On request' : '₹' + Number(n).toLocaleString('en-IN'));
export const imgFallback = (seed, w = 700, h = 525) => `https://picsum.photos/seed/${seed}/${w}/${h}`;
