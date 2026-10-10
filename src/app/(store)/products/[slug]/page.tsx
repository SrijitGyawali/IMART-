import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getProductBySlug, getProductGroupSiblings } from "@/lib/queries";
import { formatPrice } from "@/lib/format";
import { AddToCart } from "@/components/add-to-cart";
import { VariantPicker } from "@/components/variant-picker";
import { ProductGallery } from "@/components/product-gallery";
import { StoreIcon } from "@/components/store-icon";

export const revalidate = 60;

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) return { title: "Product not found" };
  return { title: product.name, description: product.description.slice(0, 160) };
}

export default async function ProductDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) notFound();
  const siblings = product.product_group_id ? await getProductGroupSiblings(product.product_group_id, product.id) : [];
  const variantOptions = siblings.length ? [product, ...siblings].map(p => ({ slug: p.slug, color: p.color ?? "", storage: p.storage ?? "" })) : [];
  const specs = [["Colour", product.color], ["Storage", product.storage], ["RAM", product.ram]].filter(([, value]) => value);
  // Keep internal purchase and supplier information out of client props.
  const cartProduct = { id: product.id, name: product.name, slug: product.slug, price: product.price, images: product.images, stock: product.stock };

  return (
    <main className="store-container">
      <nav className="store-breadcrumb" aria-label="Breadcrumb"><Link href="/">Home</Link><StoreIcon name="chevron" width={11} /><Link href="/products">All products</Link><StoreIcon name="chevron" width={11} /><span>{product.name}</span></nav>
      <div className="product-detail-layout">
        <ProductGallery key={product.id} images={product.images} name={product.name} />
        <div className="product-detail-info">
          <p className={"product-availability " + (product.stock <= 0 ? "unavailable" : "")}>{product.stock <= 0 ? "Currently out of stock" : product.stock <= 5 ? "Only " + product.stock + " left in stock" : "In stock and ready to order"}</p>
          <h1>{product.name}</h1><p className="detail-price">{formatPrice(product.price)}</p>
          {variantOptions.length > 0 && <VariantPicker options={variantOptions} currentColor={product.color ?? ""} currentStorage={product.storage ?? ""} />}
          {specs.length > 0 && <div className="detail-specs">{specs.map(([label, value]) => <span key={label}><small>{label}</small>{value}</span>)}</div>}
          {product.description && <p className="detail-description">{product.description}</p>}
          <div className="detail-buy"><AddToCart product={cartProduct} /></div>
          <div className="detail-promises"><p><StoreIcon name="truck" /> Home delivery within Butwal</p><p><StoreIcon name="pin" /> Collect from our Amarpath store</p><p><StoreIcon name="payment" /> Cash on delivery or QR payment</p><p><StoreIcon name="headset" /> Questions? <Link href="/#help" className="store-text-link">We&apos;re here to help</Link></p></div>
        </div>
      </div>
    </main>
  );
}
