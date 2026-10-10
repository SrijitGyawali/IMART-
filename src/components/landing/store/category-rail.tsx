import Image from "next/image";
import Link from "next/link";
import { StoreIcon } from "@/components/store-icon";
import type { RailItem } from "../data";

export function CategoryRail({ items }: { items: RailItem[] }) {
  if (items.length === 0) return null;
  return (
    <section className="rail" aria-labelledby="rail-heading">
      <div className="landing-container store-row-head">
        <h2 id="rail-heading">Shop by category</h2>
        <Link href="/products" className="store-text-link">
          Browse all <StoreIcon name="arrow" width={16} />
        </Link>
      </div>
      <div className="rail-track">
        {items.map((item) => (
          <Link key={item.key} href={item.href} className="rail-tile" data-cursor="view">
            <span className="rail-image">
              {item.image ? (
                <Image src={item.image} alt="" fill sizes="(max-width: 760px) 45vw, 260px" />
              ) : (
                <StoreIcon name="bag" width={40} height={40} />
              )}
            </span>
            <span className="rail-label">{item.label}</span>
          </Link>
        ))}
      </div>
    </section>
  );
}
