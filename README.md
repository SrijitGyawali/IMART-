# iMart

Storefront and back-office for iMart, a phone shop in Amarpath, Butwal —
built with Next.js (App Router), TypeScript, Tailwind CSS, and Supabase.

## Stack

- **Next.js 16** (App Router, Turbopack) + React 19
- **Supabase** — Postgres, Auth, Storage
- **Tailwind CSS 4** for styling, **Framer Motion** + **Lenis** for motion/scroll
- **Zod** for form/server-action validation

## Getting started

```bash
npm install
cp .env.example .env.local   # fill in your Supabase project's values
npm run dev
```

Then run the SQL migrations in `supabase/migrations/` (see that folder's
README for order) against your Supabase project before using the app —
nothing in Supabase is provisioned automatically.

## Project structure

```
src/
  app/
    (store)/        # public storefront — home, products, cart, checkout
    admin/           # staff back office (Supabase-Auth gated)
  components/        # shared UI: navbar, footer, cart, product card, motion helpers
  lib/
    supabase/        # browser/server/service Supabase clients
    types.ts         # shared TypeScript types mirroring the DB schema
    validation.ts     # Zod schemas for every form/server action
    queries.ts        # read queries shared across pages
    format.ts         # price/invoice/order number formatting
supabase/
  migrations/         # hand-run SQL migrations, numbered in order
```

## What's implemented

- **Storefront**: browsing, cart, checkout (COD or QR), order confirmation, newsletter signup
- **Admin — Orders**: view and update status on storefront orders
- **Admin — Inventory**: full product CRUD with brand/SKU/barcode/IMEI-tracking, low-stock alerts, manual stock adjustment
- **Admin — Suppliers**: basic CRUD
- **Admin — Sales / POS**: in-store sale creation, discounts, tax, multiple payment methods, printable invoices, returns, sales history with daily/monthly totals and profit

Not yet built: Repairs, Purchasing, Expenses, a dedicated Customers module,
a Dashboard, exportable reports, role-based permissions enforcement,
notifications, and global search. Schema for most of these already exists
in `supabase/migrations/03_erp_schema.sql`.

## Deployment

Deploys as a standard Next.js app (e.g. on Vercel). Set the same environment
variables from `.env.example` in your hosting provider's dashboard — never
commit `.env.local`.
