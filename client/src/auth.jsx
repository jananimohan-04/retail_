/* Auth — mirrors legacy js/auth.js + loginAs behavior exactly. */
import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import { getSession, setSession, setGoogleToken, googleToken, api } from './api';

const AuthCtx = createContext(null);
export const useAuth = () => useContext(AuthCtx);

const DEMO = {
  super_admin: { role: 'super_admin', name: 'Aarav Shah', companyId: null, email: 'super@cncforge.io' },
  company_admin: { role: 'company_admin', name: 'Amina Khan', companyId: 'C-A', email: 'amina@apexcnc.in' },
  sales_user: { role: 'sales_user', name: 'Ravi Kumar', companyId: 'C-A', email: 'ravi@apexcnc.in' }
};

export function AuthProvider({ children }) {
  const [me, setMe] = useState(() => getSession());
  const [ready, setReady] = useState(false);
  const [oauth, setOauth] = useState(null); // supabase client or null
  const resolved = useRef(false);

  const resolveMe = useCallback(async (token) => {
    const r = await fetch('/api/me', { headers: { Authorization: 'Bearer ' + (token || '') } });
    const j = await r.json().catch(() => ({}));
    const u = (j && j.data) || {};
    if (!u.role) throw new Error('no role');
    const s = { role: u.role, companyId: u.companyId, name: u.name || 'User', email: u.email || '', google: true };
    setSession(s);
    setMe(s);
    return s;
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const r = await fetch('/api/config');
        const j = await r.json();
        const cfg = (j && j.data) || {};
        if (cfg.googleEnabled && cfg.supabaseUrl && cfg.publishableKey) {
          const client = createClient(cfg.supabaseUrl, cfg.publishableKey);
          setOauth(client);
          const { data } = await client.auth.getSession();
          if (data && data.session) {
            setGoogleToken(data.session.access_token);
            if (!resolved.current) { resolved.current = true; await resolveMe(data.session.access_token).catch(() => {}); }
          }
          client.auth.onAuthStateChange(async (ev, sess) => {
            if ((ev === 'SIGNED_IN' || ev === 'INITIAL_SESSION') && sess) {
              setGoogleToken(sess.access_token);
              resolved.current = true;
              await resolveMe(sess.access_token).catch(() => {});
            }
            if (ev === 'SIGNED_OUT') {
              setGoogleToken(null); setSession(null); setMe(null); resolved.current = false;
            }
          });
        }
      } catch { /* offline demo continues */ }
      setReady(true);
    })();
  }, [resolveMe]);

  const loginAs = useCallback((role) => {
    const s = { ...DEMO[role] };
    setSession(s);
    setMe(s);
    return s;
  }, []);

  const googleLogin = useCallback(async () => {
    if (!oauth) throw new Error('Google login not configured yet');
    const redirectUrl = window.location.origin + window.location.pathname;
    const { error } = await oauth.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: redirectUrl } });
    if (error) throw error;
  }, [oauth]);

  const logout = useCallback(async () => {
    try { if (oauth) await oauth.auth.signOut(); } catch { /* noop */ }
    setGoogleToken(null);
    setSession(null);
    setMe(null);
    resolved.current = false;
  }, [oauth]);

  return <AuthCtx.Provider value={{ me, ready, oauthReady: !!oauth, loginAs, googleLogin, logout, resolveMe, setMe }}>{children}</AuthCtx.Provider>;
}
