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
  const activeClass = theme?.gradient
    ? `bg-gradient-to-r ${theme.gradient} text-white font-bold border-white/20 shadow-sm ${theme.glow || 'shadow-orange-500/25'}`
    : 'bg-gradient-to-r from-orange-600 to-amber-600 text-white font-bold border-orange-400/40 shadow-sm shadow-orange-500/25';
  const indicatorColor = theme?.indicator || 'bg-orange-500';
  const activeIconColor = 'text-white';
  const badgeClass = 'bg-white/25 text-white backdrop-blur-xs border border-white/20';

  return (
    <NavLink
      key={to}
      to={to}
      onClick={onClick}
      title={label}
      className={({ isActive }) => `
        group relative flex items-center ${mini ? 'justify-center p-2 w-9 h-9 mx-auto' : 'gap-2.5 px-2.5 py-1.5'} rounded-lg text-xs font-semibold transition-all duration-150
        ${isActive 
          ? `${activeClass} font-bold border` 
          : 'text-[#D7C4B7] hover:text-white hover:bg-[#22120A]/90'}
      `}
    >
      {({ isActive }) => (
        <>
          {isActive && (
            <motion.span
              layoutId="activeIndicator"
              className={`absolute left-0 top-1.5 bottom-1.5 w-1 rounded-r-full shadow-xs ${indicatorColor}`}
              transition={{ type: 'spring', stiffness: 380, damping: 30 }}
            />
          )}
          <span className={`p-0.5 rounded-md transition-colors ${
            isActive 
              ? `${activeIconColor} bg-white/20 shadow-2xs` 
              : 'text-[#B89F8F] group-hover:text-amber-300 group-hover:bg-[#32170D]'
          }`}>
            {IconComponent && <IconComponent className="w-4 h-4 flex-shrink-0" />}
          </span>
          {!mini && (
            <span className={`truncate flex-1 tracking-tight font-semibold ${
              isActive ? '!text-white' : 'text-[#E8DDD5] group-hover:!text-white'
            }`}>
              {label}
            </span>
          )}
          {!mini && badge ? (
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold tracking-wide ${isActive ? badgeClass : 'bg-[#170A04] text-[#D7C4B7] border border-[#36180C]'}`}>
              {badge}
            </span>
          ) : mini && badge ? (
            <span className={`absolute top-1 right-1 w-2.5 h-2.5 rounded-full ${indicatorColor} ring-2 ring-[#0E0704]`} />
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
    const globalDisabled = me && me.globalDisabledMenus;
    if (Array.isArray(globalDisabled) && globalDisabled.includes(pageId)) {
      if (!(role === 'super_admin' && pageId === 'super_access')) {
        return false;
      }
    }
    if (Array.isArray(effective)) {
      return effective.includes(pageId);
    }
    const page = getPageById(pageId);
    if (!page) return false;
    const userRole = role || 'sales_user';
    return (page.defaultRoles || []).includes(userRole) || (userRole.startsWith('sales_') && (page.defaultRoles || []).includes('sales_user'));
  };

  // Filter categories to only those with at least 1 visible page (exclude browse_categories from standard list since it has dedicated section below)
  const activeCategories = MENU_CATALOG.filter(cat => cat.id !== 'browse_categories').map(cat => ({
    ...cat,
    items: cat.items.filter(item => hasPermission(item.id))
  })).filter(cat => cat.items.length > 0);

  // Dynamic category check: a category is visible if user has permission for cat_<id>
  const isCatPermitted = (c) => {
    if (!c || !c.id) return false;
    const permId = `cat_${c.id.replace(/-/g, '_')}`;
    return hasPermission(permId);
  };

  const catalogCatModule = MENU_CATALOG.find(c => c.id === 'browse_categories');
  const fallbackCats = (catalogCatModule?.items || []).map(i => ({
    id: i.categorySlug,
    name: i.label,
    icon: i.emoji
  }));
  const allCats = (counts?.cats && counts.cats.length > 0) ? counts.cats : fallbackCats;
  const permittedCats = allCats.filter(isCatPermitted);
  const showCategories = permittedCats.length > 0;

  return (
    <div className={`w-full flex flex-col ${mini ? 'gap-1 py-0.5 items-center' : 'gap-2 py-0.5'}`}>
      {activeCategories.map((cat, idx) => (
        <div key={cat.id} className="w-full">
          {idx > 0 && mini && <div className="w-8 border-t border-[#26140B] my-1 mx-auto" />}
          <div>
            {!mini && (
              <div className="flex items-center gap-1.5 px-3 mb-1 mt-1.5 first:mt-0">
                <span className={`w-1.5 h-1.5 rounded-full ${cat.dotClass || 'bg-amber-600'}`} />
                <span className="text-[10px] font-black uppercase tracking-wider text-[#A88E7D] truncate">
                  {role === 'company_admin' && cat.id === 'operations' ? `${companyTitle} • ${cat.label}` : cat.label}
                </span>
              </div>
            )}
            <div className={mini ? 'flex flex-col gap-0.5 items-center' : 'space-y-0.5'}>
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
        <div className="mt-2 p-2.5 rounded-xl bg-[#180A04]/95 border border-[#36180C]/95">
          <div className="text-[10px] font-extrabold uppercase tracking-widest text-amber-400 mb-1">GUIDANCE</div>
          <p className="text-[11px] leading-relaxed text-[#D7C4B7]">
            Products arrive here automatically from ERP Inventory. Write sales copy, attach media, then
            <span className="font-bold text-white"> Submit to Finance</span> for pricing.
          </p>
        </div>
      )}

      {!mini && role === 'finance' && hasPermission('finance_review') && !hasPermission('admin_products') && (
        <div className="mt-2 p-2.5 rounded-xl bg-[#180A04]/95 border border-[#36180C]/95">
          <div className="text-[10px] font-extrabold uppercase tracking-widest text-teal-400 mb-1">GUIDANCE</div>
          <p className="text-[11px] leading-relaxed text-[#D7C4B7]">
            Review submitted content, set the selling price, then
            <span className="font-bold text-white"> Approve &amp; Publish</span> to make the listing visible.
          </p>
        </div>
      )}

      {/* Dynamic Browse Categories governed by dynamic permissions */}
      {showCategories && (
        <div className="w-full">
          {mini && <div className="w-8 border-t border-[#26140B] my-1 mx-auto" />}
          <div>
            {!mini && <div className="text-[10px] font-black uppercase tracking-wider text-[#A88E7D] px-3 mb-1 mt-1.5">BROWSE CATEGORIES</div>}
            <div className={mini ? 'flex flex-col gap-0.5 items-center' : 'space-y-0.5'}>
              {permittedCats.map((c) => (
                <NavLink
                  key={c.id}
                  to={'/store/listing?cat=' + c.id}
                  onClick={onItemClick}
                  title={c.name}
                  className={({ isActive }) => `
                    flex items-center ${mini ? 'justify-center w-9 h-9 p-1.5' : 'gap-2.5 px-2.5 py-1.5'} rounded-lg text-xs font-semibold transition-all
                    ${isActive ? 'bg-gradient-to-r from-[#3A1E0F] to-[#5C3018] text-white font-bold shadow-xs border border-[#7A3E1E]/50' : 'text-[#D7C4B7] hover:text-white hover:bg-[#22120A]/90'}
                  `}
                >
                  {({ isActive }) => (
                    <>
                      <span className="text-sm flex-shrink-0">{c.icon || '📦'}</span>
                      {!mini && (
                        <span className={`truncate flex-1 tracking-tight font-semibold ${
                          isActive ? '!text-white' : 'text-[#E8DDD5] group-hover:!text-white'
                        }`}>
                          {c.name}
                        </span>
                      )}
                    </>
                  )}
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
    <header ref={ref} className="sticky top-0 z-50 bg-[#0E0704] backdrop-blur-md border-b border-[#26140B] shadow-md shadow-black/40 w-full text-stone-100">
      <div className="w-full px-3 sm:px-5 h-15 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 flex-shrink-0">
          <button
            type="button"
            onClick={onMobileToggle}
            className="lg:hidden p-2 rounded-xl text-[#A89080] hover:text-white hover:bg-[#22120A] transition-colors cursor-pointer"
            aria-label="Toggle menu"
          >
            <Menu className="w-5 h-5" />
          </button>

          <Link to="/store/home" className="flex items-center gap-2 group flex-shrink-0 bg-white keep-white px-3 py-1.5 rounded-xl shadow-xs border border-white/20 transition-transform hover:scale-105 duration-200">
            <img src="assets/argus-logo.png" alt="ARGUSCNC" className="h-7 sm:h-8 w-auto object-contain" />
          </Link>

          {!noSide && (
            <button
              type="button"
              onClick={onToggleSidebar}
              title={sidebarOpen ? "Collapse sidebar to Full Page view" : "Expand sidebar with full labels"}
              className={`hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-xl border transition-all text-xs font-bold cursor-pointer shadow-xs ml-3 sm:ml-4 ${
                !sidebarOpen
                  ? 'bg-gradient-to-r from-orange-500 to-amber-600 text-white border-orange-500 hover:from-orange-600 hover:to-amber-700 shadow-sm shadow-orange-500/30'
                  : 'bg-[#180A04]/90 border-[#36180C]/80 text-[#D7C4B7] hover:bg-[#22120A] hover:text-white'
              }`}
            >
              {!sidebarOpen ? (
                <>
                  <Maximize2 className="w-3.5 h-3.5 text-white" />
                  <span className="hidden xl:inline">Full Page View</span>
                </>
              ) : (
                <>
                  <PanelLeftClose className="w-3.5 h-3.5 text-[#A89080]" />
                  <span className="hidden xl:inline">Full Page</span>
                </>
              )}
            </button>
          )}
        </div>

        <form onSubmit={submit} className="flex-1 max-w-xl hidden md:flex items-center relative">
          <Search className="w-4 h-4 text-[#A89080] absolute left-3.5 pointer-events-none" />
          <input
            id="headerSearchInput"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search SKU, part number, brand, industrial tooling..."
            className="w-full pl-9 pr-10 py-1.5 text-xs bg-[#150A05] border border-[#2C160B] rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-600 transition-all text-stone-100 placeholder-[#9E8676]"
          />
          <kbd className="absolute right-3 px-1.5 py-0.5 text-[10px] font-mono font-semibold text-[#A89080] bg-[#241007] border border-[#36180C] rounded-md pointer-events-none shadow-xs">/</kbd>
        </form>

        <div className="flex items-center gap-2 sm:gap-2.5 flex-shrink-0">
          {/* Global Company Selector for Super Admin */}
          {me?.role === 'super_admin' && (
            <div className="flex items-center gap-1.5 px-2.5 py-1 bg-[#150A05] border border-[#2C160B] hover:border-amber-600/50 rounded-xl shadow-xs transition-colors">
              <Building2 className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" />
              <select
                value={activeCompany}
                onChange={(e) => setActiveCompany(e.target.value)}
                className="company-select bg-[#150A05] text-xs font-bold text-stone-100 outline-none cursor-pointer border-none py-0.5 pr-1 max-w-[150px] sm:max-w-[185px] truncate"
                title="Filter active company scope across Super Admin pages"
              >
                <option value="all" className="bg-[#0E0704] text-stone-100">🏢 All Companies (Platform)</option>
                {companies.map((c) => (
                  <option key={c.id} value={c.id} className="bg-[#0E0704] text-stone-100">
                    {c.logo || '🏭'} {c.name} ({c.code || c.id})
                  </option>
                ))}
              </select>
            </div>
          )}

          {me && (
            <Link
              to="/store/profile"
              className="hidden sm:flex items-center gap-2 bg-[#150A05] hover:bg-[#22120A] px-2.5 py-1 rounded-xl border border-[#2C160B] transition-colors cursor-pointer"
              title="View Profile"
            >
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-xs font-bold text-[#E8DDD5] truncate max-w-[130px]">{me.name}</span>
              <span className="text-[10px] uppercase font-extrabold text-amber-400 bg-amber-950/60 border border-amber-800/60 px-1.5 py-0.5 rounded-md tracking-wider">
                {roleLabel}
              </span>
            </Link>
          )}

          {(!me || !me.google) && (
            <div className="hidden 2xl:flex items-center gap-1 p-0.5 bg-[#150A05] rounded-xl border border-[#2C160B] text-[11px] font-bold">
              <button
                type="button"
                onClick={() => loginAs('super_admin')}
                className={`px-2 py-0.5 rounded-lg transition-all cursor-pointer ${me?.role === 'super_admin' ? 'bg-[#6B3519] text-white shadow-xs font-black' : 'text-[#A89080] hover:text-white'}`}
              >
                Super
              </button>
              <button
                type="button"
                onClick={() => loginAs('company_admin')}
                className={`px-2 py-0.5 rounded-lg transition-all cursor-pointer ${me?.role === 'company_admin' ? 'bg-[#542812] text-white shadow-xs font-black' : 'text-[#A89080] hover:text-white'}`}
              >
                Admin
              </button>
              <button
                type="button"
                onClick={() => loginAs('content_writer')}
                className={`px-2 py-0.5 rounded-lg transition-all cursor-pointer ${me?.role === 'content_writer' ? 'bg-fuchsia-600 text-white shadow-xs' : 'text-[#A89080] hover:text-white'}`}
              >
                Content
              </button>
              <button
                type="button"
                onClick={() => loginAs('finance')}
                className={`px-2 py-0.5 rounded-lg transition-all cursor-pointer ${me?.role === 'finance' ? 'bg-teal-600 text-white shadow-xs' : 'text-[#A89080] hover:text-white'}`}
              >
                Finance
              </button>
              <button
                type="button"
                onClick={() => loginAs('sales_user')}
                className={`px-2 py-0.5 rounded-lg transition-all cursor-pointer ${me?.role === 'sales_user' ? 'bg-amber-600 text-white shadow-xs' : 'text-[#A89080] hover:text-white'}`}
              >
                Sales
              </button>
            </div>
          )}

          <Link
            to="/store/cart"
            className="relative p-2 rounded-xl border border-[#2C160B] bg-[#150A05] hover:bg-[#22120A] text-[#D7C4B7] hover:text-amber-400 transition-all duration-200 shadow-xs group cursor-pointer"
            aria-label="Shopping Cart"
          >
            <ShoppingCart className="w-4 h-4 transition-transform group-hover:scale-110" />
            {cartN > 0 && (
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="absolute -top-1.5 -right-1.5 bg-orange-600 text-white font-extrabold text-[10px] min-w-4 h-4 rounded-full flex items-center justify-center px-1 shadow-sm border border-[#0E0704]"
              >
                {cartN}
              </motion.span>
            )}
          </Link>

          <Link
            to="/store/profile"
            className="p-2 rounded-xl border border-[#2C160B] bg-[#150A05] hover:bg-[#22120A] text-[#D7C4B7] hover:text-amber-400 transition-all duration-200 shadow-xs cursor-pointer group"
            title={me?.name ? `${me.name} (${roleLabel}) — User Profile` : 'User Profile'}
            aria-label="User Profile"
          >
            <User className="w-4 h-4 transition-transform group-hover:scale-110" />
          </Link>

          <button
            type="button"
            onClick={() => { logout(); nav('/login'); }}
            className="p-2 rounded-xl text-[#B89F8F] hover:text-rose-400 hover:bg-rose-950/40 border border-[#2C160B] transition-colors cursor-pointer"
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
  const [headerH, setHeaderH] = useState(56);

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
    <div className="min-h-screen flex flex-col bg-[#DAC8B8] text-[#1A0A03] font-sans w-full">
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
            className={`hidden lg:flex flex-col flex-shrink-0 bg-[#0E0704] border-r border-[#26140B] sticky self-start overflow-y-auto sidebar-scroll sidebar-dark text-[#E8DDD5] transition-all duration-200 z-30 shadow-md ${
              sidebarOpen ? 'w-64 px-2 py-2.5' : 'w-14 p-1.5 items-center'
            }`}
          >
            <Sidebar counts={counts} mini={!sidebarOpen} />
          </aside>
        )}

        <div className="flex-1 min-w-0 flex flex-col justify-between w-full transition-colors duration-200 bg-[#DAC8B8]">
          <main className="w-full flex-1 px-3 py-2 sm:px-4 sm:py-2.5 lg:px-4 lg:py-2.5">
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

          <footer className="border-t border-[#26140B] bg-[#0E0704] py-4 text-xs text-[#A89080] w-full mt-auto">
            <div className="w-full px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
              <div>
                <span className="font-bold text-white">ARGUSCNC ERP Industrial Procurement</span> • Connected B2B Factory Platform
              </div>
              <div className="flex items-center gap-4 text-[#A89080] font-medium">
                <span className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-pulse"></span>Multi-Tenant Architecture</span>
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
              className="fixed inset-0 bg-black/75"
            />
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 250 }}
              className="fixed inset-y-0 left-0 w-72 bg-[#0E0704] border-r border-[#26140B] shadow-2xl p-4 flex flex-col z-10 overflow-y-auto sidebar-scroll sidebar-dark text-[#E8DDD5]"
            >
              <div className="flex items-center justify-between pb-4 border-b border-[#26140B] mb-2">
                <div className="bg-white keep-white px-2 py-1 rounded-lg">
                  <img src="assets/argus-logo.png" alt="ARGUSCNC" className="h-6 w-auto" />
                </div>
                <button
                  type="button"
                  onClick={() => setMobileOpen(false)}
                  className="p-1.5 rounded-lg text-[#A89080] hover:text-white hover:bg-[#22120A]"
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
