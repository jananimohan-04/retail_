# CNCFORGE ERP — Industrial Store (frontend + local backend)

> B2B procurement module for CNC manufacturers. No Supabase yet — backend uses a JSON file DB with the same API shape Supabase will replace.

## 1. Run both (one command)

```powershell
npm run install:all   # first time only — installs backend deps
npm run dev           # starts backend, which also serves the frontend
```

Open **http://localhost:4000** — storefront + API on the same port (no CORS issues).
Toast `🟢 Backend connected` means live data.

## 2. Catalog migration (consumer demo → industrial seed)

Old consumer demo products live only in dev seed/backups — production records are never auto-deleted:

```powershell
node scripts/migrate-industrial.js   # backend must NOT be running
```

- Backs up `backend/db.json` → `backend/db.backup-<timestamp>.json`
- Replaces **only** `categories` + `products` with the industrial seed
- Preserves companies, users, settings, quotations, order history
- Legacy order items referencing retired SKUs render via fallback (documented in code)

## 3. What the store is now

- **Brand:** CNCFORGE Industrial Store — navy `#172554` / blue `#2563EB` / orange `#F97316`
- **Catalog:** 9 industrial categories (CNC machines, cutting tools, spares, workholding, control & electrical, raw materials, consumables, measuring, safety) × 12 SKUs with **SKU, brand, MPN, UoM, MOQ, lead time, warehouse**
- **Quotation-only:** products with no price show *Request Quotation*, never a fabricated price; out-of-stock shows *Check Availability*
- **RFQ workflow:** `POST /api/quotations` → admin responds with price/note → `Quoted/Accepted/Rejected`; no duplicate sales system, maps to ERP Quotations later
- **B2B checkout:** company name, contact, PO reference, GST-invoice wording; orders recorded as **Pending**, never paid
- **Inventory:** single source of truth (`products[].stock`); server revalidates price/stock, rejects invisible + quotation-only items, deducts atomically, restocks on cancel

## 4. API (`/api`, headers `x-role` / `x-company-id` / `x-user-name`)

- Products: `GET /api/products?q=&cat=&brand=&visible=` (q spans name/SKU/MPN/brand/desc), `POST` (SKU unique per company, price optional), `PUT`, `PATCH …/visibility`
- Orders: `GET`, `POST` (server totals, atomic deduct), `PATCH …/status` (forward-only flow, cancel restocks)
- Quotations: `GET /api/quotations?mine=1&status=`, `POST`, `PATCH /api/quotations/:id` (admin)
- Companies, users, categories, settings, stats, uploads (`POST /api/uploads` → `/uploads/*`)

Verified: priced order deducts stock; oversell → 400; quotation-only → 400 with RFQ hint; duplicate SKU → 400; cross-company → 403; RFQ submit + respond works.

## 5. Frontend (`index.html` + `css/theme.css` + `js/`)

- `mock-data.js` — industrial seed, used when backend unreachable
- `api.js` — live-data bridge (products/orders/quotes/cats/users/companies cache)
- `app.js` — hash SPA; routes unchanged + `#/store/quotes`, `#/admin/quotes`; stale v1 localStorage overrides invalidated (`_v2` keys)

## 6. Demo roles (top-right pills)

- Super Admin → companies, admins, platform stats
- Company Admin (Amina, Apex CNC Works) → catalog, media, orders, quotations, users, settings
- Sales User (Ravi) → catalog, cart, RFQ, checkout, tracking

## 7. Supabase cutover (when credentials arrive)

Keep routes + UI; replace `backend/server.js` internals: JSON → Supabase tables (`products` + industrial columns, `quotations`, `product_media`), header auth → Auth + RLS on `company_id`, disk uploads → Storage buckets, order block → Postgres function with row locks.
