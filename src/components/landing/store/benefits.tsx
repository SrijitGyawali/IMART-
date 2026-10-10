import { StoreIcon } from "@/components/store-icon";

const BENEFITS = [
  { icon: "shield", title: "Genuine products", body: "Shop with confidence" },
  { icon: "check", title: "Warranty included", body: "Peace of mind after you buy" },
  { icon: "truck", title: "Delivery in Butwal", body: "Right to your door" },
  { icon: "headset", title: "After-sales support", body: "Repairs at our Amarpath store" },
] as const;

export function Benefits() {
  return (
    <section className="benefits" aria-label="Why shop at iMart">
      <div className="landing-container benefits-grid">
        {BENEFITS.map((b) => (
          <div key={b.title} className="benefit">
            <StoreIcon name={b.icon} width={28} height={28} />
            <span>
              <strong>{b.title}</strong>
              <small>{b.body}</small>
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}
