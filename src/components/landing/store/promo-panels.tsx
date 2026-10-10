import Image from "next/image";
import Link from "next/link";
import { StoreIcon } from "@/components/store-icon";
import type { Promo } from "../data";

export function PromoPanels({ promos }: { promos: Promo[] }) {
  if (promos.length === 0) return null;
  return (
    <section className="promos landing-container" aria-label="Collections">
      {promos.map((promo) => (
        <article key={promo.key} className={`promo promo-${promo.key}`}>
          <div className="promo-copy">
            <p className="landing-label landing-label-brand">{promo.eyebrow}</p>
            <h3>{promo.title}</h3>
            <p>{promo.body}</p>
            <Link href={promo.href} className="store-text-link">
              {promo.linkLabel} <StoreIcon name="arrow" width={18} />
            </Link>
          </div>
          <div className="promo-media">
            {promo.image && <Image src={promo.image} alt={promo.alt} fill sizes="(max-width: 760px) 90vw, 640px" />}
          </div>
        </article>
      ))}
    </section>
  );
}
