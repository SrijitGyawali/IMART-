import { StoreIcon } from "@/components/store-icon";

const SERVICES = [
  ["01", "Find your fit", "Tell us what matters to you. We'll help you compare your options."],
  ["02", "Repairs & after-sales", "Get hands-on help with your device at our Amarpath store."],
  ["03", "Phone exchange", "Bring in your current phone and ask our team about upgrading."],
] as const;

export function Services({ contact }: { contact: string }) {
  return (
    <section id="services" className="services landing-container" aria-labelledby="services-heading">
      <div className="store-row-head">
        <div>
          <p className="landing-label landing-label-brand">The human side of tech</p>
          <h2 id="services-heading">A real store. People you can count on.</h2>
        </div>
        <a href={contact} className="store-text-link">
          Talk to our team <StoreIcon name="arrow" width={16} />
        </a>
      </div>
      <ol className="service-list">
        {SERVICES.map(([number, title, body]) => (
          <li key={number} className="service-row">
            <span className="service-num">{number}</span>
            <div>
              <h3>{title}</h3>
              <p>{body}</p>
            </div>
            <span className="service-line" aria-hidden="true">
              <StoreIcon name="arrow" width={20} />
            </span>
          </li>
        ))}
      </ol>
    </section>
  );
}
