/* Supabase Auth bridge (Google OAuth). Secret key stays server-side only.
   Frontend receives only url + publishable key via /api/config. */
require('dotenv').config({ path: require('path').join(__dirname, '.env') });
const { createClient } = require('@supabase/supabase-js');

const URL = process.env.SUPABASE_URL || '';
const PUB = process.env.SUPABASE_PUBLISHABLE_KEY || '';
const SECRET = process.env.SUPABASE_SECRET_KEY || '';
const PLACEHOLDER = URL.includes('PASTE-YOUR');
const enabled = URL.startsWith('http') && !PLACEHOLDER && !!SECRET;

const admin = enabled ? createClient(URL, SECRET) : null;

async function authUserFromToken(token) {
  if (!admin || !token) return null;
  const { data, error } = await admin.auth.getUser(token);
  if (error || !data || !data.user) return null;
  return data.user;
}

module.exports = {
  enabled,
  admin,
  authUserFromToken,
  superEmail: (process.env.SUPER_ADMIN_EMAIL || 'jananimohan44@gmail.com').toLowerCase(),
  publicConfig: () => ({ supabaseUrl: PLACEHOLDER ? '' : URL, publishableKey: PUB, googleEnabled: enabled })
};
