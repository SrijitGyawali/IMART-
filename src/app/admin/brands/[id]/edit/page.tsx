import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Brand } from "@/lib/types";
import { BrandForm } from "../../brand-form";

export const dynamic = "force-dynamic";

export default async function EditBrandPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data } = await supabase.from("brands").select("*").eq("id", id).single();
  const brand = data as Brand | null;

  if (!brand) notFound();

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-4 pt-8">
      <Link href="/admin/brands" className="text-sm text-muted">
        ← Brands
      </Link>
      <h1 className="mb-8 mt-4 text-2xl font-semibold tracking-tight">
        Edit brand
      </h1>
      <BrandForm brand={brand} />
    </main>
  );
}
