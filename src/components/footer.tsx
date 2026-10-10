import Link from "next/link";
import { NewsletterForm } from "@/components/newsletter-form";
import { StoreIcon } from "./store-icon";

export function Footer() {
  const whatsapp = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? "";
  return (
    <footer className="store-footer">
      <div className="store-container">
        <div className="newsletter-row"><div><h2>Good things. Straight to your inbox.</h2><p>Be the first to hear about new arrivals and store offers.</p></div><NewsletterForm /></div>
        <div className="footer-columns">
          <div className="footer-about"><Link href="/" className="store-logo" aria-label="iMart home">i<span>Mart</span><i /></Link><p>Your local destination for phones, accessories and friendly advice.</p><span>Amarpath, Butwal<br />Rupandehi, Nepal</span></div>
          <div><h3>Explore the store</h3><Link href="/products?category=iphone">iPhone</Link><Link href="/products?q=MacBook">MacBook</Link><Link href="/products?category=chargers">Chargers & cables</Link><Link href="/products?category=accessories">Accessories</Link><Link href="/products">All products</Link></div>
          <div><h3>How can we help?</h3><Link href="/#help">Delivery & payments</Link><Link href="/#services">Repairs & support</Link><Link href="/#services">Phone exchange</Link><Link href="/#visit">Visit our store</Link><Link href="/cart">Your shopping bag</Link></div>
          <div className="footer-contact"><h3>Let&apos;s talk tech</h3>{whatsapp && <><a href={"tel:+977" + whatsapp} className="footer-phone">+977 {whatsapp}</a><a href={"https://wa.me/977" + whatsapp} target="_blank" rel="noopener noreferrer">Chat on WhatsApp <StoreIcon name="arrow" width={15} /></a></>}<p>Sunday to Friday: 9am to 8pm<br />Saturday: 10am to 6pm</p><a href="https://maps.google.com/?q=Amarpath,Butwal" target="_blank" rel="noopener noreferrer">Get directions <StoreIcon name="arrow" width={15} /></a></div>
        </div>
        <div className="footer-bottom"><p>© {new Date().getFullYear()} iMart. All rights reserved.</p><span>Made for your everyday.</span><div><StoreIcon name="payment" width={18} /> Cash <span>·</span> QR payment <span>·</span> Store pickup</div></div>
      </div>
    </footer>
  );
}
