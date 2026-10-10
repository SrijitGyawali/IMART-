"use client";

import Link from "next/link";
import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { deleteBrand } from "../actions";
import type { Brand } from "@/lib/types";

export function BrandRow({ brand }: { brand: Brand }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function handleDelete() {
    if (!confirm(`Delete "${brand.name}"? This cannot be undone.`)) return;
    startTransition(async () => {
      await deleteBrand(brand.id);
      router.refresh();
    });
  }

  return (
    <tr className="transition hover:bg-surface">
      <td className="px-4 py-3 font-semibold">{brand.name}</td>
      <td className="px-4 py-3 text-muted">/{brand.slug}</td>
      <td className="px-4 py-3 text-right">
        <div className="flex justify-end gap-3">
          <Link
            href={`/admin/brands/${brand.id}/edit`}
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
