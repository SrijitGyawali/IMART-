import Link from "next/link";
import { BrandForm } from "../brand-form";

export default function NewBrandPage() {
  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-4 pt-8">
      <Link href="/admin/brands" className="text-sm text-muted">
        ← Brands
      </Link>
      <h1 className="mb-8 mt-4 text-2xl font-semibold tracking-tight">
        New brand
      </h1>
      <BrandForm brand={null} />
    </main>
  );
}
