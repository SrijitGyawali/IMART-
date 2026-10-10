import { StoreIcon } from "@/components/store-icon";

const MARQUEE = "Amarpath · Butwal · Rupandehi · ";

export function VisitIMart({ whatsapp }: { whatsapp: string }) {
  return (
    <section id="visit" className="visit" aria-labelledby="visit-heading">
      <div className="visit-marquee" aria-hidden="true">
        <div className="visit-marquee-track">
          <span>{MARQUEE.repeat(3)}</span>
          <span>{MARQUEE.repeat(3)}</span>
        </div>
      </div>
      <div className="landing-container visit-body">
        <svg className="visit-pin" viewBox="0 0 120 120" aria-hidden="true">
          <circle cx="20" cy="96" r="4" />
          <path d="M20 96 C 40 96, 44 70, 60 70 S 80 52, 84 40" fill="none" />
          <path d="M84 12 a14 14 0 0 1 14 14 c0 10 -14 24 -14 24 s-14 -14 -14 -24 a14 14 0 0 1 14 -14 z" />
          <circle cx="84" cy="26" r="4.5" className="visit-pin-dot" />
        </svg>
        <div>
          <p className="landing-label landing-label-brand">Visit iMart</p>
          <h2 id="visit-heading">Online convenience. Local connection.</h2>
          <p>Amarpath, Butwal, Rupandehi · Sunday to Friday 9am–8pm · Saturday 10am–6pm</p>
        </div>
        <div className="visit-actions">
          <a className="landing-cta" href="https://maps.google.com/?q=Amarpath,Butwal" target="_blank" rel="noopener noreferrer">
            Find our store <span aria-hidden="true">↗</span>
          </a>
          {whatsapp && (
            <a className="store-text-link" href={`https://wa.me/977${whatsapp}`} target="_blank" rel="noopener noreferrer">
              Chat on WhatsApp <StoreIcon name="arrow" width={16} />
            </a>
          )}
        </div>
      </div>
    </section>
  );
}
