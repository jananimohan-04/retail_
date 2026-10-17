/* CNCFORGE Industrial Store — local backend (Express + JSON file DB).
   Runs frontend + API together: http://localhost:4000
   Inventory source of truth: db.products[].stock + atomic deduct in POST /api/orders.
   Swap JSON layer for Supabase (tables + RLS + Storage) later — API shape stays.
   Exposes {app, db, save, seed} when required (migration script); listens only when run directly. */
const express = require('express');
const cors = require('cors');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const SB = require('./supabase'); // Google OAuth bridge; secret key never leaves the server

const PORT = process.env.PORT || 4000;
const ROOT = path.join(__dirname, '..');           // serves index.html / css / js
const DB_FILE = path.join(__dirname, 'db.json');
const UP_DIR = process.env.VERCEL ? path.join(require('os').tmpdir(), 'uploads') : path.join(__dirname, 'uploads');
try { if (!fs.existsSync(UP_DIR)) fs.mkdirSync(UP_DIR, { recursive: true }); } catch (e) {}

/* ---------- industrial dev seed (controlled replacement for old consumer demo catalog) ---------- */
function seed() {
  return {
    categories: [
      { id: 'cnc-machines', name: 'CNC Machines', icon: '🏭', desc: 'Turning, milling & machining centers' },
      { id: 'cutting-tools', name: 'Cutting Tools', icon: '🔩', desc: 'Inserts, end mills, drills & taps' },
      { id: 'spares', name: 'Machine Spare Parts', icon: '⚙️', desc: 'Bearings, ball screws & hydraulics' },
      { id: 'workholding', name: 'Workholding & Accessories', icon: '🗜️', desc: 'Chucks, collets & fixtures' },
      { id: 'electrical', name: 'Control & Electrical', icon: '🎛️', desc: 'Servo, drives & sensors' },
      { id: 'raw-materials', name: 'Raw Materials', icon: '🧱', desc: 'Bars, rods, sheets & plastics' },
      { id: 'consumables', name: 'Industrial Consumables', icon: '🛢️', desc: 'Coolants, lubricants & abrasives' },
      { id: 'measuring', name: 'Measuring & Inspection', icon: '📏', desc: 'Calipers, micrometers & gauges' },
      { id: 'safety', name: 'Safety & Maintenance', icon: '🦺', desc: 'PPE, filters & maintenance kits' }
    ],
    companies: [
      { id: 'C-A', name: 'Apex CNC Works', logo: '🏭', city: 'Pune', status: 'active', plan: 'Growth', orders: 486, revenue: 12840000, products: 12, users: 8 },
      { id: 'C-B', name: 'Shakti Machine Tools', logo: '⚙️', city: 'Bengaluru', status: 'active', plan: 'Scale', orders: 1120, revenue: 34200000, products: 34, users: 19 },
      { id: 'C-C', name: 'Vulcan Auto Components', logo: '🔧', city: 'Chennai', status: 'suspended', plan: 'Starter', orders: 96, revenue: 1840000, products: 9, users: 4 },
      { id: 'C-ARGUS', name: 'Argus', logo: '🏭', city: 'Pune', status: 'active', plan: 'Scale', orders: 0, revenue: 0, products: 12, users: 1, email: 'argushexadoc2021@gmail.com', industry: 'CNC Manufacturing' }
    ],
    users: [
      { id: 'U-janani-1604', name: 'janani', role: 'sales_user', companyId: 'C-ARGUS', email: 'jananimohan1604@gmail.com', mobile: '', active: true },
      { id: 'U-super-janani', name: 'Janani Mohan', role: 'super_admin', companyId: null, email: 'jananimohan44@gmail.com', active: true },
      { id: 'U-1', name: 'Aarav Shah', role: 'super_admin', companyId: null, email: 'super@cncforge.io', active: true },
      { id: 'U-2', name: 'Amina Khan', role: 'company_admin', companyId: 'C-A', email: 'amina@apexcnc.in', active: true },
      { id: 'U-3', name: 'Ravi Kumar', role: 'sales_user', companyId: 'C-A', email: 'ravi@apexcnc.in', mobile: '98765 00001', active: true },
      { id: 'U-4', name: 'Sana Sheikh', role: 'sales_user', companyId: 'C-A', email: 'sana@apexcnc.in', mobile: '98765 00002', active: true },
      { id: 'U-argus', name: 'argus', role: 'company_admin', companyId: 'C-ARGUS', email: 'argushexadoc2021@gmail.com', active: true },
      { id: 'U-5', name: 'Vikram Rao', role: 'company_admin', companyId: 'C-B', email: 'vikram@shaktimtools.in', active: true }
    ],
    products: [
      { id: 'P-2001', sku: 'CNC-TC-460', companyId: 'C-A', name: 'CNC Turning Center TC-460', brand: 'ForgeLine', mpn: 'FL-TC460-12T', short: 'Ø460 swing • 12-station turret • Fanuc 0i-TF', price: 2850000, uom: 'Pc', moq: 1, leadTime: '45 days', warehouse: 'WH-Pune-01', stock: 3, category: 'cnc-machines', visible: true, featured: true, sold: 6, created: '2026-09-28', desc: 'Slant-bed CNC turning center with 12-station servo turret, Fanuc 0i-TF control, hydraulic chuck and chip conveyor. Installation and commissioning included.', specs: { 'Chuck size': '10 inch', 'Max swing': 'Ø460 mm', 'Spindle speed': '4000 rpm', 'Control': 'Fanuc 0i-TF', 'Power': '15 kW', 'Warranty': '12 months' }, images: ['https://images.unsplash.com/photo-1504328345606-18bbc8c9d7d1?auto=format&fit=crop&w=700&q=80'], video: '' },
      { id: 'P-2002', sku: 'TOOL-CNMG-01', companyId: 'C-A', name: 'Carbide Turning Insert CNMG 120408 (Pack of 10)', brand: 'CarbiMax', mpn: 'CM-CNMG120408-MP', short: 'CNMG 120408 • CVD coated • Steel & cast iron', price: 1250, uom: 'Pack', moq: 2, leadTime: 'Ex-stock', warehouse: 'WH-Pune-01', stock: 240, category: 'cutting-tools', visible: true, featured: true, sold: 940, created: '2026-10-02', desc: 'CVD-coated carbide turning inserts for steel and cast iron. Pack of 10, ISO CNMG 120408 geometry.', specs: { 'Insert': 'CNMG 120408', 'Coating': 'CVD', 'Work material': 'Steel, CI', 'Pack qty': '10 nos' }, images: ['https://images.unsplash.com/photo-1537462715879-360eeb61a0ad?auto=format&fit=crop&w=700&q=80'], video: '' },
      { id: 'P-2003', sku: 'TOOL-EM10-4F', companyId: 'C-A', name: 'Solid Carbide End Mill Ø10mm 4-Flute AlCrN', brand: 'CarbiMax', mpn: 'CM-EM10X4-ALCRN', short: 'Ø10 • 4-flute • AlCrN • 55 HRC', price: 1450, uom: 'Pc', moq: 2, leadTime: 'Ex-stock', warehouse: 'WH-Pune-01', stock: 86, category: 'cutting-tools', visible: true, featured: false, sold: 410, created: '2026-08-14', desc: '4-flute solid carbide end mill with AlCrN coating for hardened steels up to 55 HRC.', specs: { 'Diameter': 'Ø10 mm', 'Flutes': '4', 'Coating': 'AlCrN', 'Shank': 'Ø10 h6', 'Max hardness': '55 HRC' }, images: ['https://images.unsplash.com/photo-1504917595217-d4dc5ebe6122?auto=format&fit=crop&w=700&q=80'], video: '' },
      { id: 'P-2004', sku: 'BRG-6205-2RS', companyId: 'C-A', name: 'Deep Groove Ball Bearing 6205-2RS', brand: 'BearPro', mpn: 'BP-6205-2RS-C3', short: '25×52×15 • 2RS sealed • C3 clearance', price: 340, uom: 'Pc', moq: 4, leadTime: 'Ex-stock', warehouse: 'WH-Pune-02', stock: 500, category: 'spares', visible: true, featured: true, sold: 1600, created: '2026-10-10', desc: 'Single-row deep groove ball bearing, rubber sealed both sides, C3 clearance. For spindle and general machine applications.', specs: { 'Bore': '25 mm', 'OD': '52 mm', 'Width': '15 mm', 'Seal': '2RS', 'Clearance': 'C3' }, images: ['https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=700&q=80'], video: '' },
      { id: 'P-2005', sku: 'BS-SFU1605-1M', companyId: 'C-A', name: 'Ball Screw SFU1605 1000mm with Nut & End Machining', brand: 'MotionLine', mpn: 'ML-SFU1605-L1000', short: 'Ø16 • 5mm lead • C7 • with nut', price: 6800, uom: 'Set', moq: 1, leadTime: '7 days', warehouse: 'WH-Pune-01', stock: 12, category: 'spares', visible: true, featured: false, sold: 74, created: '2026-09-12', desc: 'Precision rolled ball screw assembly, C7 grade, with ball nut and standard end machining.', specs: { 'Diameter': 'Ø16 mm', 'Lead': '5 mm', 'Length': '1000 mm', 'Grade': 'C7', 'Includes': 'Nut + end machining' }, images: ['https://images.unsplash.com/photo-1581092160562-40aa08e78837?auto=format&fit=crop&w=700&q=80'], video: '' },
      { id: 'P-2006', sku: 'WH-ER32-SET18', companyId: 'C-A', name: 'ER32 Collet Set 3–20mm (18 pcs) with Wrench', brand: 'GripWell', mpn: 'GW-ER32-SET18', short: 'ER32 • 3–20mm • 18 collets • AA grade', price: 4200, uom: 'Set', moq: 1, leadTime: 'Ex-stock', warehouse: 'WH-Pune-01', stock: 30, category: 'workholding', visible: true, featured: false, sold: 130, created: '2026-10-05', desc: 'AA-grade ER32 spring collet set, 3–20mm, with hook wrench in fitted case. Runout ≤ 0.008mm.', specs: { 'Type': 'ER32', 'Range': '3–20 mm', 'Pieces': '18 + wrench', 'Runout': '≤ 0.008 mm' }, images: ['https://images.unsplash.com/photo-1581092918056-0c4c3acd3789?auto=format&fit=crop&w=700&q=80'], video: '' },
      { id: 'P-2007', sku: 'WH-CHUCK200-3J', companyId: 'C-A', name: '3-Jaw Self-Centering Chuck Ø200mm', brand: 'GripWell', mpn: 'GW-SC200-3J-A6', short: 'Ø200 • 3-jaw • A6 mount • quotation only', price: null, uom: 'Pc', moq: 1, leadTime: 'On request', warehouse: 'WH-Pune-01', stock: 8, category: 'workholding', visible: true, featured: false, sold: 22, created: '2026-07-20', desc: 'Cast-iron 3-jaw self-centering lathe chuck, A6 back mount. Price on request — submit an RFQ.', specs: { 'Diameter': 'Ø200 mm', 'Jaws': '3, self-centering', 'Mount': 'A6', 'Includes': '2 jaw sets' }, images: ['https://images.unsplash.com/photo-1581094271901-8022df4466f9?auto=format&fit=crop&w=700&q=80'], video: '' },
      { id: 'P-2008', sku: 'EL-SV15-220', companyId: 'C-A', name: 'AC Servo Motor 1.5kW 220V with Drive (Kit)', brand: 'DriveCore', mpn: 'DC-SV15K-220-KIT', short: '1.5kW • 3000rpm • 17-bit encoder', price: 24500, uom: 'Kit', moq: 1, leadTime: '10 days', warehouse: 'WH-Pune-02', stock: 6, category: 'electrical', visible: true, featured: true, sold: 41, created: '2026-10-11', desc: 'AC servo motor + matched drive kit for CNC axis retrofits. 17-bit absolute encoder.', specs: { 'Power': '1.5 kW', 'Speed': '3000 rpm', 'Voltage': '220 V', 'Encoder': '17-bit absolute', 'Includes': 'Motor + drive + cables' }, images: ['https://images.unsplash.com/photo-1581091012184-5c1d9ae4a3d2?auto=format&fit=crop&w=700&q=80'], video: '' },
      { id: 'P-2009', sku: 'RM-AL6061-D50', companyId: 'C-A', name: 'Aluminium 6061 Round Bar Ø50 × 1000mm', brand: 'MetalSource', mpn: 'MS-AL6061-D50-L1M', short: 'Ø50 • 6061-T6 • mill cert included', price: 1850, uom: 'Pc', moq: 5, leadTime: 'Ex-stock', warehouse: 'WH-Pune-02', stock: 120, category: 'raw-materials', visible: true, featured: false, sold: 680, created: '2026-10-13', desc: 'Aluminium 6061-T6 round bar sawn to 1000mm with mill test certificate. For CNC machining stock.', specs: { 'Alloy': '6061-T6', 'Diameter': 'Ø50 mm', 'Length': '1000 mm', 'Cert': 'Mill TC 3.1' }, images: ['https://images.unsplash.com/photo-1535813547-99c456a41d4a?auto=format&fit=crop&w=700&q=80'], video: '' },
      { id: 'P-2010', sku: 'CON-CUTOIL-20L', companyId: 'C-A', name: 'Water-Soluble Cutting Oil 20L (Semi-Synthetic)', brand: 'LubeTech', mpn: 'LT-CUTOIL-SS-20L', short: 'Semi-synthetic • 20L drum • hard-water stable', price: 3600, uom: 'Drum', moq: 1, leadTime: 'Ex-stock', warehouse: 'WH-Pune-02', stock: 64, category: 'consumables', visible: true, featured: false, sold: 520, created: '2026-10-14', desc: 'Semi-synthetic soluble cutting oil for CNC machining of steel, aluminium and CI. Hard-water stable, low foam.', specs: { 'Type': 'Semi-synthetic', 'Pack': '20 L drum', 'Dilution': '5–8%', 'Application': 'CNC turning/milling' }, images: ['https://images.unsplash.com/photo-1581094794329-c8112a89af12?auto=format&fit=crop&w=700&q=80'], video: '' },
      { id: 'P-2011', sku: 'MI-VC-300D', companyId: 'C-A', name: 'Digital Vernier Caliper 0–300mm IP54', brand: 'MeasurePro', mpn: 'MP-VC300-D-IP54', short: '0–300mm • 0.01mm • IP54 • carbide jaws', price: 2900, uom: 'Pc', moq: 1, leadTime: 'Ex-stock', warehouse: 'WH-Pune-01', stock: 45, category: 'measuring', visible: true, featured: false, sold: 210, created: '2026-10-15', desc: 'Digital caliper with carbide measuring faces, IP54 protection and calibration certificate.', specs: { 'Range': '0–300 mm', 'Resolution': '0.01 mm', 'Protection': 'IP54', 'Cert': 'Calibration included' }, images: ['https://images.unsplash.com/photo-1581093458791-9d42e3c7e117?auto=format&fit=crop&w=700&q=80'], video: '' },
      { id: 'P-2012', sku: 'SP-PUMP100-3P', companyId: 'C-A', name: 'Coolant Pump 100W 3-Phase (Top Mount)', brand: 'FlowPump', mpn: 'FP-CP100-3P-TM', short: '100W • 3-ph • quotation only', price: null, uom: 'Pc', moq: 1, leadTime: 'On request', warehouse: 'WH-Pune-02', stock: 0, category: 'spares', visible: true, featured: false, sold: 18, created: '2026-10-16', desc: 'Three-phase coolant pump for machining centers. Currently out of stock — check availability or request a quotation.', specs: { 'Power': '100 W', 'Supply': '3-phase 415V', 'Mount': 'Top mount', 'Head': 'As per model' }, images: ['https://images.unsplash.com/photo-1581093588401-fbb62a02f120?auto=format&fit=crop&w=700&q=80'], video: '' }
    ],
    orders: [
      { id: 'ORD-9001', companyId: 'C-A', date: '2026-10-14 14:22', salesUser: 'Ravi Kumar', customer: 'Sharma Auto Components', contact: 'Priya Sharma', companyName: 'Sharma Auto Components Pvt Ltd', mobile: '98765 43210', city: 'Pimpri, Pune 411018', total: 12200, status: 'Processing', items: [{ pid: 'P-2002', qty: 4, price: 1250 }, { pid: 'P-2010', qty: 2, price: 3600 }], address: 'Plot 44, MIDC Bhosari, Pune 411026', poRef: 'PO/SAC/26/118', history: [['Pending', '2026-10-14 14:22'], ['Confirmed', '2026-10-14 16:05'], ['Processing', '2026-10-15 10:12']] },
      { id: 'ORD-9002', companyId: 'C-A', date: '2026-10-13 11:05', salesUser: 'Ravi Kumar', customer: 'Deccan Precision Tools', contact: 'Amit Verma', companyName: 'Deccan Precision Tools', mobile: '98110 22334', city: 'Chakan, Pune 410501', total: 6800, status: 'Pending', items: [{ pid: 'P-2005', qty: 1, price: 6800 }], address: 'Gat 230, Chakan Industrial Area, Pune 410501', poRef: 'PO/DPT/26/073', history: [['Pending', '2026-10-13 11:05']] },
      { id: 'ORD-9003', companyId: 'C-A', date: '2026-10-11 18:40', salesUser: 'Sana Sheikh', customer: 'Nair Engineering Works', contact: 'Kavya Nair', companyName: 'Nair Engineering Works', mobile: '90040 11223', city: 'Thane 400601', total: 24500, status: 'Delivered', items: [{ pid: 'P-2008', qty: 1, price: 24500 }], address: 'W-118, MIDC Rabale, Thane 400601', poRef: 'PO/NEW/26/051', history: [['Pending', '2026-10-11 18:40'], ['Delivered', '2026-10-13 17:30']] }
    ],
    quotations: [
      { id: 'Q-5001', companyId: 'C-A', date: '2026-10-14 10:05', requestedBy: 'Ravi Kumar', pid: 'P-2007', qty: 2, techReq: 'A6 mount, for TC-460', deliveryReq: 'Chakan plant by month-end', companyName: 'Deccan Precision Tools', contact: 'Amit Verma', mobile: '98110 22334', status: 'Pending', quotePrice: null, adminNote: '' },
      { id: 'Q-5002', companyId: 'C-A', date: '2026-10-12 15:40', requestedBy: 'Sana Sheikh', pid: 'P-2012', qty: 4, techReq: 'Replacement for VMC-850 coolant tank', deliveryReq: 'Stagger delivery 2+2', companyName: 'Nair Engineering Works', contact: 'Kavya Nair', mobile: '90040 11223', status: 'Quoted', quotePrice: 5200, adminNote: 'Imported, 3-week lead time' }
    ],
    settings: { 'C-A': { storeName: 'Apex Industrial Store', taxPct: 18, deliveryFee: 0, freeAbove: 0, orderPrefix: 'ORD-', announcement: 'GST invoice on all orders • Bulk pricing on request' } }
  };
}

let db;
try { db = JSON.parse(fs.readFileSync(DB_FILE, 'utf8')); }
catch { db = seed(); try { fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2)); } catch(e){} }
if (!Array.isArray(db.quotations)) { db.quotations = []; }

let lastSyncTime = 0;
let pendingSave = null;
let syncPromise = null;

async function syncFromStorage(force = false) {
  if (!SB.enabled || !SB.admin) return;
  if (!force && (Date.now() - lastSyncTime < 2500)) return;
  if (syncPromise) return syncPromise;

  syncPromise = (async () => {
    try {
      const { data, error } = await SB.admin.storage.from('retail-data').download('db.json');
      if (data && !error) {
        const text = await data.text();
        const remoteDb = JSON.parse(text);
        if (remoteDb && Array.isArray(remoteDb.products)) {
          Object.assign(db, remoteDb);
          lastSyncTime = Date.now();
        }
      }
    } catch (err) {
      console.warn('Sync from Supabase storage warning:', err.message);
    } finally {
      syncPromise = null;
    }
  })();
  return syncPromise;
}

const save = () => {
  try { fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2)); } catch(e){}
  if (SB.enabled && SB.admin) {
    const content = JSON.stringify(db, null, 2);
    pendingSave = SB.admin.storage.from('retail-data').upload('db.json', content, {
      contentType: 'application/json',
      upsert: true
    }).then(() => {
      lastSyncTime = Date.now();
    }).catch(err => {
      console.warn('Failed to persist db to Supabase storage:', err.message);
    });
  }
};

/* versioned migrations (backend/migrations/): additive only, never drop tables */
const { runMigrations } = require('./migrate');
const MIGRATED = runMigrations(db, save);
if (MIGRATED.length) console.log('Migrations applied:', MIGRATED.join(', '));

/* audit log for important administrative actions (no secrets) */
function audit(req, action, entity, entityId, companyId, summary) {
  db.audit_logs.unshift({ id: 'A-' + Date.now() + Math.floor(Math.random() * 90 + 10), ts: new Date().toISOString(), actor: req.ctx.name, role: req.ctx.role, action, entity, entityId: entityId || '', companyId: companyId || '', summary: summary || '' });
  if (db.audit_logs.length > 500) db.audit_logs.length = 500;
  save();
}
/* server-side pagination helper (?page&limit, defaults 1/50, max 200) */
function pageOf(list, req) {
  const page = Math.max(1, parseInt(req.query.page || '1', 10));
  const limit = Math.min(200, Math.max(1, parseInt(req.query.limit || '50', 10)));
  const total = list.length;
  return { rows: list.slice((page - 1) * limit, page * limit), total, page, limit };
}
const companyById = id => db.companies.find(x => x.id === id);
const usersOf = cid => db.users.filter(u => u.companyId === cid);
const productsOf = cid => db.products.filter(p => p.companyId === cid);
const ordersOf = cid => db.orders.filter(o => o.companyId === cid);

const app = express();
app.use(cors());
app.use(express.json({ limit: '2mb' }));

// Middleware: keep db synchronized across Vercel serverless instances and ensure saves complete
app.use(async (req, res, next) => {
  if (req.path.startsWith('/api') && req.path !== '/api/health' && req.path !== '/api/config') {
    const isMutation = ['POST', 'PUT', 'DELETE', 'PATCH'].includes(req.method);
    await syncFromStorage(isMutation);
  }
  const origJson = res.json.bind(res);
  const origSend = res.send.bind(res);
  res.json = async function(body) {
    if (pendingSave) {
      try { await pendingSave; } catch(e){}
      pendingSave = null;
    }
    return origJson(body);
  };
  res.send = async function(body) {
    if (pendingSave) {
      try { await pendingSave; } catch(e){}
      pendingSave = null;
    }
    return origSend(body);
  };
  next();
});

/* auth context: Google (Supabase Auth) Bearer token verified server-side;
   falls back to demo headers only when no token is supplied (offline demo) */
app.use(async (req, _res, next) => {
  const h = req.headers['authorization'] || '';
  if (h.startsWith('Bearer ') && SB.enabled) {
    try {
      const u = await SB.authUserFromToken(h.slice(7).trim());
      if (u && u.email) {
        const email = String(u.email).toLowerCase();
        let person = db.users.find(x => (x.email || '').toLowerCase() === email);
        if (!person && email === SB.superEmail) { // first-login bootstrap for the Super Admin
          person = { id: 'U-' + Date.now(), name: (u.user_metadata && u.user_metadata.full_name) || 'Janani Mohan', role: 'super_admin', companyId: null, email, active: true, createdAt: new Date().toISOString().slice(0, 10) };
          db.users.unshift(person); save();
        }
        if (person && email === SB.superEmail && (person.role !== 'super_admin' || !person.active)) {
          person.role = 'super_admin';
          person.companyId = null;
          person.active = true;
          save();
        }
        const display = (u.user_metadata && (u.user_metadata.full_name || u.user_metadata.name)) || (person && person.name) || email;
        if (person && person.active === false) { req.ctx = { role: 'disabled', companyId: person.companyId, name: display, email, google: true }; return next(); }
        if (person) { req.ctx = { role: person.role, companyId: person.companyId, name: display, email, google: true }; return next(); }
        req.ctx = { role: 'pending', companyId: null, name: display, email, google: true }; return next(); // Google OK, no ERP account yet
      }
    } catch (e) { /* fall through to demo headers */ }
  }
  req.ctx = { role: req.headers['x-role'] || 'sales_user', companyId: req.headers['x-company-id'] || 'C-ARGUS', name: req.headers['x-user-name'] || 'Argus User' };
  next();
});
/* pending/disabled Google users may only reach health, config and /api/me */
app.use((req, res, next) => {
  if ((req.ctx.role === 'pending' || req.ctx.role === 'disabled') && req.path.startsWith('/api/') && !['/api/health', '/api/config', '/api/me'].includes(req.path)) {
    return res.status(403).json({ error: req.ctx.role === 'pending' ? 'Account pending approval by your administrator' : 'Account deactivated' });
  }
  next();
});
/* company isolation: non-super users locked to their own company */
function scopeCompany(req, res, next) {
  if (req.ctx.role === 'super_admin') {
    req.companyId = req.query.companyId || req.body.companyId || 'C-ARGUS';
    return next();
  }
  const q = req.query.companyId || req.body.companyId;
  if (q && q !== req.ctx.companyId) return res.status(403).json({ error: 'Cross-company access denied' });
  req.companyId = req.ctx.companyId;
  next();
}
const ok = (res, data) => res.json({ data });
const isAdmin = req => req.ctx.role === 'company_admin' || req.ctx.role === 'super_admin';
/* collision-free ids (random 4-digit ids used to clash and overwrite each other) */
function uid(prefix, list) {
  let id;
  do { id = prefix + Date.now().toString(36).toUpperCase() + Math.floor(Math.random() * 1296).toString(36).toUpperCase(); } while (list.some(x => x.id === id));
  return id;
}

app.get('/api/health', (_req, res) => res.json({ ok: true, time: new Date().toISOString() }));
app.get('/api/config', (_req, res) => res.json({ data: SB.publicConfig() }));
app.get('/api/me', (req, res) => {
  const u = req.ctx.email ? db.users.find(x => (x.email || '').toLowerCase() === req.ctx.email) : null;
  res.json({ data: { role: req.ctx.role, companyId: req.ctx.companyId, name: req.ctx.name, email: req.ctx.email || '', mobile: (u && u.mobile) || '', google: !!req.ctx.google } });
});
app.patch('/api/me', (req, res) => {
  const u = req.ctx.email ? db.users.find(x => (x.email || '').toLowerCase() === req.ctx.email) : null;
  if (!u) return res.status(400).json({ error: 'Sign in with Google to edit your profile' });
  if (req.body.name != null) { const n = String(req.body.name).trim(); if (!n) return res.status(400).json({ error: 'name required' }); u.name = n; }
  if (req.body.mobile != null) u.mobile = String(req.body.mobile).trim();
  save();
  ok(res, u);
});

/* companies (super_admin) — searchable, filterable, paginated */
app.get('/api/companies', (req, res) => {
  if (req.ctx.role !== 'super_admin') return res.status(403).json({ error: 'super_admin only' });
  let list = [...db.companies];
  if (req.query.q) { const q = req.query.q.toLowerCase(); list = list.filter(c => (c.name + ' ' + (c.code || '') + ' ' + (c.city || '') + ' ' + (c.industry || '') + ' ' + (c.email || '')).toLowerCase().includes(q)); }
  if (req.query.status && req.query.status !== 'all') list = list.filter(c => (c.storeStatus || c.status) === req.query.status);
  if (req.query.industry && req.query.industry !== 'all') list = list.filter(c => c.industry === req.query.industry);
  if (req.query.city && req.query.city !== 'all') list = list.filter(c => c.city === req.query.city);
  list.sort((a, b) => String(b.createdAt || '').localeCompare(String(a.createdAt || '')));
  const withCounts = l => l.map(c => ({ ...c, admin: (usersOf(c.id).find(u => u.role === 'company_admin') || {}).name || '', userCount: usersOf(c.id).length, productCount: productsOf(c.id).length, orderCount: ordersOf(c.id).length }));
  if (req.query.page || req.query.limit) { const pg = pageOf(list, req); pg.rows = withCounts(pg.rows); return ok(res, pg); }
  ok(res, withCounts(list));
});
app.get('/api/companies/:id', (req, res) => {
  if (req.ctx.role !== 'super_admin' && req.ctx.companyId !== req.params.id) return res.status(403).json({ error: 'denied' });
  const c = companyById(req.params.id);
  if (!c) return res.status(404).json({ error: 'not found' });
  const ps = productsOf(c.id), os = ordersOf(c.id), us = usersOf(c.id);
  const qs = db.quotations.filter(q => q.companyId === c.id);
  ok(res, { ...c, admin: us.find(u => u.role === 'company_admin') || null, userCount: us.length, productCount: ps.length, visibleCount: ps.filter(p => p.visible && !p.archived).length, categoryCount: new Set(ps.map(p => p.category)).size, orderCount: os.length, pendingOrders: os.filter(o => o.status === 'Pending').length, revenue: os.reduce((a, o) => a + o.total, 0), quoteCount: qs.length, openQuotes: qs.filter(q => q.status === 'Pending').length });
});
app.post('/api/companies', (req, res) => {
  if (req.ctx.role !== 'super_admin') return res.status(403).json({ error: 'super_admin only' });
  const { name, code, city, industry, email, phone, address, state, pin, description, adminName, adminEmail, plan } = req.body;
  if (!name || !city) return res.status(400).json({ error: 'name and city required' });
  const finalCode = (code || ('C-' + name.slice(0, 1).toUpperCase() + Math.floor(Math.random() * 90 + 10))).trim();
  if (db.companies.some(x => x.id === finalCode || x.code === finalCode)) return res.status(400).json({ error: 'company code already exists' });
  const cleanAdmin = String(adminEmail || '').toLowerCase().trim();
  if (adminName && !cleanAdmin) return res.status(400).json({ error: 'admin email required to provision Company Admin' });
  if (cleanAdmin && db.users.some(u => (u.email || '').toLowerCase().trim() === cleanAdmin)) return res.status(400).json({ error: 'admin email already registered' });
  const today = new Date().toISOString().slice(0, 10);
  const c = { id: finalCode, code: finalCode, name, logo: '🏭', industry: industry || 'CNC Manufacturing', email: email || '', phone: phone || '', address: address || '', city, state: state || '', pin: pin || '', description: description || '', status: 'active', storeStatus: 'active', plan: plan || 'Starter', orders: 0, revenue: 0, products: 0, users: 1, createdAt: today, updatedAt: today };
  db.companies.unshift(c);
  // an admin email alone is enough — before, no admin was created unless a name was typed too
  if (cleanAdmin) db.users.unshift({ id: uid('U-', db.users), name: (adminName || cleanAdmin.split('@')[0]).trim(), role: 'company_admin', companyId: finalCode, email: cleanAdmin, active: true, createdAt: today });
  save();
  audit(req, 'company.create', 'company', finalCode, finalCode, `Created ${name} (${finalCode})`);
  ok(res, c);
});
app.put('/api/companies/:id', (req, res) => {
  if (req.ctx.role !== 'super_admin') return res.status(403).json({ error: 'super_admin only' });
  const c = companyById(req.params.id);
  if (!c) return res.status(404).json({ error: 'not found' });
  const allow = ['name', 'logo', 'industry', 'email', 'phone', 'address', 'city', 'state', 'pin', 'description', 'plan', 'storeStatus', 'status'];
  for (const k of allow) if (req.body[k] !== undefined) c[k] = req.body[k];
  if (c.storeStatus === 'suspended' || c.storeStatus === 'inactive') c.status = 'suspended'; else c.status = 'active';
  c.updatedAt = new Date().toISOString().slice(0, 10);
  save();
  audit(req, 'company.update', 'company', c.id, c.id, `Updated ${c.name}: ${Object.keys(req.body).join(', ')}`);
  ok(res, c);
});
app.patch('/api/companies/:id', (req, res) => {
  if (req.ctx.role !== 'super_admin') return res.status(403).json({ error: 'super_admin only' });
  const c = db.companies.find(x => x.id === req.params.id);
  if (!c) return res.status(404).json({ error: 'not found' });
  const allow = ['name', 'logo', 'industry', 'email', 'phone', 'address', 'city', 'state', 'pin', 'description', 'plan', 'storeStatus', 'status'];
  for (const k of allow) if (req.body[k] !== undefined) c[k] = req.body[k];
  if (c.storeStatus === 'suspended' || c.storeStatus === 'inactive') c.status = 'suspended'; else c.status = 'active';
  c.updatedAt = new Date().toISOString().slice(0, 10);
  save();
  audit(req, 'company.update', 'company', c.id, c.id, `Updated ${c.name}: ${Object.keys(req.body).join(', ')}`);
  ok(res, c);
});

/* users — super_admin manages across companies; company_admin only own company */
const ROLES = ['super_admin', 'company_admin', 'sales_user'];
app.get('/api/users', scopeCompany, (req, res) => {
  const cid = req.ctx.role === 'super_admin' ? (req.query.companyId || null) : req.companyId;
  let list = db.users.filter(u => !cid || u.companyId === cid || (req.ctx.role === 'super_admin' && !cid && !req.query.companyId));
  if (req.query.q) { const q = req.query.q.toLowerCase(); list = list.filter(u => (u.name + ' ' + u.email).toLowerCase().includes(q)); }
  if (req.query.role && req.query.role !== 'all') list = list.filter(u => u.role === req.query.role);
  if (req.query.active && req.query.active !== 'all') list = list.filter(u => String(!!u.active) === req.query.active);
  const withCo = l => l.map(u => ({ ...u, companyName: (companyById(u.companyId) || {}).name || (u.companyId ? u.companyId : '— platform —') }));
  if (req.query.page || req.query.limit) { const pg = pageOf(list, req); pg.rows = withCo(pg.rows); return ok(res, pg); }
  ok(res, withCo(list));
});
app.post('/api/users', scopeCompany, (req, res) => {
  if (!['company_admin', 'super_admin'].includes(req.ctx.role)) return res.status(403).json({ error: 'admin only' });
  const { name, email, role, mobile } = req.body;
  if (!name || !email) return res.status(400).json({ error: 'name and email required' });
  const cleanEmail = email.toLowerCase().trim();
  if (role && !ROLES.includes(role)) return res.status(400).json({ error: 'invalid role' });
  if (db.users.some(u => (u.email || '').toLowerCase().trim() === cleanEmail)) return res.status(400).json({ error: 'email already registered' });
  const targetRole = role || 'sales_user';
  if (targetRole === 'super_admin' && req.ctx.role !== 'super_admin') return res.status(403).json({ error: 'only Super Admin can assign super_admin role' });
  const targetCompany = req.ctx.role === 'super_admin' ? (targetRole === 'super_admin' ? null : req.body.companyId) : (req.companyId || req.ctx.companyId || req.body.companyId);
  if (targetRole !== 'super_admin' && !targetCompany) return res.status(400).json({ error: 'companyId required' });
  if (targetCompany && !companyById(targetCompany)) return res.status(400).json({ error: 'unknown company' });
  const u = { id: 'U-' + Date.now(), name: name.trim(), email: cleanEmail, mobile: mobile || '', role: targetRole, companyId: targetCompany, active: true, createdAt: new Date().toISOString().slice(0, 10) };
  db.users.unshift(u); save();
  audit(req, 'user.create', 'user', u.id, targetCompany, `Created ${name} (${targetRole})`);
  ok(res, u);
});
app.post('/api/users/sync-local', (req, res) => {
  if (!isAdmin(req)) return res.status(403).json({ error: 'admin only' });
  const users = Array.isArray(req.body.users) ? req.body.users : [];
  let added = 0;
  for (const u of users) {
    if (!u.email || !u.name) continue;
    const em = u.email.toLowerCase().trim();
    if (!db.users.some(x => (x.email || '').toLowerCase().trim() === em)) {
      db.users.unshift({
        id: u.id || ('U-' + Date.now() + Math.floor(Math.random() * 100)),
        name: u.name.trim(),
        email: em,
        mobile: u.mobile || '',
        role: u.role === 'company_admin' ? 'company_admin' : 'sales_user', // never super_admin via sync
        companyId: req.ctx.role === 'super_admin' ? (u.companyId || 'C-ARGUS') : req.ctx.companyId,
        active: u.active !== false,
        createdAt: u.createdAt || new Date().toISOString().slice(0, 10)
      });
      added++;
    }
  }
  if (added > 0) save();
  ok(res, { synced: added, total: db.users.length });
});
app.patch('/api/users/:id', scopeCompany, (req, res) => {
  if (!isAdmin(req)) return res.status(403).json({ error: 'admin only' });
  const u = db.users.find(x => x.id === req.params.id);
  if (!u) return res.status(404).json({ error: 'not found' });
  if (req.ctx.role !== 'super_admin' && u.companyId !== req.companyId) return res.status(403).json({ error: 'denied' });
  if (req.body.role && !ROLES.includes(req.body.role)) return res.status(400).json({ error: 'invalid role' });
  if (req.body.role === 'super_admin' && req.ctx.role !== 'super_admin') return res.status(403).json({ error: 'only Super Admin can assign super_admin role' });
  if (req.ctx.role !== 'super_admin') delete req.body.companyId; // company fixed for non-super
  delete req.body.id; delete req.body.email; // identity is fixed
  Object.assign(u, req.body); save();
  audit(req, 'user.update', 'user', u.id, u.companyId, `Updated ${u.name}: ${Object.keys(req.body).join(', ')}`);
  ok(res, u);
});

/* categories — global (super) + company-specific; assignments link global cats to companies */
const catsForCompany = cid => {
  const assigned = new Set((db.category_assignments || []).filter(a => a.companyId === cid).map(a => a.categoryId));
  return db.categories.filter(c => (c.scope === 'global' && (c.companyId === null || assigned.has(c.id) || !c.companyId)) || (c.scope === 'company' && c.companyId === cid));
};
app.get('/api/categories', (req, res) => {
  let list = [...db.categories];
  if (req.query.scope && req.query.scope !== 'all') list = list.filter(c => c.scope === req.query.scope);
  if (req.query.companyId) list = list.filter(c => c.scope === 'company' && c.companyId === req.query.companyId);
  if (req.query.active && req.query.active !== 'all') list = list.filter(c => String(!!c.active) === req.query.active);
  list.sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));
  const withCounts = l => l.map(c => ({ ...c, productCount: db.products.filter(p => p.category === c.id && (!req.query.forCompany || p.companyId === req.query.forCompany)).length, assignedTo: (db.category_assignments || []).filter(a => a.categoryId === c.id).map(a => a.companyId) }));
  if (req.query.page || req.query.limit) { const pg = pageOf(list, req); pg.rows = withCounts(pg.rows); return ok(res, pg); }
  ok(res, withCounts(list));
});
app.get('/api/categories/company/:cid', (req, res) => {
  if (req.ctx.role !== 'super_admin' && req.ctx.companyId !== req.params.cid) return res.status(403).json({ error: 'denied' });
  ok(res, catsForCompany(req.params.cid).filter(c => c.active !== false).sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0)));
});
app.post('/api/categories', (req, res) => {
  if (req.ctx.role === 'sales_user') return res.status(403).json({ error: 'admin only' });
  const { name, icon, desc, image, scope, companyId, sortOrder } = req.body;
  if (!name) return res.status(400).json({ error: 'name required' });
  const id = name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
  if (db.categories.some(c => c.id === id)) return res.status(400).json({ error: 'category already exists' });
  const sc = req.ctx.role === 'super_admin' ? (scope || 'global') : 'company';
  const co = sc === 'company' ? (req.ctx.role === 'super_admin' ? (companyId || null) : req.ctx.companyId) : null;
  if (sc === 'company' && !co) return res.status(400).json({ error: 'companyId required for company category' });
  const c = { id, name, icon: icon || '🏭', desc: desc || '', image: image || '', scope: sc, companyId: co, sortOrder: sortOrder != null ? sortOrder : db.categories.length, active: true };
  db.categories.push(c); save();
  audit(req, 'category.create', 'category', id, co, `Created category ${name} (${sc})`);
  ok(res, c);
});
app.put('/api/categories/:id', (req, res) => {
  if (req.ctx.role === 'sales_user') return res.status(403).json({ error: 'admin only' });
  const c = db.categories.find(x => x.id === req.params.id);
  if (!c) return res.status(404).json({ error: 'not found' });
  if (req.ctx.role !== 'super_admin' && !(c.scope === 'company' && c.companyId === req.ctx.companyId)) return res.status(403).json({ error: 'denied' });
  if (req.body.active === false && c.active !== false && !req.query.force) {
    const n = db.products.filter(p => p.category === c.id && !p.archived).length;
    if (n) return res.status(400).json({ error: `category has ${n} live product(s); confirm to avoid orphaning (retry with ?force=1)` });
  }
  for (const k of ['name', 'icon', 'desc', 'image', 'sortOrder', 'active']) if (req.body[k] !== undefined) c[k] = req.body[k];
  save();
  audit(req, 'category.update', 'category', c.id, c.companyId, `Updated category ${c.name}`);
  ok(res, c);
});
app.post('/api/categories/:id/assign', (req, res) => {
  if (req.ctx.role !== 'super_admin') return res.status(403).json({ error: 'super_admin only' });
  const c = db.categories.find(x => x.id === req.params.id);
  if (!c || c.scope !== 'global') return res.status(400).json({ error: 'only global categories can be assigned' });
  const { companyId } = req.body;
  if (!companyById(companyId)) return res.status(400).json({ error: 'unknown company' });
  db.category_assignments = db.category_assignments || [];
  if (!db.category_assignments.some(a => a.categoryId === c.id && a.companyId === companyId)) db.category_assignments.push({ categoryId: c.id, companyId });
  save();
  audit(req, 'category.assign', 'category', c.id, companyId, `Assigned ${c.name} to ${companyId}`);
  ok(res, { assigned: true });
});
app.delete('/api/categories/:id/assign', (req, res) => {
  if (req.ctx.role !== 'super_admin') return res.status(403).json({ error: 'super_admin only' });
  db.category_assignments = (db.category_assignments || []).filter(a => !(a.categoryId === req.params.id && a.companyId === req.query.companyId));
  save();
  audit(req, 'category.unassign', 'category', req.params.id, req.query.companyId, 'Unassigned category');
  ok(res, { assigned: false });
});

/* products — industrial model: sku/brand/mpn/uom/moq/leadTime/warehouse; price null = quotation-only */
const prodText = p => [p.name, p.short, p.desc, p.sku, p.brand, p.mpn, p.category].filter(Boolean).join(' ').toLowerCase();
app.get('/api/products', (req, res) => {
  let list = [...db.products];
  const cid = req.ctx.role === 'super_admin' ? req.query.companyId : (req.companyId || req.ctx.companyId);
  if (req.query.companyId) {
    if (req.ctx.role !== 'super_admin' && req.query.companyId !== req.ctx.companyId) return res.status(403).json({ error: 'denied' });
    list = list.filter(p => p.companyId === req.query.companyId);
  } else if (req.ctx.role !== 'super_admin' && cid) list = list.filter(p => p.companyId === cid);
  if (req.query.visible) list = list.filter(p => String(p.visible) === req.query.visible);
  if (req.query.cat && req.query.cat !== 'all') list = list.filter(p => p.category === req.query.cat);
  if (req.query.brand && req.query.brand !== 'all') list = list.filter(p => p.brand === req.query.brand);
  if (req.query.q) { const q = req.query.q.toLowerCase(); list = list.filter(p => prodText(p).includes(q)); }
  if (req.query.archived && req.query.archived !== 'all') list = list.filter(p => String(!!p.archived) === req.query.archived);
  if (req.ctx.role === 'sales_user') list = list.filter(p => p.visible !== false && !p.archived);
  if (req.query.page || req.query.limit) return ok(res, pageOf(list, req));
  ok(res, list);
});
app.get('/api/products/:id', (req, res) => {
  const p = db.products.find(x => x.id === req.params.id);
  if (!p) return res.status(404).json({ error: 'not found' });
  if (req.ctx.role !== 'super_admin' && p.companyId !== req.ctx.companyId) return res.status(403).json({ error: 'denied' });
  ok(res, p);
});
app.post('/api/products', scopeCompany, (req, res) => {
  if (req.ctx.role === 'sales_user') return res.status(403).json({ error: 'admin only' });
  if (req.body.price === '') req.body.price = null;
  if (req.body.price != null) req.body.price = Number(req.body.price);
  if (req.body.stock != null && req.body.stock !== '') req.body.stock = Number(req.body.stock);
  const { name, price, stock, sku } = req.body;
  const co = req.companyId || req.body.companyId;
  if (!co) return res.status(400).json({ error: 'companyId required' });
  if (!companyById(co)) return res.status(400).json({ error: 'unknown company' });
  if (!name || !sku) return res.status(400).json({ error: 'name and SKU required' });
  if (price != null && !(price > 0)) return res.status(400).json({ error: 'price must be > 0 or empty (quotation-only)' });
  if (stock == null || stock === '' || !(stock >= 0)) return res.status(400).json({ error: 'stock >= 0 required' });
  if (db.products.some(p => p.sku === sku && p.companyId === co)) return res.status(400).json({ error: `SKU "${sku}" already exists in this company - use a different SKU or edit the existing product` });
  if (req.body.category && !db.categories.some(c => c.id === req.body.category)) return res.status(400).json({ error: 'unknown category' });
  delete req.body.id;
  const p = { id: uid('P-', db.products), sold: 0, featured: false, visible: true, active: true, archived: false, uom: 'Pc', moq: 1, created: new Date().toISOString().slice(0, 10), ...req.body, companyId: co };
  db.products.unshift(p); save();
  audit(req, 'product.create', 'product', p.id, co, `Created SKU ${sku} in ${co}`);
  ok(res, p);
});
app.put('/api/products/:id', scopeCompany, (req, res) => {
  if (!isAdmin(req)) return res.status(403).json({ error: 'admin only' });
  if (req.body.price === '') req.body.price = null;
  if (req.body.price != null) req.body.price = Number(req.body.price);
  if (req.body.stock != null) { req.body.stock = Number(req.body.stock); if (!(req.body.stock >= 0)) return res.status(400).json({ error: 'stock >= 0 required' }); }
  const p = db.products.find(x => x.id === req.params.id);
  if (!p) return res.status(404).json({ error: 'not found' });
  if (req.ctx.role !== 'super_admin' && p.companyId !== req.companyId) return res.status(403).json({ error: 'denied' });
  if (req.body.price != null && !(req.body.price > 0)) return res.status(400).json({ error: 'price must be > 0 or empty (quotation-only)' });
  if (req.body.sku && req.body.sku !== p.sku && db.products.some(x => x.sku === req.body.sku && x.companyId === p.companyId)) return res.status(400).json({ error: 'SKU already exists in this company' });
  if (req.body.category && !db.categories.some(c => c.id === req.body.category)) return res.status(400).json({ error: 'unknown category' });
  delete req.body.companyId; // products stay with their company
  delete req.body.id;
  Object.assign(p, req.body); save();
  audit(req, 'product.update', 'product', p.id, p.companyId, `Updated ${p.sku || p.id}`);
  ok(res, p);
});
app.delete('/api/products/:id', scopeCompany, (req, res) => {
  if (req.ctx.role === 'sales_user') return res.status(403).json({ error: 'admin only' });
  const idx = db.products.findIndex(x => x.id === req.params.id);
  if (idx < 0) return res.status(404).json({ error: 'not found' });
  const p = db.products[idx];
  if (req.ctx.role !== 'super_admin' && p.companyId !== req.companyId) return res.status(403).json({ error: 'denied' });
  db.products.splice(idx, 1);
  save();
  audit(req, 'product.delete', 'product', p.id, p.companyId, `Deleted SKU ${p.sku || p.id}`);
  ok(res, { deleted: true });
});
app.post('/api/products/sync-local', (req, res) => {
  if (!isAdmin(req)) return res.status(403).json({ error: 'admin only' });
  const products = Array.isArray(req.body.products) ? req.body.products : [];
  let added = 0;
  for (const p of products) {
    if (!p.sku || !p.name) continue;
    const co = req.ctx.role === 'super_admin' ? (p.companyId || 'C-ARGUS') : req.ctx.companyId;
    if (!companyById(co)) continue;
    if (!db.products.some(x => x.sku === p.sku && x.companyId === co)) {
      db.products.unshift({
        id: p.id && !db.products.some(x => x.id === p.id) ? p.id : uid('P-', db.products),
        sold: 0,
        featured: !!p.featured,
        visible: p.visible !== false,
        active: true,
        archived: false,
        uom: p.uom || 'Pc',
        moq: p.moq || 1,
        created: p.created || new Date().toISOString().slice(0, 10),
        name: p.name,
        sku: p.sku,
        brand: p.brand || '',
        mpn: p.mpn || '',
        short: p.short || '',
        price: p.price != null ? Number(p.price) : null,
        stock: Number(p.stock || 0),
        category: p.category || 'cutting-tools',
        companyId: co,
        desc: p.desc || p.name,
        specs: p.specs || {},
        images: Array.isArray(p.images) ? p.images.filter(u => u && !String(u).startsWith('blob:')) : [],
        video: p.video || ''
      });
      added++;
    }
  }
  if (added > 0) save();
  ok(res, { synced: added, total: db.products.length });
});
app.patch('/api/products/:id/visibility', scopeCompany, (req, res) => {
  if (!isAdmin(req)) return res.status(403).json({ error: 'admin only' });
  const p = db.products.find(x => x.id === req.params.id);
  if (!p) return res.status(404).json({ error: 'not found' });
  if (req.ctx.role !== 'super_admin' && p.companyId !== req.companyId) return res.status(403).json({ error: 'denied' });
  p.visible = !!req.body.visible; save();
  audit(req, 'product.visibility', 'product', p.id, p.companyId, `Visibility → ${p.visible}`);
  ok(res, p);
});
app.patch('/api/products/:id/archive', scopeCompany, (req, res) => {
  if (!isAdmin(req)) return res.status(403).json({ error: 'admin only' });
  const p = db.products.find(x => x.id === req.params.id);
  if (!p) return res.status(404).json({ error: 'not found' });
  if (req.ctx.role !== 'super_admin' && p.companyId !== req.companyId) return res.status(403).json({ error: 'denied' });
  p.archived = req.body.archived !== false;
  if (p.archived) p.visible = false;
  save();
  audit(req, 'product.archive', 'product', p.id, p.companyId, `Archived=${p.archived}`);
  ok(res, p);
});
/* global catalog (super_admin): every company's products in one view, company stays attached */
app.get('/api/catalog', (req, res) => {
  if (req.ctx.role !== 'super_admin') return res.status(403).json({ error: 'super_admin only' });
  let list = [...db.products];
  if (req.query.companyId && req.query.companyId !== 'all') list = list.filter(p => p.companyId === req.query.companyId);
  if (req.query.cat && req.query.cat !== 'all') list = list.filter(p => p.category === req.query.cat);
  if (req.query.brand && req.query.brand !== 'all') list = list.filter(p => p.brand === req.query.brand);
  if (req.query.visible && req.query.visible !== 'all') list = list.filter(p => String(!!p.visible) === req.query.visible);
  if (req.query.avail === 'in') list = list.filter(p => p.stock > 0 && p.price != null && !p.archived);
  if (req.query.avail === 'rfq') list = list.filter(p => p.price == null || p.stock <= 0);
  if (req.query.archived && req.query.archived !== 'all') list = list.filter(p => String(!!p.archived) === req.query.archived);
  if (req.query.q) { const q = req.query.q.toLowerCase(); list = list.filter(p => prodText(p).includes(q)); }
  list.sort((a, b) => String(b.created).localeCompare(String(a.created)));
  const withCo = l => l.map(p => ({ ...p, companyName: (companyById(p.companyId) || {}).name || p.companyId }));
  if (req.query.page || req.query.limit) { const pg = pageOf(list, req); pg.rows = withCo(pg.rows); return ok(res, pg); }
  ok(res, withCo(list));
});

/* uploads → Supabase Storage (public `retail-media` bucket) when configured; local disk only for offline dev.
   Vercel caps request bodies at 4.5 MB and wipes its tmp dir, so the browser uploads straight to Storage
   with a signed URL from /api/uploads/sign; the server never handles the file bytes. */
const MEDIA_TYPES = /^(image|video)\//;
const safeName = n => String(n || 'file').replace(/[^a-zA-Z0-9.]+/g, '_').slice(-80);
const mediaPath = (req, name) => `${req.ctx.companyId || 'platform'}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}-${safeName(name)}`;
app.post('/api/uploads/sign', async (req, res) => {
  if (!isAdmin(req)) return res.status(403).json({ error: 'admin only' });
  if (!SB.enabled) return res.status(501).json({ error: 'Supabase Storage not configured', fallback: true });
  const files = Array.isArray(req.body.files) ? req.body.files.slice(0, 10) : [];
  if (!files.length) return res.status(400).json({ error: 'files[] required' });
  for (const f of files) {
    if (!MEDIA_TYPES.test(f.type || '')) return res.status(400).json({ error: `${f.name}: only images and videos can be uploaded` });
    if (!(f.size > 0) || f.size > SB.MEDIA_MAX_BYTES) return res.status(400).json({ error: `${f.name}: file must be under ${SB.MEDIA_MAX_BYTES / 1024 / 1024} MB` });
  }
  try {
    await SB.ensureMediaBucket();
    const out = [];
    for (const f of files) {
      const p = mediaPath(req, f.name);
      const { data, error } = await SB.admin.storage.from(SB.MEDIA_BUCKET).createSignedUploadUrl(p);
      if (error) throw error;
      out.push({ name: f.name, path: p, signedUrl: data.signedUrl, publicUrl: SB.mediaPublicUrl(p) });
    }
    ok(res, out);
  } catch (e) { res.status(502).json({ error: 'Storage error: ' + e.message }); }
});
const upload = SB.enabled
  ? multer({ storage: multer.memoryStorage(), limits: { fileSize: 50 * 1024 * 1024 } })
  : multer({ storage: multer.diskStorage({ destination: UP_DIR, filename: (_r, f, cb) => cb(null, Date.now() + '-' + safeName(f.originalname)) }), limits: { fileSize: 50 * 1024 * 1024 } });
/* multipart fallback (small files / clients without signed-URL support) */
app.post('/api/uploads', (req, res, next) => isAdmin(req) ? next() : res.status(403).json({ error: 'admin only' }), upload.array('files', 10), async (req, res) => {
  const files = req.files || [];
  if (files.some(f => !MEDIA_TYPES.test(f.mimetype))) return res.status(400).json({ error: 'only images and videos can be uploaded' });
  if (!SB.enabled) return ok(res, files.map(f => '/uploads/' + f.filename));
  try {
    await SB.ensureMediaBucket();
    const urls = [];
    for (const f of files) {
      const p = mediaPath(req, f.originalname);
      const { error } = await SB.admin.storage.from(SB.MEDIA_BUCKET).upload(p, f.buffer, { contentType: f.mimetype, upsert: false });
      if (error) throw error;
      urls.push(SB.mediaPublicUrl(p));
    }
    ok(res, urls);
  } catch (e) { res.status(502).json({ error: 'Storage error: ' + e.message }); }
});
app.use('/uploads', express.static(UP_DIR));
/* best-effort removal of a file we stored; never blocks the request */
function removeStoredMedia(url) {
  const p = SB.enabled && SB.mediaPathFromUrl(url);
  if (p) SB.admin.storage.from(SB.MEDIA_BUCKET).remove([p]).catch(() => {});
}

/* orders — server computes totals, validates + deducts stock atomically.
   Quotation-only (price null) products are rejected: submit an RFQ instead. */
const FLOW = ['Pending', 'Confirmed', 'Processing', 'Ready for Dispatch', 'Shipped', 'Delivered'];
app.get('/api/orders', scopeCompany, (req, res) => {
  const cid = req.ctx.role === 'super_admin' ? (req.query.companyId && req.query.companyId !== 'all' ? req.query.companyId : null) : req.companyId;
  let list = db.orders.filter(o => !cid || o.companyId === cid);
  if (req.query.status && req.query.status !== 'all') list = list.filter(o => o.status === req.query.status);
  if (req.query.q) { const q = req.query.q.toLowerCase(); list = list.filter(o => (o.id + o.customer + (o.companyName || '') + o.mobile + (o.poRef || '')).toLowerCase().includes(q)); }
  const withCo = l => l.map(o => ({ ...o, companyName2: (companyById(o.companyId) || {}).name || o.companyId }));
  if (req.query.page || req.query.limit) { const pg = pageOf(list, req); pg.rows = withCo(pg.rows); return ok(res, pg); }
  ok(res, withCo(list));
});
app.get('/api/orders/:id', scopeCompany, (req, res) => {
  const o = db.orders.find(x => x.id === req.params.id);
  if (!o) return res.status(404).json({ error: 'not found' });
  if (req.ctx.role !== 'super_admin' && o.companyId !== req.companyId) return res.status(403).json({ error: 'denied' });
  ok(res, o);
});
app.post('/api/orders', scopeCompany, (req, res) => {
  const { customer, contact, companyName, mobile, address, city, poRef, items } = req.body;
  if (!customer || !mobile || !address || !Array.isArray(items) || !items.length) return res.status(400).json({ error: 'customer, mobile, address, items[] required' });
  const cid = req.companyId;
  let total = 0; const lines = [];
  for (const it of items) { // revalidate stock + price server-side, never trust client
    const p = db.products.find(x => x.id === it.pid && x.companyId === cid);
    if (!p) return res.status(400).json({ error: 'unknown product ' + it.pid });
    if (!p.visible) return res.status(400).json({ error: p.name + ' is not visible in the store' });
    if (p.price == null) return res.status(400).json({ error: p.name + ' is quotation-only — submit a quotation request instead' });
    if (!(it.qty > 0) || it.qty > p.stock) return res.status(400).json({ error: p.name + ' (' + (p.sku || p.id) + '): only ' + p.stock + ' ' + (p.uom || 'pcs') + ' in stock' });
    total += p.price * it.qty; lines.push({ pid: p.id, qty: it.qty, price: p.price });
  }
  const id = uid('ORD-', db.orders);
  const order = { id, companyId: cid, date: new Date().toISOString().slice(0, 16).replace('T', ' '), salesUser: req.ctx.name, customer, contact: contact || customer, companyName: companyName || '', mobile, city: city || '', address, poRef: poRef || '', total, status: 'Pending', items: lines, history: [['Pending', new Date().toLocaleString()]] };
  for (const l of lines) { const p = db.products.find(x => x.id === l.pid); p.stock -= l.qty; p.sold = (p.sold || 0) + l.qty; } // single atomic write
  db.orders.unshift(order); save(); ok(res, order);
});
app.patch('/api/orders/:id/status', scopeCompany, (req, res) => {
  if (!isAdmin(req)) return res.status(403).json({ error: 'admin only' });
  const o = db.orders.find(x => x.id === req.params.id);
  if (!o) return res.status(404).json({ error: 'not found' });
  if (req.ctx.role !== 'super_admin' && o.companyId !== req.companyId) return res.status(403).json({ error: 'denied' });
  const next = req.body.status;
  if (next !== 'Cancelled' && !FLOW.includes(next)) return res.status(400).json({ error: 'invalid status ' + next });
  if (o.status === 'Cancelled' || o.status === 'Delivered') return res.status(400).json({ error: o.status + ' is final' });
  if (next === 'Cancelled' || FLOW.indexOf(next) >= FLOW.indexOf(o.status)) {
    o.status = next; o.history.push([next, new Date().toLocaleString()]);
    if (next === 'Cancelled') for (const l of o.items) { const p = db.products.find(x => x.id === l.pid); if (p) p.stock += l.qty; } // restock policy
    save();
    audit(req, 'order.status', 'order', o.id, o.companyId, `Status → ${next}`);
    return ok(res, o);
  }
  return res.status(400).json({ error: 'invalid transition ' + o.status + ' → ' + next });
});

/* quotations (RFQ) — maps to the ERP Quotations module later; kept as its own
   collection here so no duplicate sales-order logic is created. */
const QFLOW = ['Pending', 'Quoted', 'Accepted', 'Rejected', 'Cancelled'];
app.get('/api/quotations', scopeCompany, (req, res) => {
  const cid = req.ctx.role === 'super_admin' ? (req.query.companyId && req.query.companyId !== 'all' ? req.query.companyId : null) : req.companyId;
  let list = db.quotations.filter(q => !cid || q.companyId === cid);
  if (req.ctx.role === 'sales_user' && req.query.mine === '1') list = list.filter(q => q.requestedBy === req.ctx.name);
  if (req.query.status && req.query.status !== 'all') list = list.filter(q => q.status === req.query.status);
  const withNames = l => l.map(q => { const p = db.products.find(x => x.id === q.pid) || {}; return { ...q, productName: p.name || q.pid, sku: p.sku || '', companyName2: (companyById(q.companyId) || {}).name || q.companyId }; });
  if (req.query.page || req.query.limit) { const pg = pageOf(list, req); pg.rows = withNames(pg.rows); return ok(res, pg); }
  ok(res, withNames(list));
});
app.post('/api/quotations', scopeCompany, (req, res) => {
  const { pid, qty, techReq, deliveryReq, companyName, contact, mobile } = req.body;
  const p = db.products.find(x => x.id === pid && x.companyId === req.companyId);
  if (!p) return res.status(400).json({ error: 'unknown product' });
  if (!(qty > 0)) return res.status(400).json({ error: 'quantity required' });
  const q = { id: uid('Q-', db.quotations), companyId: req.companyId, date: new Date().toISOString().slice(0, 16).replace('T', ' '), requestedBy: req.ctx.name, pid, qty, techReq: techReq || '', deliveryReq: deliveryReq || '', companyName: companyName || '', contact: contact || '', mobile: mobile || '', status: 'Pending', quotePrice: null, adminNote: '' };
  db.quotations.unshift(q); save(); ok(res, q);
});
app.patch('/api/quotations/:id', scopeCompany, (req, res) => {
  if (req.ctx.role === 'sales_user') return res.status(403).json({ error: 'admin only' });
  const q = db.quotations.find(x => x.id === req.params.id);
  if (!q) return res.status(404).json({ error: 'not found' });
  if (req.ctx.role !== 'super_admin' && q.companyId !== req.companyId) return res.status(403).json({ error: 'denied' });
  const { status, quotePrice, adminNote } = req.body;
  if (status && !QFLOW.includes(status)) return res.status(400).json({ error: 'invalid status' });
  if (status) q.status = status;
  if (quotePrice != null) q.quotePrice = quotePrice;
  if (adminNote != null) q.adminNote = adminNote;
  save();
  audit(req, 'quote.respond', 'quotation', q.id, q.companyId, `RFQ → ${q.status}${q.quotePrice != null ? ' @ ' + q.quotePrice : ''}`);
  ok(res, q);
});

/* stats — every metric computed from live DB rows */
app.get('/api/stats/platform', (req, res) => {
  if (req.ctx.role !== 'super_admin') return res.status(403).json({ error: 'super_admin only' });
  const byStatus = s => db.orders.filter(o => o.status === s).length;
  const byQ = s => db.quotations.filter(q => q.status === s).length;
  const catDist = db.categories.filter(c => c.scope === 'global').map(c => ({ id: c.id, name: c.name, icon: c.icon, products: db.products.filter(p => p.category === c.id && !p.archived).length }));
  const act = {};
  for (const o of db.orders) { const d = String(o.date).slice(0, 10); act[d] = (act[d] || 0) + 1; }
  const growth = {};
  for (const c of db.companies) { const m = String(c.createdAt || '').slice(0, 7); if (m) growth[m] = (growth[m] || 0) + 1; }
  ok(res, {
    companies: db.companies.length,
    activeCompanies: db.companies.filter(c => (c.storeStatus || c.status) === 'active').length,
    suspendedCompanies: db.companies.filter(c => (c.storeStatus || c.status) !== 'active').length,
    admins: db.users.filter(u => u.role === 'company_admin').length,
    salesUsers: db.users.filter(u => u.role === 'sales_user').length,
    products: db.products.filter(p => !p.archived).length,
    visibleProducts: db.products.filter(p => p.visible && !p.archived).length,
    categories: db.categories.filter(c => c.scope === 'global').length,
    orders: db.orders.length,
    pendingOrders: byStatus('Pending'),
    quotes: db.quotations.length,
    openQuotes: byQ('Pending'),
    gmv: db.orders.reduce((a, o) => a + o.total, 0),
    orderStatus: ['Pending', 'Confirmed', 'Processing', 'Ready for Dispatch', 'Shipped', 'Delivered', 'Cancelled'].map(s => ({ status: s, count: byStatus(s) })),
    quoteStatus: ['Pending', 'Quoted', 'Accepted', 'Rejected', 'Cancelled'].map(s => ({ status: s, count: byQ(s) })),
    categoryDist: catDist,
    orderActivity: Object.entries(act).sort().slice(-14).map(([date, count]) => ({ date, count })),
    companyGrowth: Object.entries(growth).sort().map(([month, count]) => ({ month, count })),
    byCompany: db.companies.map(c => ({ id: c.id, code: c.code || c.id, name: c.name, logo: c.logo, city: c.city, industry: c.industry, status: c.storeStatus || c.status, users: usersOf(c.id).length, products: productsOf(c.id).filter(p => !p.archived).length, orders: ordersOf(c.id).length, pending: ordersOf(c.id).filter(o => o.status === 'Pending').length, revenue: ordersOf(c.id).reduce((a, o) => a + o.total, 0) }))
  });
});
app.get('/api/stats/company', scopeCompany, (req, res) => {
  const cid = req.companyId;
  const ps = db.products.filter(p => p.companyId === cid), os = db.orders.filter(o => o.companyId === cid);
  const qs = db.quotations.filter(q => q.companyId === cid);
  ok(res, { products: ps.length, visible: ps.filter(p => p.visible).length, lowStock: ps.filter(p => p.stock <= 10).length, quotationOnly: ps.filter(p => p.price == null).length, orders: os.length, pending: os.filter(o => o.status === 'Pending').length, delivered: os.filter(o => o.status === 'Delivered').length, revenue: os.reduce((a, o) => a + o.total, 0), openQuotes: qs.filter(q => q.status === 'Pending').length });
});
app.get('/api/settings', scopeCompany, (req, res) => ok(res, db.settings[req.companyId] || {}));
app.put('/api/settings', scopeCompany, (req, res) => {
  if (req.ctx.role === 'sales_user') return res.status(403).json({ error: 'admin only' });
  const { companyId: _c, ...vals } = req.body;
  db.settings = db.settings || {};
  db.settings[req.companyId] = { ...(db.settings[req.companyId] || {}), ...vals }; save();
  audit(req, 'settings.company', 'settings', req.companyId, req.companyId, `Updated store settings: ${Object.keys(req.body).join(', ')}`);
  ok(res, db.settings[req.companyId]);
});

/* product media metadata (binaries stay on disk/Storage; company-scoped) */
function mediaVisible(m, req) {
  if (req.ctx.role === 'super_admin') return true;
  return m.companyId === (req.companyId || req.ctx.companyId);
}
app.get('/api/media', scopeCompany, (req, res) => {
  let list = [...(db.product_media || [])].filter(m => mediaVisible(m, req));
  if (req.query.companyId && req.ctx.role === 'super_admin') list = list.filter(m => m.companyId === req.query.companyId);
  if (req.query.productId) list = list.filter(m => m.productId === req.query.productId);
  if (req.query.type && req.query.type !== 'all') list = list.filter(m => m.type === req.query.type);
  list.sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));
  const withNames = l => l.map(m => ({ ...m, productName: (db.products.find(p => p.id === m.productId) || {}).name || m.productId, companyName: (companyById(m.companyId) || {}).name || m.companyId }));
  if (req.query.page || req.query.limit) { const pg = pageOf(list, req); pg.rows = withNames(pg.rows); return ok(res, pg); }
  ok(res, withNames(list));
});
app.post('/api/media', scopeCompany, (req, res) => {
  if (req.ctx.role === 'sales_user') return res.status(403).json({ error: 'admin only' });
  const { productId, type, url, primary, visible } = req.body;
  const co = req.companyId || req.body.companyId;
  if (!productId || !url) return res.status(400).json({ error: 'productId and url required' });
  const p = db.products.find(x => x.id === productId && x.companyId === co);
  if (!p) return res.status(400).json({ error: 'unknown product in this company' });
  const t = type === 'video' ? 'video' : 'image';
  const siblings = db.product_media.filter(m => m.productId === productId);
  const m = { id: 'M-' + Date.now(), companyId: co, productId, sku: p.sku || '', type: t, url, primary: primary !== false && siblings.length === 0, visible: visible !== false, sortOrder: siblings.length, createdAt: new Date().toISOString().slice(0, 10) };
  if (m.primary) siblings.forEach(s => { if (s.type === t) s.primary = false; });
  db.product_media.push(m);
  if (t === 'image' && !(p.images || []).includes(url)) { p.images = [...(p.images || []), url]; }
  if (t === 'video' && !p.video) p.video = url;
  save();
  audit(req, 'media.upload', 'media', m.id, co, `Uploaded ${t} for ${p.sku || productId}`);
  ok(res, m);
});
app.patch('/api/media/:id', scopeCompany, (req, res) => {
  if (req.ctx.role === 'sales_user') return res.status(403).json({ error: 'admin only' });
  const m = (db.product_media || []).find(x => x.id === req.params.id);
  if (!m || !mediaVisible(m, req)) return res.status(404).json({ error: 'not found' });
  if (req.body.primary === true) (db.product_media || []).filter(s => s.productId === m.productId && s.type === m.type).forEach(s => { s.primary = false; });
  for (const k of ['primary', 'visible', 'sortOrder', 'url']) if (req.body[k] !== undefined) m[k] = req.body[k];
  if (m.primary && m.type === 'image') { const p = db.products.find(x => x.id === m.productId); if (p) p.images = [m.url, ...(p.images || []).filter(u => u !== m.url)]; }
  save();
  audit(req, 'media.update', 'media', m.id, m.companyId, `Updated media ${m.id}`);
  ok(res, m);
});
app.delete('/api/media/:id', scopeCompany, (req, res) => {
  if (req.ctx.role === 'sales_user') return res.status(403).json({ error: 'admin only' });
  const m = (db.product_media || []).find(x => x.id === req.params.id);
  if (!m || !mediaVisible(m, req)) return res.status(404).json({ error: 'not found' });
  db.product_media = db.product_media.filter(x => x.id !== m.id);
  const p = db.products.find(x => x.id === m.productId);
  if (p) { if (m.type === 'image') p.images = (p.images || []).filter(u => u !== m.url); if (m.type === 'video' && p.video === m.url) p.video = ''; }
  save();
  if (!db.products.some(x => (x.images || []).includes(m.url) || x.video === m.url)) removeStoredMedia(m.url);
  audit(req, 'media.delete', 'media', m.id, m.companyId, `Deleted ${m.type} of ${m.sku || m.productId}`);
  ok(res, { deleted: true });
});

/* audit trail (super: all/filterable; admin: own company) */
app.get('/api/audit', scopeCompany, (req, res) => {
  let list = [...(db.audit_logs || [])];
  if (req.ctx.role !== 'super_admin') list = list.filter(a => a.companyId === req.companyId);
  else if (req.query.companyId && req.query.companyId !== 'all') list = list.filter(a => a.companyId === req.query.companyId);
  if (req.query.action && req.query.action !== 'all') list = list.filter(a => a.action === req.query.action);
  if (req.query.q) { const q = req.query.q.toLowerCase(); list = list.filter(a => (a.actor + ' ' + a.summary + ' ' + a.entityId).toLowerCase().includes(q)); }
  list.sort((a, b) => String(b.ts).localeCompare(String(a.ts)));
  if (req.query.page || req.query.limit) return ok(res, pageOf(list, req));
  ok(res, list.slice(0, 100));
});

/* global store settings (super) vs company overrides */
app.get('/api/settings/global', (req, res) => {
  if (req.ctx.role !== 'super_admin') return res.status(403).json({ error: 'super_admin only' });
  ok(res, db.global_settings || {});
});
app.put('/api/settings/global', (req, res) => {
  if (req.ctx.role !== 'super_admin') return res.status(403).json({ error: 'super_admin only' });
  db.global_settings = { ...(db.global_settings || {}), ...req.body, updatedAt: new Date().toISOString().slice(0, 10) };
  save();
  audit(req, 'settings.global', 'settings', 'global', '', `Updated global settings: ${Object.keys(req.body).join(', ')}`);
  ok(res, db.global_settings);
});

/* serve frontend (same origin → no CORS issues) */
const CLIENT_DIST = path.join(ROOT, 'client', 'dist');
const WEBROOT = fs.existsSync(CLIENT_DIST) ? CLIENT_DIST : ROOT;
app.use(express.static(WEBROOT));
app.use('/uploads', express.static(UP_DIR));
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api') || req.path.startsWith('/uploads')) return next();
  res.sendFile(path.join(WEBROOT, 'index.html'));
});

if (require.main === module) {
  app.listen(PORT, () => console.log(`CNCFORGE Industrial Store: frontend + API on http://localhost:${PORT}`));
}
module.exports = { app, db, save, seed, DB_FILE };
