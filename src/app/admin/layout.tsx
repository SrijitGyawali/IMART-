import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { signOut } from "./actions";

export const metadata = {
  title: "Admin",
  robots: { index: false },
};

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return <>{children}</>;
  }

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-50 border-b border-border bg-bg/80 backdrop-blur-xl print:hidden">
        <nav className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
          <div className="flex items-center gap-6">
            <Link href="/admin/orders" className="text-lg font-semibold">
              iMart <span className="text-sm font-normal text-muted">admin</span>
            </Link>
            <Link
              href="/admin/orders"
              className="text-sm text-muted transition hover:text-text"
            >
              Orders
            </Link>
            <Link
              href="/admin/products"
              className="text-sm text-muted transition hover:text-text"
            >
              Products
            </Link>
            <Link
              href="/admin/sales"
              className="text-sm text-muted transition hover:text-text"
            >
              Sales
            </Link>
            <Link
              href="/admin/suppliers"
              className="text-sm text-muted transition hover:text-text"
            >
              Suppliers
            </Link>
            <Link
              href="/admin/brands"
              className="text-sm text-muted transition hover:text-text"
            >
              Brands
            </Link>
          </div>
          <div className="flex items-center gap-4">
            <Link
              href="/"
              className="text-sm text-muted transition hover:text-text"
            >
              View store
            </Link>
            <form action={signOut}>
              <button
                type="submit"
                className="rounded-full border border-border px-4 py-1.5 text-sm text-muted transition hover:text-text"
              >
                Sign out
              </button>
            </form>
          </div>
        </nav>
      </header>
      {children}
    </div>
  );
}
