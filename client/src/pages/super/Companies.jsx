/* Unified Company Management — companies + admins + users on one page.
   Mirrors legacy vCompanyMgmt/coTable/admTable/usrTable and the App methods
   goMgmt/mgCard/openCoModal/saveCompanyModal/coToggle/coUserNew/saveUserModal/
   userView/coUserToggle/coUserRole/coDetails/mgExport/mgRefresh. */
import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { api } from '../../api';
import {
  PageHead, Kpi, DataTable, Tabs, Modal, Pager, Empty, Skeleton, statusBadge, toast
} from '../../components/ui';
import { CompanyFormFields, emptyCompany, companyFromDetail, validateCompany, companyPayload } from './CompanyForm';
import { asRows, csvDownload, fetchCompanyOptions, UserModal, UserView, RoleButton, SuspendConfirm, toggleUserActive } from './_shared';

const MG_TABS = [['companies', '🏢 Companies'], ['admins', '👔 Company Admins'], ['users', '👥 Company Users']];
const LIMIT = 8;

function useDebounced(value, ms = 280) {
  const [v, setV] = useState(value);
  useEffect(() => { const t = setTimeout(() => setV(value), ms); return () => clearTimeout(t); }, [value, ms]);
  return v;
}

export default function Companies({ tab: tabProp }) {
  const [sp, setSp] = useSearchParams();
  const nav = useNavigate();
  const tab = tabProp || (['admins', 'users'].includes(sp.get('tab')) ? sp.get('tab') : 'companies');

  const [stats, setStats] = useState(null);
  const [statsErr, setStatsErr] = useState('');
  const [cos, setCos] = useState([]); // company options for filters/dropdowns
  const [page, setPage] = useState(1);

  // per-tab filters (mirror legacy ui.coFQ/coFStatus/…/admFQ…/usrFQ…)
  const [coQ, setCoQ] = useState('');
  const [coStatus, setCoStatus] = useState('all');
  const [coInd, setCoInd] = useState('all');
  const [coCity, setCoCity] = useState('all');
  const [admQ, setAdmQ] = useState('');
  const [admCo, setAdmCo] = useState('all');
  const [admSt, setAdmSt] = useState('all');
  const [usrQ, setUsrQ] = useState('');
  const [usrCo, setUsrCo] = useState('all');
  const [usrRole, setUsrRole] = useState('all');
  const [usrSt, setUsrSt] = useState('all');

  const dCoQ = useDebounced(coQ), dAdmQ = useDebounced(admQ), dUsrQ = useDebounced(usrQ);

  const [data, setData] = useState({ rows: [], total: 0 });
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState('');

  // modals
  const [coModal, setCoModal] = useState(null); // { id } — '' = create
  const [detailId, setDetailId] = useState(null);
  const [userModal, setUserModal] = useState(null); // { preset, editId }
  const [viewUser, setViewUser] = useState(null);
  const [suspendCo, setSuspendCo] = useState(null);

  const goTab = (k, company) => {
    setPage(1);
    if (company !== undefined) { setAdmCo(company || 'all'); setUsrCo(company || 'all'); }
    if (tabProp) { nav('/super/companies?tab=' + k); return; }
    setSp({ tab: k });
  };

  const loadStats = useCallback(() => {
    api.get('/api/stats/platform').then(setStats).catch((e) => setStatsErr(e.message));
    fetchCompanyOptions().then(setCos).catch(() => {});
  }, []);

  useEffect(() => { loadStats(); }, [loadStats]);

  // ?new=1 opens the create modal once (legacy render() behavior)
  useEffect(() => {
    if (sp.get('new') === '1' && !tabProp) {
      setCoModal({ id: '' });
      setSp({ tab: sp.get('tab') || 'companies' }, { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      let url;
      if (tab === 'companies') {
        const p = new URLSearchParams({ page, limit: LIMIT });
        if (dCoQ) p.set('q', dCoQ);
        if (coStatus !== 'all') p.set('status', coStatus);
        if (coInd !== 'all') p.set('industry', coInd);
        if (coCity !== 'all') p.set('city', coCity);
        url = '/api/companies?' + p;
      } else if (tab === 'admins') {
        const p = new URLSearchParams({ page, limit: LIMIT, role: 'company_admin' });
        if (dAdmQ) p.set('q', dAdmQ);
        if (admCo !== 'all') p.set('companyId', admCo);
        if (admSt !== 'all') p.set('active', admSt);
        url = '/api/users?' + p;
      } else {
        const p = new URLSearchParams({ page, limit: LIMIT });
        if (dUsrQ) p.set('q', dUsrQ);
        if (usrCo !== 'all') p.set('companyId', usrCo);
        if (usrRole !== 'all') p.set('role', usrRole);
        if (usrSt !== 'all') p.set('active', usrSt);
        url = '/api/users?' + p;
      }
      const d = await api.get(url);
      const n = asRows(d);
      setData({ rows: tab === 'users' ? n.rows.filter((u) => u.role !== 'super_admin') : n.rows, total: n.total });
      setErr('');
    } catch (e) {
      setErr(e.message || 'Failed to load');
    } finally {
      setLoading(false);
    }
  }, [tab, page, dCoQ, coStatus, coInd, coCity, dAdmQ, admCo, admSt, dUsrQ, usrCo, usrRole, usrSt]);

  useEffect(() => { load(); }, [load]);

  const refresh = () => { loadStats(); load(); toast('Refreshed from database', '↻'); };

  // Fetch full detail first so the impact confirm shows live users/pending counts (legacy coToggle).
  async function askSuspend(c) {
    try {
      const d = await api.get('/api/companies/' + c.id);
      setSuspendCo({ ...c, ...d });
    } catch {
      setSuspendCo(c);
    }
  }

  function mgExport() {
    if (!data.rows.length) { toast('Nothing to export', '⚠️'); return; }
    if (tab === 'companies') {
      const cols = ['id', 'code', 'name', 'industry', 'email', 'phone', 'city', 'state', 'pin', 'status', 'plan', 'createdAt'];
      csvDownload(`company-mgCompanies-${new Date().toISOString().slice(0, 10)}.csv`, cols,
        data.rows.map((c) => [c.id, c.code || c.id, c.name, c.industry || '', c.email || '', c.phone || '', c.city || '', c.state || '', c.pin || '', c.storeStatus || c.status || '', c.plan || '', c.createdAt || '']));
    } else {
      const cols = ['id', 'name', 'email', 'mobile', 'role', 'company', 'status', 'created'];
      csvDownload(`company-${tab === 'admins' ? 'mgAdmins' : 'mgUsers'}-${new Date().toISOString().slice(0, 10)}.csv`, cols,
        data.rows.map((u) => [u.id, u.name, u.email, u.mobile || '', u.role, u.companyName || u.companyId, u.active !== false ? 'active' : 'inactive', u.createdAt || '']));
    }
    toast(data.rows.length + ' rows exported', '⤓');
  }

  const mgCard = (kind) => {
    setPage(1);
    if (kind === 'all') { setCoStatus('all'); goTab('companies'); }
    else if (kind === 'active' || kind === 'suspended') { setCoStatus(kind); goTab('companies'); }
    else if (kind === 'admins') goTab('admins');
    else if (kind === 'users') goTab('users');
    else if (kind === 'products') nav('/super/catalog');
    else nav('/super/orders');
  };

  const s = stats || {};
  const totalUsers = (s.admins || 0) + (s.salesUsers || 0);

  return (
    <>
      <PageHead
        eyebrow="CNCFORGE ERP • SUPER ADMIN"
        title="Company Management"
        desc="Manage companies, administrators, users, and access permissions from one centralized workspace."
        actions={<>
          <button className="btn btn-ghost btn-sm" onClick={mgExport}>⤓ Export</button>
          <button className="btn btn-ghost btn-sm" onClick={refresh}>↻ Refresh</button>
          <button className="btn btn-primary btn-sm" onClick={() => setCoModal({ id: '' })}>+ Create Company</button>
        </>}
      />
      {statsErr && <Empty icon="⚠️" title={'⚠️ ' + statsErr} />}
      <div className="mgmt-cards">
        <Kpi onClick={() => mgCard('all')} value={s.companies ?? '—'} label="Total companies" sub={`${s.activeCompanies ?? 0} active • ${s.suspendedCompanies ?? 0} suspended`} grad="linear-gradient(135deg,#172554,#2563EB)" />
        <Kpi onClick={() => mgCard('active')} value={s.activeCompanies ?? '—'} label="Active companies" sub="store open" grad="linear-gradient(135deg,#14532D,#10B981)" />
        <Kpi onClick={() => mgCard('suspended')} value={s.suspendedCompanies ?? '—'} label="Suspended companies" sub="store closed" grad="linear-gradient(135deg,#92400E,#D97706)" />
        <Kpi onClick={() => mgCard('admins')} value={s.admins ?? '—'} label="Company admins" sub="all companies" grad="linear-gradient(135deg,#1E3A8A,#0EA5E9)" />
        <Kpi onClick={() => mgCard('users')} value={stats ? totalUsers : '—'} label="Company users" sub="admins + sales users" grad="linear-gradient(135deg,#9A3412,#FF6500)" />
        <Kpi onClick={() => mgCard('products')} value={s.products ?? '—'} label="Products" sub="across companies" grad="linear-gradient(135deg,#0F766E,#0EA5E9)" />
        <Kpi onClick={() => mgCard('orders')} value={s.orders ?? '—'} label="Orders" sub="across companies" grad="linear-gradient(135deg,#14532D,#10B981)" />
      </div>
      <Tabs tabs={MG_TABS} active={tab} onTab={(k) => goTab(k)} />
      <div className="card" style={{ marginTop: 0, borderTopLeftRadius: 0 }}>
        <div className="card-pad">
          {tab === 'companies' && (
            <CompaniesTab
              q={coQ} setQ={(x) => { setCoQ(x); setPage(1); }} status={coStatus} setStatus={(x) => { setCoStatus(x); setPage(1); }}
              ind={coInd} setInd={(x) => { setCoInd(x); setPage(1); }} city={coCity} setCity={(x) => { setCoCity(x); setPage(1); }}
              cos={cos} data={data} loading={loading} err={err} page={page} setPage={setPage}
              onDetails={setDetailId} onEdit={(id) => setCoModal({ id })} onToggle={(c) => askSuspend(c)}
            />
          )}
          {tab === 'admins' && (
            <AdminsTab
              q={admQ} setQ={(x) => { setAdmQ(x); setPage(1); }} co={admCo} setCo={(x) => { setAdmCo(x); setPage(1); }}
              st={admSt} setSt={(x) => { setAdmSt(x); setPage(1); }} cos={cos} data={data} loading={loading} err={err}
              page={page} setPage={setPage} onInvite={() => setUserModal({ preset: { role: 'company_admin' } })}
              onView={setViewUser} onEdit={(id) => setUserModal({ editId: id })} onToggle={(u) => toggleUserActive(u, load)}
            />
          )}
          {tab === 'users' && (
            <UsersTab
              q={usrQ} setQ={(x) => { setUsrQ(x); setPage(1); }} co={usrCo} setCo={(x) => { setUsrCo(x); setPage(1); }}
              role={usrRole} setRole={(x) => { setUsrRole(x); setPage(1); }} st={usrSt} setSt={(x) => { setUsrSt(x); setPage(1); }}
              cos={cos} data={data} loading={loading} err={err} page={page} setPage={setPage}
              onAdd={() => setUserModal({ preset: { role: 'sales_user' } })} onView={setViewUser}
              onEdit={(id) => setUserModal({ editId: id })} onToggle={(u) => toggleUserActive(u, load)} onRoleChanged={load}
            />
          )}
        </div>
      </div>

      {coModal && <CompanyModal id={coModal.id} onClose={() => setCoModal(null)} onSaved={() => { setCoModal(null); load(); loadStats(); }} />}
      {detailId && <CompanyDetails id={detailId} onClose={() => setDetailId(null)} onEdit={(id) => { setDetailId(null); setCoModal({ id }); }} onManage={(t, co) => { setDetailId(null); goTab(t, co); }} />}
      {userModal && <UserModal preset={userModal.preset} editId={userModal.editId} onClose={() => setUserModal(null)} onSaved={() => { setUserModal(null); load(); loadStats(); }} />}
      {viewUser && <UserView id={viewUser} onClose={() => setViewUser(null)} onChanged={() => { setViewUser(null); load(); }} onEdit={(id) => { setViewUser(null); setUserModal({ editId: id }); }} />}
      {suspendCo && <SuspendConfirm co={suspendCo} onCancel={() => setSuspendCo(null)} onDone={() => { setSuspendCo(null); load(); loadStats(); }} />}
    </>
  );
}

/* ---------------- companies tab ---------------- */
function CompaniesTab({ q, setQ, status, setStatus, ind, setInd, city, setCity, cos, data, loading, err, page, setPage, onDetails, onEdit, onToggle }) {
  const inds = [...new Set([...cos.map((c) => c.industry).filter(Boolean), ...(ind !== 'all' ? [ind] : [])])];
  const cities = [...new Set([...cos.map((c) => c.city).filter(Boolean), ...(city !== 'all' ? [city] : [])])];
  if (loading) return <Skeleton h={220} />;
  if (err) return <Empty title={'⚠️ ' + err} />;
  return (
    <>
      <div className="toolbar">
        <input placeholder="🔍 Search name, code, email, city…" value={q} onChange={(e) => setQ(e.target.value)} />
        <select value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="all">All statuses</option>
          <option value="active">Active</option>
          <option value="suspended">Suspended</option>
        </select>
        <select value={ind} onChange={(e) => setInd(e.target.value)}>
          <option value="all">All industries</option>
          {inds.map((i) => <option key={i} value={i}>{i}</option>)}
        </select>
        <select value={city} onChange={(e) => setCity(e.target.value)}>
          <option value="all">All cities</option>
          {cities.map((i) => <option key={i} value={i}>{i}</option>)}
        </select>
      </div>
      <DataTable
        rowKey={(r) => r.id}
        empty="No companies match."
        cols={[
          { key: 'co', label: 'Company', render: (c) => <><b>{c.logo || '🏭'} {c.name}</b><div className="hint">{c.city}{c.state ? ', ' + c.state : ''}</div></> },
          { key: 'code', label: 'Code', render: (c) => <b>{c.code || c.id}</b> },
          { key: 'industry', label: 'Industry', render: (c) => c.industry || '—' },
          { key: 'admin', label: 'Admin', render: (c) => c.admin || '-' },
          { key: 'users', label: 'Users', render: (c) => c.userCount ?? '' },
          { key: 'skus', label: 'SKUs', render: (c) => c.productCount ?? '' },
          { key: 'orders', label: 'Orders', render: (c) => c.orderCount ?? '' },
          { key: 'status', label: 'Status', render: (c) => statusBadge((c.storeStatus || c.status) === 'active' ? 'Delivered' : 'Cancelled') },
          { key: 'created', label: 'Created', render: (c) => <span className="hint">{c.createdAt || '—'}</span> },
          {
            key: 'act', label: 'Actions', render: (c) => (
              <span style={{ whiteSpace: 'nowrap' }}>
                <button className="btn btn-ghost btn-sm" onClick={() => onDetails(c.id)}>Details</button>{' '}
                <button className="btn btn-ghost btn-sm" onClick={() => onEdit(c.id)}>Edit</button>{' '}
                <Link className="btn btn-ghost btn-sm" to={'/super/companies/' + c.id}>Open</Link>{' '}
                <button className="btn btn-ghost btn-sm" onClick={() => onToggle(c)}>{(c.storeStatus || c.status) === 'active' ? 'Suspend' : 'Activate'}</button>
              </span>
            )
          }
        ]}
        rows={data.rows}
      />
      <Pager total={data.total} page={page} limit={LIMIT} onPage={setPage} />
    </>
  );
}

/* ---------------- admins tab ---------------- */
function AdminsTab({ q, setQ, co, setCo, st, setSt, cos, data, loading, err, page, setPage, onInvite, onView, onEdit, onToggle }) {
  if (loading) return <Skeleton h={220} />;
  if (err) return <Empty title={'⚠️ ' + err} />;
  return (
    <>
      <div className="section-head" style={{ marginTop: 0 }}>
        <h2 style={{ fontSize: 16 }}>Company Admins ({data.total})</h2>
        <button className="btn btn-primary btn-sm" onClick={onInvite}>+ Invite Admin</button>
      </div>
      <div className="toolbar">
        <input placeholder="🔍 Search name, email, company…" value={q} onChange={(e) => setQ(e.target.value)} />
        <select value={co} onChange={(e) => setCo(e.target.value)}>
          <option value="all">All companies</option>
          {cos.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <select value={st} onChange={(e) => setSt(e.target.value)}>
          <option value="all">All statuses</option>
          <option value="true">Active</option>
          <option value="false">Inactive</option>
        </select>
      </div>
      <DataTable
        rowKey={(r) => r.id}
        empty="No administrators match."
        cols={[
          { key: 'name', label: 'Name', render: (u) => <b>{u.name}</b> },
          { key: 'email', label: 'Email', render: (u) => u.email },
          { key: 'co', label: 'Company', render: (u) => u.companyName || u.companyId },
          { key: 'mob', label: 'Mobile', render: (u) => u.mobile || '—' },
          { key: 'st', label: 'Status', render: (u) => statusBadge(u.active !== false ? 'Delivered' : 'Cancelled') },
          { key: 'cr', label: 'Created', render: (u) => <span className="hint">{u.createdAt || '—'}</span> },
          {
            key: 'act', label: 'Actions', render: (u) => (
              <span style={{ whiteSpace: 'nowrap' }}>
                <button className="btn btn-ghost btn-sm" onClick={() => onView(u.id)}>View</button>{' '}
                <button className="btn btn-ghost btn-sm" onClick={() => onEdit(u.id)}>Edit</button>{' '}
                <button className="btn btn-ghost btn-sm" onClick={() => onToggle(u)}>{u.active !== false ? 'Deactivate' : 'Activate'}</button>
              </span>
            )
          }
        ]}
        rows={data.rows}
      />
      <Pager total={data.total} page={page} limit={LIMIT} onPage={setPage} />
    </>
  );
}

/* ---------------- users tab ---------------- */
function UsersTab({ q, setQ, co, setCo, role, setRole, st, setSt, cos, data, loading, err, page, setPage, onAdd, onView, onEdit, onToggle, onRoleChanged }) {
  if (loading) return <Skeleton h={220} />;
  if (err) return <Empty title={'⚠️ ' + err} />;
  return (
    <>
      <div className="section-head" style={{ marginTop: 0 }}>
        <h2 style={{ fontSize: 16 }}>Company Users ({data.total})</h2>
        <button className="btn btn-primary btn-sm" onClick={onAdd}>+ Add User</button>
      </div>
      <div className="toolbar">
        <input placeholder="🔍 Search name, email, company…" value={q} onChange={(e) => setQ(e.target.value)} />
        <select value={co} onChange={(e) => setCo(e.target.value)}>
          <option value="all">All companies</option>
          {cos.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <select value={role} onChange={(e) => setRole(e.target.value)}>
          <option value="all">All roles</option>
          <option value="sales_user">Sales User</option>
          <option value="company_admin">Company Admin</option>
        </select>
        <select value={st} onChange={(e) => setSt(e.target.value)}>
          <option value="all">All statuses</option>
          <option value="true">Active</option>
          <option value="false">Inactive</option>
        </select>
      </div>
      <DataTable
        rowKey={(r) => r.id}
        empty="No users match."
        cols={[
          { key: 'name', label: 'Name', render: (u) => <b>{u.name}</b> },
          { key: 'email', label: 'Email', render: (u) => u.email },
          { key: 'co', label: 'Company', render: (u) => u.companyName || u.companyId },
          { key: 'role', label: 'Role', render: (u) => u.role === 'company_admin' ? 'Company Admin' : 'Sales User' },
          { key: 'mob', label: 'Mobile', render: (u) => u.mobile || '—' },
          { key: 'st', label: 'Status', render: (u) => statusBadge(u.active !== false ? 'Delivered' : 'Cancelled') },
          {
            key: 'act', label: 'Actions', render: (u) => (
              <span style={{ whiteSpace: 'nowrap' }}>
                <button className="btn btn-ghost btn-sm" onClick={() => onView(u.id)}>View</button>{' '}
                <button className="btn btn-ghost btn-sm" onClick={() => onEdit(u.id)}>Edit</button>{' '}
                <RoleButton id={u.id} role={u.role} name={u.name} company={u.companyName || u.companyId} onChanged={onRoleChanged} />{' '}
                <button className="btn btn-ghost btn-sm" onClick={() => onToggle(u)}>{u.active !== false ? 'Deactivate' : 'Activate'}</button>
              </span>
            )
          }
        ]}
        rows={data.rows}
      />
      <Pager total={data.total} page={page} limit={LIMIT} onPage={setPage} />
    </>
  );
}

/* ---------------- company create/edit modal ---------------- */
function CompanyModal({ id, onClose, onSaved }) {
  const isEdit = !!id;
  const [v, setV] = useState(emptyCompany());
  const [ready, setReady] = useState(!isEdit);
  const [err, setErr] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!isEdit) return;
    api.get('/api/companies/' + id)
      .then((c) => { setV(companyFromDetail(c)); setReady(true); })
      .catch((e) => setErr(e.message || 'Company not found.'));
  }, [id, isEdit]);

  const on = (k, val) => setV((p) => ({ ...p, [k]: val }));

  async function save() {
    setErr('');
    let codes = [];
    if (!isEdit) {
      try {
        const all = await api.get('/api/companies?limit=200');
        codes = asRows(all).rows.map((x) => (x.code || x.id || '').toUpperCase());
      } catch { /* server enforces uniqueness */ }
    }
    const msg = validateCompany(v, { isNew: !isEdit, codes });
    if (msg) { setErr(msg); return; }
    setSaving(true);
    try {
      const payload = companyPayload(v, !isEdit);
      if (isEdit) await api.put('/api/companies/' + id, payload);
      else await api.post('/api/companies', payload);
      toast(isEdit ? 'Company updated' : v.name.trim() + ' created — available immediately', '🏭');
      onSaved();
    } catch (e) {
      setErr(e.message || 'Save failed');
      setSaving(false);
    }
  }

  return (
    <Modal title={'🏢 ' + (isEdit ? 'Edit Company' + (v.name ? ' — ' + v.name : '') : 'Create Company')} onClose={onClose} wide>
      {!ready ? <p className="hint">Loading…</p> : <CompanyFormFields v={v} on={on} errors={{}} isNew={!isEdit} codeLocked={isEdit} />}
      {err && <div className="hint" style={{ color: '#DC2626', marginTop: 8 }}>{err}</div>}
      <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 12 }}>
        <button className="btn btn-ghost btn-sm" onClick={onClose}>Cancel</button>
        <button className="btn btn-primary btn-sm" id="coSaveBtn" disabled={saving || !ready} onClick={save}>💾 {saving ? 'Saving…' : (isEdit ? 'Save changes' : 'Create company')}</button>
      </div>
    </Modal>
  );
}

/* ---------------- company details modal with quick actions ---------------- */
function CompanyDetails({ id, onClose, onEdit, onManage }) {
  const [d, setD] = useState(null);
  const [err, setErr] = useState('');
  useEffect(() => {
    api.get('/api/companies/' + id).then(setD).catch((e) => setErr(e.message || 'Company not found.'));
  }, [id]);

  if (err) return <Modal title="🏢 Company details" onClose={onClose} wide><Empty title={'⚠️ ' + err} /></Modal>;
  if (!d) return <Modal title="🏢 Company details" onClose={onClose} wide><Skeleton h={160} /></Modal>;

  const st = d.storeStatus || d.status;
  const adm = d.admin || {};
  return (
    <Modal title={(d.logo || '🏭') + ' ' + d.name} onClose={onClose} wide>
      <p className="hint" style={{ marginTop: 0 }}>{d.code || d.id} • {d.industry || ''} • {d.city || ''} {statusBadge(st === 'active' ? 'Delivered' : 'Cancelled')}</p>
      <div className="form-grid">
        <Field label="Email / Phone"><div style={{ fontSize: 13 }}><b>{d.email || '—'}</b><div className="hint">{d.phone || ''}</div></div></Field>
        <Field label="Address"><div style={{ fontSize: 13 }}>{d.address || '—'}<div className="hint">{d.city || ''} {d.state || ''} {d.pin || ''}</div></div></Field>
        <Field label="Company Admin"><div style={{ fontSize: 13 }}><b>{adm.name || '—'}</b><div className="hint">{adm.email || ''}</div></div></Field>
        <Field label="Plan / Created"><div style={{ fontSize: 13 }}>{d.plan || ''}<div className="hint">{d.createdAt || ''}</div></div></Field>
      </div>
      {d.description && <p style={{ fontSize: 13 }}>{d.description}</p>}
      <div className="mgmt-cards" style={{ gridTemplateColumns: 'repeat(4,1fr)' }}>
        <div className="ind-stat"><b>{d.userCount || 0}</b><p>Users</p></div>
        <div className="ind-stat"><b>{d.productCount || 0}</b><p>SKUs</p></div>
        <div className="ind-stat"><b>{d.orderCount || 0}</b><p>Orders</p></div>
        <div className="ind-stat"><b>₹{(d.revenue || 0).toLocaleString('en-IN')}</b><p>Revenue</p></div>
      </div>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 12 }}>
        <button className="btn btn-primary btn-sm" onClick={() => onEdit(d.id)}>Edit Company</button>
        <button className="btn btn-ghost btn-sm" onClick={() => onManage('admins', d.id)}>Manage Admins</button>
        <button className="btn btn-ghost btn-sm" onClick={() => onManage('users', d.id)}>Manage Users</button>
        <Link className="btn btn-ghost btn-sm" to={'/super/companies/' + d.id + '?tab=catalog'} onClick={onClose}>Products</Link>
        <Link className="btn btn-ghost btn-sm" to={'/super/companies/' + d.id + '?tab=categories'} onClick={onClose}>Categories</Link>
        <Link className="btn btn-ghost btn-sm" to={'/super/companies/' + d.id + '?tab=orders'} onClick={onClose}>Orders</Link>
        <Link className="btn btn-ghost btn-sm" to={'/super/companies/' + d.id} onClick={onClose}>Full workspace →</Link>
      </div>
    </Modal>
  );
}
