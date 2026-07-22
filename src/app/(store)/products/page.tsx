import Link from "next/link";
import type { Metadata } from "next";
import { getCategories, getProducts } from "@/lib/queries";
import { ProductCard } from "@/components/product-card";

export const revalidate = 60;

export const metadata: Metadata = {
  title: "Products",
};

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string }>;
}) {
  const { category } = await searchParams;
  const [categories, products] = await Promise.all([
    getCategories(),
    getProducts(category),
  ]);

  return (
    <main className="mx-auto w-full max-w-6xl flex-1 px-4 pt-10">
      <h1 className="text-3xl font-semibold tracking-tight">Products</h1>

      {/* Category filter */}
      <div className="mt-6 flex flex-wrap gap-2">
        <Link
          href="/products"
          className={`rounded-full px-4 py-1.5 text-sm transition ${
            !category
              ? "bg-text text-bg"
              : "border border-border text-muted hover:text-text"
          }`}
        >
          All
        </Link>
        {categories.map((c) => (
          <Link
            key={c.id}
            href={`/products?category=${c.slug}`}
            className={`rounded-full px-4 py-1.5 text-sm transition ${
              category === c.slug
                ? "bg-text text-bg"
                : "border border-border text-muted hover:text-text"
            }`}
          >
            {c.name}
          </Link>
        ))}
      </div>

      {/* Grid */}
      {products.length > 0 ? (
        <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {products.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      ) : (
        <p className="mt-16 text-center text-sm text-muted">
          No products here yet. Check back soon.
        </p>
      )}
    </main>
  );
}
