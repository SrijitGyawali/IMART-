"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { updateOrderStatus } from "../../actions";
import type { Order } from "@/lib/types";

const NEXT_ACTIONS: Record<
  Order["status"],
  { label: string; status: Order["status"]; primary?: boolean }[]
> = {
  new: [
    { label: "Confirm order", status: "confirmed", primary: true },
    { label: "Cancel", status: "cancelled" },
  ],
  confirmed: [
    { label: "Mark delivered", status: "delivered", primary: true },
    { label: "Cancel", status: "cancelled" },
  ],
  delivered: [],
  cancelled: [{ label: "Reopen as new", status: "new" }],
};

export function StatusButtons({ order }: { order: Order }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const actions = NEXT_ACTIONS[order.status];
  if (actions.length === 0) return null;

  function handleClick(status: Order["status"]) {
    setError(null);
    startTransition(async () => {
      const result = await updateOrderStatus(order.id, status);
      if (!result.ok) {
        setError(result.error ?? "Update failed");
      } else {
        router.refresh();
      }
    });
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-3">
        {actions.map((action) => (
          <button
            key={action.status}
            onClick={() => handleClick(action.status)}
            disabled={pending}
            className={`rounded-full px-5 py-2.5 text-sm font-semibold transition disabled:opacity-50 ${
              action.primary
                ? "bg-accent text-white hover:opacity-90"
                : "border border-border text-muted hover:text-text"
            }`}
          >
            {pending ? "…" : action.label}
          </button>
        ))}
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
}
