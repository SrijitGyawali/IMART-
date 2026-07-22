"use client";

import Image from "next/image";
import Link from "next/link";
import { useCart } from "@/components/cart-provider";
import { formatPrice } from "@/lib/format";

export default function CartPage() {
  const { items, total, setQuantity, removeItem, hydrated } = useCart();

  if (!hydrated) {
    return <main className="mx-auto w-full max-w-3xl flex-1 px-4 pt-10" />;
  }

  if (items.length === 0) {
    return (
      <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col items-center px-4 pt-24 text-center">
        <h1 className="text-2xl font-semibold tracking-tight">
          Your cart is empty
        </h1>
        <p className="mt-2 text-sm text-muted">
          Browse the store and add something you like.
        </p>
        <Link
          href="/products"
          className="mt-6 rounded-full bg-accent px-6 py-2.5 text-sm font-semibold text-white transition hover:opacity-90"
        >
          Shop products
        </Link>
      </main>
    );
  }

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-4 pt-10">
      <h1 className="text-3xl font-semibold tracking-tight">Cart</h1>

      <ul className="mt-8 divide-y divide-border">
        {items.map((item) => (
          <li key={item.productId} className="flex gap-4 py-4">
            <Link
              href={`/products/${item.slug}`}
              className="relative h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-surface"
            >
              {item.image ? (
                <Image
                  src={item.image}
                  alt={item.name}
                  fill
                  sizes="80px"
                  className="object-cover"
                />
              ) : (
                <span className="flex h-full items-center justify-center text-[10px] font-semibold tracking-widest text-muted">
                  iMart
                </span>
              )}
            </Link>

            <div className="flex min-w-0 flex-1 flex-col">
              <Link
                href={`/products/${item.slug}`}
                className="truncate text-sm font-semibold"
              >
                {item.name}
              </Link>
              <p className="mt-0.5 text-sm text-muted">
                {formatPrice(item.price)}
              </p>

              <div className="mt-2 flex items-center gap-3">
                <div className="flex items-center rounded-full border border-border">
                  <button
                    onClick={() => setQuantity(item.productId, item.quantity - 1)}
                    className="px-3 py-1 text-muted transition hover:text-text"
                    aria-label="Decrease quantity"
                  >
                    −
                  </button>
                  <span className="min-w-6 text-center text-sm">
                    {item.quantity}
                  </span>
                  <button
                    onClick={() => setQuantity(item.productId, item.quantity + 1)}
                    className="px-3 py-1 text-muted transition hover:text-text"
                    aria-label="Increase quantity"
                  >
                    +
                  </button>
                </div>
                <button
                  onClick={() => removeItem(item.productId)}
                  className="text-xs text-muted underline-offset-2 transition hover:text-text hover:underline"
                >
                  Remove
                </button>
              </div>
            </div>

            <p className="text-sm font-semibold">
              {formatPrice(item.price * item.quantity)}
            </p>
          </li>
        ))}
      </ul>

      <div className="mt-6 flex items-center justify-between border-t border-border pt-6">
        <p className="text-sm text-muted">Total</p>
        <p className="text-xl font-semibold">{formatPrice(total)}</p>
      </div>

      <Link
        href="/checkout"
        className="btn-primary mt-6 block w-full rounded-full py-3 text-center text-sm font-semibold text-white"
      >
        Checkout
      </Link>
      <p className="mb-10 mt-3 text-center text-xs text-muted">
        Cash on delivery or QR payment — no card needed.
      </p>
    </main>
  );
}
