-- iMart — product variants + brand browsing
-- Run once in the Supabase SQL Editor, after 03_erp_schema.sql.
-- Safe to re-run.

-- A product_group_id links sibling products that are really the same
-- item in different colors/storage (e.g. "iPhone 15 Pro — Blue — 256GB"
-- and "iPhone 15 Pro — Titanium — 512GB" share one group id). Each
-- variant stays a normal, fully independent product row — same price,
-- stock, images, cart, and POS behavior as today — just tagged together
-- so the storefront can offer a colour/storage switcher on the page.
alter table products
  add column if not exists product_group_id uuid;

create index if not exists idx_products_group on products(product_group_id);

-- More brands, so "shop by brand" has something to browse
insert into brands (name, slug) values
  ('DJI',      'dji'),
  ('Anker',    'anker'),
  ('Soundcore','soundcore'),
  ('Marshall', 'marshall'),
  ('Joyroom',  'joyroom')
on conflict (slug) do nothing;

-- A category these new brands' speakers can live in
insert into categories (name, slug) values
  ('Speakers', 'speakers')
on conflict (slug) do nothing;

-- Brands were originally admin-only inventory data (RLS: authenticated
-- only). They're now also a public storefront filter, so anonymous
-- shoppers need read access — same pattern as categories.
drop policy if exists "public read brands" on brands;
create policy "public read brands" on brands for select using (true);
