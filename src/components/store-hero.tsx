"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { formatPrice } from "@/lib/format";
import { StoreIcon } from "./store-icon";

export interface HeroProduct { name: string; slug: string; price: number; image: string; kind: "phone" | "laptop" | "accessory" }

export function StoreHero({ products }: { products: HeroProduct[] }) {
  const [index, setIndex] = useState(0);
  const product = products[index];
  if (!product) return (
    <section className="store-hero hero-empty"><div className="hero-copy"><p className="store-eyebrow">YOUR LOCAL TECH DESTINATION</p><h1>A little upgrade.<br />A lot to love.</h1><p>Discover phones and everyday essentials, with friendly support from our store in Butwal.</p><Link className="store-button" href="/products">Explore products <StoreIcon name="arrow" width={18} /></Link></div></section>
  );
  const headline = product.kind === "laptop" ? <>Big ideas.<br />Light on your bag.</> : product.kind === "phone" ? <>Your next upgrade.<br /><span>Make it a Pro.</span></> : <>Small essentials.<br /><span>Everyday difference.</span></>;
  return (
    <section className={"store-hero hero-" + product.kind} aria-label="Product highlights" aria-roledescription="carousel">
      <div className="hero-copy" key={product.slug + "-copy"}>
        <p className="store-eyebrow">{product.kind === "phone" ? "THE IPHONE COLLECTION" : product.kind === "laptop" ? "MEET YOUR NEXT MAC" : "MADE FOR YOUR EVERYDAY"}</p>
        <h1>{headline}</h1>
        <p>{product.name.replace(/^Apple /, "")}.<br />Find your favourite at iMart, right here in Butwal.</p>
        <Link className="store-button" href={"/products/" + product.slug}>Shop now <StoreIcon name="arrow" width={18} /></Link>
        <div className="hero-price"><span>Available for</span><strong>{formatPrice(product.price)}</strong></div>
      </div>
      <div className="hero-visual" key={product.slug}>
        {product.image && <Image src={product.image} alt={product.name} fill priority sizes="(max-width: 700px) 90vw, 550px" className="object-contain" />}
      </div>
      {products.length > 1 && <div className="hero-controls">
        <div className="hero-dots">{products.map((p, i) => <button key={p.slug} onClick={() => setIndex(i)} aria-label={"Show " + p.name} aria-pressed={index === i} className={index === i ? "active" : ""} />)}</div>
        <div className="hero-arrows"><button aria-label="Previous highlight" onClick={() => setIndex((index + products.length - 1) % products.length)}><StoreIcon name="arrow" className="rotate-180" width={18} /></button><span>{String(index + 1).padStart(2, "0")} / {String(products.length).padStart(2, "0")}</span><button aria-label="Next highlight" onClick={() => setIndex((index + 1) % products.length)}><StoreIcon name="arrow" width={18} /></button></div>
      </div>}
    </section>
  );
}
