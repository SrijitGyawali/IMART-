import Link from "next/link";
import { getBrands } from "@/lib/queries";
import { BrandRow } from "./brand-row";

export const dynamic = "force-dynamic";

export default async function AdminBrandsPage() {
  const brands = await getBrands();

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-4 pt-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">Brands</h1>
        <Link
          href="/admin/brands/new"
          className="rounded-full bg-accent px-5 py-2 text-sm font-semibold text-white transition hover:opacity-90"
        >
          + New brand
        </Link>
      </div>
      <p className="mt-2 text-sm text-muted">
        Customers can filter products by brand on the store — combinable
        with category (e.g. an Anker speaker shows under both
        &quot;Speakers&quot; and &quot;Anker&quot;).
      </p>

      {brands.length === 0 ? (
        <p className="mt-16 text-center text-sm text-muted">
          No brands yet. Add the brands you sell.
        </p>
      ) : (
        <div className="mt-6 overflow-x-auto rounded-2xl border border-border">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-border text-xs uppercase tracking-wide text-muted">
              <tr>
                <th className="px-4 py-3">Brand</th>
                <th className="px-4 py-3">Slug</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {brands.map((brand) => (
                <BrandRow key={brand.id} brand={brand} />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
}
