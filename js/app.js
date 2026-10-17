/* CNCFORGE Industrial Store — B2B procurement SPA (vanilla JS).
   Inventory source of truth: backend /api (stock validated + deducted server-side).
   Falls back to mock seed when backend unreachable. Supabase replaces DB layer later. */
(() => {
const $ = (s, r=document) => r.querySelector(s);
const $$ = (s, r=document) => [...r.querySelectorAll(s)];
const fmt = n => (n == null ? 'On request' : '₹' + Number(n).toLocaleString('en-IN'));
const DBKEY='cncforge_db_overrides_v2', CARTKEY='cncforge_cart', SESKEY='cncforge_session';
const loadOv = () => { try{return JSON.parse(localStorage.getItem(DBKEY)||'{}')}catch{return{}} };
const saveOv = o => localStorage.setItem(DBKEY, JSON.stringify(o));
let OV = loadOv();
if (OV.users) {
  OV.users = OV.users.filter(u => !(u.email && u.email.includes('apexcnc.in') && u.name && u.name.includes('New Sales')));
  saveOv(OV);
}
if (OV.products) {
  OV.products = OV.products.filter(p => p.id !== 'P-ARGUS-01' && p.id !== 'P-ARGUS-02');
  saveOv(OV);
}
const B = () => window.Backend;
const getProducts = () => {
  let del = new Set();
  try { del = new Set(JSON.parse(localStorage.getItem('cncforge_deleted_pids') || '[]')); } catch(e){}
  const list = (B()?.enabled && B().cache.products) ? B().cache.products : [...(OV.products || []), ...window.MOCK.PRODUCTS];
  return list.filter(p => !del.has(p.id));
};
const getOrders = () => (B()?.enabled && B().cache.orders) ? B().cache.orders : [...(OV.orders||[]), ...window.MOCK.ORDERS];
const getQuotes = () => (B()?.enabled && B().cache.quotes) ? B().cache.quotes : [...(OV.quotes||[]), ...(window.MOCK.QUOTES||[])];
const getUsers = () => (B()?.enabled && B().cache.users) ? B().cache.users : [...(OV.users||[]), ...window.MOCK.USERS];
const getCompanies = () => (B()?.enabled && B().cache.companies) ? B().cache.companies : [...(OV.companies||[]), ...window.MOCK.COMPANIES];
const getCats = () => {
  const all = (B()?.enabled && B().cache.cats) ? B().cache.cats : window.MOCK.CAT;
  if (!me || me.role === 'super_admin') return all;
  return all.filter(c => c.scope !== 'company' || c.companyId === me.companyId);
};
const storeCats = () => getCats().filter(c => c.active !== false);
const getCart = () => { try{return JSON.parse(localStorage.getItem(CARTKEY)||'[]')}catch{return[]} };
const setCart = c => localStorage.setItem(CARTKEY, JSON.stringify(c));
const session = () => { try{return JSON.parse(localStorage.getItem(SESKEY)||'null')}catch{return null} };
const setSession = s => s?localStorage.setItem(SESKEY,JSON.stringify(s)):localStorage.removeItem(SESKEY);
let me = session() || null;
let ui = { q:'', cat:'all', brand:'all', sort:'new', avail:'all', minP:'', maxP:'', adminQ:'', orderQ:'', orderStatus:'all', quoteStatus:'all', admFQ:'', admFCo:'all', admFStatus:'all', usrFQ:'', usrFCo:'all', usrFRole:'all', usrFStatus:'all' };

function toast(msg, icon='✅'){ const w=$('#toasts'); const t=document.createElement('div'); t.className='toast'; t.innerHTML=`<span>${icon}</span><span>${msg}</span>`; w.appendChild(t); setTimeout(()=>{t.style.opacity='0';t.style.transition='.3s';setTimeout(()=>t.remove(),300)},2600); }
function availBadge(p){
  if (p.price == null && p.stock <= 0) return `<span class="badge out">Check availability</span>`;
  if (p.stock <= 0) return `<span class="badge out">Out of stock</span>`;
  if (p.stock <= 10) return `<span class="badge low">Low stock • ${p.stock}</span>`;
  return `<span class="badge in">In stock</span>`;
}
function priceHtml(p, big){
  if (p.price == null) return `<span class="price rfq">Request Quotation</span>`;
  return `<span class="price"${big?' style="font-size:26px"':''}>${fmt(p.price)} <small>/ ${p.uom||'Pc'}</small></span>`;
}
/* products show only media the admin uploaded — never stock or random photos */
const NOIMG = "data:image/svg+xml," + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300" viewBox="0 0 400 300"><rect width="400" height="300" fill="#F1F5F9"/><g fill="none" stroke="#94A3B8" stroke-width="6"><rect x="150" y="95" width="100" height="80" rx="8"/><circle cx="178" cy="122" r="9"/><path d="M155 168l30-30 22 20 14-12 26 22"/></g><text x="200" y="215" text-anchor="middle" font-family="sans-serif" font-size="20" fill="#64748B">No image</text></svg>');
const NOIMG_ERR = "this.onerror=null;this.src=NOIMG";
window.NOIMG = NOIMG;
const img0 = p => ((p && p.images) || []).find(Boolean) || NOIMG;
function statusBadge(s){ return `<span class="status s-${String(s).toLowerCase().replace(/ /g,'')}">${s}</span>`; }
function catName(id){ return (getCats().find(c=>c.id===id)||{}).name||id; }
function prodById(id){ return getProducts().find(p=>p.id===id); }
function cartCount(){ return getCart().reduce((a,c)=>a+c.qty,0); }
function cartSubtotal(){ return getCart().reduce((a,c)=>{const p=prodById(c.pid);return a+(p&&p.price!=null?p.price*c.qty:0)},0); }
function brands(){
  const myCoId = me?.companyId;
  const list = myCoId ? getProducts().filter(p=>p.companyId===myCoId) : getProducts();
  return [...new Set(list.map(p=>p.brand).filter(Boolean))];
}
function getMedia(){ return (B()?.enabled && B().cache.media) ? B().cache.media : []; }
function getAuditLog(){ return (B()?.enabled && B().cache.audit) ? B().cache.audit : [...(OV.audit||[])]; }
function getCatalog(){ return (B()?.enabled && B().cache.catalog) ? B().cache.catalog : getProducts().map(p=>({...p,companyName:(getCompanies().find(c=>c.id===p.companyId)||{}).name||p.companyId})); }
function coName(id){ return (getCompanies().find(c=>c.id===id)||{}).name||id||'—'; }
/* platform stats: live endpoint when connected, else computed from seed rows */
function pstats(){
  if (B()?.enabled && B().cache.pstats) return B().cache.pstats;
  const cos=getCompanies(), us=getUsers(), ps=getProducts().filter(p=>!p.archived), os=getOrders(), qs=getQuotes();
  const byS=s=>os.filter(o=>o.status===s).length, byQ=s=>qs.filter(q=>q.status===s).length;
  const act={}; os.forEach(o=>{const d=String(o.date).slice(0,10);act[d]=(act[d]||0)+1});
  const growth={}; cos.forEach(c=>{const m=String(c.createdAt||'').slice(0,7);if(m)growth[m]=(growth[m]||0)+1});
  return { companies:cos.length, activeCompanies:cos.filter(c=>(c.storeStatus||c.status)==='active').length, suspendedCompanies:cos.filter(c=>(c.storeStatus||c.status)!=='active').length,
    admins:us.filter(u=>u.role==='company_admin').length, salesUsers:us.filter(u=>u.role==='sales_user').length,
    products:ps.length, visibleProducts:ps.filter(p=>p.visible).length, categories:getCats().filter(c=>c.scope==='global').length,
    orders:os.length, pendingOrders:byS('Pending'), quotes:qs.length, openQuotes:byQ('Pending'), gmv:os.reduce((a,o)=>a+o.total,0),
    orderStatus:['Pending','Confirmed','Processing','Ready for Dispatch','Shipped','Delivered','Cancelled'].map(s=>({status:s,count:byS(s)})),
    quoteStatus:['Pending','Quoted','Accepted','Rejected','Cancelled'].map(s=>({status:s,count:byQ(s)})),
    categoryDist:getCats().filter(c=>c.scope==='global').map(c=>({id:c.id,name:c.name,icon:c.icon,products:ps.filter(p=>p.category===c.id).length})),
    orderActivity:Object.entries(act).sort().slice(-14).map(([date,count])=>({date,count})),
    companyGrowth:Object.entries(growth).sort().map(([month,count])=>({month,count})),
    byCompany:cos.map(c=>({id:c.id,code:c.code||c.id,name:c.name,logo:c.logo,city:c.city,industry:c.industry,status:c.storeStatus||c.status,users:us.filter(u=>u.companyId===c.id).length,products:ps.filter(p=>p.companyId===c.id).length,orders:os.filter(o=>o.companyId===c.id).length,pending:os.filter(o=>o.companyId===c.id&&o.status==='Pending').length,revenue:os.filter(o=>o.companyId===c.id).reduce((a,o)=>a+o.total,0)})) };
}
/* horizontal bar chart (pure SVG, real data only) */
function bars(rows, maxV, color){
  if(!rows.length) return `<div class="empty" style="padding:18px">Not enough data yet.</div>`;
  const mx = maxV || Math.max(...rows.map(r=>r.value), 1);
  return rows.map(r=>`<div style="display:grid;grid-template-columns:150px 1fr 44px;gap:8px;align-items:center;padding:4px 0;font-size:12px"><span style="white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${r.label}</span><svg width="100%" height="12"><rect x="0" y="0" width="${Math.max(2,(r.value/mx*100))}%" height="12" rx="3" fill="${r.color||color}"/></svg><b style="text-align:right">${r.value}</b></div>`).join('');
}
function stColor(s){ return {Pending:'#D97706',Confirmed:'#2563EB',Processing:'#7C3AED','Ready for Dispatch':'#C026D3',Shipped:'#0891B2',Delivered:'#16A34A',Cancelled:'#DC2626',Quoted:'#2563EB',Accepted:'#16A34A',Rejected:'#DC2626'}[s]||'#64748B'; }
/* server-backed paged table loader: uses live API when connected, cache filter when offline */
let tFn = null;
async function loadT(key, url, params, offlineRows){
  tFn = offlineRows || null;
  try{
    if (B()?.enabled) {
      const qs = new URLSearchParams({ page: ui.tPage||1, limit: 8, ...(params||{}) });
      const d = await B().api.get(url + '?' + qs.toString());
      ui.t = { key, url, params: params||{}, rows: d.rows || d, total: d.total ?? (d.rows||d).length, page: d.page || 1, limit: d.limit || 8 };
    } else {
      const all = (offlineRows||(()=>[]))();
      const page = ui.tPage || 1;
      ui.t = { key, url, params: params||{}, rows: all.slice((page-1)*8, page*8), total: all.length, page, limit: 8 };
    }
  }catch(e){ ui.t = { key, url, params: params||{}, rows: [], total: 0, page: 1, limit: 8, err: e.message }; }
  render();
}
function tPager(key, url, params, offlineRows){
  const t = ui.t;
  if (!t || t.key !== key || JSON.stringify(t.params||{}) !== JSON.stringify(params||{})) { loadT(key, url, params, offlineRows); return `<div class="card"><div class="card-pad"><div class="skel" style="min-height:180px"></div><p class="hint">Loading live records…</p></div></div>`; }
  if (t.err) return `<div class="empty">⚠️ ${t.err}</div>`;
  const pages = Math.max(1, Math.ceil(t.total / t.limit));
  return { rows: t.rows, pager: `<div style="display:flex;gap:8px;align-items:center;justify-content:flex-end;margin-top:12px;flex-wrap:wrap"><span class="hint">${t.total} record${t.total===1?'':'s'} • page ${t.page}/${pages}${B()?.enabled?' • live DB':''}</span><button class="btn btn-ghost btn-sm" ${t.page<=1?'disabled':''} onclick="App.tPage(-1)">← Prev</button><button class="btn btn-ghost btn-sm" ${t.page>=pages?'disabled':''} onclick="App.tPage(1)">Next →</button></div>` };
}

/* ---------- layout ---------- */
function topbar(){
  if (!me) return '';
  const c = cartCount();
  const roleLabel = (me.role || '').replace('_', ' ');
  return `<div class="top-strip"><div class="topbar-inner"><span>ARGUSCNC ERP • Creating Future Factories • GST invoice on all orders</span><span>${me.name} • ${roleLabel}${me.companyId?' • '+coName(me.companyId):''}</span></div></div>
  <div class="topbar"><div class="topbar-inner">
    <a href="#/store/home" class="logo" style="display:flex;align-items:center;gap:10px"><img src="assets/argus-logo.png" alt="ARGUSCNC" style="height:34px;width:auto;object-fit:contain"></a>
    <div class="searchbar"><input id="gSearch" placeholder="Search SKU, part number, brand, product…" value="${ui.q||''}"><button onclick="App.goSearch()">Search</button></div>
    <div class="navlinks">
      <span class="pill active" title="${me.email||''}">👤 ${me.name} (${roleLabel})</span>
      <button class="pill" onclick="App.logout()">Sign out</button>
      <a class="icon-btn" href="#/store/cart">🧾<span class="count">${c}</span></a>
      <a class="avatar" href="#/store/profile" title="${me.name} — My profile">${(me.name||'U')[0]}</a>
      <button class="icon-btn" title="Logout" onclick="App.logout()">⏻</button>
    </div></div></div>`;
}
function side(){
  const h = location.hash;
  const link=(href,label,icon,badge='')=>`<a class="side-link ${h.startsWith(href)?'active':''}" href="${href}"><span>${icon}</span>${label}${badge?`<span class="dot">${badge}</span>`:''}</a>`;
  const myCoId = me.companyId;
  const openQ = getQuotes().filter(q=>(!myCoId || q.companyId===myCoId)&&q.status==='Pending').length;
  if(me.role==='super_admin') return `<aside class="sidebar"><div class="side-title">OVERVIEW</div>
    ${link('#/super/dashboard','Platform Dashboard','📊')}
    <div class="side-title">COMPANY MANAGEMENT</div>
    ${link('#/super/companies','Company Management','🏢')}
    <div class="side-title">INDUSTRIAL CATALOG</div>
    ${link('#/super/catalog','Global Catalog','📦')}${link('#/super/categories','Categories','🗂️')}${link('#/super/media','Product Media','🖼️')}
    <div class="side-title">COMMERCE</div>
    ${link('#/super/orders','All Orders','🧾')}${link('#/super/quotes','Quotations','📝')}
    <div class="side-title">PLATFORM</div>
    ${link('#/super/settings','Global Settings','⚙️')}${link('#/super/audit','Audit Logs','🔍')}
    <div class="side-title">STORE</div>${link('#/store/home','View Storefront','🏭')}</aside>`;
  if(me.role==='company_admin') {
    const cObj = getCompanies().find(c=>c.id===myCoId) || {};
    const cName = (cObj.name || coName(myCoId) || 'COMPANY').toUpperCase();
    const pendOrders = getOrders().filter(o=>o.companyId===myCoId&&o.status==='Pending').length;
    return `<aside class="sidebar"><div class="side-title">${cName} • ADMIN</div>
    ${link('#/admin/dashboard','Dashboard','📊')}${link('#/admin/products','Catalog','📦')}${link('#/admin/media','Media','🖼️')}
    ${link('#/admin/categories','Categories','🗂️')}${link('#/admin/users','Sales Users','👥')}${link('#/admin/orders','Orders','🧾',pendOrders||'')}
    ${link('#/admin/quotes','Quotations','📝',openQ||'')}${link('#/admin/settings','Store Settings','⚙️')}
    <div class="side-title">STOREFRONT</div>${link('#/store/home','View Store','🏭')}</aside>`;
  }
  return `<aside class="sidebar"><div class="side-title">INDUSTRIAL STORE</div>
    ${link('#/store/home','Home','🏠')}${link('#/store/listing','All Products','🔩')}${link('#/store/cart','My Cart','🧾',cartCount()||'')}
    ${link('#/store/quotes','My Quotations','📝',openQ||'')}${link('#/store/orders','My Orders','📦')}${link('#/store/profile','My Profile','👤')}
    <div class="side-title">CATEGORIES</div>${storeCats().map(c=>link('#/store/listing?cat='+c.id,c.name,c.icon)).join('')}</aside>`;
}

/* ---------- industrial product card ---------- */
function prodCard(p){
  const action = p.price == null
    ? `<button class="btn btn-dark btn-sm" onclick="App.rfq('${p.id}')">Request Quote</button>`
    : p.stock <= 0
    ? `<button class="btn btn-ghost btn-sm" onclick="App.rfq('${p.id}')">Check Availability</button>`
    : `<button class="btn btn-primary btn-sm" onclick="App.addCart('${p.id}')">Add to Cart</button>`;
  return `<div class="prod">
    <a class="prod-img" href="#/store/product/${p.id}">${!(p.images||[]).find(Boolean)&&p.video?`<video src="${p.video}" muted preload="metadata" style="width:100%;height:100%;object-fit:cover"></video>`:`<img loading="lazy" src="${img0(p)}" alt="${p.name}" onerror="${NOIMG_ERR}">`}
    ${availBadge(p)}<span class="badge cat">${catName(p.category)}</span></a>
    <div class="prod-body"><span class="sku">SKU: ${p.sku||p.id}</span>
    <div class="prod-name">${p.name}</div><div class="prod-desc">${p.short||''}</div>
    <div class="prod-meta">${p.brand||''}${p.mpn?' • MPN '+p.mpn:''}${p.uom?' • per '+p.uom:''}</div>
    <div class="prod-row">${priceHtml(p)}<span class="hint">${p.warehouse||''}</span></div>
    <div class="prod-actions"><a class="btn btn-ghost btn-sm" href="#/store/product/${p.id}">Details</a>${action}</div></div></div>`;
}

/* ---------- views ---------- */
let currentSlide = 0;
let carouselTimer = null;

const CNC_SLIDES = [
  {
    image: 'https://images.unsplash.com/photo-1504328345606-18bbc8c9d7d1?auto=format&fit=crop&w=1400&q=85',
    title: 'Heavy CNC Machining Centers',
    subtitle: '12-Station Servo Turret & High-Torque Precision Turning',
    category: 'CNC Machining Center'
  },
  {
    image: 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&w=1400&q=85',
    title: 'Precision Metal Turning & Coolant Flow',
    subtitle: 'High-speed alloy cutting with continuous multi-axis feed',
    category: 'CNC Turning & Cutting'
  },
  {
    image: 'https://images.unsplash.com/photo-1581092160562-40aa08e78837?auto=format&fit=crop&w=1400&q=85',
    title: '5-Axis Precision Milling Center',
    subtitle: 'Complex aeronautical profiling with C7 rolled ball screws',
    category: 'Precision Milling'
  },
  {
    image: 'https://images.unsplash.com/photo-1504917595217-d4dc5ebe6122?auto=format&fit=crop&w=1400&q=85',
    title: 'Solid Carbide & Spindle Assemblies',
    subtitle: 'AlCrN-coated end mills engineered for 55 HRC hardened steels',
    category: 'Cutting Tools & Spindles'
  },
  {
    image: 'https://images.unsplash.com/photo-1581091012184-5c1d9ae4a3d2?auto=format&fit=crop&w=1400&q=85',
    title: 'Robotic Automation Cells',
    subtitle: 'Intelligent part handling and automated pallet management',
    category: 'Robotic Automation'
  },
  {
    image: 'https://images.unsplash.com/photo-1581092918056-0c4c3acd3789?auto=format&fit=crop&w=1400&q=85',
    title: 'Modern CNC Factory Ecosystem',
    subtitle: 'Live ERP synchronization with real-time inventory balances',
    category: 'Connected Factory Floor'
  }
];

function vLogin(){
  setTimeout(() => App.carouselStart(), 60);
  return `<div class="auth-layout">
    <!-- LEFT SIDE: 6-PHOTOGRAPH ROTATING CNC SHOWCASE -->
    <div class="auth-showcase" id="authShowcase" onmouseenter="App.carouselPause()" onmouseleave="App.carouselResume()">
      <div class="carousel-track">
        ${CNC_SLIDES.map((slide, idx) => `
          <div class="carousel-slide ${idx === currentSlide ? 'active' : ''}" id="cSlide-${idx}">
            <img src="${slide.image}" alt="${slide.title}" onerror="this.src='https://picsum.photos/seed/argus-cnc-${idx}/1200/900'">
          </div>
        `).join('')}
      </div>
      <div class="carousel-overlay"></div>
      
      <div class="showcase-content">
        <div class="showcase-header">
          <img class="showcase-logo" src="assets/argus-logo.png" alt="ARGUSCNC — Creating Future Factories">
        </div>

        <div class="showcase-body">
          <div class="showcase-tag">ENGINEERING THE FUTURE</div>
          <h1>Precision manufacturing.<br>Intelligent automation.<br>Industrial excellence.</h1>
          <p class="desc">Your connected platform for CNC manufacturing, industrial procurement, and ERP operations.</p>
          <div class="showcase-features">
            <span class="showcase-feat"><span>⚙️</span> Multi-Company ERP</span>
            <span class="showcase-feat"><span>📦</span> Industrial Inventory</span>
            <span class="showcase-feat"><span>⚡</span> Smart Procurement</span>
          </div>
        </div>

        <div class="showcase-footer">
        </div>
      </div>
    </div>

    <!-- RIGHT SIDE: GOOGLE-ONLY AUTHENTICATION -->
    <div class="auth-panel">
      <div class="auth-box">
        <div class="auth-brand">
          <img src="assets/argus-logo.png" alt="ARGUSCNC Logo">
        </div>
        <div class="auth-head">
          <h2>Welcome Back</h2>
          <p>Sign in securely with your Google account to access your company's industrial workspace.</p>
        </div>

        <button class="btn-google" id="btnGoogleAuth" onclick="App.googleLogin()">
          <svg viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
          </svg>
          <span>Continue with Google</span>
        </button>

        <div class="auth-security">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
          <span>Secure access to your authorized workspace.</span>
        </div>

        <div id="googleMsg"></div>
      </div>
    </div>
  </div>`;
}

function vPending(){
  const email = (me && me.email) || '';
  return `<div class="pending-wrap">
    <div class="pending-card">
      <div style="margin-bottom:18px">
        <img src="assets/argus-logo.png" alt="ARGUSCNC" style="height:44px;object-fit:contain">
      </div>
      <div class="pending-icon">⏳</div>
      <h2>Your account is not registered yet.</h2>
      <p>Please contact your company administrator to request access to ARGUSCNC Industrial Store.</p>
      ${email ? `<div class="pending-email-pill">Signed in as <b>${email}</b></div>` : ''}
      <div style="display:flex;gap:10px;justify-content:center;margin-top:10px">
        <button class="btn btn-ghost" onclick="App.afterGoogleLogin()">Retry Verification</button>
        <button class="btn btn-dark" onclick="App.logout()">Sign out</button>
      </div>
    </div>
  </div>`;
}
function vSuperDash(){
  const s = pstats();
  const card=(href,val,label,sub,grad)=>`<a href="${href}" class="kpi" style="background:${grad};text-decoration:none"><h3>${val}</h3><p>${label}</p><small>${sub}</small></a>`;
  return `<div class="section-head"><div><p class="hint" style="margin:0">CNCFORGE ERP • SUPER ADMIN</p><h2 style="font-size:22px">Platform Dashboard</h2></div><div style="display:flex;gap:8px"><a class="btn btn-ghost btn-sm" href="#/super/audit">Audit trail</a><a class="btn btn-primary btn-sm" href="#/super/companies/new">+ New company</a></div></div>
  <div class="stat-grid">
    ${card('#/super/companies?tab=companies',s.companies,'Total companies',`${s.activeCompanies} active • ${s.suspendedCompanies} suspended`,'linear-gradient(135deg,#172554,#2563EB)')}
    ${card('#/super/companies?tab=admins',s.admins,'Company admins','across all companies','linear-gradient(135deg,#6D28D9,#7C3AED)')}
    ${card('#/super/companies?tab=users',s.salesUsers,'Sales users','procurement teams','linear-gradient(135deg,#0E7490,#0EA5E9)')}
    ${card('#/super/catalog',s.products,'Industrial SKUs',`${s.visibleProducts} visible in stores`,'linear-gradient(135deg,#9A3412,#F97316)')}
    ${card('#/super/categories',s.categories,'Global categories','CNC catalog taxonomy','linear-gradient(135deg,#92400E,#D97706)')}
    ${card('#/super/orders',s.orders,'Total orders',`${s.pendingOrders} pending action`,'linear-gradient(135deg,#14532D,#16A34A)')}
    ${card('#/super/orders?status=Pending',s.pendingOrders,'Pending orders','needs processing','linear-gradient(135deg,#065F46,#10B981)')}
    ${card('#/super/quotes',s.quotes,'Quotation requests',`${s.openQuotes} open RFQs`,'linear-gradient(135deg,#1E3A8A,#38BDF8)')}
    ${card('#/super/orders',fmt(s.gmv),'Order value','all companies, live rows','linear-gradient(135deg,#0B1533,#334155)')}
  </div>
  <div style="display:grid;grid-template-columns:1fr 1fr;gap:14px;margin-top:14px" class="dash2">
    <div class="card"><div class="card-pad"><h3 style="margin:0 0 10px;font-size:15px">Order status distribution</h3>${bars(s.orderStatus.map(o=>({label:o.status,value:o.count,color:stColor(o.status)})))}</div></div>
    <div class="card"><div class="card-pad"><h3 style="margin:0 0 10px;font-size:15px">Products per category</h3>${bars(s.categoryDist.map(c=>({label:c.icon+' '+c.name,value:c.products})),'linear-gradient(135deg,#9A3412,#F97316)')}</div></div>
    <div class="card"><div class="card-pad"><h3 style="margin:0 0 10px;font-size:15px">Order activity (last 14 days)</h3>${s.orderActivity.length?bars(s.orderActivity.map(o=>({label:String(o.date).slice(5),value:o.count})),'linear-gradient(135deg,#14532D,#16A34A)'):'<div class="empty" style="padding:18px">No orders in this window.</div>'}</div></div>
    <div class="card"><div class="card-pad"><h3 style="margin:0 0 10px;font-size:15px">Company growth</h3>${s.companyGrowth.length?bars(s.companyGrowth.map(o=>({label:o.month,value:o.count})),'linear-gradient(135deg,#6D28D9,#7C3AED)'):'<div class="empty" style="padding:18px">Not enough data yet.</div>'}</div></div>
  </div>
  <div class="card" style="margin-top:14px"><div class="card-pad"><div class="section-head" style="margin-top:0"><h2>Companies</h2><a class="btn btn-ghost btn-sm" href="#/super/companies">Manage all →</a></div>
  <div class="table-wrap"><table><tr><th>Company</th><th>Industry</th><th>Status</th><th>Users</th><th>SKUs</th><th>Orders</th><th>Revenue</th><th></th></tr>
  ${(s.byCompany||[]).map(c=>`<tr><td><b>${c.logo} ${c.name}</b><div class="hint">${c.code} • ${c.city}</div></td><td>${c.industry||'—'}</td><td>${statusBadge(c.status==='active'?'Delivered':'Cancelled')}</td><td>${c.users}</td><td>${c.products}</td><td>${c.orders}${c.pending?` <span class="status s-pending">${c.pending} pend</span>`:''}</td><td><b>${fmt(c.revenue)}</b></td><td><a class="btn btn-ghost btn-sm" href="#/super/companies/${c.id}">Open →</a></td></tr>`).join('')}</table></div>
  <p class="hint">Every metric on this page is computed from live database rows${B()?.enabled?'':' (offline seed fallback)'}.</p></div></div>`;
}
/* ---------- unified Company Management (companies + admins + users, one page) ---------- */
const MG_TABS = [['companies','🏢 Companies'],['admins','👔 Company Admins'],['users','👥 Company Users']];
function vCompanyMgmt(tab){
  tab = (tab==='admins'||tab==='users') ? tab : 'companies';
  const s = pstats();
  const totalUsers = s.admins + s.salesUsers;
  const mcard=(val,label,sub,grad,act)=>`<button class="kpi ${grad}" onclick="App.mgCard('${act}')"><h3>${val}</h3><p>${label}</p><small>${sub}</small></button>`;
  let body = '';
  if (tab==='companies') body = coTable();
  else if (tab==='admins') body = admTable();
  else body = usrTable();
  if (typeof body === 'string' && body.startsWith('__LOADING__')) {
    body = `<div class="card"><div class="card-pad"><div class="skel" style="min-height:220px"></div><p class="hint">Loading live records…</p></div></div>`;
  }
  return `<div class="section-head"><div><p class="hint" style="margin:0">CNCFORGE ERP • SUPER ADMIN</p><h2 style="font-size:22px">Company Management</h2>
  <p class="hint" style="margin:2px 0 0">Manage companies, administrators, users, and access permissions from one centralized workspace.</p></div>
  <div style="display:flex;gap:8px;flex-wrap:wrap"><button class="btn btn-ghost btn-sm" onclick="App.mgExport()">⤓ Export</button><button class="btn btn-ghost btn-sm" onclick="App.mgRefresh()">↻ Refresh</button><button class="btn btn-primary btn-sm" onclick="App.openCoModal('')">+ Create Company</button></div></div>
  <div class="mgmt-cards">
    ${mcard(s.companies,'Total companies',`${s.activeCompanies} active • ${s.suspendedCompanies} suspended`,'k1','all')}
    ${mcard(s.activeCompanies,'Active companies','store open','k3','active')}
    ${mcard(s.suspendedCompanies,'Suspended companies','store closed','k6','suspended')}
    ${mcard(s.admins,'Company admins','all companies','k4','admins')}
    ${mcard(totalUsers,'Company users','admins + sales users','k2','users')}
    ${mcard(s.products,'Products','across companies','k5','products')}
    ${mcard(s.orders,'Orders','across companies','k3','orders')}
  </div>
  <div class="tabs">${MG_TABS.map(([k,l])=>`<a class="tab ${tab===k?'active':''}" href="#/super/companies?tab=${k}" onclick="App.goMgmt('${k}');return false;">${l}</a>`).join('')}</div>
  <div class="card" style="margin-top:0;border-top-left-radius:0"><div class="card-pad">${body}</div></div>`;
}
/* --- companies tab table (reuses /api/companies server pagination + filters) --- */
function coTable(){
  const P = { q: ui.coFQ||'', status: ui.coFStatus||'all', industry: ui.coFInd||'all', city: ui.coFCity||'all' };
  const off = () => { let l=[...getCompanies()];
    if(P.q) l=l.filter(c=>(c.name+' '+(c.code||'')+' '+(c.city||'')+' '+(c.industry||'')+' '+(c.email||'')).toLowerCase().includes(P.q.toLowerCase()));
    if(P.status!=='all') l=l.filter(c=>(c.storeStatus||c.status)===P.status);
    if(P.industry!=='all') l=l.filter(c=>c.industry===P.industry);
    if(P.city!=='all') l=l.filter(c=>c.city===P.city);
    return l; };
  const t = tPager('mgCompanies', '/api/companies', P, off);
  if (typeof t === 'string') return '__LOADING__';
  const inds=[...new Set(getCompanies().map(c=>c.industry).filter(Boolean))], cities=[...new Set(getCompanies().map(c=>c.city).filter(Boolean))];
  return `<div class="toolbar">
  <input placeholder="🔍 Search name, code, email, city…" value="${P.q}" oninput="App.coF(event,'q')">
  <select onchange="App.coF(event,'status')"><option value="all">All statuses</option><option value="active" ${P.status==='active'?'selected':''}>Active</option><option value="suspended" ${P.status==='suspended'?'selected':''}>Suspended</option></select>
  <select onchange="App.coF(event,'industry')"><option value="all">All industries</option>${inds.map(i=>`<option ${P.industry===i?'selected':''}>${i}</option>`).join('')}</select>
  <select onchange="App.coF(event,'city')"><option value="all">All cities</option>${cities.map(i=>`<option ${P.city===i?'selected':''}>${i}</option>`).join('')}</select></div>
  <div class="table-wrap"><table><tr><th>Company</th><th>Code</th><th>Industry</th><th>Admin</th><th>Users</th><th>SKUs</th><th>Orders</th><th>Status</th><th>Created</th><th>Actions</th></tr>
  ${t.rows.map(c=>`<tr><td><b>${c.logo||'🏭'} ${c.name}</b><div class="hint">${c.city}${c.state?', '+c.state:''}</div></td><td><b>${c.code||c.id}</b></td><td>${c.industry||'—'}</td>
  <td>${c.admin||'-'}</td><td>${c.userCount??''}</td><td>${c.productCount??''}</td><td>${c.orderCount??''}</td>
  <td>${statusBadge((c.storeStatus||c.status)==='active'?'Delivered':'Cancelled')}</td><td class="hint">${c.createdAt||'—'}</td>
  <td style="white-space:nowrap"><button class="btn btn-ghost btn-sm" onclick="App.coDetails('${c.id}')">Details</button> <button class="btn btn-ghost btn-sm" onclick="App.openCoModal('${c.id}')">Edit</button> <a class="btn btn-ghost btn-sm" href="#/super/companies/${c.id}">Open</a> <button class="btn btn-ghost btn-sm" onclick="App.coToggle('${c.id}','${(c.storeStatus||c.status)}')">${(c.storeStatus||c.status)==='active'?'Suspend':'Activate'}</button></td></tr>`).join('')||'<tr><td colspan=10><div class="empty">No companies match.</div></td></tr>'}</table></div>${t.pager}`;
}
function vCompanyNew(){ return vCompanyForm(null); }
function vCompanyForm(editId){
  const c = editId ? getCompanies().find(x=>x.id===editId) : null;
  if (editId && !c) return `<div class="empty"><div class="big">🔍</div>Company not found.</div>`;
  const v = k => (c ? (c[k]||'') : '');
  return `<div class="co-create-wrap">
    <div class="section-head" style="margin:0 0 10px">
      <div>
        <p class="hint" style="margin:0;font-size:11px;font-weight:700">SUPER ADMIN • COMPANY ONBOARDING</p>
        <h2 style="font-size:18px;margin:2px 0 0">${c ? 'Edit Company — ' + c.name : 'Create Company'}</h2>
      </div>
      <a class="btn btn-ghost btn-sm" href="${c ? '#/super/companies/' + c.id : '#/super/companies'}">← Back to Companies</a>
    </div>

    <div class="card" style="box-shadow:0 1px 3px rgba(15,23,42,0.05)">
      <div class="card-pad" style="padding:14px 18px">
        <div class="co-form-grid">
          <!-- Column 1: Company Profile -->
          <div class="co-col">
            <div class="co-col-title">🏢 Company Profile</div>
            <div class="field"><label>Company Name *</label><input id="nc_name" value="${v('name')}" placeholder="e.g. Apex CNC Works"></div>
            <div class="field"><label>Company Code * ${c?'(locked)':'(unique)'}</label><input id="nc_code" value="${v('code')||v('id')}" ${c?'disabled':''} placeholder="e.g. C-D"></div>
            <div class="field"><label>Industry</label><select id="nc_ind">${['CNC Manufacturing','Machine Tools','Auto Components','Fabrication','General Engineering'].map(i=>`<option ${v('industry')===i?'selected':''}>${i}</option>`).join('')}</select></div>
            <div class="field"><label>Company Email</label><input id="nc_email" value="${v('email')}" placeholder="contact@company.in"></div>
          </div>

          <!-- Column 2: Location & Contact -->
          <div class="co-col">
            <div class="co-col-title">📍 Location & Contact</div>
            <div class="field"><label>Phone</label><input id="nc_phone" value="${v('phone')}" placeholder="+91 98765 43210"></div>
            <div class="field"><label>City *</label><input id="nc_city" value="${v('city')}" placeholder="e.g. Pune"></div>
            <div class="form-row-2">
              <div class="field"><label>State</label><input id="nc_state" value="${v('state')}" placeholder="Maharashtra"></div>
              <div class="field"><label>PIN Code</label><input id="nc_pin" value="${v('pin')}" placeholder="411001"></div>
            </div>
            <div class="field"><label>Address</label><input id="nc_addr" value="${v('address')}" placeholder="Industrial Estate Phase 2"></div>
          </div>

          <!-- Column 3: Administration & Settings -->
          <div class="co-col">
            <div class="co-col-title">⚙️ Admin & Access</div>
            ${c ? '' : `
              <div class="field"><label>Company Admin Name</label><input id="nc_admin" placeholder="e.g. Neha Gupta"></div>
              <div class="field"><label>Admin Email *</label><input id="nc_aemail" placeholder="admin@company.in"></div>
            `}
            <div class="form-row-2">
              <div class="field"><label>Plan</label><select id="nc_plan">${['Starter','Growth','Scale'].map(i=>`<option ${(c?c.plan:'Starter')===i?'selected':''}>${i}</option>`).join('')}</select></div>
              <div class="field"><label>Status</label><select id="nc_status"><option value="active" ${(v('storeStatus')||'active')==='active'?'selected':''}>Active</option><option value="suspended" ${v('storeStatus')==='suspended'?'selected':''}>Suspended</option></select></div>
            </div>
            <div class="field"><label>Short Description</label><input id="nc_desc" value="${v('description')}" placeholder="CNC facility for precision machining"></div>
          </div>
        </div>

        <!-- Action Footer -->
        <div style="display:flex;align-items:center;justify-content:space-between;gap:12px;margin-top:12px;padding-top:10px;border-top:1px solid #E2E8F0">
          <span class="hint" style="font-size:11.5px">Company database record created immediately with isolated multi-tenant data scoping.</span>
          <div style="display:flex;gap:8px">
            <a class="btn btn-ghost btn-sm" href="${c?'#/super/companies/'+c.id:'#/super/companies'}">Cancel</a>
            <button class="btn btn-primary btn-sm" onclick="App.saveCompany('${c?c.id:''}')">${c?'Save changes':'Create company'}</button>
          </div>
        </div>
      </div>
    </div>
  </div>`;
}
/* --- admins tab: every Company Admin, filterable by company + status --- */
function admTable(){
  const P = { q: ui.admFQ||'', companyId: ui.admFCo&&ui.admFCo!=='all'?ui.admFCo:undefined, active: ui.admFStatus||'all', role: 'company_admin' };
  const off = () => { let l=getUsers().filter(u=>u.role==='company_admin');
    if(ui.admFQ) l=l.filter(u=>(u.name+' '+u.email+' '+coName(u.companyId)).toLowerCase().includes(ui.admFQ.toLowerCase()));
    if(ui.admFCo&&ui.admFCo!=='all') l=l.filter(u=>u.companyId===ui.admFCo);
    if(ui.admFStatus!=='all') l=l.filter(u=>String(!!u.active)===ui.admFStatus);
    return l; };
  const t = tPager('mgAdmins', '/api/users', P, off);
  if (typeof t === 'string') return '__LOADING__';
  const cos = getCompanies();
  return `<div class="section-head" style="margin-top:0"><h2 style="font-size:16px">Company Admins (${t.total})</h2><button class="btn btn-primary btn-sm" onclick="App.coUserNew('','company_admin')">+ Invite Admin</button></div>
  <div class="toolbar">
  <input placeholder="🔍 Search name, email, company…" value="${ui.admFQ}" oninput="App.admF(event,'q')">
  <select onchange="App.admF(event,'co')"><option value="all">All companies</option>${cos.map(c=>`<option value="${c.id}" ${ui.admFCo===c.id?'selected':''}>${c.name}</option>`).join('')}</select>
  <select onchange="App.admF(event,'status')"><option value="all">All statuses</option><option value="true" ${ui.admFStatus==='true'?'selected':''}>Active</option><option value="false" ${ui.admFStatus==='false'?'selected':''}>Inactive</option></select></div>
  <div class="table-wrap"><table><tr><th>Name</th><th>Email</th><th>Company</th><th>Mobile</th><th>Status</th><th>Created</th><th>Actions</th></tr>
  ${t.rows.map(u=>`<tr><td><b>${u.name}</b></td><td>${u.email}</td><td>${u.companyName||coName(u.companyId)}</td><td>${u.mobile||'—'}</td>
  <td>${statusBadge(u.active!==false?'Delivered':'Cancelled')}</td><td class="hint">${u.createdAt||'—'}</td>
  <td style="white-space:nowrap"><button class="btn btn-ghost btn-sm" onclick="App.userView('${u.id}')">View</button> <button class="btn btn-ghost btn-sm" onclick="App.coUserNew('${u.id}',null,true)">Edit</button> <button class="btn btn-ghost btn-sm" onclick="App.coUserToggle('${u.id}',${!!u.active})">${u.active!==false?'Deactivate':'Activate'}</button></td></tr>`).join('')||'<tr><td colspan=7><div class="empty">No administrators match.</div></td></tr>'}</table></div>${t.pager}`;
}
/* --- users tab: company users across the platform --- */
function usrTable(){
  const P = { q: ui.usrFQ||'', companyId: ui.usrFCo&&ui.usrFCo!=='all'?ui.usrFCo:undefined, role: ui.usrFRole&&ui.usrFRole!=='all'?ui.usrFRole:undefined, active: ui.usrFStatus||'all' };
  const off = () => { let l=getUsers().filter(u=>u.role!=='super_admin');
    if(ui.usrFQ) l=l.filter(u=>(u.name+' '+u.email+' '+coName(u.companyId)).toLowerCase().includes(ui.usrFQ.toLowerCase()));
    if(ui.usrFCo&&ui.usrFCo!=='all') l=l.filter(u=>u.companyId===ui.usrFCo);
    if(ui.usrFRole&&ui.usrFRole!=='all') l=l.filter(u=>u.role===ui.usrFRole);
    if(ui.usrFStatus!=='all') l=l.filter(u=>String(!!u.active)===ui.usrFStatus);
    return l; };
  const t = tPager('mgUsers', '/api/users', P, off);
  if (typeof t === 'string') return '__LOADING__';
  const rows = t.rows.filter(u=>u.role!=='super_admin');
  const cos = getCompanies();
  return `<div class="section-head" style="margin-top:0"><h2 style="font-size:16px">Company Users (${t.total})</h2><button class="btn btn-primary btn-sm" onclick="App.coUserNew('','sales_user')">+ Add User</button></div>
  <div class="toolbar">
  <input placeholder="🔍 Search name, email, company…" value="${ui.usrFQ}" oninput="App.usrF(event,'q')">
  <select onchange="App.usrF(event,'co')"><option value="all">All companies</option>${cos.map(c=>`<option value="${c.id}" ${ui.usrFCo===c.id?'selected':''}>${c.name}</option>`).join('')}</select>
  <select onchange="App.usrF(event,'role')"><option value="all">All roles</option><option value="sales_user" ${ui.usrFRole==='sales_user'?'selected':''}>Sales User</option><option value="company_admin" ${ui.usrFRole==='company_admin'?'selected':''}>Company Admin</option></select>
  <select onchange="App.usrF(event,'status')"><option value="all">All statuses</option><option value="true" ${ui.usrFStatus==='true'?'selected':''}>Active</option><option value="false" ${ui.usrFStatus==='false'?'selected':''}>Inactive</option></select></div>
  <div class="table-wrap"><table><tr><th>Name</th><th>Email</th><th>Company</th><th>Role</th><th>Mobile</th><th>Status</th><th>Actions</th></tr>
  ${rows.map(u=>`<tr><td><b>${u.name}</b></td><td>${u.email}</td><td>${u.companyName||coName(u.companyId)}</td><td>${u.role==='company_admin'?'Company Admin':'Sales User'}</td><td>${u.mobile||'—'}</td>
  <td>${statusBadge(u.active!==false?'Delivered':'Cancelled')}</td>
  <td style="white-space:nowrap"><button class="btn btn-ghost btn-sm" onclick="App.userView('${u.id}')">View</button> <button class="btn btn-ghost btn-sm" onclick="App.coUserNew('${u.id}',null,true)">Edit</button> <button class="btn btn-ghost btn-sm" onclick="App.coUserRole('${u.id}','${u.role}')">${u.role==='sales_user'?'Make admin':'Make sales'}</button> <button class="btn btn-ghost btn-sm" onclick="App.coUserToggle('${u.id}',${!!u.active})">${u.active!==false?'Deactivate':'Activate'}</button></td></tr>`).join('')||'<tr><td colspan=7><div class="empty">No users match.</div></td></tr>'}</table></div>${t.pager}`;
}
/* ---------- super admin: company detail (7 tabs, live DB) ---------- */
const CO_TABS = [['overview','Overview'],['users','Users'],['catalog','Catalog'],['categories','Categories'],['media','Media'],['orders','Orders'],['settings','Settings']];
async function coDetail(id){
  if (B()?.enabled) { try { return await B().api.get('/api/companies/' + id); } catch(e){ return { _err: e.message }; } }
  const c = getCompanies().find(x=>x.id===id);
  if (!c) return null;
  const ps=getProducts().filter(p=>p.companyId===id), os=getOrders().filter(o=>o.companyId===id), us=getUsers().filter(u=>u.companyId===id), qs=getQuotes().filter(q=>q.companyId===id);
  const adm = us.find(u=>u.role==='company_admin')||null;
  return { ...c, admin: adm, userCount: us.length, productCount: ps.length, visibleCount: ps.filter(p=>p.visible).length, categoryCount: new Set(ps.map(p=>p.category)).size, orderCount: os.length, pendingOrders: os.filter(o=>o.status==='Pending').length, revenue: os.reduce((a,o)=>a+o.total,0), quoteCount: qs.length, openQuotes: qs.filter(q=>q.status==='Pending').length };
}
function vCompanyDetail(id, tab, d){
  tab = tab || 'overview';
  if (d && d._err) return `<div class="empty">⚠️ ${d._err}</div>`;
  if (!d) return `<div class="card"><div class="card-pad"><div class="skel" style="min-height:200px"></div><p class="hint">Loading company…</p></div></div>`;
  const st = d.storeStatus || d.status;
  let body = '';
  if (tab === 'overview') {
    const recent = getAuditLog().filter(a=>a.companyId===id).slice(0,6);
    body = `<div class="stat-grid" style="grid-template-columns:repeat(4,1fr)">
      ${[['Users',d.userCount||0],['SKUs',d.productCount||0],['Categories',d.categoryCount||0],['Orders',d.orderCount||0],['Pending',d.pendingOrders||0],['Revenue',fmt(d.revenue||0)],['RFQs',d.quoteCount||0],['Visible',d.visibleCount||0]].map(([l,v])=>`<div class="ind-stat"><b>${v}</b><p>${l}</p></div>`).join('')}</div>
    <div class="card" style="margin-top:14px"><div class="card-pad"><h3 style="margin:0 0 8px;font-size:15px">Company information</h3>
    <div class="form-grid"><div><p class="hint" style="margin:0">Contact</p><b>${d.email||'—'}</b><div class="hint">${d.phone||''}</div></div>
    <div><p class="hint" style="margin:0">Address</p><b>${d.address||'—'}</b><div class="hint">${d.city||''} ${d.state||''} ${d.pin||''}</div></div></div>
    <p style="font-size:13px">${d.description||''}</p>
    <p class="hint">Plan ${d.plan||''} • Created ${d.createdAt||'—'} • Updated ${d.updatedAt||'—'}</p></div></div>
    <div class="card" style="margin-top:14px"><div class="card-pad"><h3 style="margin:0 0 8px;font-size:15px">Recent activity</h3>${recent.length?recent.map(a=>`<div style="display:flex;gap:10px;padding:7px 0;font-size:12.5px;border-top:1px solid #F1F5F9"><b>${a.actor}</b><span>${a.summary||a.action}</span><span class="hint" style="margin-left:auto">${String(a.ts).slice(0,16).replace('T',' ')}</span></div>`).join(''):'<p class="hint">No recorded activity yet.</p>'}<a class="btn btn-ghost btn-sm" href="#/super/audit">Full audit log →</a></div></div>`;
  } else if (tab === 'users') {
    const us = getUsers().filter(u=>u.companyId===id);
    body = `<div class="section-head" style="margin-top:0"><h2 style="font-size:16px">Users (${us.length})</h2><button class="btn btn-primary btn-sm" onclick="App.coUserNew('${id}')">+ Create user</button></div>
    <div class="table-wrap"><table><tr><th>Name</th><th>Email</th><th>Role</th><th>Mobile</th><th>Status</th><th>Actions</th></tr>
    ${us.map(u=>`<tr><td><b>${u.name}</b></td><td>${u.email}</td><td>${statusBadge(u.role==='company_admin'?'Confirmed':u.role==='super_admin'?'Processing':'Pending')} ${u.role.replace('_',' ')}</td><td>${u.mobile||'—'}</td><td>${statusBadge(u.active?'Delivered':'Cancelled')}</td>
    <td style="white-space:nowrap"><button class="btn btn-ghost btn-sm" onclick="App.coUserRole('${u.id}','${u.role}')">${u.role==='sales_user'?'Make admin':'Make sales'}</button> <button class="btn btn-ghost btn-sm" onclick="App.coUserToggle('${u.id}',${!!u.active})">${u.active?'Deactivate':'Activate'}</button></td></tr>`).join('')||'<tr><td colspan=6><div class="empty">No users.</div></td></tr>'}</table></div>`;
  } else if (tab === 'catalog') {
    const ps = getProducts().filter(p=>p.companyId===id);
    body = `<div class="section-head" style="margin-top:0"><h2 style="font-size:16px">Catalog (${ps.length} SKUs)</h2><a class="btn btn-primary btn-sm" href="#/super/companies/${id}/products/new">+ Add product</a></div>
    <div class="table-wrap"><table><tr><th>Product</th><th>Brand</th><th>Price</th><th>Stock</th><th>Visible</th><th>Actions</th></tr>
    ${ps.map(p=>`<tr><td><div style="display:flex;gap:10px;align-items:center"><img class="thumb" src="${img0(p)}" onerror="${NOIMG_ERR}"><div><b>${p.name}</b><div class="hint">${p.sku||p.id}${p.mpn?' • '+p.mpn:''}${p.archived?' • ARCHIVED':''}</div></div></div></td><td>${p.brand||'—'}</td><td>${p.price!=null?`<b>${fmt(p.price)}</b>`:'<span class="status s-ready">RFQ</span>'}</td><td>${p.stock}</td>
    <td><button class="status ${p.visible?'s-active':'s-cancelled'}" onclick="App.toggleVis('${p.id}')">${p.visible?'Visible':'Hidden'}</button></td>
    <td style="white-space:nowrap"><a class="btn btn-ghost btn-sm" href="#/store/product/${p.id}">View</a> <a class="btn btn-ghost btn-sm" href="#/admin/products/edit/${p.id}">Edit</a> <button class="btn btn-ghost btn-sm" onclick="App.coProdArchive('${p.id}',${!!p.archived})">${p.archived?'Unarchive':'Archive'}</button></td></tr>`).join('')}</table></div>`;
  } else if (tab === 'categories') {
    const globals = getCats().filter(c=>c.scope==='global');
    const mine = getCats().filter(c=>c.scope==='company'&&c.companyId===id);
    body = `<div class="section-head" style="margin-top:0"><h2 style="font-size:16px">Categories</h2><button class="btn btn-primary btn-sm" onclick="App.coCatNew('${id}')">+ Company category</button></div>
    <h3 style="font-size:14px">Global categories (assign to this company)</h3>
    <div class="table-wrap"><table><tr><th>Category</th><th>SKUs here</th><th>Action</th></tr>
    ${globals.map(c=>{const n=getProducts().filter(p=>p.companyId===id&&p.category===c.id).length;return `<tr><td>${c.icon} <b>${c.name}</b></td><td>${n}</td><td><a class="btn btn-ghost btn-sm" href="#/super/categories">Manage globally</a></td></tr>`}).join('')}</table></div>
    <h3 style="font-size:14px;margin-top:14px">Company-specific (${mine.length})</h3>
    <div class="table-wrap"><table><tr><th>Category</th><th>SKUs</th><th>Active</th><th>Action</th></tr>
    ${mine.map(c=>`<tr><td>${c.icon} <b>${c.name}</b><div class="hint">${c.desc||''}</div></td><td>${getProducts().filter(p=>p.companyId===id&&p.category===c.id).length}</td><td>${statusBadge(c.active!==false?'Delivered':'Cancelled')}</td><td><button class="btn btn-ghost btn-sm" onclick="App.coCatToggle('${c.id}',${c.active!==false})">${c.active!==false?'Deactivate':'Activate'}</button></td></tr>`).join('')||'<tr><td colspan=4><div class="empty">No company-specific categories.</div></td></tr>'}</table></div>`;
  } else if (tab === 'media') {
    const ms = getMedia().filter(m=>m.companyId===id);
    const ps = getProducts().filter(p=>p.companyId===id);
    body = `<div class="section-head" style="margin-top:0"><h2 style="font-size:16px">Media (${ms.length})</h2><button class="btn btn-primary btn-sm" onclick="App.coMediaUp('${id}')">+ Upload media</button></div>
    ${B()?.enabled?'':`<p class="hint">Media index syncs from the live database when connected. Product images below come from catalog records.</p>`}
    <div class="prod-grid" style="grid-template-columns:repeat(4,1fr)">${(ms.length?ms.map(m=>({url:m.url,type:m.type,label:(m.sku||'')+(m.primary?' • primary':''),id:m.id,vis:m.visible})) : ps.flatMap(p=>(p.images||[]).map((u,i)=>({url:u,type:'image',label:(p.sku||'')+(i===0?' • primary':''),id:null,vis:true})))).map(m=>`<div class="prod"><div class="prod-img"><${m.type==='video'?'video controls':'img'} src="${m.url}" ${m.type==='video'?'style="width:100%;height:100%"':`onerror="${NOIMG_ERR}"`}></${m.type==='video'?'video':'img'}></div><div class="prod-body"><b style="font-size:12px">${m.label}</b><span class="hint">${m.type}${m.vis?'':' • hidden'}</span>${m.id?`<div class="prod-actions"><button class="btn btn-ghost btn-sm" onclick="App.coMediaPrimary('${m.id}')">Primary</button><button class="btn btn-ghost btn-sm" onclick="App.coMediaDel('${m.id}')">Delete</button></div>`:''}</div></div>`).join('')||'<div class="empty">No media yet.</div>'}</div>`;
  } else if (tab === 'orders') {
    const os = getOrders().filter(o=>o.companyId===id);
    body = `<div class="section-head" style="margin-top:0"><h2 style="font-size:16px">Orders (${os.length})</h2><a class="btn btn-ghost btn-sm" href="#/super/orders">All orders →</a></div>
    <div class="table-wrap"><table><tr><th>Order</th><th>Customer</th><th>Items</th><th>Total</th><th>Status</th></tr>
    ${os.map(o=>`<tr><td><a href="#/admin/orders/${o.id}"><b>${o.id}</b></a><div class="hint">${o.date}</div></td><td>${o.companyName||o.customer}</td><td>${o.items.reduce((a,i)=>a+i.qty,0)}</td><td><b>${fmt(o.total)}</b></td><td>${statusBadge(o.status)}</td></tr>`).join('')||'<tr><td colspan=5><div class="empty">No orders.</div></td></tr>'}</table></div>`;
  } else if (tab === 'settings') {
    body = `<div id="coSetWrap"><div class="skel" style="min-height:120px"></div></div>`;
    setTimeout(()=>App.coSettingsLoad(id), 0);
  }
  return `<div class="section-head"><div><a class="btn btn-ghost btn-sm" href="#/super/companies">← Companies</a><h2 style="margin:8px 0 2px">${d.logo||'🏭'} ${d.name}</h2><p class="hint" style="margin:0">${d.code||d.id} • ${d.industry||''} • ${d.city||''} ${statusBadge((d.storeStatus||d.status)==='active'?'Delivered':'Cancelled')}</p></div>
  <div style="display:flex;gap:8px"><a class="btn btn-ghost btn-sm" href="#/super/companies/${id}/edit">Edit</a><button class="btn btn-ghost btn-sm" onclick="App.coToggle('${id}','${d.storeStatus||d.status}')">Suspend / Activate</button></div></div>
  <div class="tabs">${CO_TABS.map(([k,l])=>`<a class="tab ${tab===k?'active':''}" href="#/super/companies/${id}?tab=${k}">${l}</a>`).join('')}</div>
  <div class="card" style="margin-top:0;border-top-left-radius:0"><div class="card-pad">${body}</div></div>`;
}
function vAdminDash(){
  const myCoId = me.companyId;
  const ps=getProducts().filter(p=>p.companyId===myCoId), os=getOrders().filter(o=>o.companyId===myCoId);
  const qs=getQuotes().filter(q=>q.companyId===myCoId);
  const pend=os.filter(o=>o.status==='Pending').length, del=os.filter(o=>o.status==='Delivered').length;
  const rev=os.reduce((a,o)=>a+o.total,0);
  const cTitle = coName(myCoId);
  return `<div class="section-head"><h2>${cTitle} — Industrial Store</h2><a class="btn btn-primary btn-sm" href="#/admin/products/new">+ Add product</a></div>
  <div class="grid-kpi"><div class="kpi k1"><h3>${ps.length}</h3><p>SKUs in catalog</p><small>${ps.filter(p=>p.visible).length} visible • ${ps.filter(p=>p.price==null).length} quotation-only</small></div>
  <div class="kpi k4"><h3>${os.length}</h3><p>Orders</p><small>${pend} pending • ${qs.filter(q=>q.status==='Pending').length} open RFQs</small></div>
  <div class="kpi k3"><h3>${fmt(rev)}</h3><p>Order value</p><small>${del} delivered</small></div></div>
  <div style="display:grid;grid-template-columns:1.4fr .8fr;gap:14px" class="dash2">
  <div class="card"><div class="card-pad"><div class="section-head" style="margin-top:0"><h2>Recent orders</h2><a class="btn btn-ghost btn-sm" href="#/admin/orders">View all →</a></div>
  <div class="table-wrap"><table><tr><th>Order</th><th>Customer</th><th>Total</th><th>Status</th></tr>${os.length ? os.slice(0,4).map(o=>`<tr><td><a href="#/admin/orders/${o.id}"><b>${o.id}</b></a><div class="hint">${o.date}</div></td><td>${o.companyName||o.customer}</td><td><b>${fmt(o.total)}</b></td><td>${statusBadge(o.status)}</td></tr>`).join('') : '<tr><td colspan="4"><div class="empty">No orders placed yet for this company.</div></td></tr>'}</table></div></div></div>
  <div class="card"><div class="card-pad"><h2 style="margin:0 0 8px;font-size:16px">Low stock alerts</h2>${ps.filter(p=>p.stock<=15).map(p=>`<div style="display:flex;gap:10px;align-items:center;padding:9px 0;border-top:1px solid #F1F5F9"><img class="thumb" src="${img0(p)}" onerror="${NOIMG_ERR}"><div><b style="font-size:13px">${p.name}</b><div class="hint">${p.sku||''} • ${p.stock} ${p.uom||''} left • ${p.warehouse||''}</div></div><a class="btn btn-ghost btn-sm" style="margin-left:auto" href="#/admin/products/edit/${p.id}">Restock</a></div>`).join('')||'<p class="hint">Stock levels healthy or catalog empty.</p>'}</div></div></div>`;
}
function vProducts(){
  const q=(ui.adminQ||'').toLowerCase();
  const myCoId = me?.companyId;
  const isSuper = me?.role === 'super_admin';
  const ps = getProducts().filter(p => {
    if (!isSuper && myCoId && p.companyId !== myCoId) return false;
    if (q) {
      const txt = (p.name + ' ' + (p.sku || '') + ' ' + (p.brand || '') + ' ' + (p.mpn || '')).toLowerCase();
      if (!txt.includes(q)) return false;
    }
    return true;
  });
  return `<div class="section-head"><h2>Industrial catalog (${ps.length} SKUs)</h2><div><a class="btn btn-ghost btn-sm" href="#/admin/media">Media library</a> <a class="btn btn-primary btn-sm" href="#/admin/products/new">+ Add product</a></div></div>
  <div class="card"><div class="card-pad"><div class="toolbar"><input placeholder="Search name, SKU, brand, MPN…" value="${ui.adminQ||''}" oninput="App.f(event,'aq')"></div>
  <div class="table-wrap"><table><tr><th>Product</th><th>Brand</th><th>Price</th><th>Stock</th><th>Visible</th><th>Action</th></tr>
  ${ps.length ? ps.map(p=>`<tr><td><div style="display:flex;gap:10px;align-items:center"><img class="thumb" src="${img0(p)}" onerror="${NOIMG_ERR}"><div><b>${p.name}</b><div class="hint">${p.sku||p.id}${p.mpn?' • MPN '+p.mpn:''}</div></div></div></td><td>${p.brand||'—'}</td><td>${p.price!=null?`<b>${fmt(p.price)}</b> <span class="hint">/ ${p.uom||'Pc'}</span>`:`<span class="status s-ready">RFQ</span>`}</td><td>${p.stock<=10?`<b style="color:#D97706">${p.stock} low</b>`:p.stock} <span class="hint">${p.uom||''}</span></td><td><button class="status ${p.visible?'s-active':'s-cancelled'}" onclick="App.toggleVis('${p.id}')">${p.visible?'Visible':'Hidden'}</button></td><td><a class="btn btn-ghost btn-sm" href="#/admin/products/edit/${p.id}">Edit</a> <button class="btn btn-ghost btn-sm" style="color:#DC2626;padding:4px 8px;margin-left:4px" title="Delete product" onclick="App.deleteProduct('${p.id}')">🗑️</button></td></tr>`).join('') : `<tr><td colspan="6"><div class="empty" style="padding:32px;text-align:center"><div class="big">📦</div><h3>No products in catalog</h3><p class="hint">Your company catalog is empty. Click "+ Add product" above to create your first SKU.</p></div></td></tr>`}</table></div></div></div>`;
}
function vProductForm(editId, forCo){
  const p=editId?prodById(editId):{name:'',sku:'',brand:'',mpn:'',short:'',price:'',uom:'Pc',moq:1,leadTime:'',warehouse:'',stock:'',category:(storeCats()[0]||{}).id||'cutting-tools',visible:true,desc:'',specsText:'',images:[],video:''};
  if(editId&&!p) return `<div class="empty"><div class="big">🔍</div>Product not found.</div>`;
  const specsText = p.specsText ?? Object.entries(p.specs||{}).map(([k,v])=>k+': '+v).join('\n');
  const isSuper = me?.role === 'super_admin';
  const targetCo = editId ? p.companyId : (forCo || me?.companyId || '');
  const back = isSuper ? (targetCo ? '#/super/companies/'+targetCo+'?tab=catalog' : '#/super/catalog') : '#/admin/products';
  const coField = (isSuper && !editId)
    ? `<div class="field"><label>Company *</label><select id="f_co">${getCompanies().map(c=>`<option value="${c.id}" ${c.id===targetCo?'selected':''}>${c.name} (${c.code||c.id})</option>`).join('')}</select></div>`
    : `<input type="hidden" id="f_co" value="${targetCo}">`;
  return `<div class="prod-create-wrap">
    <div class="section-head" style="margin:0 0 10px">
      <div>
        <p class="hint" style="margin:0;font-size:11px;font-weight:700">CATALOG MANAGEMENT • SKU ENTRY</p>
        <h2 style="font-size:18px;margin:2px 0 0">${editId?'Edit SKU — '+(p.sku||p.name):'Add Industrial Product'}</h2>
      </div>
      <a class="btn btn-ghost btn-sm" href="${back}">← Back to Catalog</a>
    </div>

    <div class="card" style="box-shadow:0 1px 3px rgba(15,23,42,0.06)">
      <div class="card-pad" style="padding:12px 14px">
        <div class="prod-form-grid">
          <!-- Col 1: Identification & Specs -->
          <div class="prod-col">
            <div class="prod-col-title"><span>📦 Product Identity</span></div>
            ${coField}
            <div class="field">
              <label>Product Name *</label>
              <input id="f_name" value="${p.name||''}" placeholder="e.g. Carbide Turning Insert CNMG 120408">
            </div>
            <div class="form-row-2">
              <div class="field">
                <label>SKU / Item Code *</label>
                <input id="f_sku" value="${p.sku||''}" placeholder="e.g. TOOL-CNMG-01">
              </div>
              <div class="field">
                <label>Category *</label>
                <select id="f_cat">${(storeCats().some(c=>c.id===p.category)?storeCats():[...storeCats(),...getCats().filter(c=>c.id===p.category)]).map(c=>`<option value="${c.id}" ${p.category===c.id?'selected':''}>${c.icon} ${c.name}</option>`).join('')}</select>
              </div>
            </div>
            <div class="form-row-2">
              <div class="field">
                <label>Brand / Manufacturer</label>
                <input id="f_brand" value="${p.brand||''}" placeholder="e.g. CarbiMax">
              </div>
              <div class="field">
                <label>Part Number (MPN)</label>
                <input id="f_mpn" value="${p.mpn||''}" placeholder="e.g. CM-CNMG120408">
              </div>
            </div>
            <div class="field">
              <label>Specification Summary</label>
              <input id="f_short" value="${p.short||''}" placeholder="e.g. CNMG 120408 • CVD coated">
            </div>
            <div class="field">
              <label>Technical Description *</label>
              <textarea id="f_desc" rows="2" placeholder="Materials, compatibility, standards, warranty…">${p.desc||''}</textarea>
            </div>
          </div>

          <!-- Col 2: Pricing, Stock & ERP -->
          <div class="prod-col">
            <div class="prod-col-title"><span>🏷️ Commercial & Inventory</span></div>
            <div class="form-row-2">
              <div class="field">
                <label>Price (₹) <span class="hint" style="font-weight:normal">(empty = RFQ)</span></label>
                <input id="f_price" type="number" value="${p.price??''}" placeholder="Quotation-only">
              </div>
              <div class="field">
                <label>Unit of Measure (UoM)</label>
                <select id="f_uom">${['Pc','Set','Pack','Kit','Drum','Mtr','Kg','Ltr','Box'].map(u=>`<option ${p.uom===u?'selected':''}>${u}</option>`).join('')}</select>
              </div>
            </div>
            <div class="form-row-2">
              <div class="field">
                <label>Stock (ERP Inventory) *</label>
                <input id="f_stock" type="number" value="${p.stock??''}" placeholder="0">
              </div>
              <div class="field">
                <label>Min Order Qty (MOQ)</label>
                <input id="f_moq" type="number" value="${p.moq??1}">
              </div>
            </div>
            <div class="form-row-2">
              <div class="field">
                <label>Lead Time</label>
                <input id="f_lead" value="${p.leadTime||''}" placeholder="e.g. Ex-stock / 7 days">
              </div>
              <div class="field">
                <label>Warehouse</label>
                <input id="f_wh" value="${p.warehouse||''}" placeholder="e.g. WH-Pune-01">
              </div>
            </div>
            <div class="form-row-2">
              <div class="field">
                <label>Store Visibility</label>
                <select id="f_vis"><option value="1" ${p.visible?'selected':''}>Visible in store</option><option value="0" ${!p.visible?'selected':''}>Hidden</option></select>
              </div>
              <div class="field">
                <label>Featured</label>
                <select id="f_feat"><option value="1" ${p.featured?'selected':''}>Featured on home</option><option value="0" ${!p.featured?'selected':''}>Normal</option></select>
              </div>
            </div>
            <div class="field">
              <label>Technical Specifications (Key: Value per line)</label>
              <textarea id="f_specs" rows="2" placeholder="Diameter: Ø10 mm&#10;Coating: AlCrN">${specsText||''}</textarea>
            </div>
          </div>

          <!-- Col 3: Media & Publishing Actions -->
          <div class="prod-col">
            <div class="prod-col-title">
              <span>📸 Media & Publish</span>
            </div>

            <div class="field">
              <label>Product Images * <span class="hint" style="font-weight:normal">(1st = primary)</span></label>
              <div class="prod-upload-box" onclick="document.getElementById('f_imgs').click()">
                <span style="font-size:18px">📤</span>
                <div>
                  <b style="font-size:11.5px;color:var(--argus-navy)">Upload product images</b>
                  <div class="hint">Click to browse • JPG/PNG • click preview to remove</div>
                </div>
                <input type="file" id="f_imgs" accept="image/*" multiple hidden onchange="App.previewFiles(this,'imgPrev')">
              </div>
              <div class="prod-media-row" id="imgPrev">
                ${(p.images||[]).map(u=>`<img src="${u}" onclick="this.remove()" title="Click to remove">`).join('')}
              </div>
            </div>

            <div class="field">
              <label>Product Video <span class="hint" style="font-weight:normal">(demo/install)</span></label>
              <div class="prod-upload-box" onclick="document.getElementById('f_vid').click()">
                <span style="font-size:18px">🎬</span>
                <div>
                  <b style="font-size:11.5px;color:var(--argus-navy)">Upload video (optional)</b>
                  <div class="hint">MP4 / WEBM • max 50MB</div>
                </div>
                <input type="file" id="f_vid" accept="video/*" hidden onchange="App.previewFiles(this,'vidPrev')">
              </div>
              <div class="prod-media-row" id="vidPrev" style="min-height:24px">
                ${p.video?`<video src="${p.video}" controls style="height:36px"></video>`:''}
              </div>
            </div>

            <div style="margin-top:auto;padding-top:6px;border-top:1px solid #E2E8F0">
              <button class="btn btn-primary" id="f_save" style="width:100%;padding:8px 12px;font-size:13px;border-radius:7px" onclick="App.saveProduct('${editId||''}')">💾 ${editId?'Save Changes':'Publish Product'}</button>
              <div id="f_err" class="hint" style="color:#DC2626;margin-top:6px"></div>
              <div style="display:flex;justify-content:space-between;align-items:center;margin-top:6px">
                <a class="btn btn-ghost btn-sm" style="padding:4px 10px;font-size:11.5px" href="${back}">Cancel</a>
                <span class="hint" style="font-size:10.5px">Stock linked to ERP</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>`;
}
function vMedia(){
  const myCoId = me.companyId;
  const isSuper = me.role === 'super_admin';
  const ps=getProducts().filter(p=>isSuper || p.companyId===myCoId);
  return `<div class="section-head"><h2>Media library</h2><a class="btn btn-primary btn-sm" href="#/admin/products/new">+ Upload via product</a></div>
  <div class="card"><div class="card-pad"><div class="prod-grid" style="grid-template-columns:repeat(3,1fr)">${ps.length ? ps.flatMap(p=>((p.images||[]).slice(0,2)).map(u=>`<div class="prod"><div class="prod-img"><img src="${u}" onerror="${NOIMG_ERR}"></div><div class="prod-body"><b style="font-size:13px">${p.name}</b><span class="hint">${p.sku||''} • primary image</span></div></div>`)).join('') : '<div class="empty" style="grid-column:1/-1;padding:32px;text-align:center"><div class="big">🖼️</div><p class="hint">No product media uploaded yet for this company.</p></div>'}</div>
  <p class="hint">Company-scoped media. Videos stream with lazy loading + error fallback on the product page.</p></div></div>`;
}
function vCats(){
  const cats=getCats();
  const myCoId = me.companyId;
  const coProds = getProducts().filter(p=>!myCoId || p.companyId===myCoId);
  return `<div class="section-head"><h2>Categories (${cats.length})</h2><button class="btn btn-primary btn-sm" onclick="App.addCat()">+ New category</button></div>
  <div class="card"><div class="card-pad"><div class="cat-row" style="flex-wrap:wrap">${cats.map(c=>`<span class="cat-chip">${c.icon} ${c.name} <b>• ${coProds.filter(p=>p.category===c.id).length}</b></span>`).join('')}</div>
  <div class="table-wrap" style="margin-top:12px"><table><tr><th>Category</th><th>Scope</th><th>Description</th><th>SKUs</th><th>Status</th><th>Action</th></tr>${cats.map(c=>{
    const canEdit = me.role==='super_admin' || (c.scope==='company' && c.companyId===myCoId);
    return `<tr><td>${c.icon} <b>${c.name}</b></td><td class="hint">${c.scope==='company'?'Company':'Global'}</td><td class="hint">${c.desc||''}</td><td>${coProds.filter(p=>p.category===c.id).length}</td><td>${statusBadge(c.active!==false?'Delivered':'Cancelled')}</td><td style="white-space:nowrap">${canEdit?`<button class="btn btn-ghost btn-sm" onclick="App.catRename('${c.id}')">Rename</button> <button class="btn btn-ghost btn-sm" onclick="App.coCatToggle('${c.id}',${c.active!==false})">${c.active!==false?'Deactivate':'Activate'}</button>`:'<span class="hint">Managed by platform</span>'}</td></tr>`}).join('')}</table></div>
  <p class="hint">Global categories are managed by the Super Admin. Company admins can add and manage their own company categories.</p></div></div>`;
}
function vUsers(){
  const myCoId = me.companyId;
  const us=getUsers().filter(u=>u.companyId===myCoId);
  return `<div class="section-head"><h2>Sales users (${us.length})</h2><button class="btn btn-primary btn-sm" onclick="App.coUserNew('${myCoId}','sales_user')">+ Create sales user</button></div>
  <div class="card"><div class="card-pad"><div class="table-wrap"><table><tr><th>User</th><th>Contact</th><th>Status</th><th>Orders</th><th>Action</th></tr>
  ${us.length ? us.map(u=>`<tr><td><b>${u.name}</b><div class="hint">${(u.role||'').replace('_',' ')}</div></td><td>${u.email}<div class="hint">${u.mobile||''}</div></td><td>${statusBadge(u.active!==false?'Delivered':'Cancelled')}</td><td>${getOrders().filter(o=>o.salesUser===u.name).length}</td><td><button class="btn btn-ghost btn-sm" onclick="App.coUserNew('${u.id}',null,true)">Edit</button> <button class="btn btn-ghost btn-sm" onclick="App.coUserToggle('${u.id}',${!!u.active})">${u.active!==false?'Deactivate':'Activate'}</button></td></tr>`).join('') : '<tr><td colspan="5"><div class="empty" style="padding:24px;text-align:center"><div class="big">👥</div><h3>No sales users yet</h3><p class="hint">Click "+ Create sales user" to add a member with their Google email.</p></div></td></tr>'}</table></div></div></div>`;
}
function vOrdersAdmin(){
  const q=(ui.orderQ||'').toLowerCase(), st=ui.orderStatus;
  const myCoId = me.companyId;
  const isSuper = me.role === 'super_admin';
  let os=getOrders().filter(o=>isSuper || o.companyId===myCoId);
  if(st!=='all') os=os.filter(o=>o.status===st);
  if(q) os=os.filter(o=>(o.id+' '+(o.companyName||'')+' '+o.customer+' '+o.mobile+' '+(o.poRef||'')).toLowerCase().includes(q));
  return `<div class="section-head"><h2>Orders (${os.length}) <span class="hint">• ERP sales-order linked</span></h2><button class="btn btn-ghost btn-sm" onclick="window.print()">🖨️ Print</button></div>
  <div class="card"><div class="card-pad"><div class="toolbar"><input placeholder="Search order / company / PO ref…" value="${ui.orderQ||''}" oninput="App.f(event,'oq')">
  <select onchange="App.f(event,'os')">${['all','Pending','Confirmed','Processing','Ready for Dispatch','Shipped','Delivered','Cancelled'].map(s=>`<option ${st===s?'selected':''}>${s==='all'?'All statuses':s}</option>`).join('')}</select></div>
  <div class="table-wrap"><table><tr><th>Order</th><th>Sales user</th><th>Customer</th><th>Items</th><th>Total</th><th>Status</th></tr>
  ${os.length ? os.map(o=>`<tr><td><a href="#/admin/orders/${o.id}"><b>${o.id}</b></a><div class="hint">${o.date}${o.poRef?' • '+o.poRef:''}</div></td><td>${o.salesUser}${isSuper?`<div class="hint">${coName(o.companyId)}</div>`:''}</td><td>${o.companyName||o.customer}<div class="hint">${o.mobile} • ${o.city}</div></td><td>${o.items.reduce((a,i)=>a+i.qty,0)}</td><td><b>${fmt(o.total)}</b></td><td>${statusBadge(o.status)}</td></tr>`).join('') : '<tr><td colspan=6><div class="empty">No orders found for this company.</div></td></tr>'}</table></div></div></div>`;
}
function vQuotesAdmin(){
  const st=ui.quoteStatus;
  const myCoId = me.companyId;
  let qs=getQuotes().filter(x=>me.role==='super_admin' || x.companyId===myCoId);
  if(st!=='all') qs=qs.filter(x=>x.status===st);
  return `<div class="section-head"><h2>Quotation requests (${qs.length})</h2><span class="hint">Reuses ERP quotation workflow</span></div>
  <div class="card"><div class="card-pad"><div class="toolbar"><select onchange="App.f(event,'qs')">${['all','Pending','Quoted','Accepted','Rejected','Cancelled'].map(s=>`<option ${st===s?'selected':''}>${s==='all'?'All statuses':s}</option>`).join('')}</select></div>
  <div class="table-wrap"><table><tr><th>RFQ</th><th>Product</th><th>Qty</th><th>Requested by</th><th>Quote</th><th>Status</th><th>Action</th></tr>
  ${qs.length ? qs.map(q=>{const p=prodById(q.pid)||{name:q.pid,sku:q.pid};return `<tr><td><b>${q.id}</b><div class="hint">${q.date}</div></td><td><b>${p.name}</b><div class="hint">${p.sku||''} • ${q.companyName||''}</div><div class="hint">Tech: ${q.techReq||'—'}</div></td><td>${q.qty}</td><td>${q.requestedBy}<div class="hint">${q.mobile||''}</div></td><td>${q.quotePrice!=null?'<b>'+fmt(q.quotePrice)+'</b>':'—'}<div class="hint">${q.adminNote||''}</div></td><td>${statusBadge(q.status)}</td><td><button class="btn btn-ghost btn-sm" onclick="App.quoteRespond('${q.id}')">Respond</button></td></tr>`}).join('') : '<tr><td colspan=7><div class="empty">No quotation requests found for this company.</div></td></tr>'}</table></div></div></div>`;
}
function orderDetail(id, back){
  const o=getOrders().find(x=>x.id===id);
  if(!o) return `<div class="empty"><div class="big">📭</div>Order ${id} not found.</div>`;
  const items=o.items.map(i=>{const p=prodById(i.pid)||{name:i.pid,sku:i.pid,uom:'Pc',images:[]};return {...i,p}} );
  return `<div class="section-head"><h2>${o.id} ${statusBadge(o.status)}</h2><div><button class="btn btn-ghost btn-sm" onclick="window.print()">🖨️ Print summary</button> <a class="btn btn-ghost btn-sm" href="${back}">← Back</a></div></div>
  <div style="display:grid;grid-template-columns:1.3fr .7fr;gap:14px" class="dash2">
  <div class="card"><div class="card-pad"><h3 style="margin-top:0">Line items (${items.reduce((a,i)=>a+i.qty,0)})</h3>
  ${items.map(i=>`<div class="cart-line"><img src="${img0(i.p)}" onerror="${NOIMG_ERR}" style="width:80px;height:80px;border-radius:8px;object-fit:cover"><div><b>${i.p.name}</b><div class="hint">${i.p.sku||i.pid} • Qty ${i.qty} ${i.p.uom||''} × ${fmt(i.price)}</div></div><b>${fmt(i.qty*i.price)}</b></div>`).join('')}
  <div style="border-top:1px dashed var(--line);padding-top:12px;display:grid;gap:6px;font-size:14px"><div style="display:flex;justify-content:space-between"><span>Subtotal</span><b>${fmt(o.total)}</b></div><div style="display:flex;justify-content:space-between"><span>GST</span><span>As per invoice</span></div><div style="display:flex;justify-content:space-between;font-size:17px"><span><b>Total</b></span><b>${fmt(o.total)}</b></div></div></div></div>
  <div><div class="card"><div class="card-pad"><h3 style="margin-top:0">Customer & delivery</h3><b>${o.companyName||o.customer}</b><div class="hint">${o.contact||o.customer} • ${o.mobile}${o.poRef?' • PO '+o.poRef:''}</div><p style="font-size:13.5px">${o.address||o.city}</p>
  ${me.role==='sales_user' ? `<p class="hint">Current status: ${statusBadge(o.status)} — updated by your store admin.</p>` : `<div class="field"><label>Update status (valid transitions only)</label><select id="ordSt">${['Pending','Confirmed','Processing','Ready for Dispatch','Shipped','Delivered','Cancelled'].map(s=>`<option ${o.status===s?'selected':''}>${s}</option>`).join('')}</select></div>
  <button class="btn btn-primary btn-sm" onclick="App.setStatus('${o.id}')">Update status</button>`}</div></div>
  <div class="card" style="margin-top:14px"><div class="card-pad"><h3 style="margin-top:0">Status history</h3>${(o.history||[[o.status,o.date]]).map(h=>`<div style="display:flex;gap:10px;padding:7px 0;font-size:13px"><span>●</span><b>${h[0]}</b><span class="hint" style="margin-left:auto">${h[1]}</span></div>`).join('')}</div></div></div></div>`;
}
/* store settings form — shared by Admin › Store Settings and Super › Company › Settings tab */
const SET_FIELDS = [['storeName','Store name','text'],['warehouse','Default warehouse','text'],['taxPct','Tax % (GST)','number'],['orderPrefix','Order prefix','text'],['quotePrefix','Quotation prefix','text'],['lowStock','Low-stock threshold','number'],['announcement','Storefront announcement','text','full']];
function settingsForm(cid, s){
  const def = { storeName: coName(cid)+' Industrial Store', warehouse:'WH-Pune-01', taxPct:18, orderPrefix:'ORD-', quotePrefix:'Q-', lowStock:10, announcement:'GST invoice on all orders • Bulk pricing on request' };
  const v = k => (s && s[k] != null && s[k] !== '') ? s[k] : def[k];
  return `<div class="form-grid">${SET_FIELDS.map(([k,l,t,full])=>`<div class="field${full?' full':''}"><label>${l}</label><input id="set_${k}" type="${t}" value="${String(v(k)).replace(/"/g,'&quot;')}"></div>`).join('')}</div>
  <div style="display:flex;gap:8px;align-items:center;margin-top:12px"><button class="btn btn-primary btn-sm" id="setSaveBtn" onclick="App.settingsSave('${cid}')">💾 Save settings</button><span id="setMsg" class="hint"></span></div>`;
}
function vSettings(){
  const myCoId = me?.companyId;
  if (me?.role === 'super_admin' && !myCoId) {
    setTimeout(()=>App.globalSettingsLoad(), 0);
    return `<div class="section-head"><h2>Global platform settings</h2></div><div class="card"><div class="card-pad" id="gSetWrap"><div class="skel" style="min-height:120px"></div></div></div>`;
  }
  setTimeout(()=>App.coSettingsLoad(myCoId), 0);
  return `<div class="section-head"><h2>Store settings — ${coName(myCoId)}</h2></div>
  <div class="card"><div class="card-pad" id="coSetWrap"><div class="skel" style="min-height:120px"></div></div></div>`;
}
/* ---------- storefront ---------- */
function vHome(){
  const myCoId = me?.companyId || 'C-ARGUS';
  const ps = (me?.role === 'super_admin' && !me?.companyId)
    ? getProducts().filter(p=>p.visible)
    : getProducts().filter(p=>p.companyId===myCoId&&p.visible);
  const feat=ps.filter(p=>p.featured);
  const freq=[...ps].filter(p=>p.price!=null&&p.stock>0).sort((a,b)=>(b.sold||0)-(a.sold||0)).slice(0,4);
  const spares=ps.filter(p=>p.category==='spares').slice(0,4);
  const tools=ps.filter(p=>p.category==='cutting-tools').slice(0,4);
  const recent=[...ps].sort((a,b)=>String(b.created).localeCompare(String(a.created))).slice(0,4);
  const sec=(t,arr)=>arr.length?`<div class="section-head"><h2>${t}</h2><a class="btn btn-ghost btn-sm" href="#/store/listing">View all →</a></div><div class="prod-grid">${arr.map(prodCard).join('')}</div>`:'';
  return `<div class="hero"><div class="hero-inner"><div><span class="hero-tag">CNCFORGE ERP • INDUSTRIAL PROCUREMENT</span><h1>Precision Products for Modern Manufacturing</h1><p>Discover CNC machine components, precision tooling, industrial spares, and manufacturing essentials — sourced from live ERP inventory.</p>
  <div style="display:flex;gap:10px;flex-wrap:wrap"><a class="btn btn-coral" href="#/store/listing">Explore Products →</a><a class="btn btn-ghost" style="background:rgba(255,255,255,.1);border-color:rgba(255,255,255,.3);color:#fff" href="#/store/listing?cat=cutting-tools">Browse Categories</a></div>
  <div class="ind-strip" style="margin:20px 0 0"><div class="ind-stat" style="background:rgba(255,255,255,.08);border-color:rgba(255,255,255,.15)"><b style="color:#fff">${ps.length}</b><p style="color:#CBD5E1">Live SKUs</p></div><div class="ind-stat" style="background:rgba(255,255,255,.08);border-color:rgba(255,255,255,.15)"><b style="color:#fff">${storeCats().length}</b><p style="color:#CBD5E1">Categories</p></div><div class="ind-stat" style="background:rgba(255,255,255,.08);border-color:rgba(255,255,255,.15)"><b style="color:#fff">${ps.filter(p=>p.stock>0).length}</b><p style="color:#CBD5E1">In stock</p></div><div class="ind-stat" style="background:rgba(255,255,255,.08);border-color:rgba(255,255,255,.15)"><b style="color:#fff">${ps.filter(p=>p.price==null).length}</b><p style="color:#CBD5E1">On quotation</p></div></div></div>
  <div><img src="https://images.unsplash.com/photo-1504328345606-18bbc8c9d7d1?auto=format&fit=crop&w=800&q=80" onerror="this.src='https://picsum.photos/seed/cnc-hero/800/600'" style="border-radius:12px;aspect-ratio:4/3;object-fit:cover;width:100%" alt="CNC machining floor"></div></div></div>
  <div class="section-head"><h2>Shop by category</h2><a class="btn btn-ghost btn-sm" href="#/store/listing">All products →</a></div>
  <div class="cat-grid">${storeCats().map(c=>{const n=ps.filter(p=>p.category===c.id).length;return `<a class="cat-card" href="#/store/listing?cat=${c.id}"><span class="cat-ico">${c.icon}</span><span><b>${c.name}</b><p>${c.desc||''}</p><p><b>${n}</b> product${n===1?'':'s'}</p></span></a>`}).join('')}</div>
  ${sec('⭐ Featured industrial products',feat)}
  ${sec('🔁 Frequently ordered',freq)}
  ${sec('⚙️ Machine spare parts',spares)}
  ${sec('🔩 Precision cutting tools',tools)}
  ${sec('🆕 Recently added',recent)}`;
}
function vListing(){
  const myCoId = me?.companyId || 'C-ARGUS';
  let ps = (me?.role === 'super_admin' && !me?.companyId)
    ? getProducts().filter(p=>p.visible)
    : getProducts().filter(p=>p.companyId===myCoId&&p.visible);
  const q=(ui.q||'').toLowerCase();
  if(ui.cat!=='all') ps=ps.filter(p=>p.category===ui.cat);
  if(ui.brand!=='all') ps=ps.filter(p=>p.brand===ui.brand);
  if(ui.avail==='in') ps=ps.filter(p=>p.stock>0&&p.price!=null);
  if(ui.avail==='rfq') ps=ps.filter(p=>p.price==null||p.stock<=0);
  if(q) ps=ps.filter(p=>[p.name,p.short,p.desc,p.sku,p.brand,p.mpn].filter(Boolean).join(' ').toLowerCase().includes(q));
  if(ui.minP!=='') ps=ps.filter(p=>p.price!=null&&p.price>=Number(ui.minP));
  if(ui.maxP!=='') ps=ps.filter(p=>p.price!=null&&p.price<=Number(ui.maxP));
  if(ui.sort==='price-asc') ps.sort((a,b)=>(a.price??Infinity)-(b.price??Infinity));
  else if(ui.sort==='price-desc') ps.sort((a,b)=>(b.price??-1)-(a.price??-1));
  else if(ui.sort==='name') ps.sort((a,b)=>a.name.localeCompare(b.name));
  else if(ui.sort==='avail') ps.sort((a,b)=>(b.stock>0)-(a.stock>0));
  else ps.sort((a,b)=>String(b.created).localeCompare(String(a.created)));
  return `<div class="section-head"><h2>Industrial catalog (${ps.length} SKUs)</h2><span class="hint">Search SKU • MPN • brand • compatibility</span></div>
  <div class="card"><div class="card-pad"><div class="toolbar">
  <select onchange="App.f(event,'cat')"><option value="all">All categories</option>${storeCats().map(c=>`<option value="${c.id}" ${ui.cat===c.id?'selected':''}>${c.name}</option>`).join('')}</select>
  <select onchange="App.f(event,'brand')"><option value="all">All brands</option>${brands().map(b=>`<option ${ui.brand===b?'selected':''}>${b}</option>`).join('')}</select>
  <select onchange="App.f(event,'sort')"><option value="new">Recently added</option><option value="name" ${ui.sort==='name'?'selected':''}>Name A–Z</option><option value="price-asc" ${ui.sort==='price-asc'?'selected':''}>Price: low → high</option><option value="price-desc" ${ui.sort==='price-desc'?'selected':''}>Price: high → low</option><option value="avail" ${ui.sort==='avail'?'selected':''}>Availability</option></select>
  <select onchange="App.f(event,'avail')"><option value="all">All availability</option><option value="in" ${ui.avail==='in'?'selected':''}>In stock (priced)</option><option value="rfq" ${ui.avail==='rfq'?'selected':''}>Quotation / indent</option></select>
  <input type="number" placeholder="Min ₹" style="max-width:110px" value="${ui.minP}" oninput="App.f(event,'minP')"><input type="number" placeholder="Max ₹" style="max-width:110px" value="${ui.maxP}" oninput="App.f(event,'maxP')">
  ${ui.q?`<span class="hint">“${ui.q}” <button class="btn btn-ghost btn-sm" onclick="App.clearF()">Clear</button></span>`:''}</div>
  ${ps.length?`<div class="prod-grid">${ps.map(prodCard).join('')}</div>`:`<div class="empty"><div class="big">🔩</div><b>No matching SKUs</b><p>Try a different SKU, brand or category.</p><button class="btn btn-ghost btn-sm" onclick="App.clearF()">Clear filters</button></div>`}</div></div>`;
}
function vProduct(id){
  const p=prodById(id);
  if(!p) return `<div class="empty"><div class="big">🔍</div>Product not found.</div>`;
  const rel=getProducts().filter(x=>x.category===p.category&&x.id!==p.id&&x.visible&&(!p.companyId||x.companyId===p.companyId)).slice(0,4);
  const buyBox = p.price == null
    ? `<div class="card" style="box-shadow:none;border-color:#FDBA74;background:#FFFBEB"><div class="card-pad" style="padding:14px"><b>Quotation required</b><p class="hint" style="margin:6px 0 12px">This item is priced on request. Submit an RFQ with quantity and technical requirements.</p><button class="btn btn-coral" style="width:100%" onclick="App.rfq('${p.id}')">Request Quotation</button></div></div>`
    : p.stock <= 0
    ? `<div class="card" style="box-shadow:none"><div class="card-pad" style="padding:14px"><b>Currently out of stock</b><p class="hint" style="margin:6px 0 12px">Check availability or raise an indent request.</p><button class="btn btn-dark" style="width:100%" onclick="App.rfq('${p.id}')">Check Availability</button></div></div>`
    : `<div style="display:flex;gap:10px;align-items:center;margin-top:12px;flex-wrap:wrap"><span class="qty"><button onclick="App.q(-1)">−</button><span id="qVal">${Math.min(p.moq||1,10)}</span><button onclick="App.q(1)">+</button></span><span class="hint">${p.stock} ${p.uom||''} available${p.moq>1?' • MOQ '+p.moq:''}</span></div>
       <div style="display:flex;gap:10px;margin-top:12px"><button class="btn btn-primary" style="flex:1" onclick="App.addCart('${p.id}',Number(document.getElementById('qVal').innerText))">Add to Cart</button><button class="btn btn-coral" style="flex:1" onclick="App.addCart('${p.id}',Number(document.getElementById('qVal').innerText),true);location.hash='#/store/cart'">Buy Now →</button></div>`;
  return `<a class="btn btn-ghost btn-sm" href="#/store/listing">← Back to catalog</a>
  <div class="card" style="margin-top:12px"><div class="card-pad"><div style="display:grid;grid-template-columns:1fr 1fr;gap:22px" class="dash2">
  <div><div class="gallery"><div class="thumbs">${(p.images||[]).map((u,i)=>`<img src="${u}" onerror="${NOIMG_ERR}" class="${i===0?'sel':''}" onclick="App.gal('${p.id}',${i},this)">`).join('')}${p.video?`<video src="${p.video}" onclick="App.galV('${p.video}',this)"></video>`:''}</div>
  <div class="main-media" id="mainMedia">${!(p.images||[]).find(Boolean)&&p.video?`<video src="${p.video}" controls preload="metadata" style="width:100%"></video>`:`<img src="${img0(p)}" onerror="${NOIMG_ERR}">`}</div></div>
  ${p.video?`<video src="${p.video}" controls preload="metadata" style="width:100%;border-radius:10px;margin-top:12px;background:#000" onerror="this.outerHTML='<p class=hint>⚠️ Video failed to load.</p>'"></video>`:''}</div>
  <div><span class="pill">${catName(p.category)}</span> ${availBadge(p)}
  <h1 style="margin:10px 0 2px;font-size:24px;letter-spacing:-.01em">${p.name}</h1>
  <p class="hint" style="margin:0 0 4px">SKU <b>${p.sku||p.id}</b>${p.mpn?' • MPN <b>'+p.mpn+'</b>':''} • ${p.brand||''}</p>
  <div style="margin:12px 0">${priceHtml(p,true)}</div>
  <p style="font-size:13.5px;line-height:1.6">${p.desc||''}</p>
  <div class="card" style="box-shadow:none"><div class="card-pad" style="padding:14px"><b style="font-size:13px">Technical specifications</b><table class="spec-table" style="margin-top:6px">${Object.entries(p.specs||{}).map(([k,v])=>`<tr><td>${k}</td><td><b>${v}</b></td></tr>`).join('')||'<tr><td colspan=2 class="hint">Refer to datasheet via RFQ.</td></tr>'}</table></div></div>
  <div class="card" style="box-shadow:none;margin-top:10px"><div class="card-pad" style="padding:14px;display:grid;grid-template-columns:1fr 1fr;gap:8px;font-size:12.5px">
  <div><span class="hint">Unit</span><br><b>${p.uom||'Pc'}</b></div><div><span class="hint">MOQ</span><br><b>${p.moq||1}</b></div>
  <div><span class="hint">Warehouse</span><br><b>${p.warehouse||'—'}</b></div><div><span class="hint">Lead time</span><br><b>${p.leadTime||'—'}</b></div></div></div>
  <div style="margin-top:4px">${buyBox}</div>
  <p class="hint">✓ Availability from ERP inventory • ✓ Server recomputes totals • ✓ GST invoice</p></div></div></div></div>
  ${rel.length?`<div class="section-head"><h2>Related in ${catName(p.category)}</h2></div><div class="prod-grid">${rel.map(prodCard).join('')}</div>`:''}`;
}
function vCart(){
  const cart=getCart().filter(c=>prodById(c.pid));
  if(!cart.length) return `<div class="card"><div class="empty"><div class="big">🧾</div><h2>Your indent cart is empty</h2><p>Browse the industrial catalog — tooling, spares, raw materials.</p><a class="btn btn-primary" href="#/store/listing">Browse catalog →</a></div></div>`;
  const sub=cartSubtotal();
  return `<div class="section-head"><h2>Indent cart (${cartCount()} items)</h2><button class="btn btn-ghost btn-sm" onclick="App.clearCart()">Clear all</button></div>
  <div style="display:grid;grid-template-columns:1.5fr .7fr;gap:14px" class="dash2"><div>
  ${cart.map(c=>{const p=prodById(c.pid);return `<div class="cart-line"><img src="${img0(p)}" onerror="${NOIMG_ERR}" style="width:80px;height:80px;border-radius:8px;object-fit:cover"><div><b>${p.name}</b><div class="hint">${p.sku||''} • ${fmt(p.price)} / ${p.uom||'Pc'} • ${p.stock} in ${p.warehouse||'stock'}</div><div style="display:flex;gap:10px;align-items:center;margin-top:8px"><span class="qty"><button onclick="App.chQty('${p.id}',-1)">−</button><span>${c.qty}</span><button onclick="App.chQty('${p.id}',1)">+</button></span><button class="btn btn-ghost btn-sm" onclick="App.rm('${p.id}')">Remove</button></div></div><b>${fmt(p.price*c.qty)}</b></div>`}).join('')}
  <a class="btn btn-ghost btn-sm" href="#/store/listing">← Continue browsing</a></div>
  <div class="card" style="align-self:start"><div class="card-pad"><h3 style="margin-top:0">Order summary</h3>
  <div style="display:grid;gap:8px;font-size:14px"><div style="display:flex;justify-content:space-between"><span>Subtotal (excl. GST)</span><b>${fmt(sub)}</b></div><div style="display:flex;justify-content:space-between;font-size:17px;border-top:1px dashed var(--line);padding-top:10px"><span><b>Total</b></span><b>${fmt(sub)}</b></div></div>
  <a class="btn btn-primary" style="width:100%;margin-top:14px" href="#/store/checkout">Proceed to checkout →</a><p class="hint">Stock revalidated on submit. GST as per invoice.</p></div></div></div>`;
}
let ckStep=1;
function vCheckout(){
  const cart=getCart();
  if(!cart.length) return `<div class="empty"><div class="big">🧾</div>Cart empty — <a href="#/store/listing"><b>browse the catalog</b></a> first.</div>`;
  const sub=cartSubtotal();
  return `<div class="section-head"><h2>Checkout — purchase order</h2><a class="btn btn-ghost btn-sm" href="#/store/cart">← Back to cart</a></div>
  <div class="steps"><div class="step ${ckStep===1?'active':''}">1 • Company & delivery</div><div class="step ${ckStep===2?'active':''}">2 • Review indent</div></div>
  <div id="ckBody">${ckBody(sub)}</div>`;
}
function ckBody(sub){
  const cart=getCart();
  const d = ui.ck || {};
  const val = k => String(d[k]||'').replace(/"/g,'&quot;');
  if(ckStep===1) return `<div class="card"><div class="card-pad"><h3 style="margin-top:0">Company & delivery details</h3><div class="form-grid">
    <div class="field"><label>Company name *</label><input id="c_company" value="${val('c_company')}" placeholder="e.g. Sharma Auto Components Pvt Ltd"></div><div class="field"><label>Contact person *</label><input id="c_name" value="${val('c_name')}" placeholder="e.g. Priya Sharma"></div>
    <div class="field"><label>Mobile *</label><input id="c_mob" value="${val('c_mob')}" placeholder="e.g. 98765 43210"></div><div class="field"><label>Email</label><input id="c_email" value="${val('c_email')}" placeholder="purchase@company.in"></div>
    <div class="field"><label>PO reference (optional)</label><input id="c_po" value="${val('c_po')}" placeholder="e.g. PO/SAC/26/118"></div><div class="field"><label>PIN code *</label><input id="c_pin" value="${val('c_pin')}" placeholder="e.g. 411026"></div>
    <div class="field full"><label>Delivery address *</label><textarea id="c_addr" rows="2" placeholder="Plot, area, landmark">${d.c_addr||''}</textarea></div>
    <div class="field"><label>City *</label><input id="c_city" value="${val('c_city')}" placeholder="e.g. Pune"></div><div class="field"><label>State *</label><input id="c_state" value="${val('c_state')}" placeholder="e.g. Maharashtra"></div>
    <div class="field full"><label>Delivery instructions (optional)</label><input id="c_note" value="${val('c_note')}" placeholder="e.g. Unloading bay 2, contact security"></div></div>
    <button class="btn btn-primary" onclick="App.ck(2)">Review indent →</button></div></div>`;
  return `<div style="display:grid;grid-template-columns:1.4fr .8fr;gap:14px" class="dash2"><div class="card"><div class="card-pad"><h3 style="margin-top:0">Review line items</h3>
    ${cart.map(c=>{const p=prodById(c.pid);return `<div class="cart-line"><img src="${img0(p)}" onerror="${NOIMG_ERR}" style="width:60px;height:60px;border-radius:8px;object-fit:cover"><div><b style="font-size:13px">${p.name}</b><div class="hint">${p.sku||''} • ${c.qty} ${p.uom||''} × ${fmt(p.price)}</div></div><b>${fmt(p.price*c.qty)}</b></div>`}).join('')}
    <div style="display:flex;gap:10px"><button class="btn btn-ghost btn-sm" onclick="App.ck(1)">← Edit details</button><a class="btn btn-ghost btn-sm" href="#/store/cart">Edit cart</a></div></div></div>
    <div class="card"><div class="card-pad"><h3 style="margin-top:0">Payable: ${fmt(sub)}</h3><p class="hint">Excl. GST — invoiced as per ERP. Order is recorded as <b>Pending</b>, not paid.</p>
    <button class="btn btn-coral" id="ckSubmit" style="width:100%" onclick="App.placeOrder(event)">Submit order • ${fmt(sub)}</button><p class="hint">Double-click protected • server revalidates stock.</p></div></div></div>`;
}
function vConfirm(id){
  const o=getOrders().find(x=>x.id===id)||getOrders()[0];
  if(!o) return `<div class="empty"><div class="big">📭</div>No orders yet.</div>`;
  return `<div class="card"><div style="background:linear-gradient(135deg,#0B1533,#1E40AF);color:#fff;padding:36px;text-align:center"><div style="font-size:52px">🏭</div><h1 style="margin:8px 0">Order request submitted</h1><p>Order <b>${o.id}</b> • ${fmt(o.total)} • status <b>${o.status}</b>${o.poRef?' • PO '+o.poRef:''}</p></div>
  <div class="card-pad" style="display:flex;gap:10px;flex-wrap:wrap;justify-content:center"><a class="btn btn-primary" href="#/store/orders/${o.id}">Track order →</a><a class="btn btn-ghost" href="#/store/listing">Continue browsing</a><button class="btn btn-ghost" onclick="window.print()">🖨️ Print</button></div></div>`;
}
function vMyOrders(){
  const myCoId = me?.companyId || 'C-ARGUS';
  const os=getOrders().filter(o=>o.companyId===myCoId);
  return `<div class="section-head"><h2>My orders (${os.length})</h2><a class="btn btn-ghost btn-sm" href="#/store/listing">+ New indent</a></div>
  <div class="card"><div class="card-pad">${os.map(o=>{const f=prodById(o.items[0]?.pid)||{images:[]};return `<a href="#/store/orders/${o.id}" class="cart-line"><img src="${img0(f)}" onerror="${NOIMG_ERR}" style="width:64px;height:64px;border-radius:8px;object-fit:cover"><div><b>${o.id}</b><div class="hint">${o.date} • ${o.items.reduce((a,i)=>a+i.qty,0)} items • ${o.companyName||o.customer}${o.poRef?' • '+o.poRef:''}</div></div><div style="text-align:right"><b>${fmt(o.total)}</b><div>${statusBadge(o.status)}</div></div></a>`}).join('')||'<div class="empty">No orders yet.</div>'}</div></div>`;
}
function vMyQuotes(){
  const myCoId = me?.companyId || 'C-ARGUS';
  const qs=getQuotes().filter(q=>q.companyId===myCoId);
  return `<div class="section-head"><h2>My quotation requests (${qs.length})</h2><a class="btn btn-ghost btn-sm" href="#/store/listing">Browse catalog</a></div>
  <div class="card"><div class="card-pad">${qs.map(q=>{const p=prodById(q.pid)||{name:q.pid,sku:q.pid,images:[]};return `<div class="cart-line"><img src="${img0(p)}" onerror="${NOIMG_ERR}" style="width:64px;height:64px;border-radius:8px;object-fit:cover"><div><b>${q.id} — ${p.name}</b><div class="hint">${p.sku||''} • Qty ${q.qty} • ${q.date}</div><div class="hint">${q.quotePrice!=null?'Quoted: '+fmt(q.quotePrice):'Awaiting quote'}${q.adminNote?' • '+q.adminNote:''}</div></div><div>${statusBadge(q.status)}</div></div>`}).join('')||'<div class="empty">No RFQs yet.</div>'}</div></div>`;
}
function vProfile(){
  const meRow = getUsers().find(u=>me.email && (u.email||'').toLowerCase()===me.email.toLowerCase()) || {};
  return `<div class="section-head"><h2>My profile</h2></div><div class="card"><div class="card-pad" style="display:flex;gap:18px;align-items:center;flex-wrap:wrap"><div class="avatar" style="width:68px;height:68px;font-size:26px">${(me.name||'U')[0].toUpperCase()}</div>
  <div><h2 style="margin:0">${me.name}</h2><p class="hint" style="margin:2px 0">${me.role.replace('_',' ')} • ${me.companyId?coName(me.companyId):'platform'} • ${me.email||''}${me.google?' • Google sign-in':''}</p><span class="status s-active">Active</span></div></div>
  <div class="card-pad" style="border-top:1px solid var(--line)"><div class="form-grid"><div class="field"><label>Name</label><input id="pf_name" value="${me.name}"></div><div class="field"><label>Mobile</label><input id="pf_mob" value="${me.mobile||meRow.mobile||''}" placeholder="+91 …"></div><div class="field"><label>Email (Google, locked)</label><input value="${me.email||''}" disabled></div></div>
  <button class="btn btn-primary btn-sm" onclick="App.saveProfile()">Save profile</button> <button class="btn btn-ghost btn-sm" onclick="App.logout()">⏻ Logout</button></div></div>`;
}

/* ---------- RFQ modal ---------- */
function rfqModal(pid){
  const p=prodById(pid);
  if(!p) return '';
  return `<div class="modal-bg" id="rfqBg" onclick="if(event.target===this)App.rfqClose()"><div class="modal"><div class="modal-head"><span>📝 Request Quotation — ${p.sku||p.id}</span><button class="btn btn-ghost btn-sm" onclick="App.rfqClose()">✕</button></div>
  <div class="modal-body"><b>${p.name}</b><p class="hint">${p.brand||''}${p.mpn?' • MPN '+p.mpn:''} • ${p.stock} ${p.uom||''} in ${p.warehouse||'stock'}</p>
  <div class="form-grid"><div class="field"><label>Quantity (${p.uom||'Pc'}) *</label><input id="r_qty" type="number" value="${p.moq||1}" min="1"></div>
  <div class="field"><label>Company name *</label><input id="r_co" value="${String((ui.ck||{}).c_company||'').replace(/"/g,'&quot;')}" placeholder="Customer company"></div>
  <div class="field"><label>Contact person *</label><input id="r_name" value="${me.name}"></div>
  <div class="field"><label>Mobile *</label><input id="r_mob" value="${me.mobile||''}" placeholder="e.g. 98765 43210"></div>
  <div class="field full"><label>Technical requirements</label><textarea id="r_tech" rows="2" placeholder="e.g. A6 mount, tolerance, compatible machine…"></textarea></div>
  <div class="field full"><label>Delivery requirements</label><input id="r_del" placeholder="e.g. Needed at Chakan plant by month-end"></div></div>
  <button class="btn btn-coral" style="width:100%" onclick="App.submitRfq('${p.id}')">Submit RFQ</button>
  <p class="hint">Maps to the ERP Quotations module. No stock is reserved by an RFQ.</p></div></div></div>`;
}
function quoteModal(q){
  return `<div class="modal-bg" id="rfqBg" onclick="if(event.target===this)App.rfqClose()"><div class="modal"><div class="modal-head"><span>Respond — ${q.id}</span><button class="btn btn-ghost btn-sm" onclick="App.rfqClose()">✕</button></div>
  <div class="modal-body"><div class="field"><label>Status</label><select id="qr_st">${['Pending','Quoted','Accepted','Rejected','Cancelled'].map(s=>`<option ${q.status===s?'selected':''}>${s}</option>`).join('')}</select></div>
  <div class="field"><label>Quoted unit price (₹, optional)</label><input id="qr_price" type="number" value="${q.quotePrice??''}"></div>
  <div class="field"><label>Note for requester</label><input id="qr_note" value="${q.adminNote||''}" placeholder="e.g. Imported, 3-week lead time"></div>
  <button class="btn btn-primary" style="width:100%" onclick="App.quoteSave('${q.id}')">Save response</button></div></div></div>`;
}

function vAudit(){
  const logs = getAuditLog();
  return `<div class="section-head"><h2>Platform Audit Logs (${logs.length})</h2></div>
  <div class="card"><div class="card-pad"><div class="table-wrap"><table><tr><th>Timestamp</th><th>Actor</th><th>Role</th><th>Action</th><th>Company</th><th>Summary</th></tr>
  ${logs.length ? logs.map(a => `<tr><td class="hint">${String(a.ts).slice(0, 16).replace('T', ' ')}</td><td><b>${a.actor}</b></td><td><span class="hint">${(a.role || '').replace('_', ' ')}</span></td><td><b>${a.action}</b></td><td>${coName(a.companyId) || a.companyId || '—'}</td><td>${a.summary || '—'}</td></tr>`).join('') : '<tr><td colspan="6"><div class="empty">No audit logs recorded yet.</div></td></tr>'}
  </table></div></div></div>`;
}

/* ---------- router ---------- */
function render(){
  const h=location.hash||'#/store/home';
  const [pathQ]=[h.slice(1)];
  const [path,qs]=pathQ.split('?');
  const qp=Object.fromEntries(new URLSearchParams(qs||''));
  if(qp.cat) ui.cat=qp.cat;
  if(qp.status) ui.orderStatus=qp.status;
  const seg=path.split('/').filter(Boolean);
  let html='', noside=false;
  const R=seg.join('/');

  const foot = $('.footer');
  // Prevent premature redirect to login when returning with OAuth hash/code
  const isOAuthReturn = location.hash.includes('access_token=') || location.hash.includes('error=') || location.search.includes('code=');
  if (isOAuthReturn && !me) {
    document.body.classList.add('auth-open');
    if (foot) foot.style.display = 'none';
    $('#app').innerHTML = `<div style="min-height:100vh;display:flex;flex-direction:column;align-items:center;justify-content:center;background:#0F172A;color:#fff;font-family:sans-serif">
      <div style="width:44px;height:44px;border:3px solid rgba(255,255,255,0.2);border-top-color:#FF6500;border-radius:50%;animation:spin .8s linear infinite;margin-bottom:16px"></div>
      <h3 style="margin:0 0 8px;font-size:18px;font-weight:700">Verifying Google Sign-In...</h3>
      <p style="margin:0;color:#94A3B8;font-size:13px">Connecting your enterprise session</p>
      <style>@keyframes spin{to{transform:rotate(360deg)}}</style>
    </div>`;
    return;
  }
  if(R==='login'){
    document.body.classList.add('auth-open');
    if(foot) foot.style.display = 'none';
    $('#app').innerHTML = vLogin();
    window.scrollTo({top:0});
    return;
  }
  document.body.classList.remove('auth-open');
  if(foot) foot.style.display = '';
  if(carouselTimer){ clearInterval(carouselTimer); carouselTimer = null; }
  if(!me){ location.hash='#/login'; return; }
  if(R==='pending'||me.role==='pending'||me.role==='disabled'){
    document.body.classList.add('auth-open');
    if(foot) foot.style.display = 'none';
    $('#app').innerHTML = vPending();
    window.scrollTo({top:0});
    return;
  }

  /* role guards: sales users stay in the store, company admins can't open platform pages */
  const homeFor = me.role==='super_admin' ? '#/super/dashboard' : me.role==='company_admin' ? '#/admin/dashboard' : '#/store/home';
  if ((seg[0]==='super' && me.role!=='super_admin') || (seg[0]==='admin' && me.role==='sales_user')) { location.hash = homeFor; return; }

  if(R==='super/dashboard')html=vSuperDash();
  else if(R==='super/companies'){ const tab=(qp.tab==='admins'||qp.tab==='users')?qp.tab:'companies'; html=vCompanyMgmt(tab); if(qp.new==='1'){ ui._modal=()=>App.openCoModal(''); history.replaceState(null,'','#/super/companies?tab='+tab); location.hash='#/super/companies?tab='+tab; } }
  else if(R==='super/companies/new')html=vCompanyNew();
  else if(R==='super/admins'){ location.hash='#/super/companies?tab=admins'; return; }
  else if(R==='super/users'){ location.hash='#/super/companies?tab=users'; return; }
  else if(seg[0]==='super'&&seg[1]==='companies'&&seg[3]==='edit'){ html=vCompanyForm(seg[2]); }
  else if(seg[0]==='super'&&seg[1]==='companies'&&seg[3]==='products'&&seg[4]==='new'){ html=vProductForm('', seg[2]); }
  else if(R==='super/products/new')html=vProductForm('');
  else if(seg[0]==='super'&&seg[1]==='orders'&&seg[2])html=orderDetail(seg[2],'#/super/orders');
  else if(seg[0]==='super'&&seg[1]==='companies'&&seg[2]){
    const _id=seg[2], _tab=qp.tab||'overview';
    if(ui.coDId!==_id||!ui.coD){ ui.coDId=_id; ui.coD=null; coDetail(_id).then(d=>{ if((location.hash||'').includes('/super/companies/'+_id)){ ui.coD=d; render(); } }); }
    html=vCompanyDetail(_id,_tab,ui.coD);
  }
  else if(R==='super/catalog'||R==='super/products')html=vProducts();
  else if(R==='super/categories')html=vCats();
  else if(R==='super/media')html=vMedia();
  else if(R==='super/orders')html=vOrdersAdmin();
  else if(R==='super/quotes')html=vQuotesAdmin();
  else if(R==='super/settings')html=vSettings();
  else if(R==='super/audit')html=vAudit();
  else if(R==='admin/dashboard')html=vAdminDash();
  else if(R==='admin/products')html=vProducts();
  else if(R==='admin/products/new')html=vProductForm('');
  else if(seg[0]==='admin'&&seg[1]==='products'&&seg[2]==='edit')html=vProductForm(seg[3]);
  else if(R==='admin/media')html=vMedia();
  else if(R==='admin/categories')html=vCats();
  else if(R==='admin/users')html=vUsers();
  else if(R==='admin/orders')html=vOrdersAdmin();
  else if(seg[0]==='admin'&&seg[1]==='orders'&&seg[2])html=orderDetail(seg[2],'#/admin/orders');
  else if(R==='admin/quotes')html=vQuotesAdmin();
  else if(R==='admin/settings')html=vSettings();
  else if(R==='store/home'||R===''||R==='store')html=vHome();
  else if(R==='store/listing')html=vListing();
  else if(seg[0]==='store'&&seg[1]==='product')html=vProduct(seg[2]);
  else if(R==='store/cart')html=vCart();
  else if(R==='store/checkout')html=vCheckout();
  else if(seg[0]==='store'&&seg[1]==='confirmation')html=vConfirm(seg[2]);
  else if(R==='store/orders')html=vMyOrders();
  else if(seg[0]==='store'&&seg[1]==='orders'&&seg[2])html=orderDetail(seg[2],'#/store/orders');
  else if(R==='store/quotes')html=vMyQuotes();
  else if(R==='store/profile')html=vProfile();
  else html=vHome();
  $('#app').innerHTML = topbar() + (noside? `<div class="layout no-side"><main>${html}</main></div>` : `<div class="layout">${side()}<main>${html}</main></div>`);
  window.scrollTo({top:0});
  if(ui._modal){ const m=ui._modal; ui._modal=null; try{ m(); }catch(e){} }
}

/* ---------- actions ---------- */
window.App={
  toast:(m,i)=>toast(m,i),
  rerender(){ render(); },
  goSearch(){ const v=$('#gSearch').value; ui.q=v; location.hash='#/store/listing'; if(location.hash==='#/store/listing')render(); },
  carouselStart(){
    clearInterval(carouselTimer);
    carouselTimer = setInterval(() => { App.carouselNext(1); }, 4500);
  },
  carouselPause(){
    clearInterval(carouselTimer);
  },
  carouselResume(){
    App.carouselStart();
  },
  carouselGo(idx){
    currentSlide = (idx + CNC_SLIDES.length) % CNC_SLIDES.length;
    CNC_SLIDES.forEach((_, i) => {
      const s = document.getElementById('cSlide-' + i);
      const d = document.getElementById('cDot-' + i);
      if (s) s.classList.toggle('active', i === currentSlide);
      if (d) d.classList.toggle('active', i === currentSlide);
    });
    const cnt = document.getElementById('cCounter');
    if (cnt) cnt.innerText = `${currentSlide + 1} / ${CNC_SLIDES.length}`;
  },
  carouselNext(dir = 1){
    App.carouselGo(currentSlide + dir);
  },
  async googleLogin(){
    if (window.Auth && !window.Auth.client && typeof window.Auth.init === 'function') {
      await window.Auth.init();
    }
    if (window.Auth && window.Auth.client) {
      window.Auth.signIn();
    } else {
      const m = $('#googleMsg');
      if (m) {
        m.innerHTML = `<div class="auth-notice warning" style="margin-top:14px;text-align:left">
          <div style="font-weight:700;margin-bottom:4px;display:flex;align-items:center;gap:6px">
            <span>⚙️</span> Google OAuth Setup Required
          </div>
          <p style="margin:0 0 8px;font-size:12.5px;color:#78350F">
            Supabase credentials are not connected yet. To enable live Google sign-in:
          </p>
          <ol style="margin:0 0 0 18px;padding:0;font-size:12px;color:#92400E">
            <li>Open <code>backend/.env</code> in your workspace</li>
            <li>Replace <code>SUPABASE_URL</code> and <code>SUPABASE_PUBLISHABLE_KEY</code></li>
            <li>Enable Google Provider in your Supabase Auth dashboard</li>
          </ol>
        </div>`;
      }
      toast('Google OAuth configuration required (see setup guidance)', '⚠️');
    }
  },
  async afterGoogleLogin(arg){
    const silent = typeof arg === 'boolean' ? arg : false;
    const token = (typeof arg === 'string' && arg) ? arg : ((window.Auth && window.Auth.token()) || '');
    try {
      const r = await fetch('/api/me', { headers: { 'Authorization': 'Bearer ' + token } });
      const j = await r.json();
      const u = j.data || {};
      if (!u.role) throw new Error(j.error || 'User role could not be resolved');
      const prev = me;
      const same = prev && prev.email === (u.email || '') && prev.role === u.role && prev.companyId === u.companyId;
      me = { role: u.role, companyId: u.companyId, name: u.name || 'User', email: u.email || '', mobile: u.mobile || '', google: true };
      window._meResolved = true;
      setSession(me);
      if (window.Backend) { if (!same) window.Backend.cache = { products:null, orders:null, companies:null, users:null, cats:null, quotes:null, pstats:null, media:null, audit:null, gsettings:null, catalog:null }; await window.Backend.refresh().catch(()=>{}); }
      /* Supabase re-fires SIGNED_IN on tab focus / token refresh: only redirect on a real login,
         otherwise the user was thrown out of whatever page or form they were on */
      const R = (location.hash || '').replace(/^#\/?/, '').split('?')[0];
      const onEntry = !R || R === 'login' || R === 'pending' || me.role === 'pending' || me.role === 'disabled';
      if (!same || onEntry) {
        if (!silent && !same) toast(`Signed in as ${me.name} (${me.role === 'super_admin' ? 'Super Admin' : me.role.replace('_',' ')})`, '👋');
        const target = me.role==='super_admin' ? '#/super/dashboard' : me.role==='company_admin' ? '#/admin/dashboard' : me.role==='pending' || me.role==='disabled' ? '#/pending' : '#/store/home';
        if (location.hash !== target) { location.hash = target; return; }
        render();
      } else if (App._safeToRerender()) render();
    } catch(e){
      console.error('afterGoogleLogin error:', e);
      if(!silent) toast('Could not resolve your ERP role: ' + (e.message || 'error'), '⚠️');
      render();
    }
  },
  afterGoogleLogout(){ setSession(null); me = null; location.hash = '#/login'; render(); },
  logout(){ if (window.Auth && window.Auth.client) window.Auth.signOut(); else { setSession(null); me = null; location.hash = '#/login'; render(); } },
  f(e,k){ const v=e.target.value; if(k==='aq')ui.adminQ=v; if(k==='oq')ui.orderQ=v; if(k==='os')ui.orderStatus=v==='All statuses'?'all':v; if(k==='qs')ui.quoteStatus=v==='All statuses'?'all':v; if(k==='cat')ui.cat=v; if(k==='brand')ui.brand=v; if(k==='sort')ui.sort=v; if(k==='avail')ui.avail=v; if(k==='minP')ui.minP=v; if(k==='maxP')ui.maxP=v; clearTimeout(window._t); window._t=setTimeout(render,250); },
  clearF(){ ui={...ui,q:'',cat:'all',brand:'all',sort:'new',avail:'all',minP:'',maxP:''}; render(); },
  q(d){ const el=$('#qVal'); el.innerText=Math.max(1,Math.min(99,Number(el.innerText)+d)); },
  gal(pid,i,el){ $$('.thumbs img').forEach(x=>x.classList.remove('sel')); el.classList.add('sel'); const p=prodById(pid); $('#mainMedia').innerHTML=`<img src="${(p.images||[])[i]||NOIMG}" onerror="${NOIMG_ERR}">`; },
  galV(src,el){ $$('.thumbs *').forEach(x=>x.classList.remove('sel')); el.classList.add('sel'); $('#mainMedia').innerHTML=`<video src="${src}" controls autoplay style="width:100%"></video>`; },
  addCart(pid,qty=1,silent){ const p=prodById(pid); if(!p)return;
    if(p.price==null){ toast('Quotation-only item — submit an RFQ instead','📝'); App.rfq(pid); return; }
    if(p.stock<=0){ toast('Out of stock — check availability via RFQ','⚠️'); return; }
    qty=Math.max(p.moq||1,qty);
    const cart=getCart(); const ex=cart.find(c=>c.pid===pid); const cur=ex?ex.qty:0;
    if(cur+qty>p.stock){ toast(`Only ${p.stock} ${p.uom||''} in stock`,'⚠️'); return; }
    if(ex)ex.qty+=qty; else cart.push({pid,qty}); setCart(cart); if(!silent)toast(`${p.sku||p.name} × ${qty} added`,'🧾'); render(); },
  chQty(pid,d){ const cart=getCart(); const it=cart.find(c=>c.pid===pid); const p=prodById(pid); if(!it||!p)return;
    const nq=it.qty+d;
    if(d<0&&nq<(p.moq||1)){toast(`Minimum order quantity is ${p.moq||1} — use Remove to drop this line`,'⚠️');return}
    if(nq>p.stock){toast(`Only ${p.stock} available`,'⚠️');return} it.qty=nq; setCart(cart); render(); },
  rm(pid){ setCart(getCart().filter(c=>c.pid!==pid)); render(); },
  clearCart(){ setCart([]); render(); },
  rfq(pid){ document.querySelector('.modal-bg')?.remove(); document.body.insertAdjacentHTML('beforeend', rfqModal(pid)); },
  rfqClose(){ document.querySelector('.modal-bg')?.remove(); },
  async submitRfq(pid){
    const body={ pid, qty:Number(($('#r_qty')||{}).value||1), companyName:(($('#r_co')||{}).value||''), contact:(($('#r_name')||{}).value||me.name), mobile:(($('#r_mob')||{}).value||''), techReq:(($('#r_tech')||{}).value||''), deliveryReq:(($('#r_del')||{}).value||'') };
    if(!body.qty||!body.companyName||!body.contact||!body.mobile){toast('Company, contact, mobile and qty are required','⚠️');return}
    if(B()?.enabled){ try{ const q=await B().api.post('/api/quotations',body); await B().refresh(); App.rfqClose(); toast('RFQ '+q.id+' submitted','📝'); location.hash='#/store/quotes'; return; }catch(e){ toast(e.message,'⚠️'); return; } }
    const q={id:'Q-'+Math.floor(5000+Math.random()*500),companyId:me?.companyId||'C-ARGUS',date:new Date().toISOString().slice(0,16).replace('T',' '),requestedBy:me.name,status:'Pending',quotePrice:null,adminNote:'',...body};
    OV.quotes=[q,...(OV.quotes||[])]; saveOv(OV); App.rfqClose(); toast('RFQ '+q.id+' submitted (demo)','📝'); location.hash='#/store/quotes';
  },
  quoteRespond(id){ const q=getQuotes().find(x=>x.id===id); if(!q)return; document.querySelector('.modal-bg')?.remove(); document.body.insertAdjacentHTML('beforeend', quoteModal(q)); },
  async quoteSave(id){
    const body={ status:($('#qr_st')||{}).value||'Quoted', quotePrice:(($('#qr_price')||{}).value||'')===''?null:Number($('#qr_price').value), adminNote:(($('#qr_note')||{}).value||'') };
    if(B()?.enabled){ try{ await B().api.patch('/api/quotations/'+id,body); await B().refresh(); App.rfqClose(); toast(id+' updated','📝'); render(); }catch(e){ toast(e.message,'⚠️'); } return; }
    const all=[...(OV.quotes||[]),...window.MOCK.QUOTES]; const q=all.find(x=>x.id===id); Object.assign(q,body);
    OV.quotes=all.filter(x=>!(window.MOCK.QUOTES||[]).find(b=>b.id===x.id&&JSON.stringify(b)===JSON.stringify(x))); saveOv(OV); App.rfqClose(); toast(id+' updated','📝'); render();
  },
  ck(n){ const req=[['c_company','Company'],['c_name','Contact'],['c_mob','Mobile'],['c_pin','PIN'],['c_addr','Address'],['c_city','City'],['c_state','State']];
    if(n===2){
      for(const [id,l] of req){ const el=document.getElementById(id); if(!el||!el.value.trim()){toast(l+' is required','⚠️');el&&el.focus();return} }
      // step 2 replaces these inputs, so keep their values for placeOrder()
      ui.ck={}; ['c_company','c_name','c_mob','c_email','c_po','c_pin','c_addr','c_city','c_state','c_note'].forEach(id=>{ ui.ck[id]=((document.getElementById(id)||{}).value||'').trim(); });
    }
    ckStep=n; render(); },
  async placeOrder(ev){ const btn=(ev&&ev.currentTarget)||$('#ckSubmit')||{}; if(btn.disabled)return; btn.disabled=true; btn.innerText='Submitting…';
    const label=btn.innerText;
    const done=(id)=>{ setCart([]); ckStep=1; ui.ck={}; location.hash='#/store/confirmation/'+id; toast('Order '+id+' submitted • stock reserved','🏭'); };
    const cart=getCart();
    const d=ui.ck||{};
    if(!d.c_mob||!d.c_addr){ toast('Delivery details missing — please fill step 1','⚠️'); ckStep=1; render(); return; }
    const payload={ customer:d.c_company||d.c_name, contact:d.c_name, companyName:d.c_company, mobile:d.c_mob, address:[d.c_addr, d.c_city, d.c_state, d.c_pin].filter(Boolean).join(', ')+(d.c_note?' — '+d.c_note:''), city:[d.c_city, d.c_pin].filter(Boolean).join(' '), poRef:d.c_po||'', items:cart.map(c=>({pid:c.pid,qty:c.qty})) };
    if(B()?.enabled){
      try{ const o=await B().api.post('/api/orders',payload); await B().refresh(); done(o.id); }
      catch(e){ toast(e.message,'⚠️'); btn.disabled=false; btn.innerText=label; }
      return;
    }
    setTimeout(()=>{ // demo fallback: same server-side rules, client-side
      for(const c of cart){ const p=prodById(c.pid);
        if(!p.visible){toast(p.name+' is not visible','⚠️');btn.disabled=false;render();return}
        if(p.price==null){toast(p.name+' needs an RFQ','📝');btn.disabled=false;return}
        if(c.qty>p.stock){toast(`${p.name}: only ${p.stock} left`,'⚠️');btn.disabled=false;render();return} }
      const total=cart.reduce((a,c)=>a+prodById(c.pid).price*c.qty,0);
      const id='ORD-'+Math.floor(9000+Math.random()*999);
      const o={id,companyId:me?.companyId||'C-ARGUS',date:new Date().toISOString().slice(0,16).replace('T',' '),salesUser:me.name,...payload,total,status:'Pending',items:cart.map(c=>({pid:c.pid,qty:c.qty,price:prodById(c.pid).price})),history:[['Pending',new Date().toLocaleString()]]};
      OV.orders=[o,...(OV.orders||[])]; saveOv(OV); done(id); },700); },
  toggleVis(id){
    if(B()?.enabled){ const p=prodById(id);
      B().api.patch('/api/products/'+id+'/visibility',{visible:!p.visible}).then(async()=>{ await B().refresh(); toast('Visibility updated','👁️'); render(); }).catch(e=>toast(e.message,'⚠️')); return; }
    const all=getProducts(); const p=all.find(x=>x.id===id); p.visible=!p.visible;
    const baseIds=new Set(window.MOCK.PRODUCTS.map(x=>x.id)); OV.products=all.filter(x=>!baseIds.has(x.id)||x.visible!==window.MOCK.PRODUCTS.find(b=>b.id===x.id).visible); saveOv(OV); toast((p.sku||p.name)+(p.visible?' visible':' hidden'),'👁️'); render(); },
  async previewFiles(inp,prevId){
    const w=document.getElementById(prevId);
    if (!w) return;
    const isVid = prevId === 'vidPrev';
    await B()?.ensureLive?.();
    if (B()?.enabled && B().upload && inp.files && inp.files.length) {
      toast('Uploading media...', '⏳');
      B().upload(inp.files).then(urls => {
        if (isVid) w.innerHTML = '';
        urls.forEach(u => {
          const el = isVid ? document.createElement('video') : document.createElement('img');
          el.src = u;
          el.title = 'Click to remove';
          el.style.cursor = 'pointer';
          el.onclick = () => el.remove();
          if (isVid) el.controls = true;
          w.appendChild(el);
        });
        inp.value = ''; // already on the server; don't upload twice on save
        toast('Media uploaded & attached', '✅');
      }).catch(err => {
        inp.value = '';
        toast('Upload failed: ' + (err.message || 'error'), '⚠️');
      });
      return;
    }
    [...inp.files].forEach(f => {
      const u = URL.createObjectURL(f);
      const el = isVid ? document.createElement('video') : document.createElement('img');
      el.src = u;
      el.title = 'Click to remove';
      el.style.cursor = 'pointer';
      el.onclick = () => el.remove();
      if (isVid) el.controls = true;
      w.appendChild(el);
    });
    toast('Preview ready — click image to remove', '🖼️');
  },
  async saveProduct(editId){
    const errEl = $('#f_err'), btn = $('#f_save');
    const fail = m => { toast(m,'⚠️'); if (errEl) errEl.textContent = m; if (btn) { btn.disabled = false; btn.innerText = editId ? '💾 Save Changes' : '💾 Publish Product'; } };
    if (errEl) errEl.textContent = '';
    const name=(($('#f_name')||{}).value||'').trim(), sku=(($('#f_sku')||{}).value||'').trim();
    const priceRaw=(($('#f_price')||{}).value||'').trim(); const price=priceRaw===''?null:Number(priceRaw);
    const stockRaw=(($('#f_stock')||{}).value||'').trim(); const stock=Number(stockRaw);
    if(!name) return fail('Product name required');
    if(!sku) return fail('SKU required');
    if(price!=null&&!(price>0)) return fail('Price must be > 0 or empty (quotation-only)');
    if(stockRaw===''||!(stock>=0)) return fail('Valid stock (0 or more) required');
    if (btn) { btn.disabled = true; btn.innerText = 'Saving…'; }
    const live = !!(await B()?.ensureLive?.());
    const targetCo = ($('#f_co')||{}).value || me?.companyId || '';
    if (!editId && !targetCo) return fail('Select a company for this product');
    if (!editId && getProducts().some(p=>p.sku===sku && p.companyId===targetCo)) return fail(`SKU "${sku}" already exists in this company`);

    // blob: previews only exist in this browser — never store them on a shared record
    // getAttribute keeps "/uploads/x.png" relative; .src would bake in this browser's host:port
    let imgs=[...document.querySelectorAll('#imgPrev img')].map(i=>i.getAttribute('src')||'').filter(u=>u && !(live && u.startsWith('blob:')));
    const vidEl = $('#vidPrev video'); const vid = (vidEl && vidEl.getAttribute('src'))||'';
    const specs={}; ((($('#f_specs')||{}).value||'').split('\n')).forEach(l=>{const i=l.indexOf(':'); if(i>0)specs[l.slice(0,i).trim()]=l.slice(i+1).trim()});
    const data={companyId:targetCo,name,sku,brand:(($('#f_brand')||{}).value||'').trim(),mpn:(($('#f_mpn')||{}).value||''),short:(($('#f_short')||{}).value||''),price,uom:(($('#f_uom')||{}).value||'Pc'),moq:Number((($('#f_moq')||{}).value||1))||1,leadTime:(($('#f_lead')||{}).value||''),warehouse:(($('#f_wh')||{}).value||''),stock,category:(($('#f_cat')||{}).value||'cutting-tools'),visible:(($('#f_vis')||{}).value||'1')==='1',featured:(($('#f_feat')||{}).value||'0')==='1',desc:(($('#f_desc')||{}).value||name),specs,images:imgs,video:(live && vid.startsWith('blob:'))?'':vid};
    const back = me?.role==='super_admin' ? '#/super/companies/'+(editId?(prodById(editId)||{}).companyId:targetCo)+'?tab=catalog' : '#/admin/products';
    if (btn) { btn.disabled = true; btn.innerText = 'Saving…'; }
    if(live){
      try {
        const saved = editId ? await B().api.put('/api/products/'+editId,data) : await B().api.post('/api/products',data);
        if (saved && B()?.cache?.products) {
          if (editId) {
            const idx = B().cache.products.findIndex(x => x.id === editId);
            if (idx >= 0) B().cache.products[idx] = saved;
          } else {
            B().cache.products.unshift(saved);
          }
        }
      } catch(e) { return fail('Not saved: ' + (e.message || 'server error')); } // never fake a save locally
      await B().refresh().catch(()=>{});
      ui.coD = null;
      toast(editId?'SKU updated — live for sales users':'SKU published — live for sales users','✅');
      location.hash=back;
      return;
    }
    if(editId){ const all=getProducts(); Object.assign(all.find(x=>x.id===editId)||{},data); const base=new Set(window.MOCK.PRODUCTS.map(x=>x.id)); OV.products=all.filter(x=>!base.has(x.id)||JSON.stringify(x)!==JSON.stringify(window.MOCK.PRODUCTS.find(b=>b.id===x.id))); }
    else { OV.products=[{id:'P-L'+Date.now().toString(36).toUpperCase(),sold:0,created:new Date().toISOString().slice(0,10),...data},...(OV.products||[])]; }
    saveOv(OV);
    toast((editId?'SKU updated':'SKU saved')+' offline — backend not reachable, will sync when it is','⚠️');
    location.hash=back;
  },
  async deleteProduct(id){
    if (!confirm('Are you sure you want to delete this product?')) return;
    try {
      const del = JSON.parse(localStorage.getItem('cncforge_deleted_pids') || '[]');
      if (!del.includes(id)) { del.push(id); localStorage.setItem('cncforge_deleted_pids', JSON.stringify(del)); }
    } catch(e){}

    if (B()?.cache?.products) {
      B().cache.products = B().cache.products.filter(x => x.id !== id);
    }
    OV.products = (OV.products || []).filter(x => x.id !== id);
    saveOv(OV);
    ui.coD = null;
    toast('Product deleted', '🗑️');
    render();

    if (B()?.api) {
      try {
        await B().api.delete('/api/products/' + id);
        await B().refresh().catch(()=>{});
        render();
      } catch (e) {
        console.warn('Backend delete notice:', e.message);
      }
    }
  },
  saveCompany(editId){
    const name = ($('#nc_name')?.value || '').trim();
    const code = ($('#nc_code')?.value || '').trim().toUpperCase();
    const industry = $('#nc_ind')?.value || 'CNC Manufacturing';
    const email = ($('#nc_email')?.value || '').trim();
    const phone = ($('#nc_phone')?.value || '').trim();
    const city = ($('#nc_city')?.value || '').trim();
    const state = ($('#nc_state')?.value || '').trim();
    const pin = ($('#nc_pin')?.value || '').trim();
    const address = ($('#nc_addr')?.value || '').trim();
    const description = ($('#nc_desc')?.value || '').trim();
    const plan = $('#nc_plan')?.value || 'Starter';
    const storeStatus = $('#nc_status')?.value || 'active';
    const adminName = ($('#nc_admin')?.value || '').trim();
    const adminEmail = ($('#nc_aemail')?.value || '').trim();

    if (!name) { toast('Company name is required', '⚠️'); return; }
    if (!city) { toast('City is required', '⚠️'); return; }
    if (!editId && !adminEmail) { toast('Admin email is required', '⚠️'); return; }

    const payload = { name, code: code || undefined, industry, email, phone, city, state, pin, address, description, plan, storeStatus, adminName: adminName || undefined, adminEmail: adminEmail || undefined };

    if (B()?.enabled) {
      const call = editId ? B().api.put('/api/companies/' + editId, payload) : B().api.post('/api/companies', payload);
      call.then(async () => {
        await B().refresh();
        toast(editId ? 'Company updated' : name + ' created', '🏭');
        location.hash = '#/super/companies';
      }).catch(e => toast(e.message, '⚠️'));
      return;
    }

    if (editId) {
      const all = getCompanies();
      const ex = all.find(x => x.id === editId);
      if (ex) Object.assign(ex, payload);
      saveOv(OV);
      toast('Company updated', '🏭');
      location.hash = '#/super/companies';
    } else {
      const id = code || ('C-' + name.slice(0, 1).toUpperCase() + Math.floor(Math.random() * 90 + 10));
      const co = { id, logo: '🏭', status: storeStatus, orders: 0, revenue: 0, products: 0, users: 1, ...payload };
      OV.companies = [co, ...(OV.companies || [])];
      saveOv(OV);
      toast(name + ' created', '🏭');
      location.hash = '#/super/companies';
    }
  },
  /* ----- unified Company Management: navigation, filters, pagination ----- */
  goMgmt(tab, company){
    ui.tPage = 1;
    if (company !== undefined) { ui.admFCo = company||'all'; ui.usrFCo = company||'all'; }
    const h = '#/super/companies?tab=' + (tab||'companies');
    if ((location.hash||'') === h) render(); else location.hash = h;
  },
  mgCard(kind){
    ui.tPage = 1;
    let h;
    if (kind==='all') { ui.coFStatus='all'; h='#/super/companies?tab=companies'; }
    else if (kind==='active'||kind==='suspended') { ui.coFStatus=kind; h='#/super/companies?tab=companies'; }
    else if (kind==='admins') h='#/super/companies?tab=admins';
    else if (kind==='users') h='#/super/companies?tab=users';
    else if (kind==='products') h='#/super/catalog';
    else h='#/super/orders';
    if ((location.hash||'') === h) render(); else location.hash = h;
  },
  tPage(d){ const t=ui.t; ui.tPage = Math.max(1, (t&&t.page||1) + d); render(); },
  _deb(){ clearTimeout(window._mt); window._mt=setTimeout(render, 280); },
  coF(e,k){ const v=e.target.value; ui.tPage=1; if(k==='q')ui.coFQ=v; if(k==='status')ui.coFStatus=v; if(k==='industry')ui.coFInd=v; if(k==='city')ui.coFCity=v; App._deb(); },
  admF(e,k){ const v=e.target.value; ui.tPage=1; if(k==='q')ui.admFQ=v; if(k==='co')ui.admFCo=v; if(k==='status')ui.admFStatus=v; App._deb(); },
  usrF(e,k){ const v=e.target.value; ui.tPage=1; if(k==='q')ui.usrFQ=v; if(k==='co')ui.usrFCo=v; if(k==='role')ui.usrFRole=v; if(k==='status')ui.usrFStatus=v; App._deb(); },
  mgRefresh(){ if(B()?.enabled){ B().refresh().then(()=>{ toast('Refreshed from database','↻'); render(); }).catch(e=>toast(e.message,'⚠️')); } else { render(); toast('Refreshed','↻'); } },
  mgExport(){
    const t = ui.t;
    if (!t || !t.rows || !t.rows.length) { toast('Nothing to export', '⚠️'); return; }
    const key = t.key || 'export';
    let cols, rows;
    if (key === 'mgCompanies') { cols = ['id','code','name','industry','email','phone','city','state','pin','status','plan','createdAt']; rows = t.rows.map(c => cols.map(k => c[k] ?? '')); }
    else { cols = ['id','name','email','mobile','role','company','status','created']; rows = t.rows.map(u => [u.id, u.name, u.email, u.mobile||'', u.role, u.companyName||coName(u.companyId), u.active!==false?'active':'inactive', u.createdAt||'']); }
    const esc = v => `"${String(v).replace(/"/g, '""')}"`;
    const csv = [cols.join(','), ...rows.map(r => r.map(esc).join(','))].join('\n');
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
    a.download = `company-${key}-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    toast(t.rows.length + ' rows exported', '⤓');
  },
  /* ----- generic modal + confirm ----- */
  closeModal(){ document.querySelector('.modal-bg')?.remove(); document.body.style.overflow=''; },
  openModal(html, wide){
    App.closeModal();
    document.body.style.overflow = 'hidden';
    document.body.insertAdjacentHTML('beforeend', `<div class="modal-bg" id="coModalBg" onclick="if(event.target===this)App.closeModal()"><div class="modal${wide?' wide':''}"><div class="modal-body" style="padding:0"><div id="coModal"></div></div></div></div>`);
    $('#coModal').innerHTML = html;
  },
  confirmDlg(o){
    window._cf = o.onOk;
    App.openModal(`<div class="modal-head"><span>${o.danger?'⛔':'⚠️'} ${o.title||'Please confirm'}</span><button class="btn btn-ghost btn-sm" onclick="App.closeModal()">✕</button></div>
    <div class="modal-body"><p style="font-size:13.5px;margin-top:0">${o.body||''}</p>
    <div style="display:flex;gap:8px;justify-content:flex-end;margin-top:14px"><button class="btn btn-ghost btn-sm" onclick="App.closeModal()">Cancel</button><button class="btn ${o.danger?'btn-coral':'btn-primary'} btn-sm" id="cfOk" onclick="App._cfGo()">${o.okLabel||'Confirm'}</button></div></div>`);
  },
  async _cfGo(){ const fn = window._cf; window._cf = null; const b = $('#cfOk'); if (b) { b.disabled = true; b.innerText = 'Working…'; } try { if (fn) await fn(); } catch(e){ toast(e.message||'Failed','⚠️'); } },
  /* ----- company create/edit modal (same fields + validation as standalone form) ----- */
  openCoModal(editId){
    const c = editId ? getCompanies().find(x=>x.id===editId) : null;
    if (editId && !c) { toast('Company not found','⚠️'); return; }
    const v = k => (c ? (c[k]||'') : '');
    App.openModal(`<div class="modal-head"><span>🏢 ${c?'Edit Company — '+c.name:'Create Company'}</span><button class="btn btn-ghost btn-sm" onclick="App.closeModal()">✕</button></div>
    <div class="modal-body"><div class="co-form-grid">
      <div class="co-col"><div class="co-col-title">🏢 Company Profile</div>
        <div class="field"><label>Company Name *</label><input id="nc_name" value="${v('name')}" placeholder="e.g. Apex CNC Works"></div>
        <div class="field"><label>Company Code * ${c?'(locked)':'(unique)'}</label><input id="nc_code" value="${v('code')||v('id')}" ${c?'disabled':''} placeholder="e.g. C-D"></div>
        <div class="field"><label>Industry</label><select id="nc_ind">${['CNC Manufacturing','Machine Tools','Auto Components','Fabrication','General Engineering'].map(i=>`<option ${v('industry')===i?'selected':''}>${i}</option>`).join('')}</select></div>
        <div class="field"><label>Company Email</label><input id="nc_email" value="${v('email')}" placeholder="contact@company.in"></div>
        <div class="field"><label>Logo (emoji or text)</label><input id="nc_logo" value="${v('logo')}" placeholder="🏭"></div>
      </div>
      <div class="co-col"><div class="co-col-title">📍 Location & Contact</div>
        <div class="field"><label>Phone</label><input id="nc_phone" value="${v('phone')}" placeholder="+91 98765 43210"></div>
        <div class="field"><label>City *</label><input id="nc_city" value="${v('city')}" placeholder="e.g. Pune"></div>
        <div class="form-row-2"><div class="field"><label>State</label><input id="nc_state" value="${v('state')}"></div><div class="field"><label>PIN Code</label><input id="nc_pin" value="${v('pin')}"></div></div>
        <div class="field"><label>Address</label><input id="nc_addr" value="${v('address')}"></div>
      </div>
      <div class="co-col"><div class="co-col-title">⚙️ Admin & Access</div>
        ${c?'':`<div class="field"><label>Company Admin Name</label><input id="nc_admin" placeholder="e.g. Neha Gupta"></div>
        <div class="field"><label>Admin Email *</label><input id="nc_aemail" placeholder="admin@company.in"></div>`}
        <div class="form-row-2"><div class="field"><label>Plan</label><select id="nc_plan">${['Starter','Growth','Scale'].map(i=>`<option ${(c?c.plan:'Starter')===i?'selected':''}>${i}</option>`).join('')}</select></div>
        <div class="field"><label>Status</label><select id="nc_status"><option value="active" ${(v('storeStatus')||'active')==='active'?'selected':''}>Active</option><option value="suspended" ${v('storeStatus')==='suspended'?'selected':''}>Suspended</option></select></div></div>
        <div class="field"><label>Short Description</label><input id="nc_desc" value="${v('description')}"></div>
      </div></div>
      <div id="coFormErr" class="hint" style="color:#DC2626;margin-top:8px"></div>
      <div style="display:flex;gap:8px;justify-content:flex-end;margin-top:12px"><button class="btn btn-ghost btn-sm" onclick="App.closeModal()">Cancel</button><button class="btn btn-primary btn-sm" id="coSaveBtn" onclick="App.saveCompanyModal('${c?c.id:''}')">💾 ${c?'Save changes':'Create company'}</button></div>
    </div>`, true);
  },
  async saveCompanyModal(editId){
    const err = m => { const e = $('#coFormErr'); if (e) e.textContent = m||''; };
    const btn = $('#coSaveBtn');
    const name = ($('#nc_name')?.value || '').trim();
    const code = ($('#nc_code')?.value || '').trim().toUpperCase();
    const industry = $('#nc_ind')?.value || 'CNC Manufacturing';
    const email = ($('#nc_email')?.value || '').trim();
    const logo = ($('#nc_logo')?.value || '').trim() || '🏭';
    const phone = ($('#nc_phone')?.value || '').trim();
    const city = ($('#nc_city')?.value || '').trim();
    const state = ($('#nc_state')?.value || '').trim();
    const pin = ($('#nc_pin')?.value || '').trim();
    const address = ($('#nc_addr')?.value || '').trim();
    const description = ($('#nc_desc')?.value || '').trim();
    const plan = $('#nc_plan')?.value || 'Starter';
    const storeStatus = $('#nc_status')?.value || 'active';
    const adminName = ($('#nc_admin')?.value || '').trim();
    const adminEmail = ($('#nc_aemail')?.value || '').trim();
    err('');
    if (!name) return err('Company name is required.');
    if (!city) return err('City is required.');
    if (email && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return err('Company email format is invalid.');
    if (!editId && !adminEmail) return err('Admin email is required to provision the Company Admin.');
    if (adminEmail && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(adminEmail)) return err('Admin email format is invalid.');
    if (!editId && code && getCompanies().some(x => x.id === code || x.code === code)) return err('Company code already exists.');
    if (btn) { btn.disabled = true; btn.innerText = 'Saving…'; }
    const payload = { name, code: code || undefined, industry, email, logo, phone, city, state, pin, address, description, plan, storeStatus, adminName: adminName || undefined, adminEmail: adminEmail || undefined };
    const reset = () => { if (btn) { btn.disabled = false; btn.innerText = editId ? '💾 Save changes' : '💾 Create company'; } };
    // companies and their admins must exist on the server, otherwise the admin's Google login is rejected
    if (!(await B()?.ensureLive?.())) { reset(); return err('Server not reachable — company NOT saved. Start the backend (npm run dev) and try again.'); }
    try {
      if (editId) await B().api.put('/api/companies/' + editId, payload); else await B().api.post('/api/companies', payload);
    } catch(e) { reset(); return err(e.message); }
    try { await B().refresh(); } catch(e){}
    App.closeModal(); toast(editId ? 'Company updated' : name + ' created — admin ' + adminEmail + ' can sign in with Google', '🏭'); render();
  },
  /* ----- suspend / activate with impact warning (never deletes) ----- */
  async coToggle(id, cur){
    const to = (cur === 'active') ? 'suspended' : 'active';
    let users = 0, pending = 0, nm = id;
    try {
      const d = B()?.enabled ? await B().api.get('/api/companies/' + id) : null;
      if (d) { users = d.userCount||0; pending = d.pendingOrders||0; nm = d.name||id; }
      else { const s = pstats().byCompany.find(x=>x.id===id); if (s) { users = s.users; pending = s.pending; nm = s.name; } }
    } catch(e){}
    App.confirmDlg({
      title: (to==='active'?'Activate ':'Suspend ') + nm,
      danger: to !== 'active',
      body: to === 'active'
        ? `Reopen the store for <b>${nm}</b>. Users regain access immediately.`
        : `Suspend <b>${nm}</b>? Its store closes and <b>${users} user(s)</b> lose access. ${pending?`<b style="color:#92400E">${pending} pending order(s) need attention first.</b> `:''}Nothing is deleted — users, products, inventory and orders are preserved and the company can be reactivated.`,
      okLabel: to === 'active' ? 'Activate company' : 'Suspend company',
      onOk: async () => {
        if (B()?.enabled) await B().api.put('/api/companies/' + id, { storeStatus: to });
        else { const ex = [...getCompanies()].find(x => x.id === id); if (ex) { ex.storeStatus = to; ex.status = to; } saveOv(OV); }
        if (B()?.enabled) { try { await B().refresh(); } catch(e){} }
        App.closeModal(); toast(nm + (to==='active' ? ' activated' : ' suspended'), to==='active'?'✅':'⛔'); render();
      }
    });
  },
  /* ----- user create/edit modal (Google emails; role assigned by backend) ----- */
  coUserNew(cid, role, isEdit){
    let u = null;
    if (isEdit) { u = getUsers().find(x => x.id === cid); if (!u) { toast('User not found','⚠️'); return; } role = u.role; cid = u.companyId; }
    const cos = getCompanies();
    const myCo = (me && me.role === 'company_admin') ? me.companyId : (cid || (me ? me.companyId : ''));
    const lockCo = !!myCo;
    App.openModal(`<div class="modal-head"><span>👥 ${isEdit ? 'Edit User — ' + u.name : (role === 'company_admin' ? 'Invite Company Admin' : 'Add Sales User')}</span><button class="btn btn-ghost btn-sm" onclick="App.closeModal()">✕</button></div>
    <div class="modal-body"><input type="hidden" id="mu_id" value="${isEdit?u.id:''}">
      <div class="field"><label>Full name *</label><input id="mu_name" value="${isEdit?u.name:''}" placeholder="e.g. Priya Sharma"></div>
      <div class="field"><label>Google email * ${isEdit?'(locked)':''}</label><input id="mu_email" value="${isEdit?u.email:''}" ${isEdit?'disabled':''} placeholder="name@gmail.com"></div>
      <div class="field"><label>Mobile</label><input id="mu_mobile" value="${isEdit?(u.mobile||''):''}" placeholder="+91 …"></div>
      <div class="field"><label>Company *</label>${lockCo ? `<input value="${coName(myCo)} (${myCo})" disabled><input type="hidden" id="mu_company" value="${myCo}">` : `<select id="mu_company"><option value="">— Select company —</option>${cos.map(c=>`<option value="${c.id}">${c.name} (${c.code||c.id})</option>`).join('')}</select>`}</div>
      <div class="field"><label>Role *</label><select id="mu_role"><option value="sales_user" ${role!=='company_admin'?'selected':''}>Sales User</option><option value="company_admin" ${role==='company_admin'?'selected':''}>Company Admin</option></select><span class="hint">User will sign in with this Google email to access the store workspace.</span></div>
      <div id="muErr" class="hint" style="color:#DC2626"></div>
      <div style="display:flex;gap:8px;justify-content:flex-end;margin-top:12px"><button class="btn btn-ghost btn-sm" onclick="App.closeModal()">Cancel</button><button class="btn btn-primary btn-sm" id="muSaveBtn" onclick="App.saveUserModal()">💾 ${isEdit?'Save changes':'Create user'}</button></div>
    </div>`);
  },
  async saveUserModal(){
    const err = m => { const e = $('#muErr'); if (e) e.textContent = m||''; };
    const btn = $('#muSaveBtn');
    const id = $('#mu_id')?.value || '';
    const name = ($('#mu_name')?.value || '').trim();
    const email = ($('#mu_email')?.value || '').trim();
    const mobile = ($('#mu_mobile')?.value || '').trim();
    const companyId = $('#mu_company')?.value || (me ? me.companyId : '') || '';
    const role = $('#mu_role')?.value || 'sales_user';
    err('');
    if (!name) return err('Full name is required.');
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return err('A valid Google email is required.');
    if (!companyId) return err('Select a company.');
    if (!['sales_user','company_admin'].includes(role)) return err('Invalid role.');
    if (!id && getUsers().some(x => (x.email||'').toLowerCase() === email.toLowerCase())) return err('This email is already registered.');
    if (btn) { btn.disabled = true; btn.innerText = 'Saving…'; }
    const payload = id ? { name, mobile, role, companyId } : { name, email, mobile, role, companyId };
    const done = async msg => { try { await B().refresh(); } catch(e){} App.closeModal(); toast(msg, '👥'); render(); };
    const reset = () => { if (btn) { btn.disabled = false; btn.innerText = id ? '💾 Save changes' : '💾 Create user'; } };
    // Google sign-in is checked against the server, so a user saved only in this browser can never log in
    if (!(await B()?.ensureLive?.())) { reset(); return err('Server not reachable — user NOT created. Start the backend (npm run dev) and try again.'); }
    try {
      if (id) await B().api.patch('/api/users/' + id, payload); else await B().api.post('/api/users', payload);
    } catch(e) { reset(); return err(e.message); }
    done(id ? 'User updated' : name + ' added to ' + coName(companyId) + ' — can now sign in with Google as ' + email);
  },
  userView(id){
    const u = getUsers().find(x => x.id === id);
    if (!u) { toast('User not found','⚠️'); return; }
    App.openModal(`<div class="modal-head"><span>👤 ${u.name}</span><button class="btn btn-ghost btn-sm" onclick="App.closeModal()">✕</button></div>
    <div class="modal-body">
      <div class="form-grid"><div class="field"><label>Email</label><div><b>${u.email}</b></div></div><div class="field"><label>Mobile</label><div>${u.mobile||'—'}</div></div>
      <div class="field"><label>Company</label><div><b>${coName(u.companyId)}</b> <span class="hint">${u.companyId||''}</span></div></div><div class="field"><label>Role</label><div>${u.role.replace('_',' ')}</div></div>
      <div class="field"><label>Account status</label><div>${statusBadge(u.active!==false?'Delivered':'Cancelled')}</div></div><div class="field"><label>Created</label><div>${u.createdAt||'—'}</div></div></div>
      <div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:12px"><button class="btn btn-ghost btn-sm" onclick="App.coUserNew('${u.id}',null,true)">Edit</button>
      ${u.role!=='super_admin'?`<button class="btn btn-ghost btn-sm" onclick="App.coUserRole('${u.id}','${u.role}')">${u.role==='sales_user'?'Make admin':'Make sales'}</button><button class="btn btn-ghost btn-sm" onclick="App.coUserToggle('${u.id}',${!!u.active})">${u.active!==false?'Deactivate':'Activate'}</button><a class="btn btn-ghost btn-sm" href="#/super/companies/${u.companyId}" onclick="App.closeModal()">Open company →</a>`:''}</div>
    </div>`);
  },
  coUserToggle(id, active){
    const apply = async () => {
      if (B()?.enabled) await B().api.patch('/api/users/' + id, { active: !active });
      else { const ex = [...getUsers()].find(x => x.id === id); if (ex) ex.active = !active; saveOv(OV); }
      if (B()?.enabled) { try { await B().refresh(); } catch(e){} }
      App.closeModal(); toast(active ? 'Account deactivated' : 'Account activated', active ? '⛔' : '✅'); render();
    };
    apply().catch(e => toast(e.message, '⚠️'));
  },
  coUserRole(id, role){
    if (role === 'super_admin') { toast('Super Admin role is protected','⛔'); return; }
    const to = role === 'sales_user' ? 'company_admin' : 'sales_user';
    const u = getUsers().find(x => x.id === id);
    App.confirmDlg({
      title: (to==='company_admin'?'Promote ':'Demote ') + (u?u.name:id),
      danger: to !== 'company_admin',
      body: to === 'company_admin'
        ? `<b>${u?u.name:''}</b> will become <b>Company Admin</b> of ${coName(u?u.companyId:'')} with full access to that company's catalog, orders and users.`
        : `<b>${u?u.name:''}</b> will become a <b>Sales User</b> and lose administrative access.`,
      okLabel: to === 'company_admin' ? 'Promote to admin' : 'Demote to sales',
      onOk: async () => {
        if (B()?.enabled) await B().api.patch('/api/users/' + id, { role: to });
        else { const ex = [...getUsers()].find(x => x.id === id); if (ex) ex.role = to; saveOv(OV); }
        if (B()?.enabled) { try { await B().refresh(); } catch(e){} }
        App.closeModal(); toast('Role updated to ' + to.replace('_',' '), '👥'); render();
      }
    });
  },
  /* ----- company details modal with quick actions ----- */
  async coDetails(id){
    App.openModal(`<div class="modal-head"><span>🏢 Company details</span><button class="btn btn-ghost btn-sm" onclick="App.closeModal()">✕</button></div><div class="modal-body"><div class="skel" style="min-height:160px"></div><p class="hint">Loading…</p></div>`);
    let d = null;
    try { d = await coDetail(id); } catch(e){ d = { _err: e.message }; }
    if (!d || d._err) { App.openModal(`<div class="modal-head"><span>🏢 Company details</span><button class="btn btn-ghost btn-sm" onclick="App.closeModal()">✕</button></div><div class="modal-body"><div class="empty">⚠️ ${d&&d._err?d._err:'Company not found.'}</div></div>`); return; }
    const st = d.storeStatus || d.status;
    const adm = d.admin || {};
    App.openModal(`<div class="modal-head"><span>${d.logo||'🏭'} ${d.name}</span><button class="btn btn-ghost btn-sm" onclick="App.closeModal()">✕</button></div>
    <div class="modal-body">
      <p class="hint" style="margin-top:0">${d.code||d.id} • ${d.industry||''} • ${d.city||''} ${statusBadge(st==='active'?'Delivered':'Cancelled')}</p>
      <div class="form-grid">
        <div class="field"><label>Email / Phone</label><div style="font-size:13px"><b>${d.email||'—'}</b><div class="hint">${d.phone||''}</div></div></div>
        <div class="field"><label>Address</label><div style="font-size:13px">${d.address||'—'}<div class="hint">${d.city||''} ${d.state||''} ${d.pin||''}</div></div></div>
        <div class="field"><label>Company Admin</label><div style="font-size:13px"><b>${adm.name||'—'}</b><div class="hint">${adm.email||''}</div></div></div>
        <div class="field"><label>Plan / Created</label><div style="font-size:13px">${d.plan||''}<div class="hint">${d.createdAt||''}</div></div></div>
      </div>
      ${d.description?`<p style="font-size:13px">${d.description}</p>`:''}
      <div class="mgmt-cards" style="grid-template-columns:repeat(4,1fr)">
        <div class="ind-stat"><b>${d.userCount||0}</b><p>Users</p></div>
        <div class="ind-stat"><b>${d.productCount||0}</b><p>SKUs</p></div>
        <div class="ind-stat"><b>${d.orderCount||0}</b><p>Orders</p></div>
        <div class="ind-stat"><b>${fmt(d.revenue||0)}</b><p>Revenue</p></div>
      </div>
      <div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:12px">
        <button class="btn btn-primary btn-sm" onclick="App.closeModal();App.openCoModal('${d.id}')">Edit Company</button>
        <button class="btn btn-ghost btn-sm" onclick="App.closeModal();App.goMgmt('admins','${d.id}')">Manage Admins</button>
        <button class="btn btn-ghost btn-sm" onclick="App.closeModal();App.goMgmt('users','${d.id}')">Manage Users</button>
        <a class="btn btn-ghost btn-sm" href="#/super/companies/${d.id}?tab=catalog" onclick="App.closeModal()">Products</a>
        <a class="btn btn-ghost btn-sm" href="#/super/companies/${d.id}?tab=categories" onclick="App.closeModal()">Categories</a>
        <a class="btn btn-ghost btn-sm" href="#/super/companies/${d.id}?tab=orders" onclick="App.closeModal()">Orders</a>
        <a class="btn btn-ghost btn-sm" href="#/super/companies/${d.id}" onclick="App.closeModal()">Full workspace →</a>
      </div>
    </div>`, true);
  },
  /* ----- live-data refresh helpers ----- */
  _safeToRerender(){
    // don't wipe a form the user is typing into or a dialog they have open
    if (document.querySelector('.modal-bg')) return false;
    if (App._dirty) return false; // user has typed/chosen something on this page
    const a = document.activeElement;
    return !(a && ['INPUT','TEXTAREA','SELECT'].includes(a.tagName) && a.id !== 'gSearch');
  },
  async liveRefresh(force){
    if (!B()?.enabled || !me || App._refreshing) return;
    if (!force && B().lastRefresh && Date.now() - B().lastRefresh < 4000) return;
    App._refreshing = true;
    try {
      const before = JSON.stringify([B().cache.products, B().cache.orders, B().cache.quotes, B().cache.cats]);
      await B().refresh();
      const after = JSON.stringify([B().cache.products, B().cache.orders, B().cache.quotes, B().cache.cats]);
      if (before !== after && App._safeToRerender()) render();
    } catch(e) { /* keep current data */ } finally { App._refreshing = false; }
  },
  /* ----- store settings (company) + global settings (super) ----- */
  async coSettingsLoad(cid){
    const w = $('#coSetWrap'); if (!w) return;
    let s = {};
    if (B()?.enabled) { try { s = await B().api.get('/api/settings?companyId=' + encodeURIComponent(cid)); } catch(e){ w.innerHTML = `<div class="empty">⚠️ ${e.message}</div>`; return; } }
    else s = (OV.settings||{})[cid] || {};
    const w2 = $('#coSetWrap'); if (w2) w2.innerHTML = settingsForm(cid, s);
  },
  async settingsSave(cid){
    const btn = $('#setSaveBtn'), msg = $('#setMsg');
    const body = { companyId: cid };
    SET_FIELDS.forEach(([k,,t]) => { const el = $('#set_'+k); if (el) body[k] = t==='number' ? Number(el.value||0) : el.value.trim(); });
    if (btn) { btn.disabled = true; btn.innerText = 'Saving…'; }
    try {
      if (B()?.enabled) await B().api.put('/api/settings', body);
      else { OV.settings = { ...(OV.settings||{}), [cid]: body }; saveOv(OV); }
      toast('Store settings saved','⚙️'); if (msg) msg.textContent = 'Saved ' + new Date().toLocaleTimeString();
    } catch(e) { toast(e.message,'⚠️'); if (msg) msg.textContent = e.message; }
    if (btn) { btn.disabled = false; btn.innerText = '💾 Save settings'; }
  },
  async globalSettingsLoad(){
    const w = $('#gSetWrap'); if (!w) return;
    let g = {};
    if (B()?.enabled) { try { g = await B().api.get('/api/settings/global'); } catch(e){ w.innerHTML = `<div class="empty">⚠️ ${e.message}</div>`; return; } }
    const F = [['currency','Currency','text'],['taxPct','Default tax % (GST)','number'],['orderPrefix','Order prefix','text'],['quotePrefix','Quotation prefix','text'],['lowStockThreshold','Low-stock threshold','number'],['announcement','Platform announcement','text']];
    const esc = v => String(v==null?'':v).replace(/"/g,'&quot;');
    $('#gSetWrap').innerHTML = `<div class="form-grid">${F.map(([k,l,t])=>`<div class="field${k==='announcement'?' full':''}"><label>${l}</label><input id="gs_${k}" data-t="${t}" type="${t}" value="${esc(g[k])}"></div>`).join('')}
      <div class="field"><label>Quotations (RFQ)</label><select id="gs_quotationEnabled"><option value="1" ${g.quotationEnabled!==false?'selected':''}>Enabled</option><option value="0" ${g.quotationEnabled===false?'selected':''}>Disabled</option></select></div>
      <div class="field"><label>New products visible by default</label><select id="gs_visibilityDefault"><option value="1" ${g.visibilityDefault!==false?'selected':''}>Yes</option><option value="0" ${g.visibilityDefault===false?'selected':''}>No</option></select></div></div>
      <div style="display:flex;gap:8px;align-items:center;margin-top:12px"><button class="btn btn-primary btn-sm" id="gsSave" onclick="App.globalSettingsSave()">💾 Save global settings</button><span class="hint">${g.updatedAt?'Last updated '+g.updatedAt:''}</span></div>`;
  },
  async globalSettingsSave(){
    const body = {};
    $$('#gSetWrap input[id^="gs_"]').forEach(el => { body[el.id.slice(3)] = el.dataset.t==='number' ? Number(el.value||0) : el.value.trim(); });
    body.quotationEnabled = ($('#gs_quotationEnabled')||{}).value !== '0';
    body.visibilityDefault = ($('#gs_visibilityDefault')||{}).value !== '0';
    const btn = $('#gsSave'); if (btn) { btn.disabled = true; btn.innerText = 'Saving…'; }
    try { await B().api.put('/api/settings/global', body); toast('Global settings saved','⚙️'); App.globalSettingsLoad(); }
    catch(e) { toast(e.message,'⚠️'); if (btn) { btn.disabled = false; btn.innerText = '💾 Save global settings'; } }
  },
  /* ----- company detail tab actions (catalog / categories / media) ----- */
  async _after(msg, icon){ if (B()?.enabled) { try { await B().refresh(); } catch(e){} } ui.coD = null; App.closeModal(); toast(msg, icon||'✅'); render(); },
  async coProdArchive(pid, archived){
    const p = prodById(pid);
    if (!B()?.enabled) { if (p) { p.archived = !archived; if (p.archived) p.visible = false; } toast('Offline — change not saved to server','⚠️'); render(); return; }
    try { await B().api.patch('/api/products/'+pid+'/archive', { archived: !archived }); App._after((p?(p.sku||p.name):pid)+(archived?' restored':' archived — hidden from store'), '🗄️'); }
    catch(e){ toast(e.message,'⚠️'); }
  },
  coCatNew(cid){
    App.openModal(`<div class="modal-head"><span>🗂️ New company category</span><button class="btn btn-ghost btn-sm" onclick="App.closeModal()">✕</button></div>
    <div class="modal-body"><div class="field"><label>Name *</label><input id="cc_name" placeholder="e.g. Hydraulic Fittings"></div>
    <div class="field"><label>Icon (emoji)</label><input id="cc_icon" value="🏭"></div>
    <div class="field"><label>Description</label><input id="cc_desc" placeholder="Short description"></div>
    <div id="ccErr" class="hint" style="color:#DC2626"></div>
    <div style="display:flex;gap:8px;justify-content:flex-end;margin-top:12px"><button class="btn btn-ghost btn-sm" onclick="App.closeModal()">Cancel</button><button class="btn btn-primary btn-sm" onclick="App.coCatSave('${cid||''}')">💾 Create</button></div></div>`);
  },
  async coCatSave(cid){
    const name = ($('#cc_name')?.value||'').trim(); const e = $('#ccErr');
    if (!name) { if (e) e.textContent = 'Name is required.'; return; }
    const body = { name, icon: ($('#cc_icon')?.value||'').trim()||'🏭', desc: ($('#cc_desc')?.value||'').trim(), scope: 'company', companyId: cid || me.companyId };
    if (!B()?.enabled) { toast('Offline — categories need the backend','⚠️'); return; }
    try { await B().api.post('/api/categories', body); App._after('Category '+name+' created','🗂️'); } catch(err){ if (e) e.textContent = err.message; }
  },
  async coCatToggle(catId, active, force){
    if (!B()?.enabled) { toast('Offline — categories need the backend','⚠️'); return; }
    try { await B().api.put('/api/categories/'+catId+(force?'?force=1':''), { active: !active }); App._after('Category '+(active?'deactivated':'activated'),'🗂️'); }
    catch(e){
      if (!force && /force=1/.test(e.message)) {
        App.confirmDlg({ title:'Deactivate category', danger:true, body:e.message.replace(/\(retry with \?force=1\)/,'')+'. Its products stay in the catalog but the category is hidden from the store menu.', okLabel:'Deactivate anyway', onOk: () => App.coCatToggle(catId, active, true) });
      } else toast(e.message,'⚠️');
    }
  },
  catRename(catId){
    const c = getCats().find(x=>x.id===catId); if (!c) return;
    App.openModal(`<div class="modal-head"><span>🗂️ Edit category</span><button class="btn btn-ghost btn-sm" onclick="App.closeModal()">✕</button></div>
    <div class="modal-body"><div class="field"><label>Name *</label><input id="cr_name" value="${String(c.name).replace(/"/g,'&quot;')}"></div>
    <div class="field"><label>Icon (emoji)</label><input id="cr_icon" value="${c.icon||''}"></div>
    <div class="field"><label>Description</label><input id="cr_desc" value="${String(c.desc||'').replace(/"/g,'&quot;')}"></div>
    <div style="display:flex;gap:8px;justify-content:flex-end;margin-top:12px"><button class="btn btn-ghost btn-sm" onclick="App.closeModal()">Cancel</button><button class="btn btn-primary btn-sm" onclick="App.catRenameSave('${c.id}')">💾 Save</button></div></div>`);
  },
  async catRenameSave(catId){
    const name = ($('#cr_name')?.value||'').trim(); if (!name) { toast('Name is required','⚠️'); return; }
    if (!B()?.enabled) { toast('Offline — categories need the backend','⚠️'); return; }
    try { await B().api.put('/api/categories/'+catId, { name, icon: ($('#cr_icon')?.value||'').trim()||'🏭', desc: ($('#cr_desc')?.value||'').trim() }); App._after('Category updated','🗂️'); }
    catch(e){ toast(e.message,'⚠️'); }
  },
  coMediaUp(cid){
    const ps = getProducts().filter(p=>p.companyId===cid);
    if (!ps.length) { toast('Add a product first — media is attached to a product','⚠️'); return; }
    App.openModal(`<div class="modal-head"><span>🖼️ Upload media</span><button class="btn btn-ghost btn-sm" onclick="App.closeModal()">✕</button></div>
    <div class="modal-body"><div class="field"><label>Product *</label><select id="mu_prod">${ps.map(p=>`<option value="${p.id}">${p.sku||p.id} — ${p.name}</option>`).join('')}</select></div>
    <div class="field"><label>Files * (images or one video, max 50MB)</label><input type="file" id="mu_files" accept="image/*,video/*" multiple></div>
    <div id="mdErr" class="hint" style="color:#DC2626"></div>
    <div style="display:flex;gap:8px;justify-content:flex-end;margin-top:12px"><button class="btn btn-ghost btn-sm" onclick="App.closeModal()">Cancel</button><button class="btn btn-primary btn-sm" id="mdBtn" onclick="App.coMediaSave('${cid}')">📤 Upload</button></div></div>`);
  },
  async coMediaSave(cid){
    const files = ($('#mu_files')||{}).files, pid = ($('#mu_prod')||{}).value, e = $('#mdErr'), btn = $('#mdBtn');
    if (!files || !files.length) { if (e) e.textContent = 'Choose at least one file.'; return; }
    if (!B()?.enabled) { if (e) e.textContent = 'Backend offline — uploads need the server.'; return; }
    if (btn) { btn.disabled = true; btn.innerText = 'Uploading…'; }
    try {
      const types = [...files].map(f => (f.type||'').startsWith('video') ? 'video' : 'image');
      const urls = await B().upload(files);
      for (let i = 0; i < urls.length; i++) await B().api.post('/api/media', { companyId: cid, productId: pid, type: types[i]||'image', url: urls[i] });
      App._after(urls.length + ' file(s) uploaded','🖼️');
    } catch(err){ if (e) e.textContent = err.message; if (btn) { btn.disabled = false; btn.innerText = '📤 Upload'; } }
  },
  async coMediaPrimary(mid){
    try { await B().api.patch('/api/media/'+mid, { primary: true }); App._after('Primary image updated','🖼️'); } catch(e){ toast(e.message,'⚠️'); }
  },
  coMediaDel(mid){
    App.confirmDlg({ title:'Delete media', danger:true, body:'Remove this file from the product? This cannot be undone.', okLabel:'Delete', onOk: async () => { await B().api.delete('/api/media/'+mid); await App._after('Media deleted','🗑️'); } });
  },
  /* ----- my profile ----- */
  async saveProfile(){
    const name = ($('#pf_name')?.value||'').trim(), mobile = ($('#pf_mob')?.value||'').trim();
    if (!name) { toast('Name is required','⚠️'); return; }
    if (!B()?.enabled || !me.google) { toast('Profile changes need Google sign-in and the backend','⚠️'); return; }
    try { await B().api.patch('/api/me', { name, mobile }); me = { ...me, name, mobile }; setSession(me); toast('Profile saved','✅'); render(); }
    catch(e){ toast(e.message,'⚠️'); }
  },
  createCompany(){ const n=($('#nc')||{}).value||'New Company';
    if(B()?.enabled){ B().api.post('/api/companies',{name:n,city:'Pune',adminName:'New Admin'}).then(async()=>{ await B().refresh(); toast(n+' created','🏭'); location.hash='#/super/companies'; }).catch(e=>toast(e.message,'⚠️')); return; }
    const id='C-'+n.slice(0,1).toUpperCase()+Math.floor(Math.random()*90+10);
    OV.companies=[{id,name:n,logo:'🏭',city:'Pune',status:'active',plan:'Starter',orders:0,revenue:0,products:0,users:1},...(OV.companies||[])]; saveOv(OV); toast(n+' created','🏭'); location.hash='#/super/companies'; },
  addCat(){ if(B()?.enabled){ const n=prompt('New category name:'); if(!n)return; B().api.post('/api/categories',{name:n}).then(async()=>{await B().refresh();render()}).catch(e=>toast(e.message,'⚠️')); return; } toast('Category editor (demo)','🗂️'); },
  addUser(){
    App.coUserNew(me ? me.companyId : '', 'sales_user');
  },
  setStatus(id){ const v=$('#ordSt').value;
    if(B()?.enabled){ B().api.patch('/api/orders/'+id+'/status',{status:v}).then(async()=>{ await B().refresh(); toast(id+' → '+v,'🧾'); render(); }).catch(e=>toast(e.message,'⚠️')); return; }
    const all=getOrders(); const o=all.find(x=>x.id===id);
    const flow=['Pending','Confirmed','Processing','Ready for Dispatch','Shipped','Delivered'];
    if(o.status==='Cancelled'){toast('Cancelled orders are final','⚠️');return}
    if(v==='Cancelled'||flow.indexOf(v)>=flow.indexOf(o.status)){ o.status=v; o.history=[...(o.history||[]),[v,new Date().toLocaleString()]];
      const base=new Set(window.MOCK.ORDERS.map(x=>x.id)); OV.orders=all.filter(x=>!base.has(x.id)||x.status!==window.MOCK.ORDERS.find(b=>b.id===x.id).status); saveOv(OV); toast(id+' → '+v,'🧾'); render(); }
    else toast('Invalid transition: '+o.status+' → '+v,'⚠️'); },
};
window.addEventListener('hashchange',()=>{ App._dirty = false; render(); App.liveRefresh(); });
/* any edit inside a form marks the page dirty so background refreshes never wipe it
   (toolbar filters/search re-render on purpose, so they don't count) */
['input','change'].forEach(ev => document.addEventListener(ev, e => { if (e.isTrusted && !e.target.closest('.toolbar, .searchbar')) App._dirty = true; }, true));
/* keep every role on fresh server data: products an admin publishes reach open sales tabs */
window.addEventListener('focus',()=>App.liveRefresh());
document.addEventListener('visibilitychange',()=>{ if(!document.hidden) App.liveRefresh(); });
setInterval(()=>{ if(!document.hidden) App.liveRefresh(true); }, 15000);
if(!location.hash) location.hash = me ? '#/store/home' : '#/login';
document.addEventListener('keydown',e=>{ if(e.key==='/'&&document.activeElement.tagName!=='INPUT'){e.preventDefault();$('#gSearch')?.focus()} });
render();
})();
