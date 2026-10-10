import { CartProvider } from "@/components/cart-provider";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { getCategories } from "@/lib/queries";
import "./store.css";

export default async function StoreLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const categories = await getCategories();
  return (
    <CartProvider>
      <div className="storefront">
        <a href="#store-content" className="store-skip">Skip to content</a>
        <Navbar categories={categories} />
        <div id="store-content" className="store-content">{children}</div>
        <Footer />
      </div>
    </CartProvider>
  );
}
