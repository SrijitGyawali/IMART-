import Image from "next/image";
import Link from "next/link";
import { getAllProducts, getCategories } from "@/lib/queries";
import { StoreHero, type HeroProduct } from "@/components/store-hero";
import { HomeProducts } from "@/components/home-products";
import { StoreIcon } from "@/components/store-icon";

export const revalidate = 60;

const faqs = [
  ["Can I collect my order from the store?", "Yes. Choose store pickup at checkout and collect your order from iMart in Amarpath, Butwal. Our team will call to confirm the details."],
  ["How can I pay for my order?", "Choose cash on delivery or pickup, or pay using the QR code shown after ordering. For QR payments, send your payment screenshot to our team on WhatsApp."],
  ["Where do you deliver?", "Home delivery is available within Butwal. For nearby areas, contact our team before ordering so we can confirm delivery options."],
  ["Can you help with repairs or an exchange?", "Visit us with your device or message us on WhatsApp. Our team can discuss the condition, repair options, and availability before you decide."],
];

export default async function HomePage() {
  const [allProducts, categories] = await Promise.all([getAllProducts(), getCategories()]);
  // Only public catalogue fields cross the Server/Client Component boundary.
  const products = allProducts.map(p => ({
    id: p.id, name: p.name, slug: p.slug, price: p.price, images: p.images,
    category_id: p.category_id, description: p.description, stock: p.stock,
    active: p.active, featured: p.featured, created_at: p.created_at, color: p.color, storage: p.storage,
  }));
  const phone = products.find(p => /iphone.*pro max/i.test(p.name)) ?? products.find(p => /iphone.*pro/i.test(p.name));
  const laptop = products.find(p => /macbook/i.test(p.name));
  const charger = products.find(p => /power adapter/i.test(p.name));
  const air = products.find(p => /iphone air/i.test(p.name));
  const promoPhone = air ?? phone;
  const accessoryCategoryIds = categories.filter(c => ["chargers", "cases", "accessories", "speakers"].includes(c.slug)).map(c => c.id);
  const accessoryIds = products.filter(p => p.category_id && accessoryCategoryIds.includes(p.category_id)).map(p => p.id);
  const heroProducts: HeroProduct[] = [
    ...(phone ? [{ name: phone.name, slug: phone.slug, price: phone.price, image: phone.images[0], kind: "phone" as const }] : []),
    ...(laptop ? [{ name: laptop.name, slug: laptop.slug, price: laptop.price, image: laptop.images[0], kind: "laptop" as const }] : []),
    ...(charger ? [{ name: charger.name, slug: charger.slug, price: charger.price, image: charger.images[0], kind: "accessory" as const }] : []),
  ];
  const collections = [
    { name: "iPhone", href: "/products?category=iphone", product: products.find(p => /iphone 17$/i.test(p.name)) ?? phone },
    { name: "MacBook", href: "/products?q=MacBook", product: laptop },
    { name: "Chargers", href: "/products?category=chargers", product: charger },
    { name: "Cables", href: "/products?q=Cable", product: products.find(p => /lightning cable/i.test(p.name)) },
    { name: "Mice & more", href: "/products?q=Mouse", product: products.find(p => /mouse/i.test(p.name)) },
    { name: "Accessories", href: "/products?category=accessories", product: products.find(p => /headphone jack/i.test(p.name)) },
  ];
  const whatsapp = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER;
  const selectionIds = [...new Set([phone?.id, air?.id, laptop?.id, ...collections.map(c => c.product?.id)].filter((id): id is string => !!id))];
  const contact = whatsapp ? "https://wa.me/977" + whatsapp : "#visit";

  return (
    <main>
      <div className="store-container">
        <div className="hero-intro"><span><StoreIcon name="pin" width={14} /> From Amarpath, with care.</span><span>Phones, accessories & a little expert advice.</span></div>
        <StoreHero products={heroProducts} />
        <section className="category-section" aria-labelledby="category-heading">
          <div className="section-heading compact"><h2 id="category-heading">What are you looking for?</h2><Link href="/products" className="store-text-link">Browse all <StoreIcon name="arrow" width={16} /></Link></div>
          <div className="category-grid">{collections.map(collection => (
            <Link key={collection.name} href={collection.href} className="category-tile"><div className="category-image">{collection.product?.images[0] ? <Image src={collection.product.images[0]} alt="" fill sizes="120px" className="object-contain" /> : <StoreIcon name="bag" width={38} height={38} />}</div><span>{collection.name}</span></Link>
          ))}</div>
        </section>
        <div className="benefits-strip">
          <div><StoreIcon name="shield" /><span><strong>Genuine products</strong><small>Shop with confidence</small></span></div>
          <div><StoreIcon name="truck" /><span><strong>Local delivery</strong><small>Right to your door in Butwal</small></span></div>
          <div><StoreIcon name="payment" /><span><strong>Pay your way</strong><small>Cash or QR payments</small></span></div>
          <div><StoreIcon name="headset" /><span><strong>Here to help</strong><small>Real people, local support</small></span></div>
        </div>
        <HomeProducts products={products} accessoryIds={accessoryIds} selectionIds={selectionIds} />
        <section className="promo-grid" aria-label="Explore our collections">
          <div className="collection-promo promo-air"><div><p className="store-eyebrow">LESS WEIGHT. MORE POSSIBILITY.</p><h2>Easy to carry.<br />Hard to put down.</h2><p>Take a closer look at {air ? "iPhone Air" : "our iPhone collection"}.</p><Link href={air ? "/products/" + air.slug : "/products?category=iphone"} className="store-text-link">Explore iPhone <StoreIcon name="arrow" width={18} /></Link></div>{promoPhone?.images[0] && <div className="promo-image"><Image src={promoPhone.images[0]} alt={promoPhone.name} fill sizes="(max-width: 700px) 40vw, 260px" className="object-contain" /></div>}</div>
          <div className="collection-promo promo-essentials"><div><p className="store-eyebrow">THE EVERYDAY ESSENTIALS</p><h2>A perfect match<br />for your tech.</h2><p>Power up. Plug in. Keep going.</p><Link href="/products?category=chargers" className="store-text-link">Shop accessories <StoreIcon name="arrow" width={18} /></Link></div>{charger?.images[0] && <div className="promo-image"><Image src={charger.images[0]} alt={charger.name} fill sizes="(max-width: 700px) 40vw, 260px" className="object-contain" /></div>}</div>
        </section>
        <section id="services" className="services-section">
          <div className="services-copy"><span className="service-tag"><StoreIcon name="headset" width={16} /> THE HUMAN SIDE OF TECH</span><h2>A real store.<br />People you can count on.</h2><p>From choosing your first iPhone to giving an old favourite a second life, our team is here for you.</p><a href={contact} className="store-button">Talk to our team <StoreIcon name="arrow" width={18} /></a></div>
          <div className="service-list">
            {[["01", "Find your perfect fit", "Tell us what matters to you. We'll help you compare your options."], ["02", "Repairs & after-sales care", "Get hands-on help with your device at our Amarpath store."], ["03", "Explore an exchange", "Bring in your current phone and ask our team about upgrading."]].map(([number, title, body]) => <div key={number}><span>{number}</span><div><h3>{title}</h3><p>{body}</p></div><StoreIcon name="arrow" width={20} /></div>)}
          </div>
        </section>
        <section className="shopping-help store-section" id="help"><div><h2>A little help<br />before you shop.</h2><p>Everything you need for an easier purchase.</p><a className="store-text-link" href={contact}>Ask us on WhatsApp <StoreIcon name="arrow" width={17} /></a></div><div className="store-faq">{faqs.map(([question, answer]) => <details key={question}><summary>{question}<StoreIcon name="plus" width={18} /></summary><p>{answer}</p></details>)}</div></section>
      </div>
      <section id="visit" className="visit-store"><div className="store-container"><div className="visit-icon"><StoreIcon name="pin" width={30} height={30} /></div><div><h2>Online convenience. Local connection.</h2><p>Come say hello at iMart, Amarpath, Butwal.</p></div><a className="store-button store-button-outline" href="https://maps.google.com/?q=Amarpath,Butwal" target="_blank" rel="noopener noreferrer">Find our store <StoreIcon name="arrow" width={18} /></a></div></section>
    </main>
  );
}
