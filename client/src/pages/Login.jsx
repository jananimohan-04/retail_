/* Login — mirrors legacy vLogin: showcase carousel + Google button + demo pills. */
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../auth';
import { toast } from '../components/ui';

const CNC_SLIDES = [
  { image: 'https://images.unsplash.com/photo-1504328345606-18bbc8c9d7d1?auto=format&fit=crop&w=1400&q=85', title: 'Heavy CNC Machining Centers', subtitle: '12-Station Servo Turret & High-Torque Precision Turning', category: 'CNC Machining Center' },
  { image: 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&w=1400&q=85', title: 'Precision Metal Turning & Coolant Flow', subtitle: 'High-speed alloy cutting with continuous multi-axis feed', category: 'CNC Turning & Cutting' },
  { image: 'https://images.unsplash.com/photo-1581092160562-40aa08e78837?auto=format&fit=crop&w=1400&q=85', title: '5-Axis Precision Milling Center', subtitle: 'Complex aeronautical profiling with C7 rolled ball screws', category: 'Precision Milling' },
  { image: 'https://images.unsplash.com/photo-1504917595217-d4dc5ebe6122?auto=format&fit=crop&w=1400&q=85', title: 'Solid Carbide & Spindle Assemblies', subtitle: 'AlCrN-coated end mills engineered for 55 HRC hardened steels', category: 'Cutting Tools & Spindles' },
  { image: 'https://images.unsplash.com/photo-1581091012184-5c1d9ae4a3d2?auto=format&fit=crop&w=1400&q=85', title: 'Robotic Automation Cells', subtitle: 'Intelligent part handling and automated pallet management', category: 'Robotic Automation' },
  { image: 'https://images.unsplash.com/photo-1581092918056-0c4c3acd3789?auto=format&fit=crop&w=1400&q=85', title: 'Modern CNC Factory Ecosystem', subtitle: 'Live ERP synchronization with real-time inventory balances', category: 'Connected Factory Floor' }
];

export const rolePath = (role) => role === 'super_admin' ? '/super/dashboard'
  : role === 'company_admin' ? '/admin/dashboard'
  : (role === 'pending' || role === 'disabled') ? '/pending' : '/store/home';

export default function Login() {
  const { me, loginAs, googleLogin } = useAuth();
  const nav = useNavigate();
  const [slide, setSlide] = useState(0);
  const [paused, setPaused] = useState(false);
  const [setupMsg, setSetupMsg] = useState(false);

  useEffect(() => { window.scrollTo(0, 0); }, []);
  useEffect(() => {
    document.body.classList.add('auth-open');
    return () => document.body.classList.remove('auth-open');
  }, []);
  useEffect(() => {
    if (paused) return;
    const t = setInterval(() => setSlide((s) => (s + 1) % CNC_SLIDES.length), 4500);
    return () => clearInterval(t);
  }, [paused]);
  useEffect(() => {
    if (me) nav(rolePath(me.role), { replace: true });
  }, [me, nav]);

  const doGoogle = async () => {
    try {
      await googleLogin();
    } catch (e) {
      setSetupMsg(true);
      toast(e.message || 'Google OAuth configuration required (see setup guidance)', '⚠️');
    }
  };
  const demo = (role) => {
    loginAs(role);
    nav(rolePath(role), { replace: true });
  };

  return (
    <div className="auth-layout">
      <div className="auth-showcase" onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)}>
        <div className="carousel-track">
          {CNC_SLIDES.map((s, i) => (
            <div key={i} className={'carousel-slide' + (i === slide ? ' active' : '')}>
              <img src={s.image} alt={s.title} onError={(e) => { e.currentTarget.src = `https://picsum.photos/seed/argus-cnc-${i}/1200/900`; }} />
            </div>
          ))}
        </div>
        <div className="carousel-overlay"></div>
        <div className="showcase-content">
          <div className="showcase-header">
            <img className="showcase-logo" src="assets/argus-logo.png" alt="ARGUSCNC — Creating Future Factories" />
          </div>
          <div className="showcase-body">
            <div className="showcase-tag">ENGINEERING THE FUTURE</div>
            <h1>Precision manufacturing.<br />Intelligent automation.<br />Industrial excellence.</h1>
            <p className="desc">Your connected platform for CNC manufacturing, industrial procurement, and ERP operations.</p>
            <div className="showcase-features">
              <span className="showcase-feat"><span>⚙️</span> Multi-Company ERP</span>
              <span className="showcase-feat"><span>📦</span> Industrial Inventory</span>
              <span className="showcase-feat"><span>⚡</span> Smart Procurement</span>
            </div>
          </div>
          <div className="showcase-footer"></div>
        </div>
      </div>

      <div className="auth-panel">
        <div className="auth-box">
          <div className="auth-brand">
            <img src="assets/argus-logo.png" alt="ARGUSCNC Logo" />
          </div>
          <div className="auth-head">
            <h2>Welcome Back</h2>
            <p>Sign in securely with your Google account to access your company's industrial workspace.</p>
          </div>

          <button className="btn-google" onClick={doGoogle}>
            <svg viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
            </svg>
            <span>Continue with Google</span>
          </button>

          <div className="auth-security">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>
            <span>Secure access to your authorized workspace.</span>
          </div>

          {setupMsg && (
            <div className="auth-notice warning" style={{ marginTop: 14, textAlign: 'left' }}>
              <div style={{ fontWeight: 700, marginBottom: 4, display: 'flex', alignItems: 'center', gap: 6 }}>
                <span>⚙️</span> Google OAuth Setup Required
              </div>
              <p style={{ margin: '0 0 8px', fontSize: 12.5, color: '#78350F' }}>
                Supabase credentials are not connected yet. To enable live Google sign-in:
              </p>
              <ol style={{ margin: '0 0 0 18px', padding: 0, fontSize: 12, color: '#92400E' }}>
                <li>Open <code>backend/.env</code> in your workspace</li>
                <li>Replace <code>SUPABASE_URL</code> and <code>SUPABASE_PUBLISHABLE_KEY</code></li>
                <li>Enable Google Provider in your Supabase Auth dashboard</li>
              </ol>
            </div>
          )}

          <div style={{ display: 'flex', gap: 8, marginTop: 16, flexWrap: 'wrap', justifyContent: 'center' }}>
            <span className="hint" style={{ width: '100%', textAlign: 'center' }}>Instant Demo Access</span>
            <button className="pill" onClick={() => demo('super_admin')}>Super Admin</button>
            <button className="pill" onClick={() => demo('company_admin')}>Argus Admin</button>
            <button className="pill" onClick={() => demo('content_writer')}>Content Writer</button>
            <button className="pill" onClick={() => demo('finance')}>Finance</button>
            <button className="pill" style={{ background: '#ecfdf5', color: '#065f46', borderColor: '#a7f3d0' }} onClick={() => demo('sales_regional_partner')}>Regional Partner (+10%)</button>
            <button className="pill" style={{ background: '#faf5ff', color: '#6b21a8', borderColor: '#e9d5ff' }} onClick={() => demo('sales_channel_partner')}>Channel Partner (+15%)</button>
            <button className="pill" style={{ background: '#f0fdfa', color: '#115e59', borderColor: '#99f6e4' }} onClick={() => demo('sales_referral_partner')}>Referral Partner (+5%)</button>
            <button className="pill" onClick={() => demo('sales_user')}>Direct Sales</button>
          </div>
        </div>
      </div>
    </div>
  );
}
