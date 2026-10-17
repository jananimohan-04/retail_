-- CNCFORGE Industrial Store · Supabase migration
-- All tables use the retail_ prefix. Run in Supabase SQL Editor (fresh project).
-- Maps the JSON collections: companies, users, categories, category_assignments,
-- products, product_media, orders (+items/+history), quotations, store settings,
-- global settings, audit logs.

-- ============ 0. helpers ============
create or replace function public.retail_my_company()
returns text language sql stable as $$ select nullif(auth.jwt() ->> 'company_id', '') $$;

create or replace function public.retail_my_role()
returns text language sql stable as $$ select coalesce(auth.jwt() ->> 'role', '') $$;

create or replace function public.retail_is_super_admin()
returns boolean language sql stable as $$ select public.retail_my_role() = 'super_admin' $$;

create or replace function public.retail_set_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end $$;

-- ============ 1. retail_companies ============
create table if not exists public.retail_companies (
  id          text primary key,
  code        text not null unique,
  name        text not null,
  logo        text not null default '🏭',
  industry    text not null default 'CNC Manufacturing',
  email       text not null default '',
  phone       text not null default '',
  address     text not null default '',
  city        text not null,
  state       text not null default '',
  pin         text not null default '',
  description text not null default '',
  status      text not null default 'active' check (status in ('active','suspended')),
  store_status text not null default 'active' check (store_status in ('active','suspended')),
  plan        text not null default 'Starter',
  created_at  date not null default current_date,
  updated_at  date not null default current_date
);
drop trigger if exists trg_retail_companies_upd on public.retail_companies;
create trigger trg_retail_companies_upd before update on public.retail_companies
  for each row execute function public.retail_set_updated_at();
create index if not exists ix_retail_companies_status on public.retail_companies (store_status);
create index if not exists ix_retail_companies_city on public.retail_companies (city);

-- ============ 2. retail_users ============
create table if not exists public.retail_users (
  id         text primary key,
  company_id text references public.retail_companies (id) on delete set null,
  name       text not null,
  email      text not null unique,
  role       text not null default 'sales_user'
             check (role in ('super_admin','company_admin','sales_user')),
  mobile     text not null default '',
  active     boolean not null default true,
  created_at date not null default current_date,
  constraint retail_users_company_required
    check (role = 'super_admin' and company_id is null
        or role <> 'super_admin' and company_id is not null)
);
create index if not exists ix_retail_users_company on public.retail_users (company_id);
create index if not exists ix_retail_users_role on public.retail_users (role);

-- ============ 3. retail_categories (global + company-specific) ============
create table if not exists public.retail_categories (
  id          text primary key,
  name        text not null,
  icon        text not null default '🏭',
  description text not null default '',
  image       text not null default '',
  scope       text not null default 'global' check (scope in ('global','company')),
  company_id  text references public.retail_companies (id) on delete cascade,
  sort_order  integer not null default 0,
  active      boolean not null default true,
  constraint retail_categories_company_scope
    check (scope = 'global' and company_id is null
        or scope = 'company' and company_id is not null)
);
create index if not exists ix_retail_categories_scope on public.retail_categories (scope);

-- ============ 4. retail_category_assignments (global cat -> company) ============
create table if not exists public.retail_category_assignments (
  id          bigint generated always as identity primary key,
  category_id text not null references public.retail_categories (id) on delete cascade,
  company_id  text not null references public.retail_companies (id) on delete cascade,
  unique (category_id, company_id)
);

-- ============ 5. retail_products ============
create table if not exists public.retail_products (
  id         text primary key,
  sku        text not null,
  company_id text not null references public.retail_companies (id) on delete cascade,
  name       text not null,
  brand      text not null default '',
  mpn        text not null default '',
  short      text not null default '',
  price      numeric(14,2),                       -- NULL = quotation-only
  uom        text not null default 'Pc',
  moq        integer not null default 1 check (moq >= 1),
  lead_time  text not null default '',
  warehouse  text not null default '',
  stock      integer not null default 0 check (stock >= 0),
  category_id text references public.retail_categories (id) on delete restrict,
  visible    boolean not null default true,
  featured   boolean not null default false,
  sold       integer not null default 0,
  created    date not null default current_date,
  description text not null default '',
  specs      jsonb not null default '{}',
  images     text[] not null default '{}',
  video      text not null default '',
  active     boolean not null default true,
  archived   boolean not null default false,
  unique (sku, company_id),
  constraint retail_products_price_rule check (price is null or price > 0)
);
create index if not exists ix_retail_products_company on public.retail_products (company_id);
create index if not exists ix_retail_products_category on public.retail_products (category_id);
create index if not exists ix_retail_products_brand on public.retail_products (brand);
create index if not exists ix_retail_products_visible on public.retail_products (company_id, visible) where archived = false;

-- ============ 6. retail_product_media (metadata only; binaries in Storage) ============
create table if not exists public.retail_product_media (
  id          text primary key,
  company_id  text not null references public.retail_companies (id) on delete cascade,
  product_id  text not null references public.retail_products (id) on delete cascade,
  sku         text not null default '',
  type        text not null check (type in ('image','video')),
  url         text not null,
  is_primary  boolean not null default false,
  visible     boolean not null default true,
  sort_order  integer not null default 0,
  created_at  date not null default current_date
);
create index if not exists ix_retail_media_product on public.retail_product_media (product_id);
create index if not exists ix_retail_media_company on public.retail_product_media (company_id);

-- ============ 7a. retail_orders (header; totals computed from lines) ============
create table if not exists public.retail_orders (
  id           text primary key,
  company_id   text not null references public.retail_companies (id) on delete cascade,
  ordered_at   timestamptz not null default now(),
  sales_user   text not null default '',
  customer     text not null,
  contact      text not null default '',
  company_name text not null default '',
  mobile       text not null,
  city         text not null default '',
  address      text not null,
  po_ref       text not null default '',
  total        numeric(14,2) not null default 0,
  status       text not null default 'Pending'
               check (status in ('Pending','Confirmed','Processing','Ready for Dispatch','Shipped','Delivered','Cancelled'))
);
create index if not exists ix_retail_orders_company on public.retail_orders (company_id);
create index if not exists ix_retail_orders_status on public.retail_orders (status);
create index if not exists ix_retail_orders_date on public.retail_orders (ordered_at desc);

-- ============ 7b. retail_order_items (lines; stock moves driven from here) ============
create table if not exists public.retail_order_items (
  id          bigint generated always as identity primary key,
  order_id    text not null references public.retail_orders (id) on delete cascade,
  product_id  text not null references public.retail_products (id) on delete restrict,
  qty         integer not null check (qty > 0),
  unit_price  numeric(14,2) not null check (unit_price > 0),
  unique (order_id, product_id)
);
create index if not exists ix_retail_order_items_order on public.retail_order_items (order_id);

-- ============ 7c. retail_order_status_history ============
create table if not exists public.retail_order_status_history (
  id         bigint generated always as identity primary key,
  order_id   text not null references public.retail_orders (id) on delete cascade,
  status     text not null,
  changed_at timestamptz not null default now(),
  changed_by text not null default ''
);
create index if not exists ix_retail_order_history_order on public.retail_order_status_history (order_id);

-- ============ 8. retail_quotations (RFQ; maps to ERP quotations later) ============
create table if not exists public.retail_quotations (
  id            text primary key,
  company_id    text not null references public.retail_companies (id) on delete cascade,
  requested_at  timestamptz not null default now(),
  requested_by  text not null default '',
  product_id    text not null references public.retail_products (id) on delete restrict,
  qty           integer not null check (qty > 0),
  tech_req      text not null default '',
  delivery_req  text not null default '',
  company_name  text not null default '',
  contact       text not null default '',
  mobile        text not null default '',
  status        text not null default 'Pending'
                check (status in ('Pending','Quoted','Accepted','Rejected','Cancelled')),
  quote_price   numeric(14,2),
  admin_note    text not null default ''
);
create index if not exists ix_retail_quotations_company on public.retail_quotations (company_id);
create index if not exists ix_retail_quotations_status on public.retail_quotations (status);

-- ============ 9. retail_store_settings (per-company overrides) ============
create table if not exists public.retail_store_settings (
  company_id   text primary key references public.retail_companies (id) on delete cascade,
  store_name   text not null default '',
  tax_pct      numeric(5,2) not null default 18,
  delivery_fee numeric(12,2) not null default 0,
  free_above   numeric(12,2) not null default 0,
  order_prefix text not null default 'ORD-',
  announcement text not null default '',
  updated_at   timestamptz not null default now()
);
drop trigger if exists trg_retail_store_settings_upd on public.retail_store_settings;
create trigger trg_retail_store_settings_upd before update on public.retail_store_settings
  for each row execute function public.retail_set_updated_at();

-- ============ 10. retail_global_settings (single row, id = 1) ============
create table if not exists public.retail_global_settings (
  id                  integer primary key check (id = 1),
  currency            text not null default 'INR',
  tax_pct             numeric(5,2) not null default 18,
  tax_display         text not null default 'inclusive',
  visibility_default  boolean not null default true,
  quotation_enabled   boolean not null default true,
  order_prefix        text not null default 'ORD-',
  quote_prefix        text not null default 'Q-',
  low_stock_threshold integer not null default 10,
  announcement        text not null default '',
  updated_at          timestamptz not null default now()
);
insert into public.retail_global_settings (id) values (1) on conflict (id) do nothing;

-- ============ 11. retail_audit_logs (no FK: history survives company deletes) ============
create table if not exists public.retail_audit_logs (
  id         text primary key,
  ts         timestamptz not null default now(),
  actor      text not null default '',
  role       text not null default '',
  action     text not null,
  entity     text not null,
  entity_id  text not null default '',
  company_id text not null default '',
  summary    text not null default ''
);
create index if not exists ix_retail_audit_company on public.retail_audit_logs (company_id);
create index if not exists ix_retail_audit_ts on public.retail_audit_logs (ts desc);
create index if not exists ix_retail_audit_action on public.retail_audit_logs (action);

-- ============ 12. seed: 9 global industrial categories ============
insert into public.retail_categories (id, name, icon, description, scope, sort_order) values
  ('cnc-machines','CNC Machines','🏭','Turning, milling & machining centers','global',0),
  ('cutting-tools','Cutting Tools','🔩','Inserts, end mills, drills & taps','global',1),
  ('spares','Machine Spare Parts','⚙️','Bearings, ball screws & hydraulics','global',2),
  ('workholding','Workholding & Accessories','🗜️','Chucks, collets & fixtures','global',3),
  ('electrical','Control & Electrical','🎛️','Servo, drives & sensors','global',4),
  ('raw-materials','Raw Materials','🧱','Bars, rods, sheets & plastics','global',5),
  ('consumables','Industrial Consumables','🛢️','Coolants, lubricants & abrasives','global',6),
  ('measuring','Measuring & Inspection','📏','Calipers, micrometers & gauges','global',7),
  ('safety','Safety & Maintenance','🦺','PPE, filters & maintenance kits','global',8)
on conflict (id) do nothing;

-- ============ 13. Row Level Security ============
alter table public.retail_companies            enable row level security;
alter table public.retail_users               enable row level security;
alter table public.retail_categories          enable row level security;
alter table public.retail_category_assignments enable row level security;
alter table public.retail_products            enable row level security;
alter table public.retail_product_media       enable row level security;
alter table public.retail_orders              enable row level security;
alter table public.retail_order_items         enable row level security;
alter table public.retail_order_status_history enable row level security;
alter table public.retail_quotations          enable row level security;
alter table public.retail_store_settings      enable row level security;
alter table public.retail_global_settings     enable row level security;
alter table public.retail_audit_logs          enable row level security;

-- --- companies: super full; company users read own only
drop policy if exists retail_companies_all on public.retail_companies;
create policy retail_companies_all on public.retail_companies for all to authenticated
  using (public.retail_is_super_admin() or id = public.retail_my_company())
  with check (public.retail_is_super_admin());

-- --- users: super full; others read own company
drop policy if exists retail_users_all on public.retail_users;
create policy retail_users_all on public.retail_users for all to authenticated
  using (public.retail_is_super_admin() or company_id = public.retail_my_company())
  with check (public.retail_is_super_admin()
    or (company_id = public.retail_my_company() and role = 'sales_user'));

-- --- global categories readable by all; writes super only.
--- company categories isolated per company.
drop policy if exists retail_categories_read on public.retail_categories;
create policy retail_categories_read on public.retail_categories for select to authenticated
  using (scope = 'global' or public.retail_is_super_admin() or company_id = public.retail_my_company());
drop policy if exists retail_categories_write on public.retail_categories;
create policy retail_categories_write on public.retail_categories for all to authenticated
  using (public.retail_is_super_admin()
    or (scope = 'company' and company_id = public.retail_my_company()))
  with check (public.retail_is_super_admin()
    or (scope = 'company' and company_id = public.retail_my_company()));

-- --- assignments: read own company (or super); write super only
drop policy if exists retail_assignments_all on public.retail_category_assignments;
create policy retail_assignments_all on public.retail_category_assignments for all to authenticated
  using (public.retail_is_super_admin() or company_id = public.retail_my_company())
  with check (public.retail_is_super_admin());

-- --- company-scoped tables: super full; own-company read; writes own-company (service role bypasses RLS for server writes)
drop policy if exists retail_products_all on public.retail_products;
create policy retail_products_all on public.retail_products for all to authenticated
  using (public.retail_is_super_admin() or company_id = public.retail_my_company())
  with check (public.retail_is_super_admin() or company_id = public.retail_my_company());

drop policy if exists retail_media_all on public.retail_product_media;
create policy retail_media_all on public.retail_product_media for all to authenticated
  using (public.retail_is_super_admin() or company_id = public.retail_my_company())
  with check (public.retail_is_super_admin() or company_id = public.retail_my_company());

drop policy if exists retail_orders_all on public.retail_orders;
create policy retail_orders_all on public.retail_orders for all to authenticated
  using (public.retail_is_super_admin() or company_id = public.retail_my_company())
  with check (public.retail_is_super_admin() or company_id = public.retail_my_company());

drop policy if exists retail_items_all on public.retail_order_items;
create policy retail_items_all on public.retail_order_items for all to authenticated
  using (public.retail_is_super_admin()
    or exists (select 1 from public.retail_orders o
               where o.id = order_id and o.company_id = public.retail_my_company()))
  with check (public.retail_is_super_admin()
    or exists (select 1 from public.retail_orders o
               where o.id = order_id and o.company_id = public.retail_my_company()));

drop policy if exists retail_history_all on public.retail_order_status_history;
create policy retail_history_all on public.retail_order_status_history for all to authenticated
  using (public.retail_is_super_admin()
    or exists (select 1 from public.retail_orders o
               where o.id = order_id and o.company_id = public.retail_my_company()))
  with check (public.retail_is_super_admin()
    or exists (select 1 from public.retail_orders o
               where o.id = order_id and o.company_id = public.retail_my_company()));

drop policy if exists retail_quotes_all on public.retail_quotations;
create policy retail_quotes_all on public.retail_quotations for all to authenticated
  using (public.retail_is_super_admin() or company_id = public.retail_my_company())
  with check (public.retail_is_super_admin() or company_id = public.retail_my_company());

drop policy if exists retail_settings_all on public.retail_store_settings;
create policy retail_settings_all on public.retail_store_settings for all to authenticated
  using (public.retail_is_super_admin() or company_id = public.retail_my_company())
  with check (public.retail_is_super_admin() or company_id = public.retail_my_company());

-- --- global settings: read all authenticated; write super only
drop policy if exists retail_gsettings_read on public.retail_global_settings;
create policy retail_gsettings_read on public.retail_global_settings for select to authenticated using (true);
drop policy if exists retail_gsettings_write on public.retail_global_settings;
create policy retail_gsettings_write on public.retail_global_settings for all to authenticated
  using (public.retail_is_super_admin()) with check (public.retail_is_super_admin());

-- --- audit: super reads all; company users read own; no client deletes
drop policy if exists retail_audit_read on public.retail_audit_logs;
create policy retail_audit_read on public.retail_audit_logs for select to authenticated
  using (public.retail_is_super_admin() or company_id = public.retail_my_company());
drop policy if exists retail_audit_write on public.retail_audit_logs;
create policy retail_audit_write on public.retail_audit_logs for insert to authenticated
  with check (public.retail_is_super_admin() or company_id = public.retail_my_company());

-- ============ 14. grants (PostgREST needs these for the authenticated role) ============
grant usage on schema public to authenticated;
grant all on public.retail_companies, public.retail_users, public.retail_categories,
  public.retail_category_assignments, public.retail_products, public.retail_product_media,
  public.retail_orders, public.retail_order_items, public.retail_order_status_history,
  public.retail_quotations, public.retail_store_settings, public.retail_global_settings,
  public.retail_audit_logs to authenticated;
grant usage, select on all sequences in schema public to authenticated;

-- ============ 15. dashboard view (live counts, replaces JSON-computed stats) ============
create or replace view public.retail_company_stats as
select c.id, c.code, c.name, c.city, c.store_status,
  (select count(*) from public.retail_users u where u.company_id = c.id) as users,
  (select count(*) from public.retail_products p where p.company_id = c.id and not p.archived) as products,
  (select count(*) from public.retail_orders o where o.company_id = c.id) as orders,
  (select coalesce(sum(o.total),0) from public.retail_orders o where o.company_id = c.id) as revenue
from public.retail_companies c;

-- ============ 16. verify (run after migration) ============
-- select * from public.retail_categories;
-- select count(*) as products from public.retail_products;
-- select * from public.retail_company_stats;
