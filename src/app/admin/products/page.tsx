import Image from "next/image";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { formatPrice } from "@/lib/format";
import type { Product } from "@/lib/types";
import { StockAdjust } from "./stock-adjust";

export const dynamic = "force-dynamic";

export default async function AdminProductsPage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("products")
    .select("*")
    .order("created_at", { ascending: false });

  const products = (data ?? []) as Product[];

  return (
    <main className="mx-auto w-full max-w-6xl flex-1 px-4 pt-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">Products</h1>
        <Link
          href="/admin/products/new"
          className="rounded-full bg-accent px-5 py-2 text-sm font-semibold text-white transition hover:opacity-90"
        >
          + New product
        </Link>
      </div>

      {products.length === 0 ? (
        <p className="mt-16 text-center text-sm text-muted">
          No products yet. Add your first one.
        </p>
      ) : (
        <div className="mt-6 overflow-x-auto rounded-2xl border border-border">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-border text-xs uppercase tracking-wide text-muted">
              <tr>
                <th className="px-4 py-3">Product</th>
                <th className="px-4 py-3">SKU / Barcode</th>
                <th className="px-4 py-3">Price</th>
                <th className="px-4 py-3">Stock</th>
                <th className="px-4 py-3">Flags</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {products.map((product) => (
                <tr key={product.id} className="transition hover:bg-surface">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-lg bg-surface">
                        {product.images[0] ? (
                          <Image
                            src={product.images[0]}
                            alt=""
                            fill
                            sizes="40px"
                            className="object-cover"
                          />
                        ) : (
                          <span className="flex h-full items-center justify-center text-[7px] font-semibold tracking-widest text-muted">
                            iMart
                          </span>
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="truncate font-semibold">{product.name}</p>
                        <p className="truncate text-xs text-muted">
                          /{product.slug}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-muted">
                    {product.sku || product.barcode || "—"}
                  </td>
                  <td className="px-4 py-3">{formatPrice(product.price)}</td>
                  <td className="px-4 py-3">
                    <div className="flex flex-col gap-1">
                      <span
                        className={
                          product.stock === 0
                            ? "font-semibold text-red-600"
                            : product.stock <= (product.min_stock ?? 2)
                              ? "font-semibold text-amber-600"
                              : ""
                        }
                      >
                        {product.stock}
                      </span>
                      <StockAdjust productId={product.id} stock={product.stock} />
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1.5">
                      {product.stock === 0 && (
                        <span className="rounded-full bg-red-500/15 px-2 py-0.5 text-xs text-red-600">
                          out of stock
                        </span>
                      )}
                      {product.stock > 0 && product.stock <= (product.min_stock ?? 2) && (
                        <span className="rounded-full bg-amber-500/15 px-2 py-0.5 text-xs text-amber-600">
                          low stock
                        </span>
                      )}
                      {!product.active && (
                        <span className="rounded-full bg-red-500/15 px-2 py-0.5 text-xs text-red-600">
                          hidden
                        </span>
                      )}
                      {product.featured && (
                        <span className="rounded-full bg-accent/15 px-2 py-0.5 text-xs text-accent">
                          featured
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      href={`/admin/products/${product.id}/edit`}
                      className="text-sm text-accent"
                    >
                      Edit
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
}
