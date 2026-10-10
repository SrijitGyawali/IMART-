"use client";

import { useState } from "react";
import Link from "next/link";
import type { Product } from "@/lib/types";
import { ProductCard } from "./product-card";
import { StoreIcon } from "./store-icon";

export function HomeProducts({ products, accessoryIds, selectionIds }: { products: Product[]; accessoryIds: string[]; selectionIds: string[] }) {
  const [tab, setTab] = useState("selected");
  const featured = products.filter(product => product.featured);
  const selected = selectionIds.map(id => products.find(product => product.id === id)).filter((product): product is Product => !!product);
  const shown = tab === "accessories" ? products.filter(product => accessoryIds.includes(product.id)) : tab === "new" ? products : featured.length ? featured : selected.length ? selected : products;
  return (
    <section className="store-section" aria-labelledby="featured-heading">
      <div className="section-heading"><div><h2 id="featured-heading">Find your next favourite</h2><p>Good tech. Great choices. All in one place.</p></div><Link className="store-text-link" href="/products">View all products <StoreIcon name="arrow" width={17} /></Link></div>
      <div className="product-tabs" role="group" aria-label="Product collection">
        {[["selected", "Our selection"], ["new", "New arrivals"], ["accessories", "Accessories"]].map(([value, label]) => <button key={value} aria-pressed={tab === value} className={tab === value ? "active" : ""} onClick={() => setTab(value)}>{label}</button>)}
      </div>
      <div className="home-product-grid">{shown.slice(0, 8).map(product => <ProductCard product={product} key={product.id} />)}</div>
      {shown.length === 0 && <div className="store-empty"><h3>More good things are on the way.</h3><p>Explore the rest of our collection while we add new arrivals.</p><Link className="store-text-link" href="/products">Browse all products <StoreIcon name="arrow" width={17} /></Link></div>}
    </section>
  );
}
