import Image from "next/image";
import Link from "next/link";
import { formatPrice } from "@/lib/format";
import { StoreIcon } from "@/components/store-icon";
import type { HeroData } from "../data";
import { FinishPicker } from "./finish-picker";

export function HeroStage({ hero, whatsapp }: { hero: HeroData | null; whatsapp: string }) {
  const shopHref = hero ? `/products/${hero.slug}` : "/products?category=iphone";
  const shopLabel = hero ? `Shop ${hero.displayName}` : "Shop iPhone";

  return (
    <>
      {/* Mid-back plane: lives outside the hero so the 3D phone renders in front of it. */}
      <p className="hero-word" aria-hidden="true">{hero?.word ?? "iPhone"}</p>
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
              <Link className="landing-cta" href={shopHref}>
                {shopLabel}
                <StoreIcon name="arrow" width={18} />
              </Link>
              {whatsapp && (
                <a
                  className="landing-cta landing-cta-ghost"
                  href={`https://wa.me/977${whatsapp}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Talk to us <span aria-hidden="true">↗</span>
                </a>
              )}
            </div>
            {hero && hero.finishes.length > 0 && <FinishPicker finishes={hero.finishes} />}
          </div>
          <div className="hero-device-slot">
            {hero?.image && (
              <Image
                className="hero-poster"
                src={hero.image}
                alt={hero.name}
                fill
                priority
                sizes="(max-width: 760px) 90vw, 560px"
              />
            )}
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
