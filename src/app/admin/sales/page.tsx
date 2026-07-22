import Link from "next/link";
import { getSales, getSalesSummary } from "@/lib/queries";
import { formatInvoiceNumber, formatPrice } from "@/lib/format";
import { PAYMENT_METHOD_LABELS } from "@/lib/constants";
import type { Sale } from "@/lib/types";

export const dynamic = "force-dynamic";

const STATUSES = ["all", "completed", "refunded", "partially_refunded", "cancelled"] as const;

const statusStyles: Record<Sale["status"], string> = {
  completed: "bg-green-500/15 text-green-700",
  refunded: "bg-red-500/15 text-red-600",
  partially_refunded: "bg-amber-500/15 text-amber-600",
  cancelled: "bg-red-500/15 text-red-600",
};

export default async function AdminSalesPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { status } = await searchParams;
  const filter = STATUSES.includes(status as (typeof STATUSES)[number]) ? status : "all";

  const [sales, summary] = await Promise.all([
    getSales(filter && filter !== "all" ? { status: filter } : {}),
    getSalesSummary(),
  ]);

  return (
    <main className="mx-auto w-full max-w-6xl flex-1 px-4 pt-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">Sales</h1>
        <Link
          href="/admin/sales/new"
          className="btn-primary rounded-full px-5 py-2 text-sm font-semibold text-white"
        >
          + New sale
        </Link>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-2xl border border-border p-4">
          <p className="text-xs text-muted">Today&apos;s sales</p>
          <p className="mt-1 text-xl font-semibold">{formatPrice(summary.todayTotal)}</p>
          <p className="text-xs text-muted">{summary.todayCount} sale(s)</p>
        </div>
        <div className="rounded-2xl border border-border p-4">
          <p className="text-xs text-muted">This month</p>
          <p className="mt-1 text-xl font-semibold">{formatPrice(summary.monthTotal)}</p>
          <p className="text-xs text-muted">{summary.monthCount} sale(s)</p>
        </div>
        <div className="rounded-2xl border border-border p-4 sm:col-span-2">
          <p className="text-xs text-muted">This month&apos;s profit</p>
          <p className="mt-1 text-xl font-semibold text-accent">
            {formatPrice(summary.monthProfit)}
          </p>
          <p className="text-xs text-muted">Revenue minus product cost</p>
        </div>
      </div>

      <div className="mt-6 flex flex-wrap gap-2">
        {STATUSES.map((s) => (
          <Link
            key={s}
            href={s === "all" ? "/admin/sales" : `/admin/sales?status=${s}`}
            className={`rounded-full px-4 py-1.5 text-sm capitalize transition ${
              filter === s
                ? "bg-text text-bg"
                : "border border-border text-muted hover:text-text"
            }`}
          >
            {s.replace("_", " ")}
          </Link>
        ))}
      </div>

      {sales.length === 0 ? (
        <p className="mt-16 text-center text-sm text-muted">
          No sales yet. Ring up your first one.
        </p>
      ) : (
        <div className="mt-6 overflow-x-auto rounded-2xl border border-border">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-border text-xs uppercase tracking-wide text-muted">
              <tr>
                <th className="px-4 py-3">Invoice</th>
                <th className="px-4 py-3">Payment</th>
                <th className="px-4 py-3">Total</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {sales.map((sale) => (
                <tr key={sale.id} className="transition hover:bg-surface">
                  <td className="px-4 py-3 font-semibold">
                    <Link href={`/admin/sales/${sale.id}`} className="text-accent">
                      {formatInvoiceNumber(sale.invoice_number)}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-muted">
                    {PAYMENT_METHOD_LABELS[sale.payment_method] ?? sale.payment_method}
                  </td>
                  <td className="px-4 py-3 font-semibold">{formatPrice(sale.total)}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ${statusStyles[sale.status]}`}
                    >
                      {sale.status.replace("_", " ")}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-muted">
                    {new Date(sale.created_at).toLocaleString("en-GB", {
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
