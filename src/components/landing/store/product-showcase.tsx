"use client";

import { useState } from "react";
import Link from "next/link";
import { ProductCard } from "@/components/product-card";
import { StoreIcon } from "@/components/store-icon";
import type { Product } from "@/lib/types";
import type { Shelf } from "../data";

export function ProductShowcase({ shelves, products }: { shelves: Shelf[]; products: Product[] }) {
  const [active, setActive] = useState(shelves[0]?.key ?? "");
  if (shelves.length === 0) return null;
  const shelf = shelves.find((s) => s.key === active) ?? shelves[0];
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
            <button key={s.key} type="button" aria-pressed={s.key === shelf.key} onClick={() => setActive(s.key)}>
              {s.label}
            </button>
          ))}
        </div>
        <div className="showcase-grid">
          {shown.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      </div>
    </section>
  );
}
