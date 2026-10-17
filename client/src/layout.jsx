/* Global shell — menus, order, labels and role visibility identical to legacy. */
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { useAuth } from './auth';
import { getCart } from './api';

function sideLink(to, label, icon, badge) {
  return (
    <NavLink key={to} to={to} className={({ isActive }) => 'side-link' + (isActive ? ' active' : '')}>
      <span>{icon}</span>{label}{badge ? <span className="dot">{badge}</span> : null}
    </NavLink>
  );
}

export function Sidebar({ counts }) {
  const { me } = useAuth();
  const role = me && me.role;
  if (role === 'super_admin') {
    return (
      <aside className="sidebar">
        <div className="side-title">OVERVIEW</div>
        {sideLink('/super/dashboard', 'Platform Dashboard', '📊')}
        <div className="side-title">COMPANY MANAGEMENT</div>
        {sideLink('/super/companies', 'Company Management', '🏢')}
        <div className="side-title">INDUSTRIAL CATALOG</div>
        {sideLink('/super/catalog', 'Global Catalog', '📦')}
        {sideLink('/super/categories', 'Categories', '🗂️')}
        {sideLink('/super/media', 'Product Media', '🖼️')}
        <div className="side-title">COMMERCE</div>
        {sideLink('/super/orders', 'All Orders', '🧾')}
        {sideLink('/super/quotes', 'Quotations', '📝')}
        <div className="side-title">PLATFORM</div>
        {sideLink('/super/settings', 'Global Settings', '⚙️')}
        {sideLink('/super/audit', 'Audit Logs', '🔍')}
        <div className="side-title">STORE</div>
        {sideLink('/store/home', 'View Storefront', '🏭')}
      </aside>
    );
  }
  if (role === 'company_admin') {
    return (
      <aside className="sidebar">
        <div className="side-title">APEX • ADMIN</div>
        {sideLink('/admin/dashboard', 'Dashboard', '📊')}
        {sideLink('/admin/products', 'Catalog', '📦')}
        {sideLink('/admin/media', 'Media', '🖼️')}
        {sideLink('/admin/categories', 'Categories', '🗂️')}
        {sideLink('/admin/users', 'Sales Users', '👥')}
        {sideLink('/admin/orders', 'Orders', '🧾', counts.pendingOrders || '')}
        {sideLink('/admin/quotes', 'Quotations', '📝', counts.openQuotes || '')}
        {sideLink('/admin/settings', 'Store Settings', '⚙️')}
        <div className="side-title">STOREFRONT</div>
        {sideLink('/store/home', 'View Store', '🏭')}
      </aside>
    );
  }
  return (
    <aside className="sidebar">
      <div className="side-title">INDUSTRIAL STORE</div>
      {sideLink('/store/home', 'Home', '🏠')}
      {sideLink('/store/listing', 'All Products', '🔩')}
      {sideLink('/store/cart', 'My Cart', '🧾', counts.cart || '')}
      {sideLink('/store/quotes', 'My Quotations', '📝', counts.openQuotes || '')}
      {sideLink('/store/orders', 'My Orders', '📦')}
      {sideLink('/store/profile', 'My Profile', '👤')}
      <div className="side-title">CATEGORIES</div>
      {(counts.cats || []).map((c) => sideLink('/store/listing?cat=' + c.id, c.name, c.icon))}
    </aside>
  );
}

export function Topbar() {
  const { me, loginAs, logout } = useAuth();
  const [q, setQ] = useState('');
  const nav = useNavigate();
  const cartN = (getCart() || []).reduce((a, c) => a + (c.qty || 0), 0);
  const submit = (e) => { e.preventDefault(); nav('/store/listing' + (q ? '?q=' + encodeURIComponent(q) : '')); };
  return (
    <>
      <div className="top-strip"><div className="topbar-inner">
        <span>CNCFORGE ERP • GST invoice on all orders • Bulk pricing on request</span>
        <span>{me ? me.name + ' • ' + String(me.role || '').replace('_', ' ') : ''}</span>
      </div></div>
      <div className="topbar"><div className="topbar-inner">
        <Link to="/store/home" className="logo" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <img src="assets/argus-logo.png" alt="ARGUSCNC" />
        </Link>
        <form className="searchbar" onSubmit={submit}>
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search SKU, part number, brand, product…" aria-label="Search products" />
          <button type="submit">Search</button>
        </form>
        <div className="navlinks">
          {me && me.google ? (
            <><span className="pill active" title={me.email || ''}>👤 {me.name}</span><button className="pill" onClick={() => { logout(); nav('/login'); }}>Logout</button></>
          ) : (
            <><button className={'pill' + (me && me.role === 'super_admin' ? ' active' : '')} onClick={() => loginAs('super_admin')}>Super Admin</button>
              <button className={'pill' + (me && me.role === 'company_admin' ? ' active' : '')} onClick={() => loginAs('company_admin')}>Company Admin</button>
              <button className={'pill' + (!me || me.role === 'sales_user' ? ' active' : '')} onClick={() => loginAs('sales_user')}>Sales User</button></>
          )}
          <Link className="icon-btn" to="/store/cart" aria-label="Cart">🧾<span className="count">{cartN}</span></Link>
          <Link className="avatar" to="/store/profile" title={(me && me.name ? me.name + ' — My profile' : 'My profile')}>{((me && me.name) || 'U')[0]}</Link>
          <button className="icon-btn" title="Logout" onClick={() => { logout(); nav('/login'); }}>⏻</button>
        </div>
      </div></div>
    </>
  );
}

export function Shell({ counts, noSide, children }) {
  return (
    <>
      <Topbar />
      <div className={'layout' + (noSide ? ' no-side' : '')}>
        {!noSide && <Sidebar counts={counts} />}
        <main className="page">{children}</main>
      </div>
      <div className="footer"><span><b>CNCFORGE ERP</b> • Industrial Store module • B2B procurement</span><span>Company isolation enforced server-side</span></div>
    </>
  );
}
