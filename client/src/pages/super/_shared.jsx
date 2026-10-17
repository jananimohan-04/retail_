/* Shared super-admin helpers: user modal/view (saveUserModal semantics) and the
   suspend/activate impact confirm (coToggle semantics). Not a route. */
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../api';
import { Field, Modal, Confirm, statusBadge, toast } from '../../components/ui';

const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

export function asRows(d) {
  if (!d) return { rows: [], total: 0, page: 1, limit: 8 };
  if (Array.isArray(d)) return { rows: d, total: d.length, page: 1, limit: d.length || 8 };
  return { rows: d.rows || [], total: d.total ?? (d.rows || []).length, page: d.page || 1, limit: d.limit || 8 };
}

export function csvDownload(filename, cols, rows) {
  const esc = (x) => `"${String(x ?? '').replace(/"/g, '""')}"`;
  const csv = [cols.join(','), ...rows.map((r) => r.map(esc).join(','))].join('\n');
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
  a.download = filename;
  a.click();
}

export async function fetchCompanyOptions() {
  const d = await api.get('/api/companies?limit=200');
  return asRows(d).rows;
}

/* Create/edit user modal — validation mirrors legacy saveUserModal exactly.
   Role select NEVER offers super_admin. */
export function UserModal({ preset = {}, editId, onClose, onSaved }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [mobile, setMobile] = useState('');
  const [companyId, setCompanyId] = useState(preset.companyId || '');
  const [role, setRole] = useState(preset.role || 'sales_user');
  const [cos, setCos] = useState([]);
  const [err, setErr] = useState('');
  const [saving, setSaving] = useState(false);
  const lockCo = !!preset.companyId;
  const isEdit = !!editId;

  useEffect(() => {
    if (lockCo) {
      api.get('/api/companies/' + preset.companyId).then((c) => setCos([{ id: c.id, name: c.name, code: c.code }])).catch(() => {});
    } else {
      fetchCompanyOptions().then(setCos).catch(() => {});
    }
    if (isEdit) {
      api.get('/api/users?limit=200').then((d) => {
        const u = asRows(d).rows.find((x) => x.id === editId);
        if (u) {
          setName(u.name || ''); setEmail(u.email || ''); setMobile(u.mobile || '');
          setCompanyId(u.companyId || ''); setRole(u.role === 'company_admin' ? 'company_admin' : 'sales_user');
        }
      }).catch(() => {});
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editId]);

  const coName = (cid) => (cos.find((c) => c.id === cid) || {}).name || cid;

  async function save() {
    setErr('');
    const nm = name.trim(), em = email.trim(), mob = mobile.trim();
    if (!nm) return setErr('Full name is required.');
    if (!EMAIL_RE.test(em)) return setErr('A valid Google email is required.');
    if (!companyId) return setErr('Select a company.');
    if (!['sales_user', 'company_admin'].includes(role)) return setErr('Invalid role.');
    if (!isEdit) {
      try {
        const d = await api.get('/api/users?limit=200');
        if (asRows(d).rows.some((x) => (x.email || '').toLowerCase() === em.toLowerCase())) return setErr('This email is already registered.');
      } catch { /* server enforces uniqueness */ }
    }
    setSaving(true);
    try {
      const payload = isEdit ? { name: nm, mobile: mob, role, companyId } : { name: nm, email: em, mobile: mob, role, companyId };
      if (isEdit) await api.patch('/api/users/' + editId, payload);
      else await api.post('/api/users', payload);
      toast(isEdit ? 'User updated' : nm + ' added to ' + coName(companyId), '👥');
      onSaved();
    } catch (e) {
      setErr(e.message || 'Save failed');
      setSaving(false);
    }
  }

  return (
    <Modal title={'👥 ' + (isEdit ? 'Edit User' + (name ? ' — ' + name : '') : (role === 'company_admin' ? 'Invite Company Admin' : 'Add User'))} onClose={onClose}>
      <Field label="Full name" req>
        <input id="mu_name" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Priya Sharma" />
      </Field>
      <Field label={'Google email' + (isEdit ? ' (locked)' : '')} req>
        <input id="mu_email" value={email} onChange={(e) => setEmail(e.target.value)} disabled={isEdit} placeholder="name@gmail.com" />
      </Field>
      <Field label="Mobile">
        <input id="mu_mobile" value={mobile} onChange={(e) => setMobile(e.target.value)} placeholder="+91 …" />
      </Field>
      <Field label="Company" req>
        {lockCo
          ? <><input value={(coName(companyId) || '') + ' (' + companyId + ')'} disabled /><input type="hidden" id="mu_company" value={companyId} /></>
          : (
            <select id="mu_company" value={companyId} onChange={(e) => setCompanyId(e.target.value)}>
              <option value="">— Select company —</option>
              {cos.map((c) => <option key={c.id} value={c.id}>{c.name} ({c.code || c.id})</option>)}
            </select>
          )}
      </Field>
      <Field label="Role" req hint="Super Admin can only be assigned from server-side provisioning.">
        <select id="mu_role" value={role} onChange={(e) => setRole(e.target.value)}>
          <option value="sales_user">Sales User</option>
          <option value="company_admin">Company Admin</option>
        </select>
      </Field>
      {err && <div className="hint" id="muErr" style={{ color: '#DC2626' }}>{err}</div>}
      <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 12 }}>
        <button className="btn btn-ghost btn-sm" onClick={onClose}>Cancel</button>
        <button className="btn btn-primary btn-sm" id="muSaveBtn" disabled={saving} onClick={save}>💾 {saving ? 'Saving…' : (isEdit ? 'Save changes' : 'Create user')}</button>
      </div>
    </Modal>
  );
}

/* Read-only user card with quick actions (legacy userView). */
export function UserView({ id, onClose, onChanged, onEdit }) {
  const [u, setU] = useState(null);
  const [err, setErr] = useState('');
  useEffect(() => {
    api.get('/api/users?limit=200').then((d) => {
      const f = asRows(d).rows.find((x) => x.id === id);
      if (!f) setErr('User not found.');
      else setU(f);
    }).catch((e) => setErr(e.message));
  }, [id]);

  async function toggle() {
    try {
      await api.patch('/api/users/' + id, { active: !(u.active !== false) });
      toast(u.active !== false ? 'Account deactivated' : 'Account activated', u.active !== false ? '⛔' : '✅');
      onChanged();
    } catch (e) { toast(e.message, '⚠️'); }
  }

  if (err) return <Modal title="👤 User" onClose={onClose}><div className="empty">⚠️ {err}</div></Modal>;
  if (!u) return <Modal title="👤 User" onClose={onClose}><p className="hint">Loading…</p></Modal>;

  return (
    <Modal title={'👤 ' + u.name} onClose={onClose}>
      <div className="form-grid">
        <Field label="Email"><div><b>{u.email}</b></div></Field>
        <Field label="Mobile"><div>{u.mobile || '—'}</div></Field>
        <Field label="Company"><div><b>{u.companyName || u.companyId}</b> <span className="hint">{u.companyId || ''}</span></div></Field>
        <Field label="Role"><div>{(u.role || '').replace('_', ' ')}</div></Field>
        <Field label="Account status"><div>{statusBadge(u.active !== false ? 'Delivered' : 'Cancelled')}</div></Field>
        <Field label="Created"><div>{u.createdAt || '—'}</div></Field>
      </div>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 12 }}>
        <button className="btn btn-ghost btn-sm" onClick={() => onEdit(u.id)}>Edit</button>
        {u.role !== 'super_admin' && (
          <>
            <RoleButton id={u.id} role={u.role} name={u.name} company={u.companyName || u.companyId} onChanged={onChanged} />
            <button className="btn btn-ghost btn-sm" onClick={toggle}>{u.active !== false ? 'Deactivate' : 'Activate'}</button>
            {u.companyId && <Link className="btn btn-ghost btn-sm" to={'/super/companies/' + u.companyId} onClick={onClose}>Open company →</Link>}
          </>
        )}
      </div>
    </Modal>
  );
}

/* Role promote/demote with confirm (legacy coUserRole). Super Admin is protected. */
export function RoleButton({ id, role, name, company, onChanged }) {
  const [cf, setCf] = useState(false);
  const [busy, setBusy] = useState(false);
  if (role === 'super_admin') return null;
  const to = role === 'sales_user' ? 'company_admin' : 'sales_user';

  async function go() {
    setBusy(true);
    try {
      await api.patch('/api/users/' + id, { role: to });
      toast('Role updated to ' + to.replace('_', ' '), '👥');
      setCf(false);
      onChanged();
    } catch (e) { toast(e.message, '⚠️'); }
    finally { setBusy(false); }
  }

  return (
    <>
      <button className="btn btn-ghost btn-sm" onClick={() => {
        if (role === 'super_admin') { toast('Super Admin role is protected', '⛔'); return; }
        setCf(true);
      }}>{role === 'sales_user' ? 'Make admin' : 'Make sales'}</button>
      {cf && (
        <Confirm
          title={(to === 'company_admin' ? 'Promote ' : 'Demote ') + (name || id)}
          body={to === 'company_admin'
            ? `<b>${name || ''}</b> will become <b>Company Admin</b> of ${company || ''} with full access to that company's catalog, orders and users.`
            : `<b>${name || ''}</b> will become a <b>Sales User</b> and lose administrative access.`}
          okLabel={to === 'company_admin' ? 'Promote to admin' : 'Demote to sales'}
          danger={to !== 'company_admin'}
          busy={busy}
          onCancel={() => setCf(false)}
          onOk={go}
        />
      )}
    </>
  );
}

/* Suspend/activate with impact warning — never deletes (legacy coToggle).
   PUT /api/companies/:id { storeStatus }. */
export function SuspendConfirm({ co, onCancel, onDone }) {
  const [busy, setBusy] = useState(false);
  const cur = co.storeStatus || co.status || 'active';
  const to = cur === 'active' ? 'suspended' : 'active';

  async function go() {
    setBusy(true);
    try {
      await api.put('/api/companies/' + co.id, { storeStatus: to });
      toast(co.name + (to === 'active' ? ' activated' : ' suspended'), to === 'active' ? '✅' : '⛔');
      onDone();
    } catch (e) { toast(e.message, '⚠️'); setBusy(false); }
  }

  return (
    <Confirm
      title={(to === 'active' ? 'Activate ' : 'Suspend ') + (co.name || co.id)}
      danger={to !== 'active'}
      body={to === 'active'
        ? `Reopen the store for <b>${co.name || co.id}</b>. Users regain access immediately.`
        : `Suspend <b>${co.name || co.id}</b>? Its store closes and <b>${co.userCount || 0} user(s)</b> lose access. ${(co.pendingOrders ? `<b style="color:#92400E">${co.pendingOrders} pending order(s) need attention first.</b> ` : '')}Nothing is deleted — users, products, inventory and orders are preserved and the company can be reactivated.`}
      okLabel={to === 'active' ? 'Activate company' : 'Suspend company'}
      busy={busy}
      onCancel={onCancel}
      onOk={go}
    />
  );
}

/* Activate/deactivate a user account (legacy coUserToggle). */
export async function toggleUserActive(u, onDone) {
  try {
    await api.patch('/api/users/' + u.id, { active: !(u.active !== false) });
    toast(u.active !== false ? 'Account deactivated' : 'Account activated', u.active !== false ? '⛔' : '✅');
    onDone();
  } catch (e) { toast(e.message, '⚠️'); }
}
