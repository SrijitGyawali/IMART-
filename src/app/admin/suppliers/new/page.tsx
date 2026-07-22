import Link from "next/link";
import { SupplierForm } from "../supplier-form";

export default function NewSupplierPage() {
  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-4 pt-8">
      <Link href="/admin/suppliers" className="text-sm text-muted">
        ← Suppliers
      </Link>
      <h1 className="mb-8 mt-4 text-2xl font-semibold tracking-tight">
        New supplier
      </h1>
      <SupplierForm supplier={null} />
    </main>
  );
}
