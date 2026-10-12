const nprFormatter = new Intl.NumberFormat("en-IN");

export function formatPrice(amount: number): string {
  return `Rs. ${nprFormatter.format(Math.round(amount))}`;
}

export function formatOrderNumber(orderNumber: number): string {
  return `IM-${orderNumber}`;
}

export function formatInvoiceNumber(invoiceNumber: number): string {
  return `INV-${invoiceNumber}`;
}

/** "black,white , mist blue" → "Black, White, Mist blue" (as typed in the admin, tidied for display). */
export function formatColors(color: string | null | undefined): string {
  return (color ?? "")
    .split(",")
    .map((c) => c.trim())
    .filter(Boolean)
    .map((c) => c[0].toUpperCase() + c.slice(1))
    .join(", ");
}

/** "256", "256gb" or "1 TB" → "256 GB" / "1 TB"; anything else is shown as typed. */
export function formatStorage(storage: string | null | undefined): string {
  const value = (storage ?? "").trim();
  const match = /^(\d+)\s*(gb|tb)?$/i.exec(value);
  return match ? `${match[1]} ${(match[2] ?? "GB").toUpperCase()}` : value;
}

/** One line for a product card: "Black, White · 256 GB". */
export function formatVariant(color: string | null | undefined, storage: string | null | undefined): string {
  return [formatColors(color), formatStorage(storage)].filter(Boolean).join(" · ");
}
