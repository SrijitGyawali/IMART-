import { StoreIcon } from "@/components/store-icon";

const FAQS = [
  ["Can I collect my order from the store?", "Yes. Choose store pickup at checkout and collect your order from iMart in Amarpath, Butwal. Our team will call to confirm the details."],
  ["How can I pay for my order?", "Choose cash on delivery or pickup, or pay using the QR code shown after ordering. For QR payments, send your payment screenshot to our team on WhatsApp."],
  ["Where do you deliver?", "Home delivery is available within Butwal. For nearby areas, contact our team before ordering so we can confirm delivery options."],
  ["Can you help with repairs or an exchange?", "Visit us with your device or message us on WhatsApp. Our team can discuss the condition, repair options, and availability before you decide."],
] as const;

export function Faq({ contact }: { contact: string }) {
  return (
    <section id="help" className="faq landing-container" aria-labelledby="faq-heading">
      <div>
        <h2 id="faq-heading">A little help before you shop.</h2>
        <p>Everything you need for an easier purchase.</p>
        <a className="store-text-link" href={contact}>
          Ask us on WhatsApp <StoreIcon name="arrow" width={17} />
        </a>
      </div>
      <div className="faq-list">
        {FAQS.map(([question, answer]) => (
          <details key={question}>
            <summary>
              {question}
              <span className="faq-icon" aria-hidden="true"><i /><i /></span>
            </summary>
            <div className="faq-answer">
              <p>{answer}</p>
            </div>
          </details>
        ))}
      </div>
    </section>
  );
}
