import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getSaleWithItems } from "@/lib/queries";
import { formatInvoiceNumber, formatPrice } from "@/lib/format";
import { PAYMENT_METHOD_LABELS } from "@/lib/constants";
import type { Customer } from "@/lib/types";
import { PrintButton } from "./print-button";
import { RefundRow } from "./refund-row";

export const dynamic = "force-dynamic";

export default async function SaleDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const result = await getSaleWithItems(id);
  if (!result) notFound();
  const { sale, items } = result;

  let customer: Customer | null = null;
  if (sale.customer_id) {
    const supabase = await createClient();
    const { data } = await supabase
      .from("customers")
      .select("*")
      .eq("id", sale.customer_id)
      .single();
    customer = data;
  }

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-4 pt-8">
      <div className="flex items-center justify-between print:hidden">
        <Link href="/admin/sales" className="text-sm text-muted">
          ← Sales
        </Link>
        <PrintButton />
      </div>

      <div className="mt-6 rounded-2xl border border-border p-6 sm:p-8 print:border-none print:p-0">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-lg font-semibold">iMart</p>
            <p className="text-xs text-muted">Amarpath, Butwal</p>
          </div>
          <div className="text-right">
            <p className="text-lg font-semibold">
              {formatInvoiceNumber(sale.invoice_number)}
            </p>
            <p className="text-xs text-muted">
              {new Date(sale.created_at).toLocaleString("en-GB", {
                day: "numeric",
                month: "short",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </p>
          </div>
        </div>

        <div className="mt-6 flex items-center justify-between border-t border-border pt-4 text-sm">
          <div>
            <p className="text-muted">Billed to</p>
            <p className="font-semibold">{customer?.name ?? "Walk-in customer"}</p>
            {customer?.phone && <p className="text-muted">{customer.phone}</p>}
          </div>
          <div className="text-right">
            <p className="text-muted">Payment</p>
            <p className="font-semibold">
              {PAYMENT_METHOD_LABELS[sale.payment_method] ?? sale.payment_method}
            </p>
          </div>
        </div>

        <table className="mt-6 w-full text-left text-sm">
          <thead className="border-b border-border text-xs uppercase tracking-wide text-muted">
            <tr>
              <th className="py-2">Item</th>
              <th className="py-2">Qty</th>
              <th className="py-2">Price</th>
              <th className="py-2">Total</th>
              <th className="py-2 print:hidden"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {items.map((item) => (
              <tr key={item.id}>
                <td className="py-2.5">
                  {item.product_name}
                  {item.imei && (
                    <span className="block text-xs text-muted">IMEI: {item.imei}</span>
                  )}
                </td>
                <td className="py-2.5">{item.quantity}</td>
                <td className="py-2.5">{formatPrice(item.unit_price)}</td>
                <td className="py-2.5 font-semibold">{formatPrice(item.line_total)}</td>
                <td className="py-2.5 print:hidden">
                  <RefundRow item={item} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="mt-4 space-y-1 border-t border-border pt-4 text-sm">
          <div className="flex justify-between">
            <span className="text-muted">Subtotal</span>
            <span>{formatPrice(sale.subtotal)}</span>
          </div>
          {sale.discount_value > 0 && (
            <div className="flex justify-between text-muted">
              <span>
                Discount ({sale.discount_type === "percentage" ? `${sale.discount_value}%` : formatPrice(sale.discount_value)})
              </span>
              <span>
                −{formatPrice(
                  sale.discount_type === "percentage"
                    ? sale.subtotal * (sale.discount_value / 100)
                    : sale.discount_value
                )}
              </span>
            </div>
          )}
          {sale.tax_amount > 0 && (
            <div className="flex justify-between text-muted">
              <span>Tax ({sale.tax_rate}%)</span>
              <span>{formatPrice(sale.tax_amount)}</span>
            </div>
          )}
          <div className="flex justify-between text-base font-semibold">
            <span>Total</span>
            <span>{formatPrice(sale.total)}</span>
          </div>
          <div className="flex justify-between text-muted">
            <span>Amount paid</span>
            <span>{formatPrice(sale.amount_paid)}</span>
          </div>
          {sale.change_due > 0 && (
            <div className="flex justify-between text-muted">
              <span>Change due</span>
              <span>{formatPrice(sale.change_due)}</span>
            </div>
          )}
        </div>

        {sale.notes && (
          <p className="mt-4 border-t border-border pt-4 text-xs text-muted">
            {sale.notes}
          </p>
        )}

        <p className="mt-6 text-center text-xs text-muted">
          Thank you for shopping at iMart — Amarpath, Butwal
        </p>
      </div>
    </main>
  );
}
