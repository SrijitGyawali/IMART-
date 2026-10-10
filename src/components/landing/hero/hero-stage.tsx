import Link from "next/link";
import { formatPrice } from "@/lib/format";
import { StoreIcon } from "@/components/store-icon";
import type { HeroData } from "../data";
import { FinishPicker } from "./finish-picker";
import { HeroPoster } from "./hero-poster";

export function HeroStage({ hero, whatsapp }: { hero: HeroData | null; whatsapp: string }) {
  const shopHref = hero ? `/products/${hero.slug}` : "/products?category=iphone";
  const shopLabel = hero ? `Shop ${hero.displayName}` : "Shop iPhone";

  return (
    <>
      {/* Mid-back plane: lives outside the hero so the 3D phone renders in front of it. */}
      <p className="hero-word" aria-hidden="true"><span className="hero-word-inner">{hero?.word ?? "iPhone"}</span></p>
      <section className="landing-hero" data-stage-section="hero" aria-labelledby="hero-title">
        <div className="landing-container hero-grid">
          <div className="hero-copy">
            <p className="landing-label landing-label-signal">New</p>
            <h1 id="hero-title" className="hero-title">
              <span className="hero-line hero-line-1">Your next<br />upgrade.</span>
              <span className="hero-line hero-line-2">
                {hero?.isPro === false ? <>Make it<br />yours.</> : <>Make it<br />a Pro.</>}
              </span>
            </h1>
            {hero?.price != null && (
              <p className="hero-price">
                <span className="landing-label">From</span>
                <strong>{formatPrice(hero.price)}</strong>
              </p>
            )}
            <div className="hero-ctas">
              <Link
                className="landing-cta"
                href={shopHref}
                data-string="magnetic"
                data-string-strength="0.12"
                data-string-radius="150"
              >
                {shopLabel}
                <span className="cta-arrow"><StoreIcon name="arrow" width={18} /></span>
              </Link>
              {whatsapp && (
                <a
                  className="landing-cta landing-cta-ghost"
                  href={`https://wa.me/977${whatsapp}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  data-cursor="chat"
                >
                  Talk to us <span aria-hidden="true">↗</span>
                </a>
              )}
            </div>
            {hero && hero.finishes.length > 0 && <FinishPicker finishes={hero.finishes} />}
          </div>
          <div className="hero-device-slot">
            {hero && <HeroPoster finishes={hero.finishes} alt={hero.name} />}
          </div>
        </div>
        <div className="hero-scroll-cue" aria-hidden="true">
          <span>Scroll to explore</span>
          <span>01</span>
          <i />
        </div>
      </section>
    </>
  );
}
