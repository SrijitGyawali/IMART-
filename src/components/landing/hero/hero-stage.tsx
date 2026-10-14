import Link from "next/link";
import { formatPrice } from "@/lib/format";
import { StoreIcon } from "@/components/store-icon";
import type { HeroData } from "../data";
import { FinishPicker } from "./finish-picker";
import { HeroPoster } from "./hero-poster";

export function HeroStage({ hero, whatsapp }: { hero: HeroData | null; whatsapp: string }) {
  const shopHref = hero ? `/products/${hero.slug}` : "/products?category=iphone";
  const shopLabel = hero ? `Shop ${hero.displayName}` : "Shop iPhone";
  const enquiry = hero ? `Hi iMart! I'm interested in the ${hero.displayName}. Could you help me with availability and delivery in Butwal?` : "Hi iMart! Could you help me choose my next iPhone?";
  const whatsappHref = whatsapp ? `https://wa.me/977${whatsapp}?text=${encodeURIComponent(enquiry)}` : null;

  return (
    <>
      <p className="hero-word" aria-hidden="true"><span className="hero-word-inner">{hero?.word ?? "iPhone"}</span></p>
      <section className="landing-hero" data-stage-section="hero" aria-labelledby="hero-title">
        <div className="landing-container hero-grid">
          <div className="hero-copy">
            <p className="landing-label landing-label-signal">New</p>
            <h1 id="hero-title" className="hero-title">
              <span className="hero-line hero-line-1">Your next <br className="hero-desktop-break" />upgrade.</span>
              <span className="hero-line hero-line-2">
                {hero?.isPro === false ? <>Make it<br />yours.</> : <>Make it<br />a Pro.</>}
              </span>
            </h1>
          </div>
          <div className="hero-device-slot">
            <span className="hero-device-caption" aria-hidden="true">Designed to stand out.</span>
            {hero && <HeroPoster finishes={hero.finishes} alt={`${hero.name} displaying iMart's Hello, Butwal welcome screen`} />}
            <span className="hero-device-location" aria-hidden="true">Made personal.<br />Right here in Butwal.</span>
          </div>
          {hero && hero.finishes.length > 0 && <FinishPicker finishes={hero.finishes} />}
          <div className="hero-purchase">
            <div className="hero-product-info">
              <div className="hero-product-name">
                <span className="landing-label">Your next chapter</span>
                <p>{hero?.displayName ?? "Explore iPhone"}</p>
              </div>
            {hero?.price != null && (
              <p className="hero-price">
                <span className="landing-label">From</span>
                <strong>{formatPrice(hero.price)}</strong>
              </p>
            )}
            </div>
            <div className="hero-ctas">
              <Link
                className="landing-cta"
                href={shopHref}
                data-string="magnetic"
                data-string-strength="0.12"
                data-string-radius="150"
              >
                <span className="hero-shop-label-desktop">{shopLabel}</span>
                <span className="hero-shop-label-mobile">Shop iPhone</span>
                <span className="cta-arrow"><StoreIcon name="arrow" width={18} /></span>
              </Link>
              {whatsappHref && (
                <a
                  className="landing-cta landing-cta-ghost hero-whatsapp"
                  href={whatsappHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  data-cursor="chat"
                >
                  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true"><path d="M20.5 11.5a8.5 8.5 0 0 1-12.6 7.4L3 20l1.2-4.8a8.5 8.5 0 1 1 16.3-3.7Z" /><path d="M8 7.5c.7 4 2.5 5.8 6.5 6.5l1-2-2-1-.9.9a8 8 0 0 1-2.5-2.5l.9-.9-1-2-2 1Z" /></svg>
                  Talk to us <span className="hero-whatsapp-service">on WhatsApp</span><span aria-hidden="true">↗</span>
                </a>
              )}
            </div>
          </div>
        </div>
        <div className="hero-scroll-cue" aria-hidden="true">
          <span>Scroll into the story</span>
          <i />
        </div>
      </section>
    </>
  );
}
