import Link from "next/link";
import { getCustomerList, getPosProducts } from "@/lib/queries";
import { PosClient } from "../pos-client";

export const dynamic = "force-dynamic";

export default async function NewSalePage() {
  const [products, customers] = await Promise.all([
    getPosProducts(),
    getCustomerList(),
  ]);

  return (
    <main className="mx-auto w-full max-w-6xl flex-1 px-4 pt-8">
      <Link href="/admin/sales" className="text-sm text-muted">
        ← Sales
      </Link>
      <h1 className="mb-6 mt-4 text-2xl font-semibold tracking-tight">
        New sale
      </h1>
      <PosClient products={products} customers={customers} />
    </main>
  );
}
