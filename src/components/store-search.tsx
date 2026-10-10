"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useId, useRef, useState } from "react";
import { formatPrice } from "@/lib/format";
import { StoreIcon } from "./store-icon";

interface SearchProduct { id: string; name: string; slug: string; price: number; images: string[] }

export function StoreSearch() {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [result, setResult] = useState<{ query: string; products: SearchProduct[]; error?: boolean } | null>(null);
  const root = useRef<HTMLFormElement>(null);
  const id = useId();
  const term = query.trim();
  const ready = result?.query === term;
  useEffect(() => {
    if (term.length < 2) return;
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      try {
        const response = await fetch(`/api/search?q=${encodeURIComponent(term)}`, { signal: controller.signal });
        if (!response.ok) throw new Error("Search unavailable");
        const data = await response.json();
        setResult({ query: term, products: data.products });
      } catch {
        if (!controller.signal.aborted) setResult({ query: term, products: [], error: true });
      }
    }, 250);
    return () => { clearTimeout(timer); controller.abort(); };
  }, [term]);

  return (
    <form ref={root} action="/products" method="get" role="search" className="store-search"
      onSubmit={() => setOpen(false)}
      onBlur={(event) => { if (!event.currentTarget.contains(event.relatedTarget)) setOpen(false); }}
      onKeyDown={(event) => {
        if (event.key === "Escape") {
          event.preventDefault();
          root.current?.querySelector("input")?.focus();
          setOpen(false);
        }
        if (event.key === "ArrowDown") {
          const links = Array.from(root.current?.querySelectorAll<HTMLAnchorElement>(".search-results a") ?? []);
          if (links.length) { event.preventDefault(); links[(links.indexOf(document.activeElement as HTMLAnchorElement) + 1) % links.length]?.focus(); }
        }
      }}>
      <label htmlFor={id} className="sr-only">Search products</label>
      <input id={id} name="q" type="search" autoComplete="off" maxLength={80} value={query}
        onChange={(event) => { setQuery(event.target.value); setOpen(true); }} onFocus={() => setOpen(true)}
        placeholder="Search for phones, accessories and more…" aria-controls={open && term.length >= 2 ? `${id}-results` : undefined} />
      <button type="submit" aria-label="Submit search"><StoreIcon name="search" /></button>
      {open && term.length >= 2 && (
        <div className="search-results" id={`${id}-results`}>
          <p className="search-caption" role="status">{!ready ? "Searching products…" : result.error ? "Suggestions unavailable. Search all products below." : result.products.length ? "PRODUCTS" : `No matches for “${term}”`}</p>
          {ready && result.products.map((product) => (
            <Link key={product.id} href={`/products/${product.slug}`} onClick={() => setOpen(false)} className="search-result">
              <span className="search-image">{product.images[0] && <Image src={product.images[0]} alt="" fill sizes="48px" className="object-contain" />}</span>
              <span><strong>{product.name}</strong><small>{formatPrice(product.price)}</small></span>
              <StoreIcon name="chevron" width={15} />
            </Link>
          ))}
          <Link className="search-all" href={`/products?q=${encodeURIComponent(term)}`} onClick={() => setOpen(false)}>See all results <StoreIcon name="arrow" width={17} /></Link>
        </div>
      )}
    </form>
  );
}
