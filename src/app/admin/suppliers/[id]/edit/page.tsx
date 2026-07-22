import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Supplier } from "@/lib/types";
import { SupplierForm } from "../../supplier-form";

export const dynamic = "force-dynamic";

export default async function EditSupplierPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data } = await supabase.from("suppliers").select("*").eq("id", id).single();
  const supplier = data as Supplier | null;

  if (!supplier) notFound();

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-4 pt-8">
      <Link href="/admin/suppliers" className="text-sm text-muted">
        ← Suppliers
      </Link>
      <h1 className="mb-8 mt-4 text-2xl font-semibold tracking-tight">
        Edit supplier
      </h1>
      <SupplierForm supplier={supplier} />
    </main>
  );
}
