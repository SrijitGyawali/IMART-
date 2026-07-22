import { NewsletterForm } from "@/components/newsletter-form";

const whatsapp = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? "";

export function Footer() {
  return (
    <footer className="mt-24 border-t border-border">
      <div className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-4 border-b border-border px-4 py-8 sm:flex-row sm:items-center">
        <div>
          <p className="font-semibold text-text">Deals in your inbox</p>
          <p className="mt-1 text-sm text-muted">
            New arrivals and festival offers — no spam, ever.
          </p>
        </div>
        <NewsletterForm />
      </div>
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-12 text-sm text-muted sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <p className="mb-2 font-semibold text-text">iMart</p>
          <p className="leading-relaxed">
            Brand-new smartphones, genuine accessories, expert repairs, and
            easy EMI — Butwal&apos;s trusted phone store.
          </p>
        </div>

        <div>
          <p className="mb-2 font-semibold text-text">Visit us</p>
          <p>Amarpath, Butwal</p>
          <p>Rupandehi, Nepal</p>
          <p className="mt-2">
            <a
              href="https://maps.google.com/?q=Amarpath,Butwal"
              target="_blank"
              rel="noopener noreferrer"
              className="text-accent transition hover:opacity-80"
            >
              Open in Google Maps →
            </a>
          </p>
        </div>

        <div>
          <p className="mb-2 font-semibold text-text">Opening hours</p>
          <p>Sun – Fri: 9:00 AM – 8:00 PM</p>
          <p>Saturday: 10:00 AM – 6:00 PM</p>
        </div>

        <div>
          <p className="mb-2 font-semibold text-text">Contact</p>
          <p>
            <a
              href={`https://wa.me/977${whatsapp}`}
              target="_blank"
              rel="noopener noreferrer"
              className="transition hover:text-text"
            >
              WhatsApp: {whatsapp}
            </a>
          </p>
          <p>
            <a
              href={`tel:+977${whatsapp}`}
              className="transition hover:text-text"
            >
              Call: {whatsapp}
            </a>
          </p>
          <div className="mt-3 flex gap-4">
            <a
              href="https://www.facebook.com"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Facebook"
              className="transition hover:text-text"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                <path d="M24 12.07C24 5.4 18.63 0 12 0S0 5.4 0 12.07C0 18.1 4.39 23.09 10.13 24v-8.44H7.08v-3.49h3.05V9.41c0-3.02 1.79-4.7 4.53-4.7 1.31 0 2.68.24 2.68.24v2.97h-1.51c-1.49 0-1.95.93-1.95 1.89v2.26h3.32l-.53 3.49h-2.79V24C19.61 23.09 24 18.1 24 12.07z" />
              </svg>
            </a>
            <a
              href="https://www.instagram.com"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Instagram"
              className="transition hover:text-text"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <rect x="2" y="2" width="20" height="20" rx="5" />
                <circle cx="12" cy="12" r="4" />
                <circle cx="17.5" cy="6.5" r="0.5" fill="currentColor" />
              </svg>
            </a>
            <a
              href="https://www.tiktok.com"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="TikTok"
              className="transition hover:text-text"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64c.3 0 .58.05.85.13V9.4a6.33 6.33 0 0 0-5.94 10.7A6.33 6.33 0 0 0 15.86 15.7v-6.9a8.16 8.16 0 0 0 4.77 1.52v-3.45a4.85 4.85 0 0 1-1.04-.18z" />
              </svg>
            </a>
          </div>
        </div>
      </div>
      <div className="border-t border-border py-4 text-center text-xs text-muted">
        © {new Date().getFullYear()} iMart, Amarpath, Butwal
      </div>
    </footer>
  );
}
