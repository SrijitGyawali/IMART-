import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { createServiceClient } from "@/lib/supabase/server";
import { formatOrderNumber, formatPrice } from "@/lib/format";
import type { Order, OrderItem } from "@/lib/types";

export const metadata: Metadata = {
  title: "Order confirmed",
  robots: { index: false },
};

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default async function OrderConfirmedPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  if (!UUID_RE.test(id)) notFound();

  const supabase = await createServiceClient();
  const { data: order } = (await supabase
    .from("orders")
    .select("*")
    .eq("id", id)
    .single()) as { data: Order | null };

  if (!order) notFound();

  const { data: items } = (await supabase
    .from("order_items")
    .select("*")
    .eq("order_id", id)) as { data: OrderItem[] | null };

  const whatsapp = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? "";
  const message = encodeURIComponent(
    `Hi iMart! I just placed order ${formatOrderNumber(order.order_number)} (${
      order.customer_name
    }). ${order.payment_method === "qr" ? "Sending my payment screenshot now." : ""}`
  );

  return (
    <main className="mx-auto flex w-full max-w-xl flex-1 flex-col items-center px-4 pt-16 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-full border-2 border-accent bg-accent/10 text-accent">
        <svg
          width="28"
          height="28"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M20 6 9 17l-5-5" />
        </svg>
      </div>

      <h1 className="mt-6 text-3xl font-semibold tracking-tight">
        Order confirmed
      </h1>
      <p className="mt-2 text-sm text-muted">
        Order {formatOrderNumber(order.order_number)} · we&apos;ll call{" "}
        {order.phone} to confirm.
      </p>

      {/* Summary */}
      <div className="mt-8 w-full rounded-2xl bg-surface p-4 text-left">
        <ul className="divide-y divide-border">
          {(items ?? []).map((item) => (
            <li
              key={item.id}
              className="flex items-center justify-between py-3 text-sm"
            >
              <span className="min-w-0 flex-1 truncate">
                {item.product_name}{" "}
                <span className="text-muted">× {item.quantity}</span>
              </span>
              <span className="font-semibold">
                {formatPrice(item.price * item.quantity)}
              </span>
            </li>
          ))}
        </ul>
        <div className="flex items-center justify-between border-t border-border pt-3 text-sm">
          <span className="text-muted">
            {order.delivery_method === "pickup"
              ? "Pickup — Amarpath, Butwal"
              : "Delivery"}{" "}
            · {order.payment_method === "qr" ? "QR payment" : "Cash"}
          </span>
          <span className="text-lg font-semibold">
            {formatPrice(order.total)}
          </span>
        </div>
      </div>

      {/* QR payment */}
      {order.payment_method === "qr" && (
        <div className="mt-6 w-full rounded-2xl bg-surface p-6">
          <p className="text-sm font-semibold">Scan to pay</p>
          <p className="mt-1 text-xs text-muted">
            Pay {formatPrice(order.total)}, then send the screenshot on
            WhatsApp.
          </p>
          <div className="relative mx-auto mt-4 aspect-square w-48 overflow-hidden rounded-xl bg-white">
            <Image
              src="/payment-qr.png"
              alt="Payment QR code"
              fill
              sizes="192px"
              className="object-contain"
            />
          </div>
        </div>
      )}

      <a
        href={`https://wa.me/977${whatsapp}?text=${message}`}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-8 w-full rounded-md bg-[#25D366] py-3 text-sm font-semibold text-black transition hover:opacity-90"
      >
        Message us on WhatsApp
      </a>
      <Link
        href="/products"
        className="mb-16 mt-3 w-full rounded-md border border-border py-3 text-sm font-semibold transition hover:bg-surface"
      >
        Continue shopping
      </Link>
    </main>
  );
}
