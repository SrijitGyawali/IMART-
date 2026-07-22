"use client";

import Link from "next/link";
import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { deleteSupplier } from "../actions";
import type { Supplier } from "@/lib/types";

export function SupplierRow({ supplier }: { supplier: Supplier }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function handleDelete() {
    if (!confirm(`Delete "${supplier.name}"? This cannot be undone.`)) return;
    startTransition(async () => {
      await deleteSupplier(supplier.id);
      router.refresh();
    });
  }

  return (
    <tr className="transition hover:bg-surface">
      <td className="px-4 py-3">
        <p className="font-semibold">{supplier.name}</p>
        {supplier.company && (
          <p className="text-xs text-muted">{supplier.company}</p>
        )}
      </td>
      <td className="px-4 py-3 text-muted">{supplier.contact_person || "—"}</td>
      <td className="px-4 py-3 text-muted">{supplier.phone || "—"}</td>
      <td className="px-4 py-3 text-muted">{supplier.email || "—"}</td>
      <td className="px-4 py-3 text-right">
        <div className="flex justify-end gap-3">
          <Link
            href={`/admin/suppliers/${supplier.id}/edit`}
            className="text-sm text-accent"
          >
            Edit
          </Link>
          <button
            onClick={handleDelete}
            disabled={pending}
            className="text-sm text-red-600 disabled:opacity-50"
          >
            Delete
          </button>
        </div>
      </td>
    </tr>
  );
}
