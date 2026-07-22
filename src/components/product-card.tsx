import Image from "next/image";
import Link from "next/link";
import { formatPrice } from "@/lib/format";
import type { Product } from "@/lib/types";

export function ProductCard({ product }: { product: Product }) {
  const image = product.images[0];

  return (
    <Link
      href={`/products/${product.slug}`}
      className="group rounded-2xl bg-surface p-4 transition hover:bg-surface/60"
    >
      <div className="relative mb-4 aspect-square overflow-hidden rounded-xl bg-bg">
        {image ? (
          <Image
            src={image}
            alt={product.name}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            className="object-cover transition duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-sm font-semibold tracking-widest text-muted">
            iMart
          </div>
        )}
        {product.stock === 0 && (
          <span className="absolute left-2 top-2 rounded-full bg-bg/80 px-2 py-0.5 text-xs text-muted backdrop-blur">
            Out of stock
          </span>
        )}
      </div>
      <p className="truncate text-sm font-semibold">{product.name}</p>
      <p className="mt-1 text-sm text-muted">{formatPrice(product.price)}</p>
    </Link>
  );
}
