"use client";

import Link from "next/link";
import { useState } from "react";
import { useCart } from "@/components/cart-provider";
import type { Category } from "@/lib/types";
import { StoreIcon } from "./store-icon";
import { StoreSearch } from "./store-search";

export function Navbar({ categories }: { categories: Category[] }) {
  const { count, hydrated } = useCart();
  const [menuOpen, setMenuOpen] = useState(false);
  const whatsapp = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? "";

  return (
    <>
      <div className="store-topbar"><div className="store-container"><span>Your neighbourhood tech store. Now online.</span><div><Link href="/#visit">Amarpath, Butwal</Link><span className="topbar-divider" /><Link href="/#help">Shopping help</Link></div></div></div>
      <header className="store-header">
        <div className="store-container store-header-main">
          <Link href="/" className="store-logo" aria-label="iMart home">i<span>Mart</span><i /></Link>
          <StoreSearch />
          <div className="header-actions">
            {whatsapp && <a className="header-help" href={"https://wa.me/977" + whatsapp} target="_blank" rel="noopener noreferrer"><StoreIcon name="headset" width={26} height={26} /><span><small>Need a hand?</small><strong>Talk to us</strong></span></a>}
            <Link href="/cart" className="header-cart" aria-label={"Shopping bag" + (hydrated ? ", " + count + " items" : "")}><StoreIcon name="bag" width={25} height={25} /><span className="cart-label">My bag</span><span className="cart-count">{hydrated ? count : 0}</span></Link>
            <button className="mobile-menu-toggle" aria-expanded={menuOpen} aria-controls="store-navigation" aria-label={menuOpen ? "Close navigation" : "Open navigation"} onClick={() => setMenuOpen(!menuOpen)}><StoreIcon name={menuOpen ? "close" : "menu"} /></button>
          </div>
        </div>
        <nav id="store-navigation" aria-label="Main navigation" className={"store-navigation " + (menuOpen ? "is-open" : "")} onClick={() => setMenuOpen(false)}>
          <div className="store-container">
            <Link className="browse-all" href="/products"><StoreIcon name="grid" width={17} /> All products</Link>
            <Link href="/products?category=iphone">iPhone</Link>
            <Link href="/products?q=MacBook">MacBook</Link>
            {categories.filter(c => c.slug !== "iphone").map(category => <Link key={category.id} href={"/products?category=" + category.slug}>{category.name}</Link>)}
            <Link href="/#services">Repairs & support</Link>
            <Link href="/#visit" className="nav-visit"><StoreIcon name="pin" width={16} /> Visit our store</Link>
          </div>
        </nav>
      </header>
    </>
  );
}
