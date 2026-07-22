# Supabase migrations

Run these once, in order, in the Supabase SQL Editor. Each file says at the
top what it depends on. They are not run automatically — Supabase has no
migration runner wired up yet, so this is manual for now.

| # | File | What it adds |
|---|---|---|
| 1 | `01_schema.sql` | Core storefront: categories, products, orders, order_items, `place_order()` RPC |
| 2 | `02_newsletter.sql` | `newsletter_subscribers` table |
| 3 | `03_erp_schema.sql` | Brands, suppliers, customers, staff roles, sales/repairs/purchases/expenses schema, inventory audit log |
| 4 | `04_pos.sql` | `sale_items.cost_price` + the `create_sale()` RPC used by the POS |
| 5 | `05_fix_order_stock.sql` | Makes storefront checkout decrement stock and block overselling (POS already did this from file 4) |

After running file 3, insert your admin user into `staff_profiles` — see the
comment at the bottom of that file for the exact statement (you need your
user's UID from Supabase → Authentication → Users).
