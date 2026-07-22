"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { adjustProductStock } from "../actions";

export function StockAdjust({
  productId,
  stock,
}: {
  productId: string;
  stock: number;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function apply(delta: number) {
    setError(null);
    startTransition(async () => {
      const result = await adjustProductStock(
        productId,
        delta,
        delta > 0 ? "Manual restock" : "Manual correction"
      );
      if (result.ok) {
        router.refresh();
      } else {
        setError(result.error ?? "Adjustment failed");
      }
    });
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="text-xs text-muted underline-offset-2 hover:text-text hover:underline"
      >
        Adjust
      </button>
    );
  }

  return (
    <div className="flex items-center gap-1.5">
      <button
        onClick={() => apply(-1)}
        disabled={pending || stock === 0}
        className="flex h-6 w-6 items-center justify-center rounded-full border border-border text-muted transition hover:text-text disabled:opacity-40"
        aria-label="Decrease stock"
      >
        −
      </button>
      <button
        onClick={() => apply(1)}
        disabled={pending}
        className="flex h-6 w-6 items-center justify-center rounded-full border border-border text-muted transition hover:text-text disabled:opacity-40"
        aria-label="Increase stock"
      >
        +
      </button>
      <button
        onClick={() => setOpen(false)}
        className="text-xs text-muted hover:text-text"
      >
        Done
      </button>
      {error && <span className="text-xs text-red-600">{error}</span>}
    </div>
  );
}
