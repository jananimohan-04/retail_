/* Controlled catalog migration: consumer demo catalog -> industrial seed.
   - Backs up backend/db.json to backend/db.backup-<timestamp>.json (never deletes silently).
   - Replaces ONLY categories + products with the industrial seed.
   - Preserves companies, users, settings, quotations.
   - Preserves order history untouched (legacy items referencing retired SKUs keep
     rendering via the order-detail fallback; no FK is broken, no stock is modified).
   Run: node scripts/migrate-industrial.js  (backend must NOT be running) */
const fs = require('fs');
const path = require('path');

const DB_FILE = path.join(__dirname, '..', 'backend', 'db.json');
if (!fs.existsSync(DB_FILE)) { console.log('No backend/db.json found — fresh seed will be used on next start.'); process.exit(0); }

const { seed } = require('../backend/server.js');
const current = JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
const fresh = seed();

const ts = new Date().toISOString().replace(/[:.]/g, '-');
const backup = path.join(__dirname, '..', 'backend', `db.backup-${ts}.json`);
fs.writeFileSync(backup, JSON.stringify(current, null, 2));

const retired = (current.products || []).length;
current.categories = fresh.categories;
current.products = fresh.products;
if (!Array.isArray(current.quotations)) current.quotations = fresh.quotations;
fs.writeFileSync(DB_FILE, JSON.stringify(current, null, 2));

console.log(`Backup written: ${backup}`);
console.log(`Replaced ${retired} demo product(s) with ${fresh.products.length} industrial products across ${fresh.categories.length} categories.`);
console.log(`Preserved: ${(current.orders || []).length} orders, ${(current.users || []).length} users, ${(current.companies || []).length} companies.`);
console.log('Legacy order items referencing retired SKUs render via fallback (see orderDetail).');
