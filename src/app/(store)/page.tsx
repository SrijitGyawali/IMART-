import Image from "next/image";
import Link from "next/link";
import { getFeaturedProducts } from "@/lib/queries";
import { formatPrice } from "@/lib/format";
import { Reveal } from "@/components/reveal";
import { Magnetic } from "@/components/magnetic";
import { StatsCounter } from "@/components/stats-counter";
import { PhoneTrio } from "@/components/phone-trio";
import { Ripple } from "@/components/ripple";
import { TiltCard } from "@/components/tilt-card";

export const revalidate = 60;

const WHATSAPP = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? "";
const WA_LINK = `https://wa.me/977${WHATSAPP}`;

function emi(price: number): string {
  return formatPrice(Math.ceil(price / 12));
}

const TRUST_BADGES = [
  "100% Genuine Products",
  "Official Warranty",
  "Best Price Guarantee",
  "Easy EMI",
];

const BRANDS = [
  "Apple",
  "Samsung",
  "Google Pixel",
  "OnePlus",
  "Xiaomi",
  "Nothing",
  "Vivo",
  "Oppo",
  "Realme",
];

const WHY_POINTS = [
  {
    title: "100% Genuine Devices",
    body: "Every phone is sealed, authentic, and sourced from official channels.",
  },
  {
    title: "Official Warranty",
    body: "Full manufacturer warranty, honored right here in Butwal.",
  },
  {
    title: "Exchange Available",
    body: "Trade in your old phone — fair price, decided on the spot.",
  },
  {
    title: "Easy EMI",
    body: "Monthly installments with quick approval and minimal paperwork.",
  },
  {
    title: "Fast Delivery",
    body: "Order before evening, get it the same night anywhere in Butwal.",
  },
  {
    title: "Expert Support",
    body: "Real advice from people who know phones — before and after you buy.",
  },
];

const OFFERS = [
  {
    title: "Exchange Bonus",
    body: "Extra value on top of your old phone's trade-in price.",
  },
  {
    title: "Student Discount",
    body: "Show your student ID and save on phones and accessories.",
  },
  {
    title: "Festival Offers",
    body: "Dashain, Tihar, New Year — the best deals of the season.",
  },
  {
    title: "Free Accessories",
    body: "Free case and screen protector with select phones.",
  },
  {
    title: "Cashback Deals",
    body: "Instant cashback on eSewa and wallet payments.",
  },
  {
    title: "Bank Offers",
    body: "Zero-cost EMI with partner banks on flagship models.",
  },
];

const REVIEWS = [
  {
    name: "Sujan Thapa",
    role: "Student",
    body: "Got my iPhone at the best price in Butwal — genuine sealed box and they set everything up for me in the shop. The EMI process took less than an hour.",
  },
  {
    name: "Priya Sharma",
    role: "Content creator",
    body: "Traded in my old phone and the exchange price was better than anywhere else I checked. Super honest people, no hidden charges.",
  },
  {
    name: "Ramesh K.C.",
    role: "Business owner",
    body: "My screen broke on a Sunday and they replaced it the same day. This is the only shop I trust with my phone now.",
  },
];

const ACCESSORY_TILES = [
  { name: "Chargers & Cables", href: "/products?category=chargers" },
  { name: "Cases & Covers", href: "/products?category=cases" },
  { name: "Earbuds & Audio", href: "/products?category=accessories" },
  { name: "Power Banks", href: "/products?category=accessories" },
  { name: "Smartwatches", href: "/products?category=accessories" },
  { name: "Screen Protectors", href: "/products?category=accessories" },
];

const REPAIRS = [
  {
    title: "Screen Replacement",
    body: "Original-quality displays, fitted while you wait.",
    price: "from Rs. 4,500",
  },
  {
    title: "Battery Replacement",
    body: "Bring back all-day battery life in under an hour.",
    price: "from Rs. 3,000",
  },
  {
    title: "Camera Repair",
    body: "Blurry photos or a broken lens — we fix both.",
    price: "from Rs. 3,500",
  },
  {
    title: "Water Damage",
    body: "Board-level recovery. Diagnosis is free.",
    price: "quoted after check",
  },
  {
    title: "Software Issues",
    body: "Stuck logos, slow phones, data recovery, updates.",
    price: "from Rs. 1,000",
  },
];

const FAQS = [
  {
    q: "Are your phones genuine with official warranty?",
    a: "Yes. Every device we sell is brand-new, factory-sealed, and carries the official manufacturer warranty valid in Nepal.",
  },
  {
    q: "How does EMI work?",
    a: "Choose your phone, bring your documents (citizenship + income proof or a guarantor), and we'll set up monthly installments — usually approved the same day.",
  },
  {
    q: "Can I exchange my old phone?",
    a: "Absolutely. Bring your old phone to the shop, we'll inspect it on the spot and give you a fair trade-in price toward any new device.",
  },
  {
    q: "Do you deliver outside Butwal?",
    a: "We deliver same-day within Butwal. For nearby cities, message us on WhatsApp and we'll arrange courier delivery.",
  },
  {
    q: "How do I pay?",
    a: "Cash on delivery, QR / eSewa payment, or EMI — whatever works for you.",
  },
  {
    q: "How long do repairs take?",
    a: "Most screen and battery replacements are done within an hour. Complex repairs like water damage take 1–3 days.",
  },
];

function SectionHeading({
  eyebrow,
  title,
  sub,
  align = "center",
}: {
  eyebrow: string;
  title: string;
  sub?: string;
  align?: "left" | "center";
}) {
  return (
    <Reveal
      className={
        align === "center"
          ? "mx-auto mb-10 max-w-xl text-center"
          : "mb-10 max-w-xl"
      }
    >
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-accent">
        {eyebrow}
      </p>
      <h2 className="mt-2 text-3xl font-semibold tracking-tight [text-wrap:balance] sm:text-4xl">
        {title}
      </h2>
      {sub && <p className="mt-3 text-sm text-muted">{sub}</p>}
    </Reveal>
  );
}

export default async function HomePage() {
  const featured = await getFeaturedProducts();

  return (
    <main className="flex-1 overflow-x-clip">
      {/* ============ 1. HERO — phone trio showcase ============ */}
      <section className="relative overflow-hidden">
        <div className="hero-glow pointer-events-none absolute inset-0" />
        <div className="relative mx-auto max-w-3xl px-4 pt-16 text-center lg:pt-20">
          <p
            className="fade-up inline-block rounded-full border border-border px-4 py-1.5 text-xs text-muted"
            style={{ "--delay": "0s" } as React.CSSProperties}
          >
            Butwal&apos;s trusted phone store — Amarpath
          </p>
          <h1
            className="fade-up mt-5 text-4xl font-semibold leading-[1.05] tracking-[-0.02em] [text-wrap:balance] sm:text-5xl lg:text-7xl"
            style={{ "--delay": "0.08s" } as React.CSSProperties}
          >
            The phone you want.
            <br />
            <span className="iridescent-text">The price you deserve.</span>
          </h1>
          <p
            className="fade-up mx-auto mt-5 max-w-md text-base text-muted"
            style={{ "--delay": "0.16s" } as React.CSSProperties}
          >
            Brand-new smartphones, genuine accessories, expert repairs, and
            easy EMI — all under one roof at iMart.
          </p>
          <div
            className="fade-up mt-8 flex flex-wrap items-center justify-center gap-4"
            style={{ "--delay": "0.24s" } as React.CSSProperties}
          >
            <Magnetic>
              <Ripple>
                <Link
                  href="/products"
                  className="btn-primary inline-block rounded-full px-7 py-3 text-sm font-semibold text-white"
                >
                  Shop Now
                </Link>
              </Ripple>
            </Magnetic>
            <Magnetic>
              <Ripple>
                <a
                  href={WA_LINK}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-glass inline-block rounded-full px-7 py-3 text-sm font-semibold"
                >
                  Contact on WhatsApp
                </a>
              </Ripple>
            </Magnetic>
          </div>
          <ul
            className="fade-up mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-2"
            style={{ "--delay": "0.32s" } as React.CSSProperties}
          >
            {TRUST_BADGES.map((badge) => (
              <li
                key={badge}
                className="flex items-center gap-2 text-xs text-muted"
              >
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="shrink-0 text-accent"
                >
                  <path d="M20 6 9 17l-5-5" />
                </svg>
                {badge}
              </li>
            ))}
          </ul>
        </div>

        <div className="relative mx-auto mt-12 max-w-7xl px-4">
          <PhoneTrio />
        </div>
      </section>

      {/* ============ 2. BRANDS ============ */}
      <section className="border-y border-border py-8">
        <p className="mb-5 text-center text-xs font-semibold uppercase tracking-[0.2em] text-muted">
          Brands we carry
        </p>
        <div className="marquee mx-auto max-w-7xl">
          <ul className="marquee-track items-center gap-x-12 px-4">
            {[...BRANDS, ...BRANDS].map((brand, i) => (
              <li
                key={`${brand}-${i}`}
                className="whitespace-nowrap text-sm font-semibold tracking-wide text-muted transition hover:text-text"
                aria-hidden={i >= BRANDS.length}
              >
                {brand}
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* ============ 2b. STATS ============ */}
      <section className="mx-auto max-w-7xl px-4 pt-16">
        <Reveal>
          <StatsCounter />
        </Reveal>
      </section>

      {/* ============ 3. FEATURED PHONES ============ */}
      {featured.length > 0 && (
        <section className="mx-auto max-w-7xl px-4 pt-20">
          <SectionHeading
            align="left"
            eyebrow="Featured"
            title="This week's top picks"
            sub="Hand-picked phones at prices you won't beat anywhere in Butwal."
          />
          <Reveal delay={0.08}>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {featured.map((product) => (
              <TiltCard key={product.id}>
              <Link
                href={`/products/${product.slug}`}
                className="group relative block rounded-2xl bg-surface p-4 transition hover:shadow-[0_20px_40px_-16px_rgba(0,0,0,0.15)]"
              >
                <div className="relative mb-4 aspect-square overflow-hidden rounded-xl bg-bg">
                  {product.images[0] ? (
                    <Image
                      src={product.images[0]}
                      alt={product.name}
                      fill
                      sizes="(max-width: 640px) 50vw, 25vw"
                      className="object-cover transition duration-300 group-hover:scale-105"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-sm font-semibold tracking-widest text-muted">
                      iMart
                    </div>
                  )}
                  {product.stock > 0 && product.stock <= 3 && (
                    <span className="absolute left-2 top-2 rounded-full bg-accent px-2 py-0.5 text-[10px] font-semibold text-white">
                      Almost gone
                    </span>
                  )}
                </div>
                <p className="truncate text-sm font-semibold">{product.name}</p>
                <p className="mt-1 text-sm">{formatPrice(product.price)}</p>
                <p className="mt-0.5 text-xs text-muted">
                  or {emi(product.price)}/mo with EMI
                </p>
              </Link>
              </TiltCard>
            ))}
          </div>
          </Reveal>
          <div className="mt-8 text-center">
            <Link
              href="/products"
              className="text-sm font-semibold text-accent"
            >
              View all products →
            </Link>
          </div>
        </section>
      )}

      {/* ============ 4. WHY CHOOSE IMART — asymmetric split ============ */}
      <section className="mt-24 bg-surface py-20">
        <div className="mx-auto max-w-7xl px-4">
        <div className="grid gap-10 lg:grid-cols-5 lg:gap-16">
          <Reveal className="lg:col-span-2">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-accent">
              Why iMart
            </p>
            <h2 className="mt-2 text-3xl font-semibold leading-tight tracking-tight sm:text-4xl">
              Bought a phone before? This feels different.
            </h2>
            <p className="mt-4 text-sm leading-relaxed text-muted">
              We&apos;re not a marketplace or a middleman — we&apos;re a shop
              in Amarpath you can walk into, with people who answer the phone
              after you buy. That changes everything about how we sell.
            </p>
            <Link
              href="/products"
              className="mt-6 inline-block text-sm font-semibold text-accent"
            >
              Browse the store →
            </Link>
          </Reveal>
          <Reveal delay={0.1} className="lg:col-span-3">
            <ul className="grid gap-x-8 gap-y-7 sm:grid-cols-2">
              {WHY_POINTS.map((point) => (
                <li key={point.title} className="flex gap-3">
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="mt-0.5 shrink-0 text-accent"
                  >
                    <path d="M20 6 9 17l-5-5" />
                  </svg>
                  <div>
                    <p className="text-sm font-semibold">{point.title}</p>
                    <p className="mt-1 text-sm leading-relaxed text-muted">
                      {point.body}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          </Reveal>
        </div>
        </div>
      </section>

      {/* ============ 5. OFFERS — bento ============ */}
      <section className="mx-auto max-w-7xl px-4 pt-24">
        <SectionHeading
          align="left"
          eyebrow="Deals"
          title="Offers running right now"
          sub="Ask about any of these in the shop or on WhatsApp."
        />
        <Reveal delay={0.08}>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {/* Anchor offer — spans 2 rows */}
          <div className="flex flex-col justify-between rounded-3xl bg-accent p-8 text-white sm:col-span-2 lg:col-span-1 lg:row-span-2">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/70">
                Most popular
              </p>
              <p className="mt-3 text-2xl font-semibold leading-tight">
                {OFFERS[0].title}
              </p>
              <p className="mt-2 text-sm leading-relaxed text-white/80">
                {OFFERS[0].body} Bring any working phone — we&apos;ll quote it
                in minutes.
              </p>
            </div>
            <a
              href={`${WA_LINK}?text=${encodeURIComponent("Hi iMart! What's my phone worth on exchange?")}`}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-8 inline-block w-fit rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-accent transition hover:opacity-90"
            >
              Get my exchange quote
            </a>
          </div>
          {/* Supporting offers */}
          {OFFERS.slice(1).map((offer) => (
            <div
              key={offer.title}
              className="rounded-2xl border border-border p-6 transition hover:border-accent/40"
            >
              <p className="text-sm font-semibold">{offer.title}</p>
              <p className="mt-1.5 text-sm text-muted">{offer.body}</p>
            </div>
          ))}
        </div>
        </Reveal>
      </section>

      {/* ============ 6. REVIEWS ============ */}
      <section className="mt-24 bg-surface py-20">
        <div className="mx-auto max-w-7xl px-4">
        <SectionHeading
          eyebrow="Reviews"
          title="What customers say"
        />
        <Reveal delay={0.08}>
        <div className="grid gap-4 lg:grid-cols-3">
          {REVIEWS.map((review) => (
            <figure key={review.name} className="glass rounded-2xl p-6">
              <div
                className="flex gap-0.5 text-accent"
                aria-label="5 out of 5 stars"
              >
                {Array.from({ length: 5 }).map((_, i) => (
                  <svg
                    key={i}
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                  >
                    <path d="M12 2l2.9 6.6 7.1.6-5.4 4.7 1.6 7L12 17l-6.2 3.9 1.6-7L2 9.2l7.1-.6L12 2z" />
                  </svg>
                ))}
              </div>
              <blockquote className="mt-4 text-sm leading-relaxed text-muted">
                &ldquo;{review.body}&rdquo;
              </blockquote>
              <figcaption className="mt-4 flex items-center gap-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-accent/15 text-xs font-semibold text-accent">
                  {review.name
                    .split(" ")
                    .map((n) => n[0])
                    .join("")}
                </span>
                <span>
                  <span className="block text-sm font-semibold">
                    {review.name}
                  </span>
                  <span className="text-xs text-muted">
                    {review.role} · Verified purchase
                  </span>
                </span>
              </figcaption>
            </figure>
          ))}
        </div>
        </Reveal>
        </div>
      </section>

      {/* ============ 7. ACCESSORIES ============ */}
      <section className="mx-auto max-w-7xl px-4 pt-24">
        <SectionHeading
          align="left"
          eyebrow="Accessories"
          title="Complete your setup"
          sub="Everything that goes with your phone — genuine, tested, in stock."
        />
        <Reveal delay={0.08}>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          {ACCESSORY_TILES.map((tile) => (
            <Link
              key={tile.name}
              href={tile.href}
              className="group rounded-2xl bg-surface p-6 text-center transition hover:-translate-y-0.5 hover:bg-surface/70"
            >
              <p className="text-sm font-semibold">{tile.name}</p>
              <p className="mt-1 text-xs text-accent opacity-0 transition group-hover:opacity-100">
                Browse →
              </p>
            </Link>
          ))}
        </div>
        </Reveal>
      </section>

      {/* ============ 8. REPAIRS — price menu ============ */}
      <section className="mx-auto max-w-3xl px-4 pt-24">
        <SectionHeading
          align="left"
          eyebrow="Repairs"
          title="Broken phone? Bring it in."
          sub="Most repairs done while you wait — genuine parts, honest prices."
        />
        <Reveal delay={0.08}>
        <div className="divide-y divide-border rounded-2xl border border-border">
          {REPAIRS.map((repair) => (
            <div
              key={repair.title}
              className="flex items-baseline justify-between gap-6 px-6 py-4"
            >
              <div className="min-w-0">
                <p className="text-sm font-semibold">{repair.title}</p>
                <p className="mt-0.5 text-sm text-muted">{repair.body}</p>
              </div>
              <p
                className="shrink-0 text-sm font-semibold text-accent"
                style={{ fontVariantNumeric: "tabular-nums" }}
              >
                {repair.price}
              </p>
            </div>
          ))}
          <a
            href={`${WA_LINK}?text=${encodeURIComponent("Hi iMart! My phone needs a repair.")}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-between gap-6 px-6 py-4 transition hover:bg-surface"
          >
            <p className="text-sm font-semibold text-accent">
              Not listed? Send us a photo on WhatsApp
            </p>
            <span className="text-accent">→</span>
          </a>
        </div>
        </Reveal>
      </section>

      {/* ============ 9. FAQ ============ */}
      <section className="mx-auto max-w-2xl px-4 pt-24">
        <SectionHeading eyebrow="FAQ" title="Common questions" />
        <Reveal delay={0.08}>
        <div className="divide-y divide-border rounded-2xl border border-border">
          {FAQS.map((faq) => (
            <details key={faq.q} className="group px-6 py-4">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-sm font-semibold [&::-webkit-details-marker]:hidden">
                {faq.q}
                <span className="shrink-0 text-muted transition group-open:rotate-45">
                  +
                </span>
              </summary>
              <p className="mt-3 text-sm leading-relaxed text-muted">
                {faq.a}
              </p>
            </details>
          ))}
        </div>
        </Reveal>
      </section>

      {/* ============ 10. FINAL CTA ============ */}
      <section className="mx-auto max-w-7xl px-4 pt-24">
        <Reveal>
        <div className="noise relative overflow-hidden rounded-3xl bg-[#0B0B0F] px-6 py-16 text-center sm:py-20">
          <div
            className="pointer-events-none absolute -left-24 -top-24 h-80 w-80 rounded-full opacity-40 blur-[100px]"
            style={{ background: "#AF52DE" }}
          />
          <div
            className="pointer-events-none absolute -bottom-24 -right-24 h-80 w-80 rounded-full opacity-30 blur-[100px]"
            style={{ background: "#007AFF" }}
          />
          <div className="relative">
            <h2 className="text-3xl font-semibold tracking-tight text-white [text-wrap:balance] sm:text-4xl">
              Upgrade your smartphone{" "}
              <span className="iridescent-text">today</span>
            </h2>
            <p className="mx-auto mt-3 max-w-md text-sm text-white/60">
              Visit us at Amarpath, order online, or just say hi on WhatsApp —
              we&apos;ll help you pick the right phone.
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
              <Magnetic>
                <Ripple>
                  <Link
                    href="/products"
                    className="btn-primary inline-block rounded-full px-7 py-3 text-sm font-semibold text-white"
                  >
                    Shop Now
                  </Link>
                </Ripple>
              </Magnetic>
              <Magnetic>
                <Ripple>
                  <a
                    href={WA_LINK}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-block rounded-full bg-[#25D366] px-7 py-3 text-sm font-semibold text-black transition hover:opacity-90 active:scale-[0.97]"
                  >
                    WhatsApp Us
                  </a>
                </Ripple>
              </Magnetic>
              <Magnetic>
                <a
                  href="https://maps.google.com/?q=Amarpath,Butwal"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block rounded-full border border-white/20 px-7 py-3 text-sm font-semibold text-white transition hover:bg-white/10 active:scale-[0.97]"
                >
                  Visit the Store
                </a>
              </Magnetic>
            </div>
          </div>
        </div>
        </Reveal>
      </section>
    </main>
  );
}
