"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useCart } from "@/components/cart-provider";
import type { Product } from "@/lib/types";

export function AddToCart({ product }: { product: Pick<Product, "id" | "name" | "slug" | "price" | "images" | "stock"> }) {
  const { addItem } = useCart();
  const router = useRouter();
  const [added, setAdded] = useState(false);

  if (product.stock <= 0) {
    return (
      <button
        disabled
        className="w-full cursor-not-allowed rounded-md bg-surface py-3 text-sm font-semibold text-muted"
      >
        Out of stock
      </button>
    );
  }

  function handleAdd() {
    addItem({
      productId: product.id,
      slug: product.slug,
      name: product.name,
      price: product.price,
      image: product.images[0] ?? "",
    });
    setAdded(true);
    setTimeout(() => setAdded(false), 1500);
  }

  function handleBuyNow() {
    addItem({
      productId: product.id,
      slug: product.slug,
      name: product.name,
      price: product.price,
      image: product.images[0] ?? "",
    });
    router.push("/checkout");
  }

  return (
    <div className="flex flex-col gap-3">
      <button
        onClick={handleBuyNow}
        className="btn-primary w-full rounded-md py-3 text-sm font-semibold text-white"
      >
        Buy Now
      </button>
      <button
        onClick={handleAdd}
        className="w-full rounded-md border border-border py-3 text-sm font-semibold transition hover:bg-surface"
      >
        {added ? "Added ✓" : "Add to Cart"}
      </button>
    </div>
  );
}
