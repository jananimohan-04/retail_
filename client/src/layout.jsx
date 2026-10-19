/* Global shell — modern responsive layout with Lucide icons & Framer Motion animations */
import { Link, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useState, useEffect, useRef, forwardRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  LayoutDashboard, Building2, Boxes, FolderTree, Image as ImageIcon, 
  Receipt, FileText, Settings, ShieldCheck, Store, Home, ShoppingCart, 
  Package, User, Search, Menu, X, LogOut, ChevronRight,
  PanelLeftClose, PanelLeftOpen, Maximize2, Minimize2,
  PenLine, IndianRupee, ClipboardCheck
} from 'lucide-react';
import { useAuth } from './auth';
import { useCompany } from './companyContext';
import { getCart } from './api';

import { MENU_CATALOG, ICON_MAP, getPageById } from './menuCatalog';

function sideLink(to, label, IconComponent, badge = null, onClick = null, mini = false, theme = null) {
  const activeClass = theme?.activeLink || 'bg-blue-50 text-blue-700 font-bold border-blue-200/60 shadow-xs';
  const indicatorColor = theme?.indicator || 'bg-blue-600';
  const activeIconColor = theme?.activeIcon || 'text-blue-600';
  const badgeClass = theme?.badge || 'bg-blue-600 text-white';

  return (
    <NavLink
      key={to}
      to={to}
      onClick={onClick}
      title={label}
      className={({ isActive }) => `
        group relative flex items-center ${mini ? 'justify-center p-2.5 w-10 h-10 mx-auto' : 'gap-3 px-3 py-2.5'} rounded-xl text-xs font-semibold transition-all duration-200
        ${isActive 
          ? `${activeClass} font-bold border` 
          : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/90'}
      `}
    >
      {({ isActive }) => (
        <>
          {isActive && (
            <motion.span
              layoutId="activeIndicator"
              className={`absolute left-0 top-2 bottom-2 w-1.5 rounded-r-full shadow-xs ${indicatorColor}`}
              transition={{ type: 'spring', stiffness: 380, damping: 30 }}
            />
          )}
          <span className={`p-1 rounded-lg transition-colors ${
            isActive 
              ? `${activeIconColor} bg-white/80 shadow-2xs` 
              : 'text-slate-400 group-hover:text-slate-700 group-hover:bg-slate-200/60'
          }`}>
            {IconComponent && <IconComponent className="w-4 h-4 flex-shrink-0" />}
          </span>
          {!mini && <span className="truncate flex-1 tracking-tight">{label}</span>}
          {!mini && badge ? (
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold tracking-wide ${isActive ? badgeClass : 'bg-slate-200 text-slate-700'}`}>
              {badge}
            </span>
          ) : mini && badge ? (
            <span className={`absolute top-1 right-1 w-2.5 h-2.5 rounded-full ${indicatorColor} ring-2 ring-white`} />
          ) : null}
        </>
      )}
    </NavLink>
  );
}

export function Sidebar({ counts, onItemClick, mini = false }) {
  const { me } = useAuth();
  const role = me && me.role;
  const companyTitle = ((me && me.companyId) || 'ARGUS').toUpperCase();
  const effective = me && me.effectivePermissions;

  const hasPermission = (pageId) => {
    if (Array.isArray(effective)) {
      return effective.includes(pageId);
    }
    const page = getPageById(pageId);
    if (!page) return false;
    const userRole = role || 'sales_user';
    return (page.defaultRoles || []).includes(userRole) || (userRole.startsWith('sales_') && (page.defaultRoles || []).includes('sales_user'));
  };

  // Filter categories to only those with at least 1 visible page
  const activeCategories = MENU_CATALOG.map(cat => ({
    ...cat,
    items: cat.items.filter(item => hasPermission(item.id))
  })).filter(cat => cat.items.length > 0);

  const showCategories = hasPermission('store_listing') && (counts?.cats || []).length > 0;

  return (
    <div className={`w-full flex flex-col ${mini ? 'gap-1.5 py-1 items-center' : 'gap-5 py-2'}`}>
      {activeCategories.map((cat, idx) => (
        <div key={cat.id} className="w-full">
          {idx > 0 && mini && <div className="w-8 border-t border-slate-100 my-1 mx-auto" />}
          <div>
            {!mini && (
              <div className="flex items-center gap-1.5 px-3.5 mb-1.5">
                <span className={`w-1.5 h-1.5 rounded-full ${cat.dotClass || 'bg-slate-400'}`} />
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 truncate">
                  {role === 'company_admin' && cat.id === 'operations' ? `${companyTitle} • ${cat.label}` : cat.label}
                </span>
              </div>
            )}
            <div className={mini ? 'flex flex-col gap-1 items-center' : 'space-y-0.5'}>
              {cat.items.map(item => {
                const IconComp = ICON_MAP[item.icon] || Boxes;
                const badge = item.badgeKey ? (counts?.[item.badgeKey] || '') : null;
                return sideLink(item.path, item.label, IconComp, badge, onItemClick, mini, item.theme);
              })}
            </div>
          </div>
        </div>
      ))}

      {/* Guidance boxes for content writer / finance if active and only workflow */}
      {!mini && role === 'content_writer' && hasPermission('content_writer') && !hasPermission('admin_products') && (
        <div className="mt-2">
          <div className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400 px-3.5 mb-1.5">GUIDANCE</div>
          <p className="px-3.5 text-[11px] leading-relaxed text-slate-500">
            Products arrive here automatically from ERP Inventory. Write sales copy, attach media, then
            <span className="font-bold text-slate-700"> Submit to Finance</span> for pricing.
          </p>
        </div>
      )}

      {!mini && role === 'finance' && hasPermission('finance_review') && !hasPermission('admin_products') && (
        <div className="mt-2">
          <div className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400 px-3.5 mb-1.5">GUIDANCE</div>
          <p className="px-3.5 text-[11px] leading-relaxed text-slate-500">
            Review submitted content, set the selling price, then
            <span className="font-bold text-slate-700"> Approve &amp; Publish</span> to make the listing visible.
          </p>
        </div>
      )}

      {/* Dynamic Browse Categories for store browsers */}
      {showCategories && (
        <div className="w-full">
          {mini && <div className="w-8 border-t border-slate-100 my-1 mx-auto" />}
          <div>
            {!mini && <div className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400 px-3.5 mb-1.5">BROWSE CATEGORIES</div>}
            <div className={mini ? 'flex flex-col gap-1 items-center' : 'space-y-0.5'}>
              {(counts?.cats || []).map((c) => (
                <NavLink
                  key={c.id}
                  to={'/store/listing?cat=' + c.id}
                  onClick={onItemClick}
                  title={c.name}
                  className={({ isActive }) => `
                    flex items-center ${mini ? 'justify-center w-10 h-10 p-2' : 'gap-2.5 px-3.5 py-2'} rounded-xl text-xs font-semibold transition-all
                    ${isActive ? 'bg-orange-50 text-orange-700 font-bold' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'}
                  `}
                >
                  <span className="text-sm flex-shrink-0">{c.icon || '📦'}</span>
                  {!mini && <span className="truncate">{c.name}</span>}
                </NavLink>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export const Topbar = forwardRef(function Topbar({ onMobileToggle, sidebarOpen, onToggleSidebar, noSide }, ref) {
  const { me, loginAs, logout } = useAuth();
  const { activeCompany, setActiveCompany, companies } = useCompany();
  const [q, setQ] = useState('');
  const nav = useNavigate();
  const cartN = (getCart() || []).reduce((a, c) => a + (c.qty || 0), 0);

  const submit = (e) => {
    e.preventDefault();
    nav('/store/listing' + (q ? '?q=' + encodeURIComponent(q) : ''));
  };

  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === '/' && document.activeElement.tagName !== 'INPUT' && document.activeElement.tagName !== 'TEXTAREA') {
        e.preventDefault();
        document.getElementById('headerSearchInput')?.focus();
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, []);

  const ROLE_LABELS = {
    super_admin: 'Super Admin',
    company_admin: 'Company Admin',
    content_writer: 'Content Writer',
    finance: 'Finance',
    sales_regional_partner: 'Regional Partner (+10%)',
    sales_channel_partner: 'Channel Partner (+15%)',
    sales_referral_partner: 'Referral Partner (+5%)',
    sales_user: 'Sales'
  };
  const roleLabel = me?.salesTier ? `${me.salesTier} (+${me.markupPct || 0}%)` : (ROLE_LABELS[me?.role] || 'Sales');

  return (
    <header ref={ref} className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-xs w-full">
      <div className="bg-slate-900 text-slate-300 text-[11px] font-medium py-1.5 px-4 sm:px-6 border-b border-slate-800 flex items-center justify-between w-full">
        <div className="flex items-center gap-2 truncate">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span className="font-bold text-white">ARGUSCNC ERP</span>
          <span className="hidden sm:inline text-slate-500">•</span>
          <span className="hidden sm:inline truncate">Precision Manufacturing & Industrial Procurement</span>
        </div>
        <div className="flex items-center gap-3 text-[11px] text-slate-400 font-medium">
          {me?.salesTier || (me?.markupPct !== undefined && me?.markupPct > 0) ? (
            <span className="text-emerald-300 font-bold uppercase tracking-wider bg-emerald-950/80 border border-emerald-700/80 px-2.5 py-0.5 rounded-full flex items-center gap-1.5">
              <span>🏷️</span>
              <span>{me.salesTier || 'Partner Tier'} (+{me.markupPct || 0}%)</span>
            </span>
          ) : (
            <span className="text-orange-400 font-bold uppercase tracking-wider">GST Verified</span>
          )}
          <span>•</span>
          <span className="text-slate-300">{me?.name || 'Argus Enterprise'}</span>
        </div>
      </div>

      <div className="w-full px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onMobileToggle}
            className="lg:hidden p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
            aria-label="Toggle menu"
          >
            <Menu className="w-5 h-5" />
          </button>

          <Link to="/store/home" className="flex items-center gap-2 group flex-shrink-0">
            <img src="assets/argus-logo.png" alt="ARGUSCNC" className="h-8 w-auto object-contain transition-transform group-hover:scale-105 duration-200" />
          </Link>

          {!noSide && (
            <button
              type="button"
              onClick={onToggleSidebar}
              title={sidebarOpen ? "Collapse sidebar to Full Page view" : "Expand sidebar with full labels"}
              className={`hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-xl border transition-all text-xs font-bold cursor-pointer ml-2 shadow-xs ${
                !sidebarOpen
                  ? 'bg-blue-600 text-white border-blue-600 hover:bg-blue-700'
                  : 'bg-white border-slate-200/80 text-slate-700 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              {!sidebarOpen ? (
                <>
                  <Maximize2 className="w-4 h-4 text-white" />
                  <span className="hidden xl:inline">Full Page View</span>
                </>
              ) : (
                <>
                  <PanelLeftClose className="w-4 h-4 text-slate-500" />
                  <span className="hidden xl:inline">Full Page</span>
                </>
              )}
            </button>
          )}
        </div>

        <form onSubmit={submit} className="flex-1 max-w-2xl hidden md:flex items-center relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 pointer-events-none" />
          <input
            id="headerSearchInput"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search SKU, part number, brand, industrial tooling..."
            className="w-full pl-10 pr-12 py-2 text-xs bg-slate-100/80 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white transition-all text-slate-800 placeholder-slate-400"
          />
          <kbd className="absolute right-3 px-1.5 py-0.5 text-[10px] font-mono font-semibold text-slate-400 bg-white border border-slate-200 rounded-md pointer-events-none shadow-xs">/</kbd>
        </form>

        <div className="flex items-center gap-2.5 sm:gap-3.5 flex-shrink-0">
          {/* Global Company Selector for Super Admin */}
          {me?.role === 'super_admin' && (
            <div className="flex items-center gap-1.5 px-3 py-1 bg-gradient-to-r from-sky-50 via-blue-50 to-indigo-50 border border-sky-200/90 hover:border-sky-300 rounded-full shadow-2xs transition-all">
              <Building2 className="w-3.5 h-3.5 text-sky-600 flex-shrink-0" />
              <select
                value={activeCompany}
                onChange={(e) => setActiveCompany(e.target.value)}
                className="bg-transparent text-xs font-bold text-slate-800 outline-none cursor-pointer py-0.5 pr-1 max-w-[160px] sm:max-w-[200px] truncate"
                title="Filter active company scope across Super Admin pages"
              >
                <option value="all">🏢 All Companies (Platform)</option>
                {companies.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.logo || '🏭'} {c.name} ({c.code || c.id})
                  </option>
                ))}
              </select>
            </div>
          )}

          {me && me.google ? (
            <Link
              to="/store/profile"
              className="hidden sm:flex items-center gap-2 bg-slate-100 hover:bg-slate-200/80 px-3 py-1.5 rounded-full border border-slate-200 transition-colors cursor-pointer"
              title="View Profile"
            >
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span className="text-xs font-bold text-slate-800 truncate max-w-[140px]">{me.name}</span>
              <span className="text-[10px] uppercase font-extrabold text-blue-600 tracking-wider">({roleLabel})</span>
            </Link>
          ) : (
            <div className="hidden xl:flex items-center gap-1 p-1 bg-slate-100/90 rounded-full border border-slate-200/80 text-[11px] font-bold flex-wrap shadow-2xs">
              <button
                type="button"
                onClick={() => loginAs('super_admin')}
                className={`px-2.5 py-1 rounded-full transition-all cursor-pointer ${me?.role === 'super_admin' ? 'bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white shadow-xs shadow-indigo-950/40 ring-1 ring-white/20' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'}`}
              >
                Super
              </button>
              <button
                type="button"
                onClick={() => loginAs('company_admin')}
                className={`px-2.5 py-1 rounded-full transition-all cursor-pointer ${me?.role === 'company_admin' ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-xs shadow-blue-500/30' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'}`}
              >
                Admin
              </button>
              <button
                type="button"
                onClick={() => loginAs('content_writer')}
                className={`px-2.5 py-1 rounded-full transition-all cursor-pointer ${me?.role === 'content_writer' ? 'bg-gradient-to-r from-fuchsia-600 to-pink-600 text-white shadow-xs shadow-fuchsia-500/30' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'}`}
              >
                Content
              </button>
              <button
                type="button"
                onClick={() => loginAs('finance')}
                className={`px-2.5 py-1 rounded-full transition-all cursor-pointer ${me?.role === 'finance' ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-xs shadow-emerald-500/30' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'}`}
              >
                Finance
              </button>
              <button
                type="button"
                onClick={() => loginAs('sales_regional_partner')}
                className={`px-2.5 py-1 rounded-full transition-all cursor-pointer ${me?.role === 'sales_regional_partner' ? 'bg-gradient-to-r from-teal-600 to-cyan-600 text-white shadow-xs shadow-teal-500/30' : 'text-teal-700 hover:bg-teal-50'}`}
                title="Regional Partner (+10% Pricing)"
              >
                Regional (+10%)
              </button>
              <button
                type="button"
                onClick={() => loginAs('sales_channel_partner')}
                className={`px-2.5 py-1 rounded-full transition-all cursor-pointer ${me?.role === 'sales_channel_partner' ? 'bg-gradient-to-r from-purple-600 to-violet-600 text-white shadow-xs shadow-purple-500/30' : 'text-purple-700 hover:bg-purple-50'}`}
                title="Channel Partner (+15% Pricing)"
              >
                Channel (+15%)
              </button>
              <button
                type="button"
                onClick={() => loginAs('sales_referral_partner')}
                className={`px-2.5 py-1 rounded-full transition-all cursor-pointer ${me?.role === 'sales_referral_partner' ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-xs shadow-cyan-500/30' : 'text-cyan-700 hover:bg-cyan-50'}`}
                title="Referral Partner (+5% Pricing)"
              >
                Referral (+5%)
              </button>
              <button
                type="button"
                onClick={() => loginAs('sales_user')}
                className={`px-2.5 py-1 rounded-full transition-all cursor-pointer ${me?.role === 'sales_user' ? 'bg-gradient-to-r from-orange-600 to-amber-600 text-white shadow-xs shadow-orange-500/30' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'}`}
                title="Direct Sales (Base Price)"
              >
                Direct Sales
              </button>
            </div>
          )}

          <Link
            to="/store/cart"
            className="relative p-2.5 rounded-xl border border-slate-200/90 bg-white hover:bg-slate-50 text-slate-700 hover:text-slate-900 transition-all duration-200 shadow-xs group cursor-pointer"
            aria-label="Shopping Cart"
          >
            <ShoppingCart className="w-4 h-4 transition-transform group-hover:scale-110" />
            {cartN > 0 && (
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="absolute -top-1.5 -right-1.5 bg-orange-600 text-white font-extrabold text-[10px] min-w-5 h-5 rounded-full flex items-center justify-center px-1 shadow-sm border-2 border-white"
              >
                {cartN}
              </motion.span>
            )}
          </Link>

          <Link
            to="/store/profile"
            className="p-2.5 rounded-xl border border-slate-200/90 bg-white hover:bg-slate-50 text-slate-700 hover:text-blue-600 transition-all duration-200 shadow-xs cursor-pointer group"
            title={me?.name ? `${me.name} (${roleLabel}) — User Profile` : 'User Profile'}
            aria-label="User Profile"
          >
            <User className="w-4 h-4 transition-transform group-hover:scale-110" />
          </Link>

          <button
            type="button"
            onClick={() => { logout(); nav('/login'); }}
            className="p-2.5 rounded-xl text-slate-500 hover:text-rose-600 hover:bg-rose-50 border border-slate-200/60 transition-colors cursor-pointer"
            title="Sign Out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
});

export function Shell({ counts, noSide, children }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(() => {
    try {
      const saved = localStorage.getItem('cncforge_sidebar_open');
      return saved !== null ? saved === 'true' : true;
    } catch { return true; }
  });
  const location = useLocation();
  const headerRef = useRef(null);
  const [headerH, setHeaderH] = useState(93);

  const toggleSidebar = () => {
    setSidebarOpen((prev) => {
      const next = !prev;
      try { localStorage.setItem('cncforge_sidebar_open', String(next)); } catch {}
      return next;
    });
  };

  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (!headerRef.current) return;
    const update = () => {
      if (headerRef.current) setHeaderH(headerRef.current.offsetHeight);
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(headerRef.current);
    return () => ro.disconnect();
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-slate-50/60 text-slate-900 font-sans w-full">
      <Topbar 
        ref={headerRef}
        onMobileToggle={() => setMobileOpen(true)} 
        sidebarOpen={sidebarOpen}
        onToggleSidebar={toggleSidebar}
        noSide={noSide}
      />

      <div className="flex-1 flex w-full min-h-0 items-stretch">
        {!noSide && (
          <aside 
            style={{ top: `${headerH}px`, height: `calc(100vh - ${headerH}px)` }}
            className={`hidden lg:flex flex-col flex-shrink-0 bg-white border-r border-slate-200/80 sticky self-start overflow-y-auto transition-all duration-200 z-30 ${
              sidebarOpen ? 'w-64 p-3' : 'w-14 p-1.5 items-center'
            }`}
          >
            <Sidebar counts={counts} mini={!sidebarOpen} />
          </aside>
        )}

        <div className="flex-1 min-w-0 flex flex-col justify-between w-full bg-gradient-to-b from-slate-50/50 via-white to-slate-50/70">
          <main className="w-full flex-1 p-4 sm:p-6 lg:p-6">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 8, scale: 0.998 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
              className="w-full"
            >
              {children}
            </motion.div>
          </main>

          <footer className="border-t border-slate-200 bg-white py-5 text-xs text-slate-500 w-full mt-auto">
            <div className="w-full px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
              <div>
                <span className="font-bold text-slate-800">ARGUSCNC ERP Industrial Procurement</span> • Connected B2B Factory Platform
              </div>
              <div className="flex items-center gap-4 text-slate-400 font-medium">
                <span>Multi-Tenant Architecture</span>
                <span>•</span>
                <span>Encrypted Cloud Storage</span>
              </div>
            </div>
          </footer>
        </div>
      </div>

      <AnimatePresence>
        {mobileOpen && (
          <div className="fixed inset-0 z-50 lg:hidden">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileOpen(false)}
              className="fixed inset-0 bg-slate-950/60"
            />
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 250 }}
              className="fixed inset-y-0 left-0 w-72 bg-white shadow-2xl p-4 flex flex-col z-10 overflow-y-auto"
            >
              <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-2">
                <img src="assets/argus-logo.png" alt="ARGUSCNC" className="h-7 w-auto" />
                <button
                  type="button"
                  onClick={() => setMobileOpen(false)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <Sidebar counts={counts} onItemClick={() => setMobileOpen(false)} />
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
