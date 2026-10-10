"use client";

import { useLayoutEffect, useRef, useState } from "react";
import Link from "next/link";
import { ProductCard } from "@/components/product-card";
import { StoreIcon } from "@/components/store-icon";
import type { Product } from "@/lib/types";
import type { Shelf } from "../data";
import { shelfIn, shelfOut } from "../motion/store-motion";

export function ProductShowcase({ shelves, products }: { shelves: Shelf[]; products: Product[] }) {
  const [active, setActive] = useState(shelves[0]?.key ?? "");
  const gridRef = useRef<HTMLDivElement>(null);
  // The first render is left to the section entrance; only tab swaps animate here.
  const swapped = useRef(false);
  const shelfKey = (shelves.find((s) => s.key === active) ?? shelves[0])?.key;

  // Layout effect: the incoming cards are hidden before the browser paints them.
  useLayoutEffect(() => {
    const grid = gridRef.current;
    if (grid && swapped.current) shelfIn(Array.from(grid.children));
  }, [shelfKey]);

  if (shelves.length === 0) return null;
  const shelf = shelves.find((s) => s.key === active) ?? shelves[0];

  async function switchTo(key: string) {
    if (key === shelf.key) return;
    const grid = gridRef.current;
    await shelfOut(grid ? Array.from(grid.children) : []);
    swapped.current = true;
    setActive(key);
  }
  const byId = new Map(products.map((p) => [p.id, p]));
  const shown = shelf.productIds
    .map((id) => byId.get(id))
    .filter((p): p is Product => p !== undefined)
    .slice(0, 8);

  return (
    <section className="showcase" aria-labelledby="showcase-heading">
      <div className="landing-container">
        <div className="store-row-head">
          <div>
            <h2 id="showcase-heading">Find your next favourite</h2>
            <p>Good tech. Great choices. All in one place.</p>
          </div>
          <Link className="store-text-link" href="/products">
            View all products <StoreIcon name="arrow" width={16} />
          </Link>
        </div>
        <div className="showcase-tabs" role="group" aria-label="Product collections">
          {shelves.map((s) => (
            <button key={s.key} type="button" aria-pressed={s.key === shelf.key} onClick={() => switchTo(s.key)}>
              {s.label}
            </button>
          ))}
        </div>
        <div ref={gridRef} className="showcase-grid">
          {shown.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      </div>
    </section>
  );
}
