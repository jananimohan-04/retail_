/* Menu Catalog — authoritative navigation definition for ARGUS CNC ERP */
import {
  LayoutDashboard, Building2, Boxes, FolderTree, Image as ImageIcon,
  Receipt, FileText, Settings, ShieldCheck, Store, Home, ShoppingCart,
  Package, User, PenLine, IndianRupee, KeyRound
} from 'lucide-react';

export const ICON_MAP = {
  LayoutDashboard,
  Building2,
  Boxes,
  FolderTree,
  ImageIcon,
  Receipt,
  FileText,
  Settings,
  ShieldCheck,
  Store,
  Home,
  ShoppingCart,
  Package,
  User,
  PenLine,
  IndianRupee,
  KeyRound
};

export const MENU_CATALOG = [
  {
    id: 'overview',
    label: 'Overview',
    description: 'Executive dashboard and high-level KPIs',
    items: [
      { id: 'super_dashboard', label: 'Platform Dashboard', path: '/super/dashboard', icon: 'LayoutDashboard', defaultRoles: ['super_admin'] },
      { id: 'admin_dashboard', label: 'Company Dashboard', path: '/admin/dashboard', icon: 'LayoutDashboard', defaultRoles: ['company_admin'] }
    ]
  },
  {
    id: 'organizations',
    label: 'Organizations',
    description: 'Companies, multi-tenant workspaces, and admins',
    items: [
      { id: 'super_companies', label: 'Company Hub', path: '/super/companies', icon: 'Building2', defaultRoles: ['super_admin'] }
    ]
  },
  {
    id: 'global_catalog',
    label: 'Global Catalog',
    description: 'Global master SKUs, universal categories, and media',
    items: [
      { id: 'super_catalog', label: 'Master Catalog', path: '/super/catalog', icon: 'Boxes', defaultRoles: ['super_admin'] },
      { id: 'super_categories', label: 'Categories', path: '/super/categories', icon: 'FolderTree', defaultRoles: ['super_admin'] },
      { id: 'super_media', label: 'Product Media', path: '/super/media', icon: 'ImageIcon', defaultRoles: ['super_admin'] }
    ]
  },
  {
    id: 'operations',
    label: 'Operations',
    description: 'Tenant inventory, category mapping, sales reps, and store settings',
    items: [
      { id: 'admin_products', label: 'Industrial Catalog', path: '/admin/products', icon: 'Boxes', defaultRoles: ['company_admin'] },
      { id: 'admin_media', label: 'Product Media', path: '/admin/media', icon: 'ImageIcon', defaultRoles: ['company_admin'] },
      { id: 'admin_categories', label: 'Custom Categories', path: '/admin/categories', icon: 'FolderTree', defaultRoles: ['company_admin'] },
      { id: 'admin_users', label: 'Sales Representatives', path: '/admin/users', icon: 'User', defaultRoles: ['company_admin'] },
      { id: 'admin_settings', label: 'Store Settings', path: '/admin/settings', icon: 'Settings', defaultRoles: ['company_admin'] }
    ]
  },
  {
    id: 'commerce',
    label: 'Commerce',
    description: 'Customer orders, platform-wide fulfillment, and RFQ quotations',
    items: [
      { id: 'super_orders', label: 'Platform Orders', path: '/super/orders', icon: 'Receipt', defaultRoles: ['super_admin'] },
      { id: 'super_quotes', label: 'RFQ Quotations', path: '/super/quotes', icon: 'FileText', defaultRoles: ['super_admin'] },
      { id: 'admin_orders', label: 'Customer Orders', path: '/admin/orders', icon: 'Receipt', badgeKey: 'pendingOrders', defaultRoles: ['company_admin'] },
      { id: 'admin_quotes', label: 'RFQ Inquiries', path: '/admin/quotes', icon: 'FileText', badgeKey: 'openQuotes', defaultRoles: ['company_admin'] }
    ]
  },
  {
    id: 'governance',
    label: 'Governance',
    description: 'Menu access permissions, global settings, and audit logs',
    items: [
      { id: 'super_access', label: 'Menu Access Control', path: '/super/access', icon: 'KeyRound', defaultRoles: ['super_admin'] },
      { id: 'super_settings', label: 'Global Settings', path: '/super/settings', icon: 'Settings', defaultRoles: ['super_admin'] },
      { id: 'super_audit', label: 'Audit Logs', path: '/super/audit', icon: 'ShieldCheck', defaultRoles: ['super_admin'] }
    ]
  },
  {
    id: 'publishing',
    label: 'Publishing',
    description: 'Copywriting queue and finance pricing approval',
    items: [
      { id: 'content_writer', label: 'Content Writer', path: '/content', icon: 'PenLine', badgeKey: 'pendingContent', defaultRoles: ['super_admin', 'company_admin', 'content_writer'] },
      { id: 'finance_review', label: 'Finance Review', path: '/finance', icon: 'IndianRupee', badgeKey: 'financeQueue', defaultRoles: ['super_admin', 'company_admin', 'finance'] }
    ]
  },
  {
    id: 'storefront',
    label: 'Storefront',
    description: 'Retail catalog browsing, order placement, and customer account',
    items: [
      { id: 'store_home', label: 'Store Home / Live', path: '/store/home', icon: 'Store', defaultRoles: ['super_admin', 'company_admin', 'sales_user', 'sales_regional_partner', 'sales_channel_partner', 'sales_referral_partner'] },
      { id: 'store_listing', label: 'All Products', path: '/store/listing', icon: 'Boxes', defaultRoles: ['sales_user', 'sales_regional_partner', 'sales_channel_partner', 'sales_referral_partner'] },
      { id: 'store_cart', label: 'My Cart', path: '/store/cart', icon: 'ShoppingCart', badgeKey: 'cart', defaultRoles: ['sales_user', 'sales_regional_partner', 'sales_channel_partner', 'sales_referral_partner'] },
      { id: 'store_quotes', label: 'My Quotations', path: '/store/quotes', icon: 'FileText', badgeKey: 'openQuotes', defaultRoles: ['sales_user', 'sales_regional_partner', 'sales_channel_partner', 'sales_referral_partner'] },
      { id: 'store_orders', label: 'My Orders', path: '/store/orders', icon: 'Package', defaultRoles: ['sales_user', 'sales_regional_partner', 'sales_channel_partner', 'sales_referral_partner'] },
      { id: 'store_profile', label: 'My Profile', path: '/store/profile', icon: 'User', defaultRoles: ['sales_user', 'sales_regional_partner', 'sales_channel_partner', 'sales_referral_partner'] }
    ]
  }
];

export function getAllPageIds() {
  const ids = [];
  for (const cat of MENU_CATALOG) {
    for (const item of cat.items) {
      ids.push(item.id);
    }
  }
  return ids;
}

export function getPageById(pageId) {
  for (const cat of MENU_CATALOG) {
    for (const item of cat.items) {
      if (item.id === pageId) return item;
    }
  }
  return null;
}
