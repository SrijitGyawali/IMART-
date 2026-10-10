import Link from "next/link";
import type { Metadata } from "next";
import { getBrands, getCategories, getProducts } from "@/lib/queries";
import { ProductCard } from "@/components/product-card";
import { StoreIcon } from "@/components/store-icon";

export const revalidate = 60;
export const metadata: Metadata = { title: "Shop phones & accessories" };

type Filters = { category?: string; brand?: string; q?: string; sort?: string; stock?: string };
function buildHref(params: Filters) {
  const search = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => { if (value) search.set(key, value); });
  return "/products" + (search.size ? "?" + search.toString() : "");
}

export default async function ProductsPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const raw = await searchParams;
  const filters: Filters = Object.fromEntries(["category", "brand", "q", "sort", "stock"].map(key => [key, typeof raw[key] === "string" ? raw[key] : undefined]));
  const { category, brand, q, sort, stock } = filters;
  const [categories, brands, products] = await Promise.all([
    getCategories(), getBrands(), getProducts({ categorySlug: category, brandSlug: brand, search: q, sort, inStock: stock === "in" }),
  ]);
  const categoryName = categories.find(c => c.slug === category)?.name;
  const heading = q ? "Search results" : categoryName ?? "Explore the collection";
  return (
    <main className="store-container">
      <nav className="store-breadcrumb" aria-label="Breadcrumb"><Link href="/">Home</Link><StoreIcon name="chevron" width={11} /><span>Shop {categoryName ?? "all products"}</span></nav>
      <div className="catalog-heading"><h1>{heading}</h1><p>{q ? "Find the right match for “" + q + "”." : "Phones, accessories and everyday essentials. Find what works for you."}</p>{q && <Link className="active-search" href={buildHref({ ...filters, q: undefined })}>{q}<StoreIcon name="close" width={13} /><span className="sr-only">Clear search</span></Link>}</div>
      <div className="catalog-layout">
        <aside className="catalog-sidebar" aria-label="Product filters">
          <section><h2>Shop by category</h2><div><Link className={!category ? "active" : ""} href={buildHref({ ...filters, category: undefined })}>All products</Link>{categories.map(c => <Link key={c.id} className={category === c.slug ? "active" : ""} href={buildHref({ ...filters, category: c.slug })}>{c.name}</Link>)}</div></section>
          {brands.length > 0 && <section><h2>Brands</h2><Link className={!brand ? "active" : ""} href={buildHref({ ...filters, brand: undefined })}>All brands</Link>{brands.map(b => <Link key={b.id} className={brand === b.slug ? "active" : ""} href={buildHref({ ...filters, brand: b.slug })}>{b.name}</Link>)}</section>}
          <section><h2>Availability</h2><Link className={stock === "in" ? "active" : ""} href={buildHref({ ...filters, stock: stock === "in" ? undefined : "in" })}>In stock only</Link></section>
          {(category || brand || q || stock) && <Link href="/products" className="store-text-link">Clear all filters</Link>}
        </aside>
        <div>
          <div className="catalog-toolbar"><p>{products.length} product{products.length === 1 ? "" : "s"} found</p><form action="/products" method="get" className="catalog-sort">
            {Object.entries({ category, brand, q, stock }).filter(([, value]) => value).map(([key, value]) => <input key={key} type="hidden" name={key} value={value} />)}
            <label htmlFor="product-sort">Sort by</label><select name="sort" id="product-sort" defaultValue={sort ?? "newest"}><option value="newest">Newest arrivals</option><option value="price-low">Price: low to high</option><option value="price-high">Price: high to low</option><option value="name">Name: A to Z</option></select><button type="submit">Apply</button>
          </form></div>
          {products.length ? <div className="catalog-products">{products.map(product => <ProductCard product={product} key={product.id} />)}</div> : <div className="store-empty"><StoreIcon name="search" width={34} height={34} className="mx-auto mb-4 text-muted" /><h3>No products found</h3><p>Try a different search or clear a filter to see more of the collection.</p><Link className="store-button" href="/products">Explore all products <StoreIcon name="arrow" width={17} /></Link></div>}
        </div>
      </div>
    </main>
  );
}
