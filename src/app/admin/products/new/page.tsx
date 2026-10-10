import Link from "next/link";
import { getAdminProductOptions, getBrands, getCategories, getSuppliers } from "@/lib/queries";
import { ProductForm } from "../product-form";

export const dynamic = "force-dynamic";

export default async function NewProductPage() {
  const [categories, brands, suppliers, allProducts] = await Promise.all([
    getCategories(),
    getBrands(),
    getSuppliers(),
    getAdminProductOptions(),
  ]);

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-4 pt-8">
      <Link href="/admin/products" className="text-sm text-muted">
        ← Products
      </Link>
      <h1 className="mb-8 mt-4 text-2xl font-semibold tracking-tight">
        New product
      </h1>
      <ProductForm
        product={null}
        categories={categories}
        brands={brands}
        suppliers={suppliers}
        allProducts={allProducts}
      />
    </main>
  );
}
