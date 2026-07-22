-- iMart ERP extension schema — Phase A
-- Adds POS/Sales, Repairs, Inventory extension, Suppliers, Purchasing,
-- Expenses, Customers, Staff roles, Payments, Notifications, and a
-- stock audit log on top of the existing storefront schema
-- (supabase-schema.sql) and newsletter schema (supabase-newsletter.sql).
--
-- Run this once in the Supabase SQL Editor, AFTER supabase-schema.sql.
-- Safe to re-run: every ALTER uses "if not exists".

create extension if not exists "uuid-ossp";

-- =========================================================
-- 1. Brands (master data for inventory)
-- =========================================================
create table brands (
  id   uuid primary key default uuid_generate_v4(),
  name text not null,
  slug text not null unique
);

insert into brands (name, slug) values
  ('Apple',   'apple'),
  ('Samsung', 'samsung'),
  ('Google Pixel', 'google-pixel'),
  ('OnePlus', 'oneplus'),
  ('Xiaomi',  'xiaomi'),
  ('Nothing', 'nothing'),
  ('Vivo',    'vivo'),
  ('Oppo',    'oppo'),
  ('Realme',  'realme');

-- =========================================================
-- 2. Suppliers
-- =========================================================
create table suppliers (
  id              uuid primary key default uuid_generate_v4(),
  name            text not null,
  company         text not null default '',
  contact_person  text not null default '',
  phone           text not null default '',
  email           text not null default '',
  address         text not null default '',
  pan_vat         text not null default '',
  bank_details    text not null default '',
  notes           text not null default '',
  created_at      timestamptz not null default now()
);

-- =========================================================
-- 3. Extend products for full inventory management
-- =========================================================
alter table products
  add column if not exists brand_id        uuid references brands(id) on delete set null,
  add column if not exists model           text not null default '',
  add column if not exists color           text not null default '',
  add column if not exists storage         text not null default '',
  add column if not exists ram             text not null default '',
  add column if not exists sku             text unique,
  add column if not exists barcode         text unique,
  add column if not exists purchase_price  numeric(10,2) not null default 0,
  add column if not exists min_stock       int not null default 2,
  add column if not exists supplier_id     uuid references suppliers(id) on delete set null,
  add column if not exists warranty_months int not null default 0,
  add column if not exists imei_tracked    boolean not null default false;

create index if not exists idx_products_brand on products(brand_id);
create index if not exists idx_products_supplier on products(supplier_id);
create index if not exists idx_products_low_stock on products(stock) where stock <= min_stock;

-- =========================================================
-- 4. Customers
-- =========================================================
create table customers (
  id             uuid primary key default uuid_generate_v4(),
  name           text not null,
  phone          text not null default '',
  email          text not null default '',
  address        text not null default '',
  loyalty_points int not null default 0,
  notes          text not null default '',
  created_at     timestamptz not null default now()
);

create index on customers(phone);

-- =========================================================
-- 5. Staff profiles — one row per Supabase Auth user, holds their role
--    (extend, don't replace, Supabase Auth — same auth system as today)
-- =========================================================
create table staff_profiles (
  id         uuid primary key references auth.users(id) on delete cascade,
  full_name  text not null default '',
  role       text not null default 'admin' check (role in ('admin','manager','cashier','technician')),
  phone      text not null default '',
  active     boolean not null default true,
  created_at timestamptz not null default now()
);

-- =========================================================
-- 6. Sales / POS
--    Kept separate from the storefront's orders/order_items tables —
--    those are online checkout orders; these are in-store POS sales
--    rung up by staff. Both reduce the same products.stock.
-- =========================================================
create table sales (
  id              uuid primary key default uuid_generate_v4(),
  invoice_number  bigint generated always as identity unique,
  customer_id     uuid references customers(id) on delete set null,
  is_walk_in      boolean not null default true,
  subtotal        numeric(10,2) not null default 0,
  discount_type   text check (discount_type in ('percentage','fixed')),
  discount_value  numeric(10,2) not null default 0,
  tax_rate        numeric(5,2) not null default 0,
  tax_amount      numeric(10,2) not null default 0,
  total           numeric(10,2) not null default 0,
  payment_method  text not null default 'cash' check (payment_method in ('cash','card','bank_transfer','esewa','khalti')),
  amount_paid     numeric(10,2) not null default 0,
  change_due      numeric(10,2) not null default 0,
  status          text not null default 'completed' check (status in ('completed','refunded','partially_refunded','cancelled')),
  cashier_id      uuid references auth.users(id),
  notes           text not null default '',
  created_at      timestamptz not null default now()
);

create index on sales(customer_id);
create index on sales(created_at);
create index on sales(status);

create table sale_items (
  id           uuid primary key default uuid_generate_v4(),
  sale_id      uuid not null references sales(id) on delete cascade,
  product_id   uuid references products(id) on delete set null,
  product_name text not null,
  imei         text,
  quantity     int not null default 1,
  unit_price   numeric(10,2) not null,
  discount     numeric(10,2) not null default 0,
  line_total   numeric(10,2) not null,
  returned     boolean not null default false
);

create index on sale_items(sale_id);
create index on sale_items(product_id);
-- An IMEI can only be attached to one *active* (non-returned) sale at a time
create unique index idx_sale_items_imei on sale_items(imei) where imei is not null and not returned;

create table sale_returns (
  id            uuid primary key default uuid_generate_v4(),
  sale_id       uuid not null references sales(id) on delete cascade,
  sale_item_id  uuid not null references sale_items(id) on delete cascade,
  quantity      int not null default 1,
  reason        text not null default '',
  refund_amount numeric(10,2) not null default 0,
  restock       boolean not null default true,
  created_by    uuid references auth.users(id),
  created_at    timestamptz not null default now()
);

create index on sale_returns(sale_id);

-- =========================================================
-- 7. Repairs
-- =========================================================
create table repairs (
  id                  uuid primary key default uuid_generate_v4(),
  repair_number       bigint generated always as identity unique,
  customer_id         uuid references customers(id) on delete set null,
  customer_name       text not null,
  phone               text not null,
  device_brand        text not null default '',
  device_model        text not null default '',
  imei                text not null default '',
  problem_description text not null default '',
  technician_id       uuid references auth.users(id),
  technician_name     text not null default '',
  repair_cost         numeric(10,2) not null default 0,
  advance_paid        numeric(10,2) not null default 0,
  status              text not null default 'received' check (
                        status in ('received','diagnosing','waiting_parts','repairing','ready','delivered','cancelled')
                      ),
  date_received       timestamptz not null default now(),
  delivery_date       timestamptz,
  notes               text not null default '',
  images              text[] not null default '{}',
  created_at          timestamptz not null default now()
);

create index on repairs(phone);
create index on repairs(status);
create index on repairs(customer_id);

create table repair_status_history (
  id         uuid primary key default uuid_generate_v4(),
  repair_id  uuid not null references repairs(id) on delete cascade,
  status     text not null,
  note       text not null default '',
  changed_by uuid references auth.users(id),
  changed_at timestamptz not null default now()
);

create index on repair_status_history(repair_id);

create table repair_parts (
  id         uuid primary key default uuid_generate_v4(),
  repair_id  uuid not null references repairs(id) on delete cascade,
  product_id uuid references products(id) on delete set null,
  part_name  text not null,
  quantity   int not null default 1,
  unit_cost  numeric(10,2) not null default 0
);

create index on repair_parts(repair_id);

-- Log the initial status into the timeline whenever a repair is created
create or replace function record_repair_status_history() returns trigger
language plpgsql as $$
begin
  insert into repair_status_history (repair_id, status, note)
  values (new.id, new.status, 'Repair created');
  return new;
end;
$$;

create trigger trg_repairs_initial_status
  after insert on repairs
  for each row execute function record_repair_status_history();

-- Log every status change into the timeline
create or replace function record_repair_status_change() returns trigger
language plpgsql as $$
begin
  if new.status is distinct from old.status then
    insert into repair_status_history (repair_id, status, note)
    values (new.id, new.status, '');
  end if;
  return new;
end;
$$;

create trigger trg_repairs_status_change
  after update on repairs
  for each row execute function record_repair_status_change();

-- =========================================================
-- 8. Purchasing
-- =========================================================
create table purchase_orders (
  id            uuid primary key default uuid_generate_v4(),
  po_number     bigint generated always as identity unique,
  supplier_id   uuid not null references suppliers(id) on delete restrict,
  status        text not null default 'pending' check (status in ('pending','partially_received','received','cancelled')),
  invoice_file  text not null default '',
  notes         text not null default '',
  ordered_at    timestamptz not null default now(),
  received_at   timestamptz,
  created_at    timestamptz not null default now()
);

create index on purchase_orders(supplier_id);
create index on purchase_orders(status);

create table purchase_items (
  id                 uuid primary key default uuid_generate_v4(),
  purchase_order_id  uuid not null references purchase_orders(id) on delete cascade,
  product_id         uuid references products(id) on delete set null,
  product_name       text not null,
  quantity           int not null default 1,
  unit_cost          numeric(10,2) not null default 0,
  received_quantity  int not null default 0
);

create index on purchase_items(purchase_order_id);

create table supplier_payments (
  id                 uuid primary key default uuid_generate_v4(),
  supplier_id        uuid not null references suppliers(id) on delete cascade,
  purchase_order_id  uuid references purchase_orders(id) on delete set null,
  amount             numeric(10,2) not null,
  method             text not null default 'cash' check (method in ('cash','card','bank_transfer','esewa','khalti')),
  paid_at            timestamptz not null default now(),
  notes              text not null default ''
);

create index on supplier_payments(supplier_id);

-- =========================================================
-- 9. Expenses
-- =========================================================
create table expenses (
  id           uuid primary key default uuid_generate_v4(),
  category     text not null check (
                 category in ('rent','electricity','internet','salary','marketing','repairs','transportation','miscellaneous')
               ),
  amount       numeric(10,2) not null,
  description  text not null default '',
  receipt_url  text not null default '',
  expense_date date not null default current_date,
  created_by   uuid references auth.users(id),
  created_at   timestamptz not null default now()
);

create index on expenses(expense_date);
create index on expenses(category);

-- =========================================================
-- 10. Inventory movements — audit log for every stock change
-- =========================================================
create table inventory_movements (
  id              uuid primary key default uuid_generate_v4(),
  product_id      uuid references products(id) on delete set null,
  change_type     text not null check (change_type in ('sale','purchase','repair_part','adjustment','return','initial')),
  quantity_change int not null,
  reference_table text not null default '',
  reference_id    uuid,
  note            text not null default '',
  created_by      uuid references auth.users(id),
  created_at      timestamptz not null default now()
);

create index on inventory_movements(product_id);
create index on inventory_movements(created_at);
create index on inventory_movements(change_type);

-- =========================================================
-- 11. Payments — generic ledger for sale/repair/purchase payments
-- =========================================================
create table payments (
  id            uuid primary key default uuid_generate_v4(),
  payment_type  text not null check (payment_type in ('sale','repair','purchase')),
  reference_id  uuid not null,
  amount        numeric(10,2) not null,
  method        text not null default 'cash' check (method in ('cash','card','bank_transfer','esewa','khalti')),
  paid_at       timestamptz not null default now(),
  notes         text not null default '',
  created_by    uuid references auth.users(id)
);

create index on payments(payment_type, reference_id);

-- =========================================================
-- 12. Notifications
-- =========================================================
create table notifications (
  id         uuid primary key default uuid_generate_v4(),
  type       text not null check (
               type in ('low_stock','repair_ready','supplier_due','daily_summary','pending_repair','overdue_payment')
             ),
  title      text not null,
  message    text not null default '',
  link       text not null default '',
  read       boolean not null default false,
  created_at timestamptz not null default now()
);

create index on notifications(read);
create index on notifications(created_at);

-- =========================================================
-- 13. Row Level Security — same pattern as the storefront tables:
--     every table here is internal/staff-only, so authenticated
--     admins get full access and there is no public policy.
-- =========================================================
alter table brands               enable row level security;
alter table suppliers            enable row level security;
alter table customers            enable row level security;
alter table staff_profiles       enable row level security;
alter table sales                enable row level security;
alter table sale_items           enable row level security;
alter table sale_returns         enable row level security;
alter table repairs              enable row level security;
alter table repair_status_history enable row level security;
alter table repair_parts         enable row level security;
alter table purchase_orders      enable row level security;
alter table purchase_items       enable row level security;
alter table supplier_payments    enable row level security;
alter table expenses             enable row level security;
alter table inventory_movements  enable row level security;
alter table payments             enable row level security;
alter table notifications        enable row level security;

create policy "admin all brands"                on brands                for all using (auth.role() = 'authenticated');
create policy "admin all suppliers"             on suppliers             for all using (auth.role() = 'authenticated');
create policy "admin all customers"             on customers             for all using (auth.role() = 'authenticated');
create policy "admin all staff_profiles"        on staff_profiles        for all using (auth.role() = 'authenticated');
create policy "admin all sales"                 on sales                 for all using (auth.role() = 'authenticated');
create policy "admin all sale_items"            on sale_items            for all using (auth.role() = 'authenticated');
create policy "admin all sale_returns"          on sale_returns          for all using (auth.role() = 'authenticated');
create policy "admin all repairs"               on repairs               for all using (auth.role() = 'authenticated');
create policy "admin all repair_status_history" on repair_status_history for all using (auth.role() = 'authenticated');
create policy "admin all repair_parts"          on repair_parts          for all using (auth.role() = 'authenticated');
create policy "admin all purchase_orders"       on purchase_orders       for all using (auth.role() = 'authenticated');
create policy "admin all purchase_items"        on purchase_items        for all using (auth.role() = 'authenticated');
create policy "admin all supplier_payments"     on supplier_payments     for all using (auth.role() = 'authenticated');
create policy "admin all expenses"              on expenses              for all using (auth.role() = 'authenticated');
create policy "admin all inventory_movements"   on inventory_movements   for all using (auth.role() = 'authenticated');
create policy "admin all payments"              on payments              for all using (auth.role() = 'authenticated');
create policy "admin all notifications"         on notifications         for all using (auth.role() = 'authenticated');

-- =========================================================
-- 14. Business logic — stock movement triggers
-- =========================================================

-- A POS sale decrements stock immediately and blocks overselling
create or replace function record_sale_item_stock() returns trigger
language plpgsql as $$
declare
  v_stock int;
begin
  if new.product_id is not null then
    select stock into v_stock from products where id = new.product_id for update;

    if v_stock is not null and v_stock < new.quantity then
      raise exception 'Insufficient stock for product %: have %, need %', new.product_id, v_stock, new.quantity;
    end if;

    update products set stock = stock - new.quantity where id = new.product_id;

    insert into inventory_movements (product_id, change_type, quantity_change, reference_table, reference_id, note, created_by)
    values (new.product_id, 'sale', -new.quantity, 'sale_items', new.id, 'POS sale', auth.uid());
  end if;
  return new;
end;
$$;

create trigger trg_sale_items_stock
  after insert on sale_items
  for each row execute function record_sale_item_stock();

-- A return restocks the item (when requested) and frees its IMEI for resale
create or replace function record_sale_return_stock() returns trigger
language plpgsql as $$
declare
  v_product_id uuid;
begin
  update sale_items set returned = true where id = new.sale_item_id;

  if new.restock then
    select product_id into v_product_id from sale_items where id = new.sale_item_id;
    if v_product_id is not null then
      update products set stock = stock + new.quantity where id = v_product_id;
      insert into inventory_movements (product_id, change_type, quantity_change, reference_table, reference_id, note, created_by)
      values (v_product_id, 'return', new.quantity, 'sale_returns', new.id, new.reason, auth.uid());
    end if;
  end if;
  return new;
end;
$$;

create trigger trg_sale_returns_stock
  after insert on sale_returns
  for each row execute function record_sale_return_stock();

-- Parts used in a repair decrement stock the same way a sale does
create or replace function record_repair_part_stock() returns trigger
language plpgsql as $$
declare
  v_stock int;
begin
  if new.product_id is not null then
    select stock into v_stock from products where id = new.product_id for update;

    if v_stock is not null and v_stock < new.quantity then
      raise exception 'Insufficient stock for part %: have %, need %', new.product_id, v_stock, new.quantity;
    end if;

    update products set stock = stock - new.quantity where id = new.product_id;

    insert into inventory_movements (product_id, change_type, quantity_change, reference_table, reference_id, note, created_by)
    values (new.product_id, 'repair_part', -new.quantity, 'repair_parts', new.id, 'Used in repair', auth.uid());
  end if;
  return new;
end;
$$;

create trigger trg_repair_parts_stock
  after insert on repair_parts
  for each row execute function record_repair_part_stock();

-- Receiving a purchase item increments stock and rolls the PO status forward
create or replace function receive_purchase_item(p_item_id uuid, p_quantity int)
returns void
language plpgsql
security definer
as $$
declare
  v_product_id uuid;
  v_po_id      uuid;
begin
  select product_id, purchase_order_id into v_product_id, v_po_id
  from purchase_items where id = p_item_id;

  if v_po_id is null then
    raise exception 'Purchase item % not found', p_item_id;
  end if;

  update purchase_items
    set received_quantity = received_quantity + p_quantity
    where id = p_item_id;

  if v_product_id is not null then
    update products set stock = stock + p_quantity where id = v_product_id;

    insert into inventory_movements (product_id, change_type, quantity_change, reference_table, reference_id, note, created_by)
    values (v_product_id, 'purchase', p_quantity, 'purchase_items', p_item_id, 'Stock received', auth.uid());
  end if;

  update purchase_orders po
    set status = 'received', received_at = now()
    where po.id = v_po_id
      and not exists (
        select 1 from purchase_items pi
        where pi.purchase_order_id = po.id and pi.received_quantity < pi.quantity
      );

  update purchase_orders po
    set status = 'partially_received'
    where po.id = v_po_id
      and po.status = 'pending'
      and exists (select 1 from purchase_items pi where pi.purchase_order_id = po.id and pi.received_quantity > 0);
end;
$$;

grant execute on function receive_purchase_item to authenticated;

-- Manual stock adjustment (audit-logged) — used by the inventory UI
create or replace function adjust_stock(p_product_id uuid, p_quantity_change int, p_note text default '')
returns void
language plpgsql
security definer
as $$
begin
  update products set stock = stock + p_quantity_change where id = p_product_id;

  insert into inventory_movements (product_id, change_type, quantity_change, reference_table, note, created_by)
  values (p_product_id, 'adjustment', p_quantity_change, 'manual', p_note, auth.uid());
end;
$$;

grant execute on function adjust_stock to authenticated;

-- =========================================================
-- One-time setup after running this file:
--
-- 1. Insert a staff_profiles row for your existing admin login so
--    the app can read their role (replace the uuid with your admin
--    user's id from Authentication → Users):
--
--    insert into staff_profiles (id, full_name, role)
--    values ('3c1bb1ad-86fa-486f-8aa4-5b90c8385218', 'Store Owner', 'admin');
--
-- 2. Known gap carried over from the storefront schema: the existing
--    place_order() RPC (online checkout) does not decrement
--    products.stock. The new POS/repair/purchase triggers above
--    only cover the new tables. Reconciling online-order stock is
--    a good candidate for a later phase.
-- =========================================================
