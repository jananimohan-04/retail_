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
import { getCart } from './api';

function sideLink(to, label, IconComponent, badge = null, onClick = null, mini = false) {
  return (
    <NavLink
      key={to}
      to={to}
      onClick={onClick}
      title={label}
      className={({ isActive }) => `
        group relative flex items-center ${mini ? 'justify-center p-2.5 w-10 h-10 mx-auto' : 'gap-3 px-3.5 py-2.5'} rounded-xl text-xs font-semibold transition-all duration-200
        ${isActive 
          ? 'bg-blue-50 text-blue-700 font-bold border border-blue-200/60 shadow-xs' 
          : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'}
      `}
    >
      {({ isActive }) => (
        <>
          {isActive && (
            <motion.span
              layoutId="activeIndicator"
              className="absolute left-0 top-2 bottom-2 w-1 bg-orange-500 rounded-r-full"
              transition={{ type: 'spring', stiffness: 350, damping: 30 }}
            />
          )}
          <span className={`transition-colors ${isActive ? 'text-blue-600' : 'text-slate-400 group-hover:text-slate-600'}`}>
            {IconComponent && <IconComponent className="w-4 h-4 flex-shrink-0" />}
          </span>
          {!mini && <span className="truncate flex-1">{label}</span>}
          {!mini && badge ? (
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold tracking-wide ${isActive ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-700'}`}>
              {badge}
            </span>
          ) : mini && badge ? (
            <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-orange-500" />
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

  if (role === 'super_admin') {
    return (
      <div className={`w-full flex flex-col ${mini ? 'gap-1.5 py-1 items-center' : 'gap-5 py-2'}`}>
        <div>
          {!mini && <div className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400 px-3.5 mb-1.5">OVERVIEW</div>}
          {sideLink('/super/dashboard', 'Platform Dashboard', LayoutDashboard, null, onItemClick, mini)}
        </div>
        {mini && <div className="w-8 border-t border-slate-100 my-0.5" />}
        <div>
          {!mini && <div className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400 px-3.5 mb-1.5">ORGANIZATIONS</div>}
          {sideLink('/super/companies', 'Company Hub', Building2, null, onItemClick, mini)}
        </div>
        {mini && <div className="w-8 border-t border-slate-100 my-0.5" />}
        <div className={mini ? 'flex flex-col gap-1' : ''}>
          {!mini && <div className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400 px-3.5 mb-1.5">GLOBAL CATALOG</div>}
          {sideLink('/super/catalog', 'Master Catalog', Boxes, null, onItemClick, mini)}
          {sideLink('/super/categories', 'Categories', FolderTree, null, onItemClick, mini)}
          {sideLink('/super/media', 'Product Media', ImageIcon, null, onItemClick, mini)}
        </div>
        {mini && <div className="w-8 border-t border-slate-100 my-0.5" />}
        <div className={mini ? 'flex flex-col gap-1' : ''}>
          {!mini && <div className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400 px-3.5 mb-1.5">COMMERCE</div>}
          {sideLink('/super/orders', 'Platform Orders', Receipt, null, onItemClick, mini)}
          {sideLink('/super/quotes', 'RFQ Quotations', FileText, null, onItemClick, mini)}
        </div>
        {mini && <div className="w-8 border-t border-slate-100 my-0.5" />}
        <div className={mini ? 'flex flex-col gap-1' : ''}>
          {!mini && <div className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400 px-3.5 mb-1.5">GOVERNANCE</div>}
          {sideLink('/super/settings', 'Global Settings', Settings, null, onItemClick, mini)}
          {sideLink('/super/audit', 'Audit Logs', ShieldCheck, null, onItemClick, mini)}
        </div>
        {mini && <div className="w-8 border-t border-slate-100 my-0.5" />}
        <div className={mini ? 'flex flex-col gap-1' : ''}>
          {!mini && <div className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400 px-3.5 mb-1.5">PUBLISHING</div>}
          {sideLink('/content', 'Content Writer', PenLine, null, onItemClick, mini)}
          {sideLink('/finance', 'Finance Review', IndianRupee, null, onItemClick, mini)}
        </div>
        {mini && <div className="w-8 border-t border-slate-100 my-0.5" />}
        <div>
          {!mini && <div className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400 px-3.5 mb-1.5">STOREFRONT</div>}
          {sideLink('/store/home', 'View Storefront', Store, null, onItemClick, mini)}
        </div>
      </div>
    );
  }

  if (role === 'company_admin') {
    return (
      <div className={`w-full flex flex-col ${mini ? 'gap-1.5 py-1 items-center' : 'gap-5 py-2'}`}>
        <div className={mini ? 'flex flex-col gap-1' : ''}>
          {!mini && (
            <div className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400 px-3.5 mb-1.5">
              {companyTitle} • OPERATIONS
            </div>
          )}
          {sideLink('/admin/dashboard', 'Dashboard', LayoutDashboard, null, onItemClick, mini)}
          {sideLink('/admin/products', 'Industrial Catalog', Boxes, null, onItemClick, mini)}
          {sideLink('/admin/media', 'Product Media', ImageIcon, null, onItemClick, mini)}
          {sideLink('/admin/categories', 'Custom Categories', FolderTree, null, onItemClick, mini)}
          {sideLink('/admin/users', 'Sales Representatives', User, null, onItemClick, mini)}
          {sideLink('/admin/orders', 'Customer Orders', Receipt, counts?.pendingOrders || '', onItemClick, mini)}
          {sideLink('/admin/quotes', 'RFQ Inquiries', FileText, counts?.openQuotes || '', onItemClick, mini)}
          {sideLink('/admin/settings', 'Store Settings', Settings, null, onItemClick, mini)}
        </div>
        {mini && <div className="w-8 border-t border-slate-100 my-0.5" />}
        <div className={mini ? 'flex flex-col gap-1' : ''}>
          {!mini && <div className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400 px-3.5 mb-1.5">PUBLISHING</div>}
          {sideLink('/content', 'Content Writer', PenLine, null, onItemClick, mini)}
          {sideLink('/finance', 'Finance Review', IndianRupee, null, onItemClick, mini)}
        </div>
        {mini && <div className="w-8 border-t border-slate-100 my-0.5" />}
        <div>
          {!mini && <div className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400 px-3.5 mb-1.5">STOREFRONT</div>}
          {sideLink('/store/home', 'Live Store', Store, null, onItemClick, mini)}
        </div>
      </div>
    );
  }

  if (role === 'content_writer') {
    return (
      <div className={`w-full flex flex-col ${mini ? 'gap-1.5 py-1 items-center' : 'gap-5 py-2'}`}>
        <div>
          {!mini && (
            <div className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400 px-3.5 mb-1.5">
              {companyTitle} • CONTENT
            </div>
          )}
          {sideLink('/content', 'Content Queue', PenLine, counts?.pendingContent || '', onItemClick, mini)}
        </div>
        {!mini && (
          <div>
            <div className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400 px-3.5 mb-1.5">GUIDANCE</div>
            <p className="px-3.5 text-[11px] leading-relaxed text-slate-500">
              Products arrive here automatically from ERP Inventory. Write the sales copy, attach media, then
              <span className="font-bold text-slate-700"> Submit to Finance</span> for pricing.
            </p>
          </div>
        )}
      </div>
    );
  }

  if (role === 'finance') {
    return (
      <div className={`w-full flex flex-col ${mini ? 'gap-1.5 py-1 items-center' : 'gap-5 py-2'}`}>
        <div>
          {!mini && (
            <div className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400 px-3.5 mb-1.5">
              {companyTitle} • FINANCE
            </div>
          )}
          {sideLink('/finance', 'Review & Pricing', IndianRupee, counts?.financeQueue || '', onItemClick, mini)}
        </div>
        {!mini && (
          <div>
            <div className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400 px-3.5 mb-1.5">GUIDANCE</div>
            <p className="px-3.5 text-[11px] leading-relaxed text-slate-500">
              Review submitted content, set the selling price, then
              <span className="font-bold text-slate-700"> Approve &amp; Publish</span> to make the listing visible to Salespeople.
            </p>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={`w-full flex flex-col ${mini ? 'gap-1.5 py-1 items-center' : 'gap-5 py-2'}`}>
      <div className={mini ? 'flex flex-col gap-1' : ''}>
        {!mini && <div className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400 px-3.5 mb-1.5">INDUSTRIAL STORE</div>}
        {sideLink('/store/home', 'Home', Home, null, onItemClick, mini)}
        {sideLink('/store/listing', 'All Products', Boxes, null, onItemClick, mini)}
        {sideLink('/store/cart', 'My Cart', ShoppingCart, counts?.cart || '', onItemClick, mini)}
        {sideLink('/store/quotes', 'My Quotations', FileText, counts?.openQuotes || '', onItemClick, mini)}
        {sideLink('/store/orders', 'My Orders', Package, null, onItemClick, mini)}
        {sideLink('/store/profile', 'My Profile', User, null, onItemClick, mini)}
      </div>
      {mini && <div className="w-8 border-t border-slate-100 my-0.5" />}
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
  );
}

export const Topbar = forwardRef(function Topbar({ onMobileToggle, sidebarOpen, onToggleSidebar, noSide }, ref) {
  const { me, loginAs, logout } = useAuth();
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
          {me && me.google ? (
            <div className="hidden sm:flex items-center gap-2 bg-slate-100 px-3 py-1.5 rounded-full border border-slate-200">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span className="text-xs font-bold text-slate-800 truncate max-w-[140px]">{me.name}</span>
              <span className="text-[10px] uppercase font-extrabold text-blue-600 tracking-wider">({roleLabel})</span>
            </div>
          ) : (
            <div className="hidden xl:flex items-center gap-1 p-1 bg-slate-100 rounded-full border border-slate-200/80 text-[11px] font-bold flex-wrap">
              <button
                type="button"
                onClick={() => loginAs('super_admin')}
                className={`px-2 py-1 rounded-full transition-all cursor-pointer ${me?.role === 'super_admin' ? 'bg-slate-900 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'}`}
              >
                Super
              </button>
              <button
                type="button"
                onClick={() => loginAs('company_admin')}
                className={`px-2 py-1 rounded-full transition-all cursor-pointer ${me?.role === 'company_admin' ? 'bg-slate-900 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'}`}
              >
                Admin
              </button>
              <button
                type="button"
                onClick={() => loginAs('content_writer')}
                className={`px-2 py-1 rounded-full transition-all cursor-pointer ${me?.role === 'content_writer' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'}`}
              >
                Content
              </button>
              <button
                type="button"
                onClick={() => loginAs('finance')}
                className={`px-2 py-1 rounded-full transition-all cursor-pointer ${me?.role === 'finance' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'}`}
              >
                Finance
              </button>
              <button
                type="button"
                onClick={() => loginAs('sales_regional_partner')}
                className={`px-2 py-1 rounded-full transition-all cursor-pointer ${me?.role === 'sales_regional_partner' ? 'bg-emerald-600 text-white shadow-xs' : 'text-emerald-700 hover:bg-emerald-50'}`}
                title="Regional Partner (+10% Pricing)"
              >
                Regional (+10%)
              </button>
              <button
                type="button"
                onClick={() => loginAs('sales_channel_partner')}
                className={`px-2 py-1 rounded-full transition-all cursor-pointer ${me?.role === 'sales_channel_partner' ? 'bg-purple-600 text-white shadow-xs' : 'text-purple-700 hover:bg-purple-50'}`}
                title="Channel Partner (+15% Pricing)"
              >
                Channel (+15%)
              </button>
              <button
                type="button"
                onClick={() => loginAs('sales_referral_partner')}
                className={`px-2 py-1 rounded-full transition-all cursor-pointer ${me?.role === 'sales_referral_partner' ? 'bg-teal-600 text-white shadow-xs' : 'text-teal-700 hover:bg-teal-50'}`}
                title="Referral Partner (+5% Pricing)"
              >
                Referral (+5%)
              </button>
              <button
                type="button"
                onClick={() => loginAs('sales_user')}
                className={`px-2 py-1 rounded-full transition-all cursor-pointer ${me?.role === 'sales_user' ? 'bg-slate-900 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'}`}
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
            className="w-9 h-9 rounded-xl bg-slate-900 text-white flex items-center justify-center text-xs font-extrabold shadow-sm hover:ring-2 hover:ring-blue-500 hover:ring-offset-2 transition-all cursor-pointer"
            title={me?.name ? `${me.name} (${roleLabel})` : 'Profile'}
          >
            {((me?.name) || 'A')[0].toUpperCase()}
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

        <div className="flex-1 min-w-0 flex flex-col justify-between w-full">
          <main className="w-full flex-1 p-4 sm:p-6 lg:p-6">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.18, ease: 'easeOut' }}
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
