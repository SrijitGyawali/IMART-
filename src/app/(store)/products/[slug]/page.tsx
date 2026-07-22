import Image from "next/image";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getProductBySlug } from "@/lib/queries";
import { formatPrice } from "@/lib/format";
import { AddToCart } from "@/components/add-to-cart";

export const revalidate = 60;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) return { title: "Product not found" };
  return {
    title: product.name,
    description: product.description.slice(0, 160),
  };
}

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) notFound();

  const [mainImage, ...restImages] = product.images;

  return (
    <main className="mx-auto w-full max-w-6xl flex-1 px-4 pt-10">
      <div className="grid gap-10 lg:grid-cols-2">
        {/* Images */}
        <div>
          <div className="relative aspect-square overflow-hidden rounded-2xl bg-surface">
            {mainImage ? (
              <Image
                src={mainImage}
                alt={product.name}
                fill
                priority
                sizes="(max-width: 1024px) 100vw, 50vw"
                className="object-cover"
              />
            ) : (
              <div className="flex h-full items-center justify-center text-sm font-semibold tracking-widest text-muted">
                iMart
              </div>
            )}
          </div>
          {restImages.length > 0 && (
            <div className="mt-3 grid grid-cols-4 gap-3">
              {restImages.map((img) => (
                <div
                  key={img}
                  className="relative aspect-square overflow-hidden rounded-xl bg-surface"
                >
                  <Image
                    src={img}
                    alt={product.name}
                    fill
                    sizes="25vw"
                    className="object-cover"
                  />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Info */}
        <div className="flex flex-col">
          <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
            {product.name}
          </h1>
          <p className="iridescent-text mt-3 w-fit text-2xl font-semibold">
            {formatPrice(product.price)}
          </p>

          {product.stock > 0 && product.stock <= 5 && (
            <p className="mt-2 text-sm text-muted">
              Only {product.stock} left in stock
            </p>
          )}

          {product.description && (
            <p className="mt-6 whitespace-pre-line text-sm leading-relaxed text-muted">
              {product.description}
            </p>
          )}

          <div className="mt-8 max-w-sm">
            <AddToCart product={product} />
          </div>

          <div className="mt-8 space-y-2 border-t border-border pt-6 text-sm text-muted">
            <p>✓ Cash on delivery available in Butwal</p>
            <p>✓ Pickup from Amarpath store</p>
            <p>✓ Genuine products, shop warranty</p>
          </div>
        </div>
      </div>
    </main>
  );
}
