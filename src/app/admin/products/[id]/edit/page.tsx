import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getBrands, getCategories, getSuppliers } from "@/lib/queries";
import type { Product } from "@/lib/types";
import { ProductForm } from "../../product-form";

export const dynamic = "force-dynamic";

export default async function EditProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const [{ data }, categories, brands, suppliers] = await Promise.all([
    supabase.from("products").select("*").eq("id", id).single(),
    getCategories(),
    getBrands(),
    getSuppliers(),
  ]);
  const product = data as Product | null;

  if (!product) notFound();

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-4 pt-8">
      <Link href="/admin/products" className="text-sm text-muted">
        ← Products
      </Link>
      <h1 className="mb-8 mt-4 text-2xl font-semibold tracking-tight">
        Edit product
      </h1>
      <ProductForm product={product} categories={categories} brands={brands} suppliers={suppliers} />
    </main>
  );
}
