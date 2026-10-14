"use client";

import Image from "next/image";
import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { saveProduct, deleteProduct } from "../actions";
import type { Brand, Category, Product, Supplier } from "@/lib/types";

function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/[\s_]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

export function ProductForm({
  product,
  categories,
  brands,
  suppliers,
  allProducts,
}: {
  product: Product | null;
  categories: Category[];
  brands: Brand[];
  suppliers: Supplier[];
  allProducts: Pick<Product, "id" | "name" | "color" | "storage">[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [keptImages, setKeptImages] = useState<string[]>(
    product?.images ?? []
  );
  const [slugTouched, setSlugTouched] = useState(!!product);
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
    formData.set("kept_images", JSON.stringify(keptImages));

    startTransition(async () => {
      const result = await saveProduct(product?.id ?? null, formData);
      if (result.ok) {
        router.push("/admin/products");
        router.refresh();
      } else {
        setError(result.error ?? "Save failed");
      }
    });
  }

  function handleDelete() {
    if (!product) return;
    if (!confirm(`Delete "${product.name}"? This cannot be undone.`)) return;

    startTransition(async () => {
      const result = await deleteProduct(product.id);
      if (result.ok) {
        router.push("/admin/products");
        router.refresh();
      } else {
        setError(result.error ?? "Delete failed");
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
            Name
          </label>
          <input
            id="name"
            name="name"
            required
            defaultValue={product?.name}
            onChange={handleNameChange}
            placeholder="iPhone 15 Pro Max 256GB"
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
            defaultValue={product?.slug}
            onChange={() => setSlugTouched(true)}
            pattern="[a-z0-9-]+"
            placeholder="iphone-15-pro-max-256gb"
            className={inputClass}
          />
        </div>
      </div>

      <div className="grid gap-5 sm:grid-cols-3">
        <div>
          <label htmlFor="price" className="mb-1.5 block text-sm">
            Price (Rs.)
          </label>
          <input
            id="price"
            name="price"
            required
            type="number"
            min="0"
            step="1"
            defaultValue={product?.price}
            placeholder="185000"
            className={inputClass}
          />
        </div>
        <div>
          <label htmlFor="stock" className="mb-1.5 block text-sm">
            Stock
          </label>
          <input
            id="stock"
            name="stock"
            required
            type="number"
            min="0"
            step="1"
            defaultValue={product?.stock ?? 1}
            className={inputClass}
          />
        </div>
        <div>
          <label htmlFor="category_id" className="mb-1.5 block text-sm">
            Category
          </label>
          <select
            id="category_id"
            name="category_id"
            defaultValue={product?.category_id ?? ""}
            className={inputClass}
          >
            <option value="">— None —</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid gap-5 sm:grid-cols-3">
        <div>
          <label htmlFor="brand_id" className="mb-1.5 block text-sm">
            Brand
          </label>
          <select
            id="brand_id"
            name="brand_id"
            defaultValue={product?.brand_id ?? ""}
            className={inputClass}
          >
            <option value="">— None —</option>
            {brands.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="model" className="mb-1.5 block text-sm">
            Model
          </label>
          <input
            id="model"
            name="model"
            defaultValue={product?.model}
            placeholder="15 Pro Max"
            className={inputClass}
          />
        </div>
        <div>
          <label htmlFor="color" className="mb-1.5 block text-sm">
            Color
          </label>
          <input
            id="color"
            name="color"
            defaultValue={product?.color}
            placeholder="Natural Titanium"
            className={inputClass}
          />
        </div>
        <div>
          <label htmlFor="storage" className="mb-1.5 block text-sm">
            Storage
          </label>
          <input
            id="storage"
            name="storage"
            defaultValue={product?.storage}
            placeholder="256GB"
            className={inputClass}
          />
        </div>
        <div>
          <label htmlFor="ram" className="mb-1.5 block text-sm">
            RAM
          </label>
          <input
            id="ram"
            name="ram"
            defaultValue={product?.ram}
            placeholder="8GB"
            className={inputClass}
          />
        </div>
        <div>
          <label htmlFor="warranty_months" className="mb-1.5 block text-sm">
            Warranty (months)
          </label>
          <input
            id="warranty_months"
            name="warranty_months"
            type="number"
            min="0"
            step="1"
            defaultValue={product?.warranty_months ?? 0}
            className={inputClass}
          />
        </div>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor="sku" className="mb-1.5 block text-sm">
            SKU
          </label>
          <input
            id="sku"
            name="sku"
            defaultValue={product?.sku ?? ""}
            placeholder="IPH15PM-256-TIT"
            className={inputClass}
          />
        </div>
        <div>
          <label htmlFor="barcode" className="mb-1.5 block text-sm">
            Barcode
          </label>
          <input
            id="barcode"
            name="barcode"
            defaultValue={product?.barcode ?? ""}
            placeholder="8901234567890"
            className={inputClass}
          />
        </div>
      </div>

      <div className="grid gap-5 sm:grid-cols-3">
        <div>
          <label htmlFor="purchase_price" className="mb-1.5 block text-sm">
            Purchase price (Rs.)
          </label>
          <input
            id="purchase_price"
            name="purchase_price"
            type="number"
            min="0"
            step="1"
            defaultValue={product?.purchase_price ?? 0}
            className={inputClass}
          />
          <p className="mt-1 text-xs text-muted">Used for profit reports</p>
        </div>
        <div>
          <label htmlFor="min_stock" className="mb-1.5 block text-sm">
            Low stock threshold
          </label>
          <input
            id="min_stock"
            name="min_stock"
            type="number"
            min="0"
            step="1"
            defaultValue={product?.min_stock ?? 2}
            className={inputClass}
          />
        </div>
        <div>
          <label htmlFor="supplier_id" className="mb-1.5 block text-sm">
            Supplier
          </label>
          <select
            id="supplier_id"
            name="supplier_id"
            defaultValue={product?.supplier_id ?? ""}
            className={inputClass}
          >
            <option value="">— None —</option>
            {suppliers.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          name="imei_tracked"
          defaultChecked={product?.imei_tracked ?? false}
          className="h-4 w-4 accent-[#0071E3]"
        />
        Track by IMEI (each unit sold individually — e.g. phones)
      </label>

      <div>
        <label htmlFor="variant_of" className="mb-1.5 block text-sm">
          Link as a colour/storage variant of
        </label>
        <select id="variant_of" name="variant_of" defaultValue="" className={inputClass}>
          <option value="">— Not a variant —</option>
          {allProducts
            .filter((p) => p.id !== product?.id)
            .map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
                {p.color || p.storage
                  ? ` (${[p.color, p.storage].filter(Boolean).join(", ")})`
                  : ""}
              </option>
            ))}
        </select>
        <p className="mt-1 text-xs text-muted">
          Pick the product this is the same item in a different colour or
          storage of. The store will show a colour/size switcher on the
          product page.
          {product?.product_group_id && (
            <span className="block">
              This product is already linked to a variant group — only set
              this if you want to link it somewhere else.
            </span>
          )}
        </p>
      </div>

      <div>
        <label htmlFor="description" className="mb-1.5 block text-sm">
          Description
        </label>
        <textarea
          id="description"
          name="description"
          rows={5}
          defaultValue={product?.description}
          placeholder="Condition, warranty, what's included…"
          className={inputClass}
        />
      </div>

      {keptImages.length > 0 && (
        <div>
          <p className="mb-1.5 text-sm">Current images</p>
          <div className="flex flex-wrap gap-3">
            {keptImages.map((img) => (
              <div
                key={img}
                className="relative h-24 w-24 overflow-hidden rounded-xl bg-surface"
              >
                <Image
                  src={img}
                  alt=""
                  fill
                  sizes="96px"
                  className="object-cover"
                />
                <button
                  type="button"
                  onClick={() =>
                    setKeptImages((prev) => prev.filter((i) => i !== img))
                  }
                  className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-bg/80 text-xs backdrop-blur transition hover:bg-red-500"
                  aria-label="Remove image"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      <div>
        <label htmlFor="new_images" className="mb-1.5 block text-sm">
          {keptImages.length > 0 ? "Add more images" : "Images"}
        </label>
        <input
          id="new_images"
          name="new_images"
          type="file"
          accept="image/*"
          multiple
          className="w-full rounded-xl border border-dashed border-border bg-surface px-4 py-6 text-sm text-muted file:mr-4 file:rounded-full file:border-0 file:bg-accent file:px-4 file:py-1.5 file:text-sm file:font-semibold file:text-white"
        />
        <p className="mt-1 text-xs text-muted">
          JPG/PNG, up to 5 MB each. First image is the cover.
        </p>
      </div>

      <div className="flex gap-6">
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            name="featured"
            defaultChecked={product?.featured ?? false}
            className="h-4 w-4 accent-[#0071E3]"
          />
          Featured on homepage
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            name="active"
            defaultChecked={product?.active ?? true}
            className="h-4 w-4 accent-[#0071E3]"
          />
          Visible in store
        </label>
      </div>

      {error && (
        <p className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-600">
          {error}
        </p>
      )}

      <div className="flex items-center gap-4">
        <button
          type="submit"
          disabled={pending}
          className="rounded-full bg-accent px-8 py-3 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-50"
        >
          {pending ? "Saving…" : product ? "Save changes" : "Create product"}
        </button>
        {product && (
          <button
            type="button"
            onClick={handleDelete}
            disabled={pending}
            className="text-sm text-red-600 underline-offset-2 transition hover:underline disabled:opacity-50"
          >
            Delete product
          </button>
        )}
      </div>
    </form>
  );
}
