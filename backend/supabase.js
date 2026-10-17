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

/* product media lives in its own PUBLIC bucket — never in the private `retail-data` bucket
   (that one holds db.json and must stay private) */
const MEDIA_BUCKET = process.env.SUPABASE_MEDIA_BUCKET || 'retail-media';
const MEDIA_MAX_BYTES = 50 * 1024 * 1024;
let bucketReady = null;
function ensureMediaBucket() {
  if (!admin) return Promise.reject(new Error('Supabase not configured'));
  bucketReady = bucketReady || (async () => {
    const { data } = await admin.storage.getBucket(MEDIA_BUCKET);
    if (data) return true;
    const { error } = await admin.storage.createBucket(MEDIA_BUCKET, { public: true, fileSizeLimit: MEDIA_MAX_BYTES, allowedMimeTypes: ['image/*', 'video/*'] });
    if (error && !/already exists/i.test(error.message)) throw error;
    return true;
  })().catch(e => { bucketReady = null; throw e; });
  return bucketReady;
}
const mediaPublicUrl = p => admin.storage.from(MEDIA_BUCKET).getPublicUrl(p).data.publicUrl;
/* "https://<project>.supabase.co/storage/v1/object/public/retail-media/<path>" -> "<path>" (null if not ours) */
function mediaPathFromUrl(u) {
  const marker = '/storage/v1/object/public/' + MEDIA_BUCKET + '/';
  const s = String(u || '');
  if (!URL || !s.startsWith(URL) || !s.includes(marker)) return null;
  return decodeURIComponent(s.slice(s.indexOf(marker) + marker.length).split('?')[0]);
}

module.exports = {
  enabled,
  admin,
  authUserFromToken,
  MEDIA_BUCKET,
  MEDIA_MAX_BYTES,
  ensureMediaBucket,
  mediaPublicUrl,
  mediaPathFromUrl,
  superEmail: (process.env.SUPER_ADMIN_EMAIL || 'jananimohan44@gmail.com').toLowerCase(),
  publicConfig: () => ({ supabaseUrl: PLACEHOLDER ? '' : URL, publishableKey: PUB, googleEnabled: enabled })
};
