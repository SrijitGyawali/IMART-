import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { formatOrderNumber, formatPrice } from "@/lib/format";
import type { Order } from "@/lib/types";

export const dynamic = "force-dynamic";

const STATUSES = ["all", "new", "confirmed", "delivered", "cancelled"] as const;

const statusStyles: Record<Order["status"], string> = {
  new: "bg-accent/15 text-accent",
  confirmed: "bg-amber-500/15 text-amber-600",
  delivered: "bg-green-500/15 text-green-700",
  cancelled: "bg-red-500/15 text-red-600",
};

export default async function AdminOrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { status } = await searchParams;
  const filter = STATUSES.includes(status as (typeof STATUSES)[number])
    ? status
    : "all";

  const supabase = await createClient();
  let query = supabase
    .from("orders")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(100);

  if (filter !== "all") query = query.eq("status", filter);

  const { data } = await query;
  const orders = (data ?? []) as Order[];

  return (
    <main className="mx-auto w-full max-w-6xl flex-1 px-4 pt-8">
      <h1 className="text-2xl font-semibold tracking-tight">Orders</h1>

      <div className="mt-4 flex flex-wrap gap-2">
        {STATUSES.map((s) => (
          <Link
            key={s}
            href={s === "all" ? "/admin/orders" : `/admin/orders?status=${s}`}
            className={`rounded-full px-4 py-1.5 text-sm capitalize transition ${
              filter === s
                ? "bg-text text-bg"
                : "border border-border text-muted hover:text-text"
            }`}
          >
            {s}
          </Link>
        ))}
      </div>

      {orders.length === 0 ? (
        <p className="mt-16 text-center text-sm text-muted">
          No {filter !== "all" ? filter : ""} orders yet.
        </p>
      ) : (
        <div className="mt-6 overflow-x-auto rounded-2xl border border-border">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-border text-xs uppercase tracking-wide text-muted">
              <tr>
                <th className="px-4 py-3">Order</th>
                <th className="px-4 py-3">Customer</th>
                <th className="px-4 py-3">Phone</th>
                <th className="px-4 py-3">Method</th>
                <th className="px-4 py-3">Total</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Placed</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {orders.map((order) => (
                <tr key={order.id} className="transition hover:bg-surface">
                  <td className="px-4 py-3 font-semibold">
                    <Link
                      href={`/admin/orders/${order.id}`}
                      className="block text-accent"
                    >
                      {formatOrderNumber(order.order_number)}
                    </Link>
                  </td>
                  <td className="px-4 py-3">{order.customer_name}</td>
                  <td className="px-4 py-3 text-muted">{order.phone}</td>
                  <td className="px-4 py-3 text-muted">
                    {order.delivery_method === "pickup" ? "Pickup" : "Delivery"}{" "}
                    · {order.payment_method === "qr" ? "QR" : "Cash"}
                  </td>
                  <td className="px-4 py-3 font-semibold">
                    {formatPrice(order.total)}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ${statusStyles[order.status]}`}
                    >
                      {order.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-muted">
                    {new Date(order.created_at).toLocaleString("en-GB", {
                      day: "numeric",
                      month: "short",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
}
