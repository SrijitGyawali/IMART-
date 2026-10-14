import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { formatOrderNumber, formatPrice } from "@/lib/format";
import type { Order, OrderItem } from "@/lib/types";
import { StatusButtons } from "./status-buttons";

export const dynamic = "force-dynamic";

export default async function AdminOrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

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

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-4 pt-8">
      <Link href="/admin/orders" className="text-sm text-muted">
        ← Orders
      </Link>

      <div className="mt-4 flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">
          {formatOrderNumber(order.order_number)}
        </h1>
        <span className="rounded-full bg-surface px-3 py-1 text-sm capitalize">
          {order.status}
        </span>
      </div>
      <p className="mt-1 text-sm text-muted">
        {new Date(order.created_at).toLocaleString("en-GB", {
          weekday: "short",
          day: "numeric",
          month: "short",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        })}
      </p>

      <div className="mt-6 rounded-2xl bg-surface p-5">
        <p className="text-sm font-semibold">{order.customer_name}</p>
        <p className="mt-1 text-sm text-muted">
          {order.delivery_method === "pickup"
            ? "Store pickup — Amarpath"
            : `Deliver to: ${order.address}`}
        </p>
        <p className="mt-1 text-sm text-muted">
          Payment: {order.payment_method === "qr" ? "QR / eSewa" : "Cash"}
        </p>
        <div className="mt-4 flex gap-3">
          <a
            href={`tel:+977${order.phone}`}
            className="rounded-full border border-border px-4 py-2 text-sm font-semibold transition hover:bg-bg"
          >
            Call {order.phone}
          </a>
          <a
            href={`https://wa.me/977${order.phone}`}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-full border border-border px-4 py-2 text-sm font-semibold transition hover:bg-bg"
          >
            WhatsApp
          </a>
        </div>
      </div>

      <div className="mt-4 rounded-2xl bg-surface p-5">
        <ul className="divide-y divide-border">
          {(items ?? []).map((item) => (
            <li
              key={item.id}
              className="flex items-center justify-between py-3 text-sm"
            >
              <span>
                {item.product_name}{" "}
                <span className="text-muted">× {item.quantity}</span>
              </span>
              <span className="font-semibold">
                {formatPrice(item.price * item.quantity)}
              </span>
            </li>
          ))}
        </ul>
        <div className="flex items-center justify-between border-t border-border pt-3">
          <span className="text-sm text-muted">Total</span>
          <span className="text-lg font-semibold">
            {formatPrice(order.total)}
          </span>
        </div>
      </div>

      <div className="mb-16 mt-6">
        <StatusButtons order={order} />
      </div>
    </main>
  );
}
