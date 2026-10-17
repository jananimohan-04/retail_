/* Routes — identical hash paths to the legacy app (HashRouter preserves #/... URLs). */
import { useCallback, useEffect, useState } from 'react';
import { HashRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './auth';
import { Shell } from './layout';
import { ToastHost } from './components/ui';
import { api, getCart } from './api';
import Login from './pages/Login';
import Pending from './pages/Pending';
import SuperDashboard from './pages/super/Dashboard';
import Companies from './pages/super/Companies';
import CompanyNew from './pages/super/CompanyNew';
import CompanyDetail from './pages/super/CompanyDetail';
import SuperCatalog from './pages/super/Catalog';
import SuperCategories from './pages/super/Categories';
import SuperMedia from './pages/super/Media';
import SuperOrders from './pages/super/Orders';
import SuperQuotes from './pages/super/Quotes';
import SuperSettings from './pages/super/Settings';
import SuperAudit from './pages/super/Audit';
import AdminDashboard from './pages/admin/Dashboard';
import AdminProducts from './pages/admin/Products';
import AdminProductForm from './pages/admin/ProductForm';
import AdminMedia from './pages/admin/Media';
import AdminCategories from './pages/admin/Categories';
import AdminUsers from './pages/admin/Users';
import AdminOrders from './pages/admin/Orders';
import AdminOrderDetail from './pages/admin/OrderDetail';
import AdminQuotes from './pages/admin/Quotes';
import AdminSettings from './pages/admin/Settings';
import StoreHome from './pages/store/Home';
import StoreListing from './pages/store/Listing';
import StoreProduct from './pages/store/Product';
import StoreCart from './pages/store/Cart';
import StoreCheckout from './pages/store/Checkout';
import StoreConfirmation from './pages/store/Confirmation';
import StoreOrders from './pages/store/Orders';
import StoreOrderDetail from './pages/store/OrderDetail';
import StoreQuotes from './pages/store/Quotes';
import StoreProfile from './pages/store/Profile';

function Gate({ children, noSide }) {
  const { me, ready } = useAuth();
  const loc = useLocation();
  const [counts, setCounts] = useState({ cart: 0, cats: [], pendingOrders: '', openQuotes: '' });

  useEffect(() => {
    const cartN = (getCart() || []).reduce((a, c) => a + (c.qty || 0), 0);
    setCounts((p) => ({ ...p, cart: cartN }));
    if (!me || !me.companyId || me.role === 'super_admin') {
      api.get('/api/categories').then((c) => setCounts((p) => ({ ...p, cats: c || [] }))).catch(() => {});
      if (!me || me.role === 'super_admin') return;
    }
    Promise.all([
      api.get('/api/orders').catch(() => []),
      api.get('/api/quotations').catch(() => []),
      api.get('/api/categories').catch(() => [])
    ]).then(([o, qq, c]) => {
      const cid = me.companyId;
      const oo = (o || []).filter((x) => x.companyId === cid);
      const q2 = (qq || []).filter((x) => x.companyId === cid);
      setCounts((p) => ({
        ...p,
        pendingOrders: oo.filter((x) => x.status === 'Pending').length || '',
        openQuotes: q2.filter((x) => x.status === 'Pending').length || '',
        cats: c || []
      }));
    }).catch(() => {});
  }, [me, loc.pathname]);

  if (!ready) return null;
  if (loc.pathname === '/login') return <>{children}</>;
  if (!me) return <Navigate to="/login" replace />;
  if (me.role === 'pending' || me.role === 'disabled') return <Pending />;
  return <Shell counts={counts} noSide={noSide}>{children}</Shell>;
}

export default function App() {
  return (
    <AuthProvider>
      <HashRouter>
        <ToastHost />
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/pending" element={<Gate noSide><Pending /></Gate>} />
          <Route path="/super/dashboard" element={<Gate><SuperDashboard /></Gate>} />
          <Route path="/super/companies" element={<Gate><Companies /></Gate>} />
          <Route path="/super/companies/new" element={<Gate><CompanyNew /></Gate>} />
          <Route path="/super/companies/:id/edit" element={<Gate><CompanyNew edit /></Gate>} />
          <Route path="/super/companies/:id" element={<Gate><CompanyDetail /></Gate>} />
          <Route path="/super/admins" element={<Gate><Companies tab="admins" /></Gate>} />
          <Route path="/super/users" element={<Gate><Companies tab="users" /></Gate>} />
          <Route path="/super/catalog" element={<Gate><SuperCatalog /></Gate>} />
          <Route path="/super/categories" element={<Gate><SuperCategories /></Gate>} />
          <Route path="/super/media" element={<Gate><SuperMedia /></Gate>} />
          <Route path="/super/orders" element={<Gate><SuperOrders /></Gate>} />
          <Route path="/super/orders/:id" element={<Gate><AdminOrderDetail back="/super/orders" /></Gate>} />
          <Route path="/super/quotes" element={<Gate><SuperQuotes /></Gate>} />
          <Route path="/super/settings" element={<Gate><SuperSettings /></Gate>} />
          <Route path="/super/audit" element={<Gate><SuperAudit /></Gate>} />
          <Route path="/admin/dashboard" element={<Gate><AdminDashboard /></Gate>} />
          <Route path="/admin/products" element={<Gate><AdminProducts /></Gate>} />
          <Route path="/admin/products/new" element={<Gate><AdminProductForm /></Gate>} />
          <Route path="/admin/products/edit/:id" element={<Gate><AdminProductForm edit /></Gate>} />
          <Route path="/admin/media" element={<Gate><AdminMedia /></Gate>} />
          <Route path="/admin/categories" element={<Gate><AdminCategories /></Gate>} />
          <Route path="/admin/users" element={<Gate><AdminUsers /></Gate>} />
          <Route path="/admin/orders" element={<Gate><AdminOrders /></Gate>} />
          <Route path="/admin/orders/:id" element={<Gate><AdminOrderDetail back="/admin/orders" /></Gate>} />
          <Route path="/admin/quotes" element={<Gate><AdminQuotes /></Gate>} />
          <Route path="/admin/settings" element={<Gate><AdminSettings /></Gate>} />
          <Route path="/store/home" element={<Gate><StoreHome /></Gate>} />
          <Route path="/store/listing" element={<Gate><StoreListing /></Gate>} />
          <Route path="/store/product/:id" element={<Gate><StoreProduct /></Gate>} />
          <Route path="/store/cart" element={<Gate><StoreCart /></Gate>} />
          <Route path="/store/checkout" element={<Gate><StoreCheckout /></Gate>} />
          <Route path="/store/confirmation/:id" element={<Gate><StoreConfirmation /></Gate>} />
          <Route path="/store/orders" element={<Gate><StoreOrders /></Gate>} />
          <Route path="/store/orders/:id" element={<Gate><StoreOrderDetail /></Gate>} />
          <Route path="/store/quotes" element={<Gate><StoreQuotes /></Gate>} />
          <Route path="/store/profile" element={<Gate><StoreProfile /></Gate>} />
          <Route path="/" element={<Navigate to="/store/home" replace />} />
          <Route path="*" element={<Gate><StoreHome /></Gate>} />
        </Routes>
      </HashRouter>
    </AuthProvider>
  );
}
