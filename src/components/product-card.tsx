import Image from "next/image";
import Link from "next/link";
import { formatPrice } from "@/lib/format";
import type { Product } from "@/lib/types";
import { StoreIcon } from "./store-icon";

export function ProductCard({ product }: { product: Product }) {
  return (
    <Link href={"/products/" + product.slug} className="shop-product">
      <div className="shop-product-image">
        {product.images[0] ? <Image src={product.images[0]} alt={product.name} fill sizes="(max-width: 600px) 45vw, (max-width: 1000px) 30vw, 250px" className="object-contain" /> : <span className="product-placeholder"><StoreIcon name="bag" width={44} height={44} /></span>}
        {product.featured && <span className="product-badge">Featured</span>}
      </div>
      <div className="shop-product-content">
        <p className={"product-availability " + (product.stock <= 0 ? "unavailable" : "")}>{product.stock > 0 ? "In stock" : "Out of stock"}</p>
        <h3>{product.name}</h3>
        <p className="product-variant">{[product.color, product.storage].filter(Boolean).join(" · ") || "Explore the details"}</p>
        <div className="product-card-bottom"><strong>{formatPrice(product.price)}</strong><span aria-hidden="true"><StoreIcon name="arrow" width={17} /></span></div>
      </div>
    </Link>
  );
}
