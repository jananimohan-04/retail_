-- 003: products only carry media an admin uploaded (SQL twin of backend/migrations/008).
-- Removes the stock photo the old frontend inserted when a product was saved without an image
-- (C-ARGUS rows), drops browser-only blob: URLs, and makes /uploads links host-independent.
-- Safe to run more than once.

-- 1. drop the auto-added default photo (Argus products only) and blob: previews
update public.retail_products
set images = coalesce((
  select array_agg(u order by ord)
  from unnest(images) with ordinality as t(u, ord)
  where u <> ''
    and u not like 'blob:%'
    and not (company_id = 'C-ARGUS'
             and u = 'https://images.unsplash.com/photo-1504917595217-d4dc5ebe6122?auto=format&fit=crop&w=700&q=80')
), '{}')
where exists (
  select 1 from unnest(images) as u
  where u like 'blob:%' or u = ''
     or (company_id = 'C-ARGUS'
         and u = 'https://images.unsplash.com/photo-1504917595217-d4dc5ebe6122?auto=format&fit=crop&w=700&q=80')
);

update public.retail_products set video = '' where video like 'blob:%';

-- 2. "http://localhost:4000/uploads/x.png" -> "/uploads/x.png"
update public.retail_products
set images = (select array_agg(regexp_replace(u, '^https?://[^/]+(/uploads/)', '\1') order by ord)
              from unnest(images) with ordinality as t(u, ord))
where array_to_string(images, ' ') ~ 'https?://[^/ ]+/uploads/';

update public.retail_products
set video = regexp_replace(video, '^https?://[^/]+(/uploads/)', '\1')
where video ~ '^https?://[^/]+/uploads/';

update public.retail_product_media
set url = regexp_replace(url, '^https?://[^/]+(/uploads/)', '\1')
where url ~ '^https?://[^/]+/uploads/';

-- check: should return 0 rows
select id, name, images from public.retail_products
where company_id = 'C-ARGUS'
  and 'https://images.unsplash.com/photo-1504917595217-d4dc5ebe6122?auto=format&fit=crop&w=700&q=80' = any(images);
