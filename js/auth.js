/* Google OAuth (Supabase Auth) — no passwords. Backend verifies the token + maps email to ERP role. */
(() => {
  const A = window.Auth = { client: null, config: null, session: null, ready: false, _busy: false };
  A.token = () => (A.session && A.session.access_token) || null;
  A.init = async () => {
    try {
      const r = await fetch('/api/config');
      const j = await r.json();
      A.config = j.data || {};
    } catch (e) { A.ready = true; return false; }
    if (!A.config.googleEnabled || !window.supabase) { A.ready = true; return false; }
    try {
      A.client = window.supabase.createClient(A.config.supabaseUrl, A.config.publishableKey);
      const { data } = await A.client.auth.getSession();
      A.session = (data && data.session) || null;
      let loginInFlight = false;
      const doLogin = async (token) => {
        if (!token || loginInFlight) return;
        loginInFlight = true;
        try { if (window.App) await window.App.afterGoogleLogin(token); } finally { loginInFlight = false; }
      };
      A.client.auth.onAuthStateChange(async (ev, sess) => {
        A.session = sess;
        if ((ev === 'SIGNED_IN' || ev === 'INITIAL_SESSION') && sess && window.App) {
          await doLogin(sess.access_token);
        }
        if (ev === 'SIGNED_OUT' && window.App) window.App.afterGoogleLogout();
      });
      if (A.session && window.App && !window._meResolved) {
        await doLogin(A.session.access_token);
      }
    } catch (e) { /* offline demo continues */ }
    A.ready = true;
    return !!A.client;
  };
  A.signIn = async () => {
    if (!A.client) { if (window.App) window.App.toast('Google login not configured yet', '⚠️'); return; }
    // Clean redirect URL without hash fragment so Supabase handles token parsing cleanly
    const redirectUrl = window.location.origin + window.location.pathname;
    const { error } = await A.client.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: redirectUrl }
    });
    if (error && window.App) window.App.toast(error.message, '⚠️');
  };
  A.signOut = async () => {
    try { if (A.client) await A.client.auth.signOut(); } catch (e) { /* noop */ }
    A.session = null;
    if (window.App) window.App.afterGoogleLogout();
  };
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => { A.init(); });
  } else {
    A.init();
  }
})();
