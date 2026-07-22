import Link from "next/link";
import { getSuppliers } from "@/lib/queries";
import { SupplierRow } from "./supplier-row";

export const dynamic = "force-dynamic";

export default async function AdminSuppliersPage() {
  const suppliers = await getSuppliers();

  return (
    <main className="mx-auto w-full max-w-6xl flex-1 px-4 pt-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">Suppliers</h1>
        <Link
          href="/admin/suppliers/new"
          className="rounded-full bg-accent px-5 py-2 text-sm font-semibold text-white transition hover:opacity-90"
        >
          + New supplier
        </Link>
      </div>

      {suppliers.length === 0 ? (
        <p className="mt-16 text-center text-sm text-muted">
          No suppliers yet. Add one to link it to products and purchases.
        </p>
      ) : (
        <div className="mt-6 overflow-x-auto rounded-2xl border border-border">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-border text-xs uppercase tracking-wide text-muted">
              <tr>
                <th className="px-4 py-3">Supplier</th>
                <th className="px-4 py-3">Contact person</th>
                <th className="px-4 py-3">Phone</th>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {suppliers.map((supplier) => (
                <SupplierRow key={supplier.id} supplier={supplier} />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
}
