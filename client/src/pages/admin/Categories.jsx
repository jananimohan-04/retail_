/* Company categories — chips + table with SKU counts, rename (PUT), add (POST, company-scoped). */
import { useEffect, useState } from 'react';
import { api } from '../../api';
import { useAuth } from '../../auth';
import { PageHead, Field, Modal, Empty, Skeleton, toast } from '../../components/ui';

export default function Categories() {
  const { me } = useAuth();
  const [cats, setCats] = useState(null);
  const [prods, setProds] = useState([]);
  const [err, setErr] = useState('');
  const [modal, setModal] = useState(null); // {mode:'add'} | {mode:'rename', cat}
  const [mName, setMName] = useState('');
  const [mIcon, setMIcon] = useState('🏭');
  const [mDesc, setMDesc] = useState('');
  const [mErr, setMErr] = useState('');
  const [mBusy, setMBusy] = useState(false);

  function load() {
    api.get('/api/categories/company/' + me.companyId).then((d) => setCats(Array.isArray(d) ? d : (d.rows || []))).catch((e) => setErr(e.message));
    api.get('/api/products').then((d) => setProds(Array.isArray(d) ? d : (d.rows || []))).catch(() => {});
  }

  useEffect(load, [me && me.companyId]); // eslint-disable-line react-hooks/exhaustive-deps

  if (err && !cats) return <Empty icon="⚠️" title={err} sub="Could not reach the backend." />;
  if (!cats) return <Skeleton h={220} />;

  const count = (id) => prods.filter((p) => p.category === id).length;

  function openAdd() {
    setMName(''); setMIcon('🏭'); setMDesc(''); setMErr('');
    setModal({ mode: 'add' });
  }
  function openRename(c) {
    setMName(c.name); setMIcon(c.icon || '🏭'); setMDesc(c.desc || ''); setMErr('');
    setModal({ mode: 'rename', cat: c });
  }

  async function submit() {
    const name = (mName || '').trim();
    if (!name) { setMErr('Category name is required.'); return; }
    setMBusy(true);
    setMErr('');
    try {
      if (modal.mode === 'add') {
        await api.post('/api/categories', { name, icon: mIcon || '🏭', desc: mDesc || '' });
        toast('Category "' + name + '" created', '🗂️');
      } else {
        await api.put('/api/categories/' + modal.cat.id, { name, icon: mIcon || '🏭', desc: mDesc || '' });
        toast('Category renamed', '🗂️');
      }
      setModal(null);
      load();
    } catch (e) {
      setMErr(e.message || 'Save failed');
    } finally {
      setMBusy(false);
    }
  }

  return (
    <>
      <PageHead
        title={'Categories (' + cats.length + ')'}
        actions={<button className="btn btn-primary btn-sm" onClick={openAdd}>+ New category</button>}
      />
      <div className="card"><div className="card-pad">
        <div className="cat-row" style={{ flexWrap: 'wrap' }}>
          {cats.map((c) => <span className="cat-chip" key={c.id}>{c.icon} {c.name} <b>• {count(c.id)}</b></span>)}
        </div>
        <div className="table-wrap" style={{ marginTop: 12 }}><table><tbody>
          <tr><th>Category</th><th>Description</th><th>SKUs</th><th>Action</th></tr>
          {cats.map((c) => (
            <tr key={c.id}>
              <td>{c.icon} <b>{c.name}</b></td>
              <td className="hint">{c.desc || ''}</td>
              <td>{count(c.id)}</td>
              <td><button className="btn btn-ghost btn-sm" onClick={() => openRename(c)}>Rename</button></td>
            </tr>
          ))}
        </tbody></table></div>
        <p className="hint">Categories are per-company in production. Do not assume every company sells every category.</p>
      </div></div>
      {modal && (
        <Modal title={modal.mode === 'add' ? '➕ New category' : '✏️ Rename category'} onClose={() => setModal(null)}>
          <Field label="Category name *"><input value={mName} onChange={(e) => setMName(e.target.value)} placeholder="e.g. Precision Tooling" /></Field>
          <Field label="Icon (emoji)"><input value={mIcon} onChange={(e) => setMIcon(e.target.value)} placeholder="🏭" /></Field>
          <Field label="Description"><input value={mDesc} onChange={(e) => setMDesc(e.target.value)} placeholder="Short description" /></Field>
          {mErr && <p className="ferr">⚠️ {mErr}</p>}
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 12 }}>
            <button className="btn btn-ghost btn-sm" onClick={() => setModal(null)}>Cancel</button>
            <button className="btn btn-primary btn-sm" disabled={mBusy} onClick={submit}>{mBusy ? 'Saving…' : (modal.mode === 'add' ? 'Create category' : 'Save changes')}</button>
          </div>
        </Modal>
      )}
    </>
  );
}
