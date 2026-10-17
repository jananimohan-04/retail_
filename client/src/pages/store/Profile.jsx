/* Store profile — mirrors legacy vProfile: me-derived fields + Save toast + Logout. */
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../auth';
import { toast } from '../../components/ui';

export default function Profile() {
  const { me, logout } = useAuth();
  const nav = useNavigate();

  useEffect(() => { window.scrollTo(0, 0); }, []);
  if (!me) return null;

  const out = async () => {
    await logout();
    nav('/login', { replace: true });
  };

  return (
    <>
      <div className="section-head"><h2>My profile</h2></div>
      <div className="card">
        <div className="card-pad" style={{ display: 'flex', gap: 18, alignItems: 'center', flexWrap: 'wrap' }}>
          <div className="avatar" style={{ width: 68, height: 68, fontSize: 26 }}>{(me.name || 'U')[0]}</div>
          <div>
            <h2 style={{ margin: 0 }}>{me.name}</h2>
            <p className="hint" style={{ margin: '2px 0' }}>{String(me.role || '').replace('_', ' ')} • {(me.companyId || 'platform')} • {me.email || ''}{me.google ? ' • Google sign-in' : ''}</p>
            <span className="status s-active">Active</span>
          </div>
        </div>
        <div className="card-pad" style={{ borderTop: '1px solid var(--line)' }}>
          <div className="form-grid">
            <div className="field"><label>Name</label><input defaultValue={me.name} /></div>
            <div className="field"><label>Mobile</label><input defaultValue="98765 00001" /></div>
            <div className="field"><label>Email</label><input defaultValue={me.email || ''} /></div>
            <div className="field"><label>Default plant</label><input defaultValue="Chakan, Pune" /></div>
          </div>
          <button className="btn btn-primary btn-sm" onClick={() => toast('Profile saved (demo)')}>Save profile</button>{' '}
          <button className="btn btn-ghost btn-sm" onClick={out}>⏻ Logout</button>
        </div>
      </div>
    </>
  );
}
