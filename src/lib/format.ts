const nprFormatter = new Intl.NumberFormat("en-IN");

export function formatPrice(amount: number): string {
  return `Rs. ${nprFormatter.format(Math.round(amount))}`;
}

export function formatPhone(phone: string): string {
  return phone;
}

export function phoneToTel(phone: string): string {
  return `tel:+977${phone}`;
}

export function formatOrderNumber(orderNumber: number): string {
  return `IM-${orderNumber}`;
}

export function formatInvoiceNumber(invoiceNumber: number): string {
  return `INV-${invoiceNumber}`;
}

export function formatRepairNumber(repairNumber: number): string {
  return `RPR-${repairNumber}`;
}
