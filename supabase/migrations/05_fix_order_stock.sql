-- iMart — fix: online checkout now decrements stock
-- Closes the gap found during pre-production smoke testing: place_order()
-- previously created orders without ever touching products.stock.
--
-- Run this once in the Supabase SQL Editor, AFTER supabase-pos.sql.
--
-- Replaces place_order() so it blocks overselling and decrements stock
-- exactly like the POS create_sale() RPC already does, logging every
-- deduction to inventory_movements for the audit trail.

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
  v_order_id   uuid;
  v_total      numeric := 0;
  v_item       jsonb;
  v_stock      int;
  v_product_id uuid;
  v_quantity   int;
begin
  -- calculate total
  for v_item in select * from jsonb_array_elements(p_items) loop
    v_total := v_total + (v_item->>'price')::numeric * (v_item->>'quantity')::int;
  end loop;

  -- verify stock BEFORE creating the order, so a sold-out item never
  -- results in an order with no way to fulfil it. Row lock held until
  -- the end of this transaction closes the race with a simultaneous
  -- checkout for the same product.
  for v_item in select * from jsonb_array_elements(p_items) loop
    v_product_id := (v_item->>'product_id')::uuid;
    v_quantity   := (v_item->>'quantity')::int;

    if v_product_id is not null then
      select stock into v_stock from products where id = v_product_id for update;
      if v_stock is not null and v_stock < v_quantity then
        raise exception 'Insufficient stock for product %: have %, need %', v_product_id, v_stock, v_quantity;
      end if;
    end if;
  end loop;

  insert into orders (customer_name, phone, address, delivery_method, payment_method, total)
  values (p_customer_name, p_phone, p_address, p_delivery_method, p_payment_method, v_total)
  returning id into v_order_id;

  for v_item in select * from jsonb_array_elements(p_items) loop
    v_product_id := (v_item->>'product_id')::uuid;
    v_quantity   := (v_item->>'quantity')::int;

    insert into order_items (order_id, product_id, product_name, quantity, price)
    values (
      v_order_id,
      v_product_id,
      v_item->>'product_name',
      v_quantity,
      (v_item->>'price')::numeric
    );

    if v_product_id is not null then
      update products set stock = stock - v_quantity where id = v_product_id;

      insert into inventory_movements (product_id, change_type, quantity_change, reference_table, reference_id, note, created_by)
      values (v_product_id, 'sale', -v_quantity, 'order_items', v_order_id, 'Online storefront order', auth.uid());
    end if;
  end loop;

  return v_order_id;
end;
$$;

grant execute on function place_order to anon;
