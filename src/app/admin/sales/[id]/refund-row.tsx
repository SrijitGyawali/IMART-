"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { formatPrice } from "@/lib/format";
import type { SaleItem } from "@/lib/types";
import { createReturn } from "../actions";

export function RefundRow({ item }: { item: SaleItem }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (item.returned) {
    return <span className="text-xs text-muted">Returned</span>;
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="text-xs text-red-600 underline-offset-2 hover:underline"
      >
        Return
      </button>
    );
  }

  function handleSubmit(formData: FormData) {
    setError(null);
    formData.set("sale_item_id", item.id);
    startTransition(async () => {
      const result = await createReturn(formData);
      if (result.ok) {
        setOpen(false);
        router.refresh();
      } else {
        setError(result.error ?? "Return failed");
      }
    });
  }

  return (
    <form action={handleSubmit} className="space-y-2 rounded-lg bg-surface p-3 text-left">
      <div className="flex items-center gap-2">
        <label className="text-xs text-muted">Qty</label>
        <input
          type="number"
          name="quantity"
          min={1}
          max={item.quantity}
          defaultValue={item.quantity}
          className="w-16 rounded-lg border border-border bg-bg px-2 py-1 text-xs"
        />
        <label className="text-xs text-muted">Refund</label>
        <input
          type="number"
          name="refund_amount"
          min={0}
          defaultValue={item.line_total}
          className="w-24 rounded-lg border border-border bg-bg px-2 py-1 text-xs"
        />
      </div>
      <input
        name="reason"
        placeholder="Reason (optional)"
        className="w-full rounded-lg border border-border bg-bg px-2 py-1 text-xs"
      />
      <label className="flex items-center gap-1.5 text-xs text-muted">
        <input type="checkbox" name="restock" defaultChecked className="h-3.5 w-3.5" />
        Restock this item
      </label>
      {error && <p className="text-xs text-red-600">{error}</p>}
      <div className="flex gap-2">
        <button
          type="submit"
          disabled={pending}
          className="rounded-lg bg-red-600 px-3 py-1 text-xs font-semibold text-white disabled:opacity-50"
        >
          {pending ? "…" : "Confirm return"}
        </button>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="text-xs text-muted"
        >
          Cancel
        </button>
      </div>
      <p className="text-[10px] text-muted">
        Line total was {formatPrice(item.line_total)}
      </p>
    </form>
  );
}
