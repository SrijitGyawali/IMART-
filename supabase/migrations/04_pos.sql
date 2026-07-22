-- iMart POS — Phase C
-- Run this once in the Supabase SQL Editor, AFTER supabase-erp-schema.sql.

-- Snapshot the product's cost at the moment of sale, so profit reports stay
-- accurate even after purchase_price changes later.
alter table sale_items add column if not exists cost_price numeric(10,2) not null default 0;

-- Wraps sale + all its line items in one transaction: if any line fails
-- (insufficient stock, duplicate IMEI — both enforced by existing triggers),
-- the whole sale rolls back instead of leaving an orphan header row.
create or replace function create_sale(
  p_customer_id    uuid,
  p_is_walk_in     boolean,
  p_discount_type  text,
  p_discount_value numeric,
  p_tax_rate       numeric,
  p_payment_method text,
  p_amount_paid    numeric,
  p_notes          text,
  p_items          jsonb   -- [{product_id, product_name, imei, quantity, unit_price}]
)
returns uuid
language plpgsql
as $$
declare
  v_sale_id      uuid;
  v_subtotal     numeric := 0;
  v_discount_amt numeric := 0;
  v_taxable      numeric := 0;
  v_tax_amount   numeric := 0;
  v_total        numeric := 0;
  v_change_due   numeric := 0;
  v_cost         numeric;
  v_item         jsonb;
begin
  for v_item in select * from jsonb_array_elements(p_items) loop
    v_subtotal := v_subtotal + (v_item->>'unit_price')::numeric * (v_item->>'quantity')::int;
  end loop;

  if p_discount_type = 'percentage' then
    v_discount_amt := v_subtotal * least(greatest(p_discount_value, 0), 100) / 100;
  elsif p_discount_type = 'fixed' then
    v_discount_amt := least(greatest(p_discount_value, 0), v_subtotal);
  end if;

  v_taxable    := v_subtotal - v_discount_amt;
  v_tax_amount := v_taxable * greatest(coalesce(p_tax_rate, 0), 0) / 100;
  v_total      := v_taxable + v_tax_amount;
  v_change_due := case when p_payment_method = 'cash' and p_amount_paid > v_total
                    then p_amount_paid - v_total else 0 end;

  insert into sales (
    customer_id, is_walk_in, subtotal, discount_type, discount_value,
    tax_rate, tax_amount, total, payment_method, amount_paid, change_due,
    cashier_id, notes
  ) values (
    p_customer_id, p_is_walk_in, v_subtotal, p_discount_type, coalesce(p_discount_value, 0),
    coalesce(p_tax_rate, 0), v_tax_amount, v_total, p_payment_method, p_amount_paid, v_change_due,
    auth.uid(), coalesce(p_notes, '')
  )
  returning id into v_sale_id;

  for v_item in select * from jsonb_array_elements(p_items) loop
    select purchase_price into v_cost from products where id = (v_item->>'product_id')::uuid;

    insert into sale_items (
      sale_id, product_id, product_name, imei, quantity, unit_price, discount, line_total, cost_price
    ) values (
      v_sale_id,
      (v_item->>'product_id')::uuid,
      v_item->>'product_name',
      nullif(v_item->>'imei', ''),
      (v_item->>'quantity')::int,
      (v_item->>'unit_price')::numeric,
      0,
      (v_item->>'unit_price')::numeric * (v_item->>'quantity')::int,
      coalesce(v_cost, 0)
    );
  end loop;

  insert into payments (payment_type, reference_id, amount, method, notes, created_by)
  values ('sale', v_sale_id, p_amount_paid, p_payment_method, 'POS sale payment', auth.uid());

  return v_sale_id;
end;
$$;

grant execute on function create_sale to authenticated;
