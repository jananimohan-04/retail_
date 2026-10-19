/* Menu Access Management — Role-wise & User-wise Dynamic Navigation Permissions */
import { useEffect, useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ShieldCheck, Users, History, KeyRound, Check, X, RotateCcw,
  Save, Search, ChevronDown, ChevronRight, Lock, Eye, AlertCircle,
  Sparkles, CheckCircle2, SlidersHorizontal, Info, RefreshCw
} from 'lucide-react';
import { api } from '../../api';
import { useAuth } from '../../auth';
import { toast } from '../../components/ui';
import { MENU_CATALOG, ICON_MAP, getAllPageIds } from '../../menuCatalog';

export default function MenuAccess() {
  const { me, refreshPermissions } = useAuth();
  const [activeTab, setActiveTab] = useState('roles'); // 'roles' | 'users' | 'audit'
  const [loading, setLoading] = useState(true);

  // Role management state
  const [roles, setRoles] = useState([]);
  const [selectedRoleId, setSelectedRoleId] = useState('super_admin');
  const [rolePermissions, setRolePermissions] = useState({}); // { [roleId]: string[] }
  const [savingRole, setSavingRole] = useState(false);
  const [roleSearch, setRoleSearch] = useState('');

  // User management state
  const [users, setUsers] = useState([]);
  const [selectedUserId, setSelectedUserId] = useState('');
  const [userOverrides, setUserOverrides] = useState({}); // { [pageId]: 'allow' | 'deny' }
  const [userSearch, setUserSearch] = useState('');
  const [savingUser, setSavingUser] = useState(false);
  const [resettingUser, setResettingUser] = useState(false);

  // Audit logs state
  const [auditLogs, setAuditLogs] = useState([]);
  const [auditLoading, setAuditLoading] = useState(false);

  // Accordion collapsed state for categories
  const [collapsedCats, setCollapsedCats] = useState({});

  // 1. Initial Data Fetching
  const loadData = async () => {
    setLoading(true);
    try {
      const [rRoles, rUsers] = await Promise.all([
        api.get('/api/permissions/roles'),
        api.get('/api/users')
      ]);

      setRoles(rRoles || []);
      const rPermsMap = {};
      (rRoles || []).forEach(r => {
        rPermsMap[r.id] = Array.isArray(r.menuPermissions) ? [...r.menuPermissions] : [];
      });
      setRolePermissions(rPermsMap);

      const uList = rUsers || [];
      setUsers(uList);
      if (uList.length > 0 && !selectedUserId) {
        setSelectedUserId(uList[0].id);
        setUserOverrides(uList[0].menuOverrides || {});
      }
    } catch (err) {
      toast('Failed to load permissions: ' + err.message, '⚠️');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // When switching selected user, load user details & overrides
  useEffect(() => {
    if (!selectedUserId) return;
    const u = users.find(x => x.id === selectedUserId);
    if (u) {
      setUserOverrides(u.menuOverrides ? { ...u.menuOverrides } : {});
    }
  }, [selectedUserId, users]);

  // Load audit logs when tab switched to audit
  const loadAudit = async () => {
    setAuditLoading(true);
    try {
      const logs = await api.get('/api/permissions/audit');
      setAuditLogs(logs || []);
    } catch (err) {
      toast('Failed to load audit logs', '⚠️');
    } finally {
      setAuditLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'audit') {
      loadAudit();
    }
  }, [activeTab]);

  const toggleCatCollapse = (catId) => {
    setCollapsedCats(prev => ({ ...prev, [catId]: !prev[catId] }));
  };

  /* =========================================================================
     ROLE CONFIGURATION HANDLERS
     ========================================================================= */
  const activeRole = roles.find(r => r.id === selectedRoleId) || roles[0];
  const curRolePerms = rolePermissions[selectedRoleId] || [];

  const isRolePageChecked = (pageId) => curRolePerms.includes(pageId);

  const handleToggleRolePage = (pageId) => {
    if (selectedRoleId === 'super_admin' && pageId === 'super_access') {
      toast('Menu Access Control is locked for Super Admin to prevent lockout', '🔒');
      return;
    }
    const current = new Set(curRolePerms);
    if (current.has(pageId)) current.delete(pageId);
    else current.add(pageId);

    setRolePermissions(prev => ({
      ...prev,
      [selectedRoleId]: Array.from(current)
    }));
  };

  const handleToggleCategoryForRole = (cat) => {
    const allCatPageIds = cat.items.map(i => i.id);
    const current = new Set(curRolePerms);
    const allChecked = allCatPageIds.every(id => current.has(id));

    if (allChecked) {
      // Uncheck all except super_access if super_admin
      allCatPageIds.forEach(id => {
        if (selectedRoleId === 'super_admin' && id === 'super_access') return;
        current.delete(id);
      });
    } else {
      // Check all
      allCatPageIds.forEach(id => current.add(id));
    }

    setRolePermissions(prev => ({
      ...prev,
      [selectedRoleId]: Array.from(current)
    }));
  };

  const handleSelectAllRole = () => {
    const allIds = getAllPageIds();
    setRolePermissions(prev => ({
      ...prev,
      [selectedRoleId]: allIds
    }));
  };

  const handleClearAllRole = () => {
    const kept = selectedRoleId === 'super_admin' ? ['super_access', 'super_dashboard'] : [];
    setRolePermissions(prev => ({
      ...prev,
      [selectedRoleId]: kept
    }));
  };

  const handleResetRoleDefaults = () => {
    if (!activeRole) return;
    const defaults = [];
    MENU_CATALOG.forEach(cat => {
      cat.items.forEach(item => {
        if ((item.defaultRoles || []).includes(selectedRoleId) ||
            (selectedRoleId.startsWith('sales_') && (item.defaultRoles || []).includes('sales_user'))) {
          defaults.push(item.id);
        }
      });
    });
    if (selectedRoleId === 'super_admin' && !defaults.includes('super_access')) {
      defaults.push('super_access');
    }
    setRolePermissions(prev => ({
      ...prev,
      [selectedRoleId]: defaults
    }));
    toast(`Reset "${activeRole.name}" to factory defaults`, '🔄');
  };

  const handleSaveRole = async () => {
    if (!selectedRoleId) return;
    setSavingRole(true);
    try {
      await api.patch(`/api/permissions/roles/${selectedRoleId}`, {
        menuPermissions: curRolePerms
      });
      toast(`Permissions for "${activeRole?.name}" saved successfully!`, '✅');
      // Refresh session permissions in case current user shares this role
      await refreshPermissions();
    } catch (err) {
      toast(err.message || 'Failed to save role permissions', '❌');
    } finally {
      setSavingRole(false);
    }
  };

  /* =========================================================================
     USER OVERRIDES HANDLERS
     ========================================================================= */
  const activeUser = users.find(u => u.id === selectedUserId) || users[0];
  const userBaseRoleObj = roles.find(r => r.id === (activeUser && activeUser.role));
  const userRoleDefaults = rolePermissions[activeUser?.role] || [];

  const getUserPageState = (pageId) => {
    if (userOverrides[pageId] === 'allow') return 'allow';
    if (userOverrides[pageId] === 'deny') return 'deny';
    return 'inherit';
  };

  const isUserPageEffective = (pageId) => {
    const state = getUserPageState(pageId);
    if (state === 'allow') return true;
    if (state === 'deny') return false;
    return userRoleDefaults.includes(pageId);
  };

  const handleSetUserOverride = (pageId, state) => {
    if (activeUser?.role === 'super_admin' && (pageId === 'super_access' || pageId === 'super_dashboard') && state === 'deny') {
      toast('Super Admin access cannot be denied to prevent lockout', '🔒');
      return;
    }
    setUserOverrides(prev => {
      const next = { ...prev };
      if (state === 'inherit') {
        delete next[pageId];
      } else {
        next[pageId] = state;
      }
      return next;
    });
  };

  const handleResetUserToInherit = async () => {
    if (!selectedUserId) return;
    setResettingUser(true);
    try {
      await api.post(`/api/permissions/users/${selectedUserId}/reset`);
      setUserOverrides({});
      // Update in local users array
      setUsers(prev => prev.map(u => u.id === selectedUserId ? { ...u, menuOverrides: {} } : u));
      toast(`All overrides cleared for ${activeUser?.name}. Now inheriting 100% role defaults.`, '🔄');
      await refreshPermissions();
    } catch (err) {
      toast(err.message || 'Failed to reset overrides', '❌');
    } finally {
      setResettingUser(false);
    }
  };

  const handleSaveUserOverrides = async () => {
    if (!selectedUserId) return;
    setSavingUser(true);
    try {
      await api.patch(`/api/permissions/users/${selectedUserId}`, {
        menuOverrides: userOverrides
      });
      // Update in local state
      setUsers(prev => prev.map(u => u.id === selectedUserId ? { ...u, menuOverrides: { ...userOverrides } } : u));
      toast(`Overrides for ${activeUser?.name} saved successfully!`, '✅');
      await refreshPermissions();
    } catch (err) {
      toast(err.message || 'Failed to save user overrides', '❌');
    } finally {
      setSavingUser(false);
    }
  };

  const handleBulkUserSet = (state) => {
    const allIds = getAllPageIds();
    const next = {};
    if (state !== 'inherit') {
      allIds.forEach(id => {
        if (activeUser?.role === 'super_admin' && (id === 'super_access' || id === 'super_dashboard') && state === 'deny') {
          return;
        }
        next[id] = state;
      });
    }
    setUserOverrides(next);
  };

  /* Filtered users list */
  const filteredUsers = useMemo(() => {
    if (!userSearch) return users;
    const q = userSearch.toLowerCase();
    return users.filter(u =>
      (u.name || '').toLowerCase().includes(q) ||
      (u.email || '').toLowerCase().includes(q) ||
      (u.companyId || '').toLowerCase().includes(q) ||
      (u.role || '').toLowerCase().includes(q)
    );
  }, [users, userSearch]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-3">
        <div className="w-9 h-9 border-3 border-blue-600 border-t-transparent rounded-full animate-spin" />
        <p className="text-sm font-semibold text-slate-500">Loading Access Management Catalog...</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      {/* Page Header */}
      <div className="relative overflow-hidden bg-white p-6 rounded-2xl border border-slate-200/90 shadow-xs">
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 rounded-full bg-gradient-to-br from-rose-500 to-red-600 opacity-5 blur-3xl pointer-events-none" />
        <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5 mb-1.5">
              <div className="p-3 bg-gradient-to-br from-rose-500 via-red-600 to-pink-600 text-white shadow-md shadow-rose-900/10 rounded-2xl flex-shrink-0">
                <KeyRound className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-2xl font-black text-slate-900 tracking-tight">Dynamic Menu Access Control</h1>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wide bg-rose-50 text-rose-800 border border-rose-200">
                    Security Governance
                  </span>
                </div>
              </div>
            </div>
            <p className="text-xs text-slate-500 max-w-2xl leading-relaxed mt-1">
              Configure system-wide left navigation permissions. Define default accessible pages per role,
              or drill down into individual users with granular 3-state overrides (<span className="text-slate-700 font-bold">Inherit</span>, <span className="text-emerald-600 font-bold">Allow</span>, or <span className="text-rose-600 font-bold">Deny</span>).
            </p>
          </div>

          {/* Top Navigation Tabs */}
          <div className="flex items-center gap-1.5 p-1 bg-slate-100/90 rounded-2xl border border-slate-200/80 self-start md:self-auto shadow-2xs">
            <button
              onClick={() => setActiveTab('roles')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'roles' ? 'bg-gradient-to-r from-rose-600 to-red-600 text-white shadow-xs shadow-rose-500/30' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
            >
              <ShieldCheck className="w-4 h-4" />
              <span>Role Defaults</span>
            </button>
            <button
              onClick={() => setActiveTab('users')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'users' ? 'bg-gradient-to-r from-rose-600 to-red-600 text-white shadow-xs shadow-rose-500/30' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
            >
              <Users className="w-4 h-4" />
              <span>User Overrides</span>
            </button>
            <button
              onClick={() => setActiveTab('audit')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'audit' ? 'bg-gradient-to-r from-rose-600 to-red-600 text-white shadow-xs shadow-rose-500/30' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
            >
              <History className="w-4 h-4" />
              <span>Audit History</span>
            </button>
          </div>
        </div>
      </div>

      {/* =========================================================================
          TAB 1: ROLE-WISE PERMISSIONS
          ========================================================================= */}
      {activeTab === 'roles' && (
        <div className="space-y-6">
          {/* Role Selector Grid */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-extrabold uppercase tracking-widest text-slate-400">Select Role to Configure</span>
              <span className="text-[11px] font-semibold text-slate-500">{roles.length} Roles available</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2">
              {roles.map(r => {
                const isSel = r.id === selectedRoleId;
                const permsCount = (rolePermissions[r.id] || []).length;
                return (
                  <button
                    key={r.id}
                    onClick={() => setSelectedRoleId(r.id)}
                    className={`flex flex-col text-left p-3 rounded-xl border transition-all cursor-pointer ${
                      isSel
                        ? 'bg-blue-50/80 border-blue-500 ring-2 ring-blue-500/20 text-blue-900 shadow-xs'
                        : 'bg-slate-50/60 border-slate-200 hover:bg-slate-100 hover:border-slate-300 text-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between w-full mb-1">
                      <span className={`text-[10px] font-extrabold uppercase px-1.5 py-0.5 rounded ${
                        r.category === 'internal' ? 'bg-slate-200 text-slate-700' : 'bg-emerald-100 text-emerald-800'
                      }`}>
                        {r.category === 'internal' ? 'Internal' : 'Partner'}
                      </span>
                      {isSel && <Check className="w-3.5 h-3.5 text-blue-600" />}
                    </div>
                    <span className="text-xs font-bold truncate leading-snug">{r.name}</span>
                    <span className="text-[10px] text-slate-500 mt-1">
                      {permsCount} pages active
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Action Toolbar for Role */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white px-5 py-4 rounded-2xl border border-slate-200/80 shadow-xs">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100/60 text-blue-700 rounded-lg">
                <SlidersHorizontal className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <span>Default Menu Permissions: <span className="text-blue-600">{activeRole?.name}</span></span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-blue-100 text-blue-800">
                    {curRolePerms.length} / {getAllPageIds().length} Pages Enabled
                  </span>
                </h3>
                <p className="text-[11px] text-slate-500">
                  Changes made here apply to all users assigned the <span className="font-semibold text-slate-700">{activeRole?.name}</span> role unless overridden.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={handleSelectAllRole}
                className="px-3 py-1.5 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
              >
                Select All
              </button>
              <button
                onClick={handleClearAllRole}
                className="px-3 py-1.5 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
              >
                Clear All
              </button>
              <button
                onClick={handleResetRoleDefaults}
                title="Reset to factory baseline"
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
                <span>Defaults</span>
              </button>
              <button
                onClick={handleSaveRole}
                disabled={savingRole}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold shadow-sm transition-all cursor-pointer"
              >
                {savingRole ? <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                <span>Save Role Permissions</span>
              </button>
            </div>
          </div>

          {/* Super Admin Protection Alert */}
          {selectedRoleId === 'super_admin' && (
            <div className="flex items-center gap-3 p-3.5 bg-amber-50 border border-amber-200/80 rounded-xl text-xs text-amber-800">
              <Lock className="w-4 h-4 text-amber-600 flex-shrink-0" />
              <span>
                <strong className="font-bold">Lockout Protection Active:</strong> Menu Access Control (<code className="bg-amber-100 px-1 py-0.5 rounded font-mono">super_access</code>) is permanently retained for Super Admin so you can never accidentally lock yourself out of this console.
              </span>
            </div>
          )}

          {/* Two-Column Editor: Left = Tree / Hierarchy, Right = Live Menu Preview */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left: Category Hierarchy (7 cols) */}
            <div className="lg:col-span-7 space-y-4">
              {MENU_CATALOG.map(cat => {
                const catPageIds = cat.items.map(i => i.id);
                const enabledCount = catPageIds.filter(id => isRolePageChecked(id)).length;
                const totalCount = catPageIds.length;
                const allChecked = enabledCount === totalCount;
                const noneChecked = enabledCount === 0;
                const isCollapsed = !!collapsedCats[cat.id];

                return (
                  <div key={cat.id} className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
                    {/* Category Header */}
                    <div className="flex items-center justify-between px-5 py-3.5 bg-slate-50/70 border-b border-slate-200/60">
                      <button
                        onClick={() => toggleCatCollapse(cat.id)}
                        className="flex items-center gap-2.5 text-left flex-1 cursor-pointer"
                      >
                        {isCollapsed ? <ChevronRight className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-black uppercase tracking-wider text-slate-800">{cat.label}</span>
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                              allChecked
                                ? 'bg-emerald-100 text-emerald-800'
                                : noneChecked
                                ? 'bg-slate-200 text-slate-600'
                                : 'bg-blue-100 text-blue-800'
                            }`}>
                              {enabledCount} / {totalCount} active
                            </span>
                          </div>
                          <p className="text-[10px] text-slate-400">{cat.description}</p>
                        </div>
                      </button>

                      {/* Category Bulk Toggle */}
                      <button
                        onClick={() => handleToggleCategoryForRole(cat)}
                        className={`text-[11px] font-bold px-2.5 py-1 rounded-lg border transition-all cursor-pointer ${
                          allChecked
                            ? 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100'
                            : 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100'
                        }`}
                      >
                        {allChecked ? 'Disable Category' : 'Enable Category'}
                      </button>
                    </div>

                    {/* Page Items Accordion Content */}
                    {!isCollapsed && (
                      <div className="divide-y divide-slate-100">
                        {cat.items.map(item => {
                          const IconComp = ICON_MAP[item.icon] || KeyRound;
                          const checked = isRolePageChecked(item.id);
                          const isProtected = selectedRoleId === 'super_admin' && item.id === 'super_access';

                          return (
                            <div
                              key={item.id}
                              onClick={() => !isProtected && handleToggleRolePage(item.id)}
                              className={`flex items-center justify-between px-5 py-3.5 transition-colors ${
                                isProtected
                                  ? 'bg-amber-50/40 cursor-not-allowed'
                                  : checked
                                  ? 'bg-blue-50/30 hover:bg-blue-50/50 cursor-pointer'
                                  : 'hover:bg-slate-50 cursor-pointer'
                              }`}
                            >
                              <div className="flex items-center gap-3">
                                <div className={`w-5 h-5 rounded-md flex items-center justify-center border transition-all ${
                                  checked
                                    ? 'bg-blue-600 border-blue-600 text-white shadow-xs'
                                    : 'border-slate-300 bg-white'
                                }`}>
                                  {checked && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                                </div>
                                <div className={`p-1.5 rounded-lg ${checked ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-400'}`}>
                                  <IconComp className="w-4 h-4" />
                                </div>
                                <div>
                                  <div className="flex items-center gap-2">
                                    <span className={`text-xs font-bold ${checked ? 'text-slate-900' : 'text-slate-500'}`}>
                                      {item.label}
                                    </span>
                                    {isProtected && (
                                      <span className="flex items-center gap-1 text-[10px] font-extrabold text-amber-700 bg-amber-100 px-1.5 py-0.5 rounded">
                                        <Lock className="w-2.5 h-2.5" /> Protected
                                      </span>
                                    )}
                                  </div>
                                  <span className="text-[10px] font-mono text-slate-400">{item.path}</span>
                                </div>
                              </div>

                              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                checked ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-slate-100 text-slate-400'
                              }`}>
                                {checked ? 'Visible' : 'Hidden'}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Right: Interactive Live Sidebar Preview (5 cols) */}
            <div className="lg:col-span-5">
              <div className="sticky top-6 bg-slate-900 text-slate-200 p-5 rounded-2xl border border-slate-800 shadow-xl space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                  <div className="flex items-center gap-2">
                    <Eye className="w-4 h-4 text-blue-400" />
                    <span className="text-xs font-black uppercase tracking-wider text-white">Live Sidebar Preview</span>
                  </div>
                  <span className="text-[10px] font-mono text-slate-400">
                    Role: {activeRole?.name}
                  </span>
                </div>

                <p className="text-[11px] text-slate-400 leading-snug">
                  This preview renders the left navigation exactly as an assigned user will see it. Categories with zero enabled pages are suppressed automatically.
                </p>

                {/* Simulated Left Nav Rail */}
                <div className="bg-slate-950/80 rounded-xl p-4 border border-slate-800/80 max-h-[580px] overflow-y-auto space-y-4 text-xs font-semibold">
                  {MENU_CATALOG.map(cat => {
                    const visibleItems = cat.items.filter(i => isRolePageChecked(i.id));
                    if (visibleItems.length === 0) return null; // suppressed!

                    return (
                      <div key={cat.id} className="space-y-1">
                        <div className="text-[9px] font-black uppercase tracking-widest text-slate-400 px-2">
                          {cat.label}
                        </div>
                        <div className="space-y-0.5">
                          {visibleItems.map(item => {
                            const IconComp = ICON_MAP[item.icon] || KeyRound;
                            return (
                              <div
                                key={item.id}
                                className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-slate-300 hover:bg-slate-800/60 transition-colors"
                              >
                                <IconComp className="w-3.5 h-3.5 text-blue-400 flex-shrink-0" />
                                <span className="truncate flex-1">{item.label}</span>
                                {item.badgeKey && (
                                  <span className="px-1.5 py-0.2 rounded-full text-[9px] font-extrabold bg-blue-500/20 text-blue-300">
                                    •
                                  </span>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}

                  {curRolePerms.length === 0 && (
                    <div className="text-center py-8 text-slate-400 text-xs">
                      No pages enabled for this role. The sidebar will be completely empty.
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 2: USER-WISE OVERRIDES
          ========================================================================= */}
      {activeTab === 'users' && (
        <div className="space-y-6">
          {/* User Selector Header & Search */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <span className="text-xs font-extrabold uppercase tracking-widest text-slate-400">Select User to Customize</span>
                <p className="text-[11px] text-slate-500">Pick any user to grant or deny specific pages beyond their base role defaults.</p>
              </div>

              {/* User search bar */}
              <div className="relative w-full sm:w-72">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search user by name, email..."
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500/30"
                />
              </div>
            </div>

            {/* User Badges Carousel / Pills */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2.5 max-h-56 overflow-y-auto p-1">
              {filteredUsers.map(u => {
                const isSel = u.id === selectedUserId;
                const overridesCount = Object.keys(u.menuOverrides || {}).length;
                return (
                  <button
                    key={u.id}
                    onClick={() => setSelectedUserId(u.id)}
                    className={`flex items-start gap-2.5 text-left p-3 rounded-xl border transition-all cursor-pointer ${
                      isSel
                        ? 'bg-blue-50/80 border-blue-500 ring-2 ring-blue-500/20 shadow-xs'
                        : 'bg-slate-50/60 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <div className="w-8 h-8 rounded-full bg-slate-200 text-slate-700 font-extrabold flex items-center justify-center text-xs flex-shrink-0">
                      {(u.name || 'U').charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-900 truncate">{u.name}</span>
                        {isSel && <Check className="w-3.5 h-3.5 text-blue-600 flex-shrink-0" />}
                      </div>
                      <p className="text-[10px] text-slate-500 truncate">{u.email}</p>
                      <div className="flex items-center gap-1.5 mt-1">
                        <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-slate-200 text-slate-700">
                          {u.role}
                        </span>
                        {overridesCount > 0 ? (
                          <span className="text-[9px] font-extrabold text-amber-700 bg-amber-100 px-1.5 py-0.2 rounded">
                            {overridesCount} overrides
                          </span>
                        ) : (
                          <span className="text-[9px] text-slate-400">100% inherited</span>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Active User Toolbar & Overrides Summary */}
          {activeUser && (
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white px-5 py-4 rounded-2xl border border-slate-200/80 shadow-xs">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-700 font-black flex items-center justify-center text-sm">
                  {activeUser.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <span>{activeUser.name}</span>
                    <span className="text-slate-400 text-xs">({activeUser.email})</span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-slate-100 text-slate-700">
                      Base: {userBaseRoleObj?.name || activeUser.role}
                    </span>
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Active overrides: <strong className="text-slate-800">{Object.keys(userOverrides).length}</strong>.
                    Precedence: <span className="font-semibold text-emerald-600">User Allow/Deny</span> &gt; <span className="font-semibold text-slate-600">Role Defaults</span>.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <button
                  onClick={handleResetUserToInherit}
                  disabled={resettingUser}
                  title="Clear all overrides so user inherits 100% role defaults"
                  className="flex items-center gap-1 px-3 py-1.5 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
                  <span>Revert to Inherit All</span>
                </button>
                <button
                  onClick={() => handleBulkUserSet('allow')}
                  className="px-3 py-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-lg transition-colors cursor-pointer"
                >
                  Allow All
                </button>
                <button
                  onClick={() => handleBulkUserSet('deny')}
                  className="px-3 py-1.5 text-xs font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 rounded-lg transition-colors cursor-pointer"
                >
                  Deny All
                </button>
                <button
                  onClick={handleSaveUserOverrides}
                  disabled={savingUser}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold shadow-sm transition-all cursor-pointer"
                >
                  {savingUser ? <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                  <span>Save User Overrides</span>
                </button>
              </div>
            </div>
          )}

          {/* Two-Column Editor: Left = 3-State Controls, Right = Resulting User Live Preview */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left: 3-State Segments (7 cols) */}
            <div className="lg:col-span-7 space-y-4">
              {MENU_CATALOG.map(cat => {
                const isCollapsed = !!collapsedCats['user_' + cat.id];

                return (
                  <div key={cat.id} className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
                    {/* Category Header */}
                    <button
                      onClick={() => toggleCatCollapse('user_' + cat.id)}
                      className="flex items-center justify-between w-full px-5 py-3.5 bg-slate-50/70 border-b border-slate-200/60 cursor-pointer text-left"
                    >
                      <div className="flex items-center gap-2.5">
                        {isCollapsed ? <ChevronRight className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                        <div>
                          <span className="text-xs font-black uppercase tracking-wider text-slate-800">{cat.label}</span>
                          <p className="text-[10px] text-slate-400">{cat.description}</p>
                        </div>
                      </div>
                    </button>

                    {/* Page Items with 3-State Segmented Control */}
                    {!isCollapsed && (
                      <div className="divide-y divide-slate-100">
                        {cat.items.map(item => {
                          const IconComp = ICON_MAP[item.icon] || KeyRound;
                          const state = getUserPageState(item.id);
                          const isEffective = isUserPageEffective(item.id);
                          const isRoleGranted = userRoleDefaults.includes(item.id);
                          const isProtected = activeUser?.role === 'super_admin' && (item.id === 'super_access' || item.id === 'super_dashboard');

                          return (
                            <div
                              key={item.id}
                              className={`flex flex-col sm:flex-row sm:items-center justify-between p-4 gap-3 transition-colors ${
                                state === 'allow'
                                  ? 'bg-emerald-50/30'
                                  : state === 'deny'
                                  ? 'bg-rose-50/30'
                                  : 'hover:bg-slate-50/60'
                              }`}
                            >
                              {/* Left details */}
                              <div className="flex items-center gap-3">
                                <div className={`p-2 rounded-xl ${
                                  isEffective ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-400'
                                }`}>
                                  <IconComp className="w-4 h-4" />
                                </div>
                                <div>
                                  <div className="flex items-center gap-2">
                                    <span className="text-xs font-bold text-slate-900">{item.label}</span>
                                    {state !== 'inherit' && (
                                      <span className={`text-[9px] font-extrabold uppercase px-1.5 py-0.2 rounded ${
                                        state === 'allow' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                                      }`}>
                                        Override: {state}
                                      </span>
                                    )}
                                  </div>
                                  <div className="flex items-center gap-2 mt-0.5">
                                    <span className="text-[10px] font-mono text-slate-400">{item.path}</span>
                                    <span className="text-[10px] text-slate-400">•</span>
                                    <span className="text-[10px] text-slate-500">
                                      Role Default: <strong className={isRoleGranted ? 'text-emerald-600' : 'text-slate-500'}>{isRoleGranted ? 'Allowed' : 'Denied'}</strong>
                                    </span>
                                  </div>
                                </div>
                              </div>

                              {/* Right: 3-State Segmented Control */}
                              <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 self-start sm:self-auto">
                                <button
                                  type="button"
                                  onClick={() => handleSetUserOverride(item.id, 'inherit')}
                                  className={`px-2.5 py-1 text-[11px] font-bold rounded-lg transition-all cursor-pointer ${
                                    state === 'inherit'
                                      ? 'bg-white text-slate-800 shadow-xs'
                                      : 'text-slate-500 hover:text-slate-800'
                                  }`}
                                >
                                  Inherit
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleSetUserOverride(item.id, 'allow')}
                                  className={`px-2.5 py-1 text-[11px] font-bold rounded-lg transition-all cursor-pointer ${
                                    state === 'allow'
                                      ? 'bg-emerald-600 text-white shadow-xs'
                                      : 'text-slate-500 hover:text-emerald-700'
                                  }`}
                                >
                                  Allow
                                </button>
                                <button
                                  type="button"
                                  disabled={isProtected}
                                  onClick={() => handleSetUserOverride(item.id, 'deny')}
                                  className={`px-2.5 py-1 text-[11px] font-bold rounded-lg transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed ${
                                    state === 'deny'
                                      ? 'bg-rose-600 text-white shadow-xs'
                                      : 'text-slate-500 hover:text-rose-700'
                                  }`}
                                >
                                  Deny
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Right: Effective User Live Preview (5 cols) */}
            <div className="lg:col-span-5">
              <div className="sticky top-6 bg-slate-900 text-slate-200 p-5 rounded-2xl border border-slate-800 shadow-xl space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                  <div className="flex items-center gap-2">
                    <Eye className="w-4 h-4 text-emerald-400" />
                    <span className="text-xs font-black uppercase tracking-wider text-white">Live User Menu Preview</span>
                  </div>
                  <span className="text-[10px] font-mono text-slate-400 truncate max-w-[150px]">
                    {activeUser?.name}
                  </span>
                </div>

                <p className="text-[11px] text-slate-400 leading-snug">
                  The actual menu rendered for <strong className="text-slate-200">{activeUser?.name}</strong> upon logging into ARGUS CNC ERP.
                </p>

                {/* Simulated Left Nav Rail for this user */}
                <div className="bg-slate-950/80 rounded-xl p-4 border border-slate-800/80 max-h-[580px] overflow-y-auto space-y-4 text-xs font-semibold">
                  {MENU_CATALOG.map(cat => {
                    const visibleItems = cat.items.filter(i => isUserPageEffective(i.id));
                    if (visibleItems.length === 0) return null;

                    return (
                      <div key={cat.id} className="space-y-1">
                        <div className="text-[9px] font-black uppercase tracking-widest text-slate-400 px-2">
                          {cat.label}
                        </div>
                        <div className="space-y-0.5">
                          {visibleItems.map(item => {
                            const IconComp = ICON_MAP[item.icon] || KeyRound;
                            const isOverridden = userOverrides[item.id] === 'allow';
                            return (
                              <div
                                key={item.id}
                                className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-slate-300 hover:bg-slate-800/60 transition-colors"
                              >
                                <IconComp className="w-3.5 h-3.5 text-blue-400 flex-shrink-0" />
                                <span className="truncate flex-1">{item.label}</span>
                                {isOverridden && (
                                  <span className="px-1.5 py-0.5 rounded text-[8px] font-extrabold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                                    Override
                                  </span>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 3: AUDIT & CHANGE HISTORY
          ========================================================================= */}
      {activeTab === 'audit' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-6 space-y-4">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <div>
              <h2 className="text-sm font-bold text-slate-900">Permission Audit Trail</h2>
              <p className="text-xs text-slate-500">Every change to role defaults and user overrides is recorded permanently.</p>
            </div>
            <button
              onClick={loadAudit}
              disabled={auditLoading}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-slate-500 ${auditLoading ? 'animate-spin' : ''}`} />
              <span>Refresh Log</span>
            </button>
          </div>

          {auditLoading ? (
            <div className="py-12 text-center text-xs font-semibold text-slate-400">Loading audit history...</div>
          ) : auditLogs.length === 0 ? (
            <div className="py-12 text-center text-xs text-slate-400">
              No permission changes recorded yet. Changes you make will be listed here.
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {auditLogs.map(log => (
                <div key={log.id} className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-xl bg-slate-100 text-slate-600 mt-0.5">
                      <ShieldCheck className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-900">{log.summary}</span>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-slate-100 text-slate-600">
                          {log.action}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 mt-1 text-[11px] text-slate-500">
                        <span>By: <strong>{log.actor}</strong></span>
                        <span>•</span>
                        <span>Target: <code>{log.entityId}</code></span>
                      </div>
                    </div>
                  </div>
                  <span className="text-[11px] font-mono text-slate-400 self-start sm:self-auto">
                    {new Date(log.ts).toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
