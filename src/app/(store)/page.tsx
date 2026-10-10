import { getAllProducts, getCategories } from "@/lib/queries";
import { LandingExperience } from "@/components/landing/landing-experience";
import { HeroStage } from "@/components/landing/hero/hero-stage";
import { ProductFilm } from "@/components/landing/film/product-film";
import { CategoryRail } from "@/components/landing/store/category-rail";
import { ProductShowcase } from "@/components/landing/store/product-showcase";
import { Benefits } from "@/components/landing/store/benefits";
import { PromoPanels } from "@/components/landing/store/promo-panels";
import { Services } from "@/components/landing/store/services";
import { Faq } from "@/components/landing/store/faq";
import { VisitIMart } from "@/components/landing/store/visit-imart";
import { BootIntro } from "@/components/landing/intro/boot-intro";
import {
  buildHero, buildPromos, buildRail, buildShelves, pickHeroProduct, toPublicProduct,
} from "@/components/landing/data";

export const revalidate = 60;

export default async function HomePage() {
  const [products, categories] = await Promise.all([getAllProducts(), getCategories()]);
  const heroProduct = pickHeroProduct(products, categories);
  const hero = buildHero(heroProduct);
  const whatsapp = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? "";
  const contact = whatsapp ? `https://wa.me/977${whatsapp}` : "#visit";

  return (
    <LandingExperience initialFinish={hero?.finishes[0] ?? null}>
      <BootIntro />
      <div className="landing-dark">
        <HeroStage hero={hero} whatsapp={whatsapp} />
        <ProductFilm />
      </div>
      <div className="landing-store" data-stage-section="light">
        <CategoryRail items={buildRail(categories, products, heroProduct)} />
        <ProductShowcase shelves={buildShelves(categories, products)} products={products.map(toPublicProduct)} />
        <Benefits />
        <PromoPanels promos={buildPromos(products)} />
        <Services contact={contact} />
        <Faq contact={contact} />
        <VisitIMart whatsapp={whatsapp} />
      </div>
    </LandingExperience>
  );
}
