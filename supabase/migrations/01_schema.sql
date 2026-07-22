-- iMart schema
-- Run this once in Supabase SQL Editor

create extension if not exists "uuid-ossp";

-- Categories
create table categories (
  id   uuid primary key default uuid_generate_v4(),
  name text not null,
  slug text not null unique
);

insert into categories (name, slug) values
  ('iPhone',      'iphone'),
  ('Cases',       'cases'),
  ('Chargers',    'chargers'),
  ('Accessories', 'accessories');

-- Products
create table products (
  id          uuid primary key default uuid_generate_v4(),
  name        text not null,
  slug        text not null unique,
  price       numeric(10,2) not null default 0,
  description text not null default '',
  category_id uuid references categories(id) on delete set null,
  images      text[] not null default '{}',
  stock       int not null default 0,
  featured    boolean not null default false,
  active      boolean not null default true,
  created_at  timestamptz not null default now()
);

create index on products(featured) where featured = true;
create index on products(category_id);

-- Orders
create table orders (
  id              uuid primary key default uuid_generate_v4(),
  order_number    bigint generated always as identity,
  customer_name   text not null,
  phone           text not null,
  address         text not null default '',
  delivery_method text not null check (delivery_method in ('delivery','pickup')),
  payment_method  text not null check (payment_method in ('cod','qr')),
  status          text not null default 'new' check (status in ('new','confirmed','delivered','cancelled')),
  total           numeric(10,2) not null default 0,
  created_at      timestamptz not null default now()
);

-- Order items
create table order_items (
  id           uuid primary key default uuid_generate_v4(),
  order_id     uuid not null references orders(id) on delete cascade,
  product_id   uuid references products(id) on delete set null,
  product_name text not null,
  quantity     int not null default 1,
  price        numeric(10,2) not null
);

create index on order_items(order_id);

-- RLS: public can read active products and categories, nothing else
alter table categories enable row level security;
alter table products    enable row level security;
alter table orders      enable row level security;
alter table order_items enable row level security;

create policy "public read categories" on categories for select using (true);
create policy "public read active products" on products for select using (active = true);

-- Authenticated admin can do everything
create policy "admin all categories"  on categories  for all using (auth.role() = 'authenticated');
create policy "admin all products"    on products    for all using (auth.role() = 'authenticated');
create policy "admin all orders"      on orders      for all using (auth.role() = 'authenticated');
create policy "admin all order_items" on order_items for all using (auth.role() = 'authenticated');

-- place_order() RPC — called from checkout (anon, no auth required)
create or replace function place_order(
  p_customer_name   text,
  p_phone           text,
  p_address         text,
  p_delivery_method text,
  p_payment_method  text,
  p_items           jsonb   -- [{product_id, product_name, quantity, price}]
)
returns uuid
language plpgsql
security definer
as $$
declare
  v_order_id uuid;
  v_total    numeric := 0;
  v_item     jsonb;
begin
  -- calculate total
  for v_item in select * from jsonb_array_elements(p_items) loop
    v_total := v_total + (v_item->>'price')::numeric * (v_item->>'quantity')::int;
  end loop;

  insert into orders (customer_name, phone, address, delivery_method, payment_method, total)
  values (p_customer_name, p_phone, p_address, p_delivery_method, p_payment_method, v_total)
  returning id into v_order_id;

  for v_item in select * from jsonb_array_elements(p_items) loop
    insert into order_items (order_id, product_id, product_name, quantity, price)
    values (
      v_order_id,
      (v_item->>'product_id')::uuid,
      v_item->>'product_name',
      (v_item->>'quantity')::int,
      (v_item->>'price')::numeric
    );
  end loop;

  return v_order_id;
end;
$$;

grant execute on function place_order to anon;
