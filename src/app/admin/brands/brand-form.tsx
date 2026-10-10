"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { saveBrand } from "../actions";
import type { Brand } from "@/lib/types";

function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/[\s_]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

export function BrandForm({ brand }: { brand: Brand | null }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [slugTouched, setSlugTouched] = useState(!!brand);
  const slugRef = useRef<HTMLInputElement>(null);

  function handleNameChange(e: React.ChangeEvent<HTMLInputElement>) {
    if (!slugTouched && slugRef.current) {
      slugRef.current.value = slugify(e.target.value);
    }
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const formData = new FormData(e.currentTarget);

    startTransition(async () => {
      const result = await saveBrand(brand?.id ?? null, formData);
      if (result.ok) {
        router.push("/admin/brands");
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
      <div>
        <label htmlFor="name" className="mb-1.5 block text-sm">
          Brand name
        </label>
        <input
          id="name"
          name="name"
          required
          defaultValue={brand?.name}
          onChange={handleNameChange}
          placeholder="Anker"
          className={inputClass}
        />
      </div>
      <div>
        <label htmlFor="slug" className="mb-1.5 block text-sm">
          Slug <span className="text-muted">(URL)</span>
        </label>
        <input
          id="slug"
          name="slug"
          required
          ref={slugRef}
          defaultValue={brand?.slug}
          onChange={() => setSlugTouched(true)}
          pattern="[a-z0-9-]+"
          placeholder="anker"
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
        {pending ? "Saving…" : brand ? "Save changes" : "Create brand"}
      </button>
    </form>
  );
}
