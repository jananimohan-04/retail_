/* Company sales users — table with orders count, create, activate/deactivate. */
import { useEffect, useState } from 'react';
import { api } from '../../api';
import { useAuth } from '../../auth';
import { PageHead, DataTable, Field, statusBadge, Modal, Empty, Skeleton, toast } from '../../components/ui';

export default function Users() {
  const { me } = useAuth();
  const [users, setUsers] = useState(null);
  const [orders, setOrders] = useState([]);
  const [err, setErr] = useState('');
  const [show, setShow] = useState(false);
  const [nName, setNName] = useState('');
  const [nEmail, setNEmail] = useState('');
  const [nMobile, setNMobile] = useState('');
  const [nRole, setNRole] = useState('sales_user');
  const [mErr, setMErr] = useState('');
  const [mBusy, setMBusy] = useState(false);

  function load() {
    api.get('/api/users').then((d) => {
      const list = Array.isArray(d) ? d : (d.rows || []);
      setUsers(list.filter((u) => !me.companyId || u.companyId === me.companyId));
    }).catch((e) => setErr(e.message));
    api.get('/api/orders').then((d) => setOrders(Array.isArray(d) ? d : (d.rows || []))).catch(() => {});
  }

  useEffect(load, [me && me.companyId]); // eslint-disable-line react-hooks/exhaustive-deps

  if (err && !users) return <Empty icon="⚠️" title={err} sub="Could not reach the backend." />;
  if (!users) return <Skeleton h={220} />;

  function toggle(u) {
    const to = !(u.active !== false);
    api.patch('/api/users/' + u.id, { active: to })
      .then(() => { toast(to ? u.name + ' activated' : u.name + ' deactivated', to ? '✅' : '⛔'); load(); })
      .catch((e) => toast(e.message, '⚠️'));
  }

  async function create() {
    const name = (nName || '').trim(), email = (nEmail || '').trim();
    if (!name) { setMErr('Full name is required.'); return; }
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) { setMErr('A valid email is required.'); return; }
    setMBusy(true);
    setMErr('');
    try {
      await api.post('/api/users', { name, email, mobile: nMobile || '', role: nRole, companyId: me.companyId });
      toast(name + ' created', '👥');
      setShow(false);
      setNName(''); setNEmail(''); setNMobile(''); setNRole('sales_user');
      load();
    } catch (e) {
      setMErr(e.message || 'Create failed');
    } finally {
      setMBusy(false);
    }
  }

  return (
    <>
      <PageHead
        title={'Sales users (' + users.length + ')'}
        actions={<button className="btn btn-primary btn-sm" onClick={() => { setMErr(''); setShow(true); }}>+ Create sales user</button>}
      />
      <div className="card"><div className="card-pad">
        <DataTable
          empty="No sales users created yet for this company."
          rowKey={(r) => r.id}
          cols={[
            { key: 'u', label: 'User', render: (u) => (<div><b>{u.name}</b><div className="hint">{(u.role || '').replace('_', ' ')}</div></div>) },
            { key: 'c', label: 'Contact', render: (u) => (<div>{u.email}<div className="hint">{u.mobile || ''}</div></div>) },
            { key: 's', label: 'Status', render: (u) => statusBadge(u.active !== false ? 'Delivered' : 'Cancelled') },
            { key: 'o', label: 'Orders', render: (u) => orders.filter((o) => o.salesUser === u.name).length },
            {
              key: 'a', label: 'Action', render: (u) => (
                <button className="btn btn-ghost btn-sm" onClick={() => toggle(u)}>{u.active !== false ? 'Deactivate' : 'Activate'}</button>)
            }
          ]}
          rows={users}
        />
      </div></div>
      {show && (
        <Modal title="👥 Create sales user" onClose={() => setShow(false)}>
          <Field label="Full name *"><input value={nName} onChange={(e) => setNName(e.target.value)} placeholder="e.g. Priya Sharma" /></Field>
          <Field label="Email *"><input value={nEmail} onChange={(e) => setNEmail(e.target.value)} placeholder="name@company.in" /></Field>
          <Field label="Mobile"><input value={nMobile} onChange={(e) => setNMobile(e.target.value)} placeholder="+91 …" /></Field>
          <Field label="Role *"><select value={nRole} onChange={(e) => setNRole(e.target.value)}><option value="sales_user">Sales User</option><option value="company_admin">Company Admin</option></select></Field>
          {mErr && <p className="ferr">⚠️ {mErr}</p>}
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 12 }}>
            <button className="btn btn-ghost btn-sm" onClick={() => setShow(false)}>Cancel</button>
            <button className="btn btn-primary btn-sm" disabled={mBusy} onClick={create}>{mBusy ? 'Saving…' : 'Create user'}</button>
          </div>
        </Modal>
      )}
    </>
  );
}
