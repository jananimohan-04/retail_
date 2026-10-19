/* Menu Catalog — authoritative navigation definition & color theme system for ARGUS CNC ERP */
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
    color: 'indigo',
    dotClass: 'bg-indigo-500 shadow-indigo-500/50',
    badgeClass: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    items: [
      {
        id: 'super_dashboard',
        label: 'Platform Dashboard',
        path: '/super/dashboard',
        icon: 'LayoutDashboard',
        defaultRoles: ['super_admin'],
        theme: {
          name: 'indigo',
          gradient: 'from-indigo-600 via-blue-600 to-cyan-500',
          activeLink: 'bg-indigo-50/90 text-indigo-700 font-bold border-indigo-200/80 shadow-xs shadow-indigo-100',
          activeIcon: 'text-indigo-600',
          indicator: 'bg-indigo-600',
          badge: 'bg-indigo-600 text-white',
          glow: 'shadow-indigo-500/20'
        }
      },
      {
        id: 'admin_dashboard',
        label: 'Company Dashboard',
        path: '/admin/dashboard',
        icon: 'LayoutDashboard',
        defaultRoles: ['company_admin'],
        theme: {
          name: 'blue',
          gradient: 'from-blue-600 via-indigo-600 to-sky-500',
          activeLink: 'bg-blue-50/90 text-blue-700 font-bold border-blue-200/80 shadow-xs shadow-blue-100',
          activeIcon: 'text-blue-600',
          indicator: 'bg-blue-600',
          badge: 'bg-blue-600 text-white',
          glow: 'shadow-blue-500/20'
        }
      }
    ]
  },
  {
    id: 'organizations',
    label: 'Organizations',
    description: 'Companies, multi-tenant workspaces, and admins',
    color: 'sky',
    dotClass: 'bg-sky-500 shadow-sky-500/50',
    badgeClass: 'bg-sky-50 text-sky-700 border-sky-200',
    items: [
      {
        id: 'super_companies',
        label: 'Company Hub',
        path: '/super/companies',
        icon: 'Building2',
        defaultRoles: ['super_admin'],
        theme: {
          name: 'sky',
          gradient: 'from-sky-500 via-cyan-500 to-blue-600',
          activeLink: 'bg-sky-50/90 text-sky-800 font-bold border-sky-200/80 shadow-xs shadow-sky-100',
          activeIcon: 'text-sky-600',
          indicator: 'bg-sky-500',
          badge: 'bg-sky-600 text-white',
          glow: 'shadow-sky-500/20'
        }
      }
    ]
  },
  {
    id: 'global_catalog',
    label: 'Global Catalog',
    description: 'Global master SKUs, universal categories, and media',
    color: 'amber',
    dotClass: 'bg-amber-500 shadow-amber-500/50',
    badgeClass: 'bg-amber-50 text-amber-800 border-amber-200',
    items: [
      {
        id: 'super_catalog',
        label: 'Master Catalog',
        path: '/super/catalog',
        icon: 'Boxes',
        defaultRoles: ['super_admin'],
        theme: {
          name: 'amber',
          gradient: 'from-amber-500 via-orange-500 to-yellow-500',
          activeLink: 'bg-amber-50/90 text-amber-900 font-bold border-amber-200/80 shadow-xs shadow-amber-100',
          activeIcon: 'text-amber-600',
          indicator: 'bg-amber-500',
          badge: 'bg-amber-600 text-white',
          glow: 'shadow-amber-500/20'
        }
      },
      {
        id: 'super_categories',
        label: 'Categories',
        path: '/super/categories',
        icon: 'FolderTree',
        defaultRoles: ['super_admin'],
        theme: {
          name: 'yellow',
          gradient: 'from-yellow-500 via-amber-500 to-orange-500',
          activeLink: 'bg-yellow-50/90 text-yellow-900 font-bold border-yellow-200/80 shadow-xs shadow-yellow-100',
          activeIcon: 'text-yellow-600',
          indicator: 'bg-yellow-500',
          badge: 'bg-yellow-600 text-white',
          glow: 'shadow-yellow-500/20'
        }
      },
      {
        id: 'super_media',
        label: 'Product Media',
        path: '/super/media',
        icon: 'ImageIcon',
        defaultRoles: ['super_admin'],
        theme: {
          name: 'orange',
          gradient: 'from-orange-400 via-amber-500 to-red-400',
          activeLink: 'bg-orange-50/90 text-orange-900 font-bold border-orange-200/80 shadow-xs shadow-orange-100',
          activeIcon: 'text-orange-600',
          indicator: 'bg-orange-500',
          badge: 'bg-orange-600 text-white',
          glow: 'shadow-orange-500/20'
        }
      }
    ]
  },
  {
    id: 'operations',
    label: 'Operations',
    description: 'Tenant inventory, category mapping, sales reps, and store settings',
    color: 'emerald',
    dotClass: 'bg-emerald-500 shadow-emerald-500/50',
    badgeClass: 'bg-emerald-50 text-emerald-800 border-emerald-200',
    items: [
      {
        id: 'admin_products',
        label: 'Industrial Catalog',
        path: '/admin/products',
        icon: 'Boxes',
        defaultRoles: ['company_admin'],
        theme: {
          name: 'emerald',
          gradient: 'from-emerald-500 via-teal-600 to-green-600',
          activeLink: 'bg-emerald-50/90 text-emerald-800 font-bold border-emerald-200/80 shadow-xs shadow-emerald-100',
          activeIcon: 'text-emerald-600',
          indicator: 'bg-emerald-500',
          badge: 'bg-emerald-600 text-white',
          glow: 'shadow-emerald-500/20'
        }
      },
      {
        id: 'admin_media',
        label: 'Product Media',
        path: '/admin/media',
        icon: 'ImageIcon',
        defaultRoles: ['company_admin'],
        theme: {
          name: 'teal',
          gradient: 'from-teal-500 via-emerald-500 to-cyan-500',
          activeLink: 'bg-teal-50/90 text-teal-800 font-bold border-teal-200/80 shadow-xs shadow-teal-100',
          activeIcon: 'text-teal-600',
          indicator: 'bg-teal-500',
          badge: 'bg-teal-600 text-white',
          glow: 'shadow-teal-500/20'
        }
      },
      {
        id: 'admin_categories',
        label: 'Custom Categories',
        path: '/admin/categories',
        icon: 'FolderTree',
        defaultRoles: ['company_admin'],
        theme: {
          name: 'green',
          gradient: 'from-green-500 via-emerald-600 to-teal-600',
          activeLink: 'bg-green-50/90 text-green-800 font-bold border-green-200/80 shadow-xs shadow-green-100',
          activeIcon: 'text-green-600',
          indicator: 'bg-green-500',
          badge: 'bg-green-600 text-white',
          glow: 'shadow-green-500/20'
        }
      },
      {
        id: 'admin_users',
        label: 'Sales Representatives',
        path: '/admin/users',
        icon: 'User',
        defaultRoles: ['company_admin'],
        theme: {
          name: 'cyan',
          gradient: 'from-cyan-600 via-teal-600 to-blue-600',
          activeLink: 'bg-cyan-50/90 text-cyan-800 font-bold border-cyan-200/80 shadow-xs shadow-cyan-100',
          activeIcon: 'text-cyan-600',
          indicator: 'bg-cyan-600',
          badge: 'bg-cyan-600 text-white',
          glow: 'shadow-cyan-500/20'
        }
      },
      {
        id: 'admin_settings',
        label: 'Store Settings',
        path: '/admin/settings',
        icon: 'Settings',
        defaultRoles: ['company_admin'],
        theme: {
          name: 'slate',
          gradient: 'from-slate-600 via-teal-700 to-emerald-700',
          activeLink: 'bg-slate-100/90 text-slate-800 font-bold border-slate-300/80 shadow-xs',
          activeIcon: 'text-slate-600',
          indicator: 'bg-slate-600',
          badge: 'bg-slate-700 text-white',
          glow: 'shadow-slate-500/20'
        }
      }
    ]
  },
  {
    id: 'commerce',
    label: 'Commerce',
    description: 'Customer orders, platform-wide fulfillment, and RFQ quotations',
    color: 'purple',
    dotClass: 'bg-purple-500 shadow-purple-500/50',
    badgeClass: 'bg-purple-50 text-purple-800 border-purple-200',
    items: [
      {
        id: 'super_orders',
        label: 'Platform Orders',
        path: '/super/orders',
        icon: 'Receipt',
        defaultRoles: ['super_admin'],
        theme: {
          name: 'purple',
          gradient: 'from-purple-600 via-violet-600 to-indigo-600',
          activeLink: 'bg-purple-50/90 text-purple-800 font-bold border-purple-200/80 shadow-xs shadow-purple-100',
          activeIcon: 'text-purple-600',
          indicator: 'bg-purple-600',
          badge: 'bg-purple-600 text-white',
          glow: 'shadow-purple-500/20'
        }
      },
      {
        id: 'super_quotes',
        label: 'RFQ Quotations',
        path: '/super/quotes',
        icon: 'FileText',
        defaultRoles: ['super_admin'],
        theme: {
          name: 'violet',
          gradient: 'from-violet-600 via-purple-600 to-pink-600',
          activeLink: 'bg-violet-50/90 text-violet-800 font-bold border-violet-200/80 shadow-xs shadow-violet-100',
          activeIcon: 'text-violet-600',
          indicator: 'bg-violet-600',
          badge: 'bg-violet-600 text-white',
          glow: 'shadow-violet-500/20'
        }
      },
      {
        id: 'admin_orders',
        label: 'Customer Orders',
        path: '/admin/orders',
        icon: 'Receipt',
        badgeKey: 'pendingOrders',
        defaultRoles: ['company_admin'],
        theme: {
          name: 'purple',
          gradient: 'from-purple-500 via-indigo-600 to-violet-600',
          activeLink: 'bg-purple-50/90 text-purple-800 font-bold border-purple-200/80 shadow-xs shadow-purple-100',
          activeIcon: 'text-purple-600',
          indicator: 'bg-purple-500',
          badge: 'bg-purple-600 text-white',
          glow: 'shadow-purple-500/20'
        }
      },
      {
        id: 'admin_quotes',
        label: 'RFQ Inquiries',
        path: '/admin/quotes',
        icon: 'FileText',
        badgeKey: 'openQuotes',
        defaultRoles: ['company_admin'],
        theme: {
          name: 'indigo',
          gradient: 'from-indigo-500 via-blue-600 to-purple-600',
          activeLink: 'bg-indigo-50/90 text-indigo-800 font-bold border-indigo-200/80 shadow-xs shadow-indigo-100',
          activeIcon: 'text-indigo-600',
          indicator: 'bg-indigo-500',
          badge: 'bg-indigo-600 text-white',
          glow: 'shadow-indigo-500/20'
        }
      }
    ]
  },
  {
    id: 'governance',
    label: 'Governance',
    description: 'Menu access permissions, global settings, and audit logs',
    color: 'rose',
    dotClass: 'bg-rose-500 shadow-rose-500/50',
    badgeClass: 'bg-rose-50 text-rose-800 border-rose-200',
    items: [
      {
        id: 'super_access',
        label: 'Menu Access Control',
        path: '/super/access',
        icon: 'KeyRound',
        defaultRoles: ['super_admin'],
        theme: {
          name: 'rose',
          gradient: 'from-rose-500 via-red-600 to-pink-600',
          activeLink: 'bg-rose-50/90 text-rose-800 font-bold border-rose-200/80 shadow-xs shadow-rose-100',
          activeIcon: 'text-rose-600',
          indicator: 'bg-rose-500',
          badge: 'bg-rose-600 text-white',
          glow: 'shadow-rose-500/20'
        }
      },
      {
        id: 'super_settings',
        label: 'Global Settings',
        path: '/super/settings',
        icon: 'Settings',
        defaultRoles: ['super_admin'],
        theme: {
          name: 'slate',
          gradient: 'from-slate-700 via-rose-700 to-pink-700',
          activeLink: 'bg-rose-50/70 text-rose-900 font-bold border-rose-200/80 shadow-xs',
          activeIcon: 'text-rose-600',
          indicator: 'bg-rose-500',
          badge: 'bg-rose-700 text-white',
          glow: 'shadow-rose-500/20'
        }
      },
      {
        id: 'super_audit',
        label: 'Audit Logs',
        path: '/super/audit',
        icon: 'ShieldCheck',
        defaultRoles: ['super_admin'],
        theme: {
          name: 'red',
          gradient: 'from-red-600 via-rose-600 to-amber-600',
          activeLink: 'bg-red-50/90 text-red-800 font-bold border-red-200/80 shadow-xs shadow-red-100',
          activeIcon: 'text-red-600',
          indicator: 'bg-red-600',
          badge: 'bg-red-600 text-white',
          glow: 'shadow-red-500/20'
        }
      }
    ]
  },
  {
    id: 'publishing',
    label: 'Publishing',
    description: 'Copywriting queue and finance pricing approval',
    color: 'fuchsia',
    dotClass: 'bg-fuchsia-500 shadow-fuchsia-500/50',
    badgeClass: 'bg-fuchsia-50 text-fuchsia-800 border-fuchsia-200',
    items: [
      {
        id: 'content_writer',
        label: 'Content Writer',
        path: '/content',
        icon: 'PenLine',
        badgeKey: 'pendingContent',
        defaultRoles: ['super_admin', 'company_admin', 'content_writer'],
        theme: {
          name: 'fuchsia',
          gradient: 'from-fuchsia-500 via-pink-600 to-purple-600',
          activeLink: 'bg-fuchsia-50/90 text-fuchsia-800 font-bold border-fuchsia-200/80 shadow-xs shadow-fuchsia-100',
          activeIcon: 'text-fuchsia-600',
          indicator: 'bg-fuchsia-500',
          badge: 'bg-fuchsia-600 text-white',
          glow: 'shadow-fuchsia-500/20'
        }
      },
      {
        id: 'finance_review',
        label: 'Finance Review',
        path: '/finance',
        icon: 'IndianRupee',
        badgeKey: 'financeQueue',
        defaultRoles: ['super_admin', 'company_admin', 'finance'],
        theme: {
          name: 'teal',
          gradient: 'from-teal-500 via-emerald-600 to-cyan-600',
          activeLink: 'bg-teal-50/90 text-teal-800 font-bold border-teal-200/80 shadow-xs shadow-teal-100',
          activeIcon: 'text-teal-600',
          indicator: 'bg-teal-500',
          badge: 'bg-teal-600 text-white',
          glow: 'shadow-teal-500/20'
        }
      }
    ]
  },
  {
    id: 'storefront',
    label: 'Storefront',
    description: 'Retail catalog browsing, order placement, and customer account',
    color: 'orange',
    dotClass: 'bg-orange-500 shadow-orange-500/50',
    badgeClass: 'bg-orange-50 text-orange-800 border-orange-200',
    items: [
      {
        id: 'store_home',
        label: 'Store Home / Live',
        path: '/store/home',
        icon: 'Store',
        defaultRoles: ['super_admin', 'company_admin', 'sales_user', 'sales_regional_partner', 'sales_channel_partner', 'sales_referral_partner'],
        theme: {
          name: 'orange',
          gradient: 'from-orange-500 via-amber-500 to-red-500',
          activeLink: 'bg-orange-50/90 text-orange-800 font-bold border-orange-200/80 shadow-xs shadow-orange-100',
          activeIcon: 'text-orange-600',
          indicator: 'bg-orange-500',
          badge: 'bg-orange-600 text-white',
          glow: 'shadow-orange-500/20'
        }
      },
      {
        id: 'store_listing',
        label: 'All Products',
        path: '/store/listing',
        icon: 'Boxes',
        defaultRoles: ['sales_user', 'sales_regional_partner', 'sales_channel_partner', 'sales_referral_partner'],
        theme: {
          name: 'amber',
          gradient: 'from-amber-500 via-orange-500 to-yellow-600',
          activeLink: 'bg-amber-50/90 text-amber-900 font-bold border-amber-200/80 shadow-xs shadow-amber-100',
          activeIcon: 'text-amber-600',
          indicator: 'bg-amber-500',
          badge: 'bg-amber-600 text-white',
          glow: 'shadow-amber-500/20'
        }
      },
      {
        id: 'store_cart',
        label: 'My Cart',
        path: '/store/cart',
        icon: 'ShoppingCart',
        badgeKey: 'cart',
        defaultRoles: ['sales_user', 'sales_regional_partner', 'sales_channel_partner', 'sales_referral_partner'],
        theme: {
          name: 'orange',
          gradient: 'from-orange-600 via-red-500 to-pink-500',
          activeLink: 'bg-orange-50/90 text-orange-900 font-bold border-orange-200/80 shadow-xs shadow-orange-100',
          activeIcon: 'text-orange-600',
          indicator: 'bg-orange-600',
          badge: 'bg-orange-600 text-white',
          glow: 'shadow-orange-500/20'
        }
      },
      {
        id: 'store_quotes',
        label: 'My Quotations',
        path: '/store/quotes',
        icon: 'FileText',
        badgeKey: 'openQuotes',
        defaultRoles: ['sales_user', 'sales_regional_partner', 'sales_channel_partner', 'sales_referral_partner'],
        theme: {
          name: 'amber',
          gradient: 'from-amber-500 via-yellow-500 to-orange-600',
          activeLink: 'bg-amber-50/90 text-amber-800 font-bold border-amber-200/80 shadow-xs shadow-amber-100',
          activeIcon: 'text-amber-600',
          indicator: 'bg-amber-500',
          badge: 'bg-amber-600 text-white',
          glow: 'shadow-amber-500/20'
        }
      },
      {
        id: 'store_orders',
        label: 'My Orders',
        path: '/store/orders',
        icon: 'Package',
        defaultRoles: ['sales_user', 'sales_regional_partner', 'sales_channel_partner', 'sales_referral_partner'],
        theme: {
          name: 'orange',
          gradient: 'from-orange-600 via-amber-600 to-yellow-600',
          activeLink: 'bg-orange-50/90 text-orange-800 font-bold border-orange-200/80 shadow-xs shadow-orange-100',
          activeIcon: 'text-orange-600',
          indicator: 'bg-orange-600',
          badge: 'bg-orange-600 text-white',
          glow: 'shadow-orange-500/20'
        }
      },
      {
        id: 'store_profile',
        label: 'My Profile',
        path: '/store/profile',
        icon: 'User',
        defaultRoles: ['sales_user', 'sales_regional_partner', 'sales_channel_partner', 'sales_referral_partner'],
        theme: {
          name: 'amber',
          gradient: 'from-amber-600 via-orange-600 to-yellow-600',
          activeLink: 'bg-amber-50/90 text-amber-900 font-bold border-amber-200/80 shadow-xs shadow-amber-100',
          activeIcon: 'text-amber-600',
          indicator: 'bg-amber-600',
          badge: 'bg-amber-600 text-white',
          glow: 'shadow-amber-500/20'
        }
      }
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

export function getPageByPath(pathname) {
  for (const cat of MENU_CATALOG) {
    for (const item of cat.items) {
      if (item.path === pathname || (item.path !== '/' && pathname.startsWith(item.path))) {
        return item;
      }
    }
  }
  return null;
}

export function getCategoryById(catId) {
  return MENU_CATALOG.find(c => c.id === catId) || null;
}
