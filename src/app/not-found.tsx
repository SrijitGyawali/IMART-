import Link from "next/link";

export const metadata = { title: "Page not found" };

export default function NotFound() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center px-6 py-24 text-center">
      <Link href="/" aria-label="iMart home" className="text-[34px] font-semibold tracking-[-0.06em] text-text">
        i<span className="text-accent">Mart</span>
        <span className="ml-1 inline-block h-1.5 w-1.5 rounded-full bg-[#8eba78]" />
      </Link>
      <p className="mt-12 text-xs font-semibold tracking-[0.2em] text-accent">404</p>
      <h1 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">We couldn&rsquo;t find that page.</h1>
      <p className="mt-4 max-w-md text-sm leading-relaxed text-muted">
        The link may be out of date, or the product is no longer listed. Everything else is right where you left it.
      </p>
      <div className="mt-10 flex flex-col gap-3 sm:flex-row">
        <Link href="/" className="btn-primary rounded-md px-6 py-3 text-sm font-semibold text-white">
          Back to home
        </Link>
        <Link href="/products" className="rounded-md border border-border px-6 py-3 text-sm font-semibold transition hover:bg-surface">
          Browse products
        </Link>
      </div>
    </main>
  );
}
