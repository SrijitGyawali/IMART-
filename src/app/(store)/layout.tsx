import { CartProvider } from "@/components/cart-provider";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { SmoothScroll } from "@/components/smooth-scroll";
import { ScrollProgress } from "@/components/scroll-progress";
import { CustomCursor } from "@/components/custom-cursor";

export default function StoreLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <CartProvider>
      <SmoothScroll />
      <ScrollProgress />
      <CustomCursor />
      <Navbar />
      {children}
      <Footer />
    </CartProvider>
  );
}
