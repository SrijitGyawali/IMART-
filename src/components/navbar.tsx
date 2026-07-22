"use client";

import Link from "next/link";
import { useCart } from "@/components/cart-provider";

export function Navbar() {
  const { count, hydrated } = useCart();

  return (
    <header className="sticky top-0 z-50 bg-bg/80 backdrop-blur-xl">
      <nav className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
        <Link href="/" className="text-lg font-semibold tracking-tight">
          iMart
        </Link>

        <div className="flex items-center gap-6 text-sm text-muted">
          <Link href="/products" className="transition hover:text-text">
            Products
          </Link>
          <Link
            href="/cart"
            className="relative flex items-center transition hover:text-text"
            aria-label="Cart"
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z" />
              <path d="M3 6h18" />
              <path d="M16 10a4 4 0 0 1-8 0" />
            </svg>
            {hydrated && count > 0 && (
              <span className="absolute -right-2 -top-2 flex h-4 min-w-4 items-center justify-center rounded-full bg-accent px-1 text-[10px] font-semibold text-white">
                {count}
              </span>
            )}
          </Link>
        </div>
      </nav>
      <div className="iridescent-line" />
    </header>
  );
}
