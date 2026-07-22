"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { saveSupplier } from "../actions";
import type { Supplier } from "@/lib/types";

export function SupplierForm({ supplier }: { supplier: Supplier | null }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const formData = new FormData(e.currentTarget);

    startTransition(async () => {
      const result = await saveSupplier(supplier?.id ?? null, formData);
      if (result.ok) {
        router.push("/admin/suppliers");
        router.refresh();
      } else {
        setError(result.error ?? "Save failed");
      }
    });
  }

  const inputClass =
    "w-full rounded-xl border border-border bg-surface px-4 py-3 text-sm outline-none transition placeholder:text-muted focus:border-accent";

  return (
    <form onSubmit={handleSubmit} className="space-y-5 pb-16">
      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor="name" className="mb-1.5 block text-sm">
            Supplier name
          </label>
          <input
            id="name"
            name="name"
            required
            defaultValue={supplier?.name}
            placeholder="Kathmandu Mobile Distributors"
            className={inputClass}
          />
        </div>
        <div>
          <label htmlFor="company" className="mb-1.5 block text-sm">
            Company
          </label>
          <input
            id="company"
            name="company"
            defaultValue={supplier?.company}
            className={inputClass}
          />
        </div>
      </div>

      <div className="grid gap-5 sm:grid-cols-3">
        <div>
          <label htmlFor="contact_person" className="mb-1.5 block text-sm">
            Contact person
          </label>
          <input
            id="contact_person"
            name="contact_person"
            defaultValue={supplier?.contact_person}
            className={inputClass}
          />
        </div>
        <div>
          <label htmlFor="phone" className="mb-1.5 block text-sm">
            Phone
          </label>
          <input
            id="phone"
            name="phone"
            defaultValue={supplier?.phone}
            className={inputClass}
          />
        </div>
        <div>
          <label htmlFor="email" className="mb-1.5 block text-sm">
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            defaultValue={supplier?.email}
            className={inputClass}
          />
        </div>
      </div>

      <div>
        <label htmlFor="address" className="mb-1.5 block text-sm">
          Address
        </label>
        <input
          id="address"
          name="address"
          defaultValue={supplier?.address}
          className={inputClass}
        />
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor="pan_vat" className="mb-1.5 block text-sm">
            PAN / VAT
          </label>
          <input
            id="pan_vat"
            name="pan_vat"
            defaultValue={supplier?.pan_vat}
            className={inputClass}
          />
        </div>
        <div>
          <label htmlFor="bank_details" className="mb-1.5 block text-sm">
            Bank details
          </label>
          <input
            id="bank_details"
            name="bank_details"
            defaultValue={supplier?.bank_details}
            placeholder="Bank name, account number"
            className={inputClass}
          />
        </div>
      </div>

      <div>
        <label htmlFor="notes" className="mb-1.5 block text-sm">
          Notes
        </label>
        <textarea
          id="notes"
          name="notes"
          rows={3}
          defaultValue={supplier?.notes}
          className={inputClass}
        />
      </div>

      {error && (
        <p className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-600">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="rounded-full bg-accent px-8 py-3 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-50"
      >
        {pending ? "Saving…" : supplier ? "Save changes" : "Create supplier"}
      </button>
    </form>
  );
}
