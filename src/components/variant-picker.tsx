"use client";

import Link from "next/link";

interface VariantOption {
  slug: string;
  color: string;
  storage: string;
}

const COLOR_SWATCHES: Record<string, string> = {
  black: "#1d1d1f",
  white: "#f5f5f7",
  silver: "#e3e3e3",
  gold: "#d4af37",
  blue: "#2997ff",
  "natural titanium": "#8a7f76",
  "deep blue": "#274690",
  graphite: "#3a3a3c",
  red: "#e0342b",
  green: "#3c6b4a",
  purple: "#8e6bab",
  orange: "#e6712e",
  pink: "#f2b8c6",
  gray: "#8e8e93",
  grey: "#8e8e93",
  yellow: "#f4d35e",
};

function swatchColor(name: string): string {
  return COLOR_SWATCHES[name.trim().toLowerCase()] ?? "#c7c7cc";
}

export function VariantPicker({
  options,
  currentColor,
  currentStorage,
}: {
  options: VariantOption[];
  currentColor: string;
  currentStorage: string;
}) {
  const colors = Array.from(new Set(options.map((o) => o.color).filter(Boolean)));
  const storages = Array.from(new Set(options.map((o) => o.storage).filter(Boolean)));

  // Prefer an exact colour+storage match; fall back to whichever variant
  // has that colour (or that storage) at all.
  function findSlug(color: string, storage: string): string | undefined {
    return (
      options.find((o) => o.color === color && o.storage === storage)?.slug ??
      options.find((o) => o.color === color)?.slug ??
      options.find((o) => o.storage === storage)?.slug
    );
  }

  return (
    <div className="space-y-5">
      {colors.length > 1 && (
        <div>
          <p className="mb-2 text-sm font-semibold">
            Colour <span className="font-normal text-muted">— {currentColor}</span>
          </p>
          <div className="flex flex-wrap gap-2">
            {colors.map((color) => {
              const slug = findSlug(color, currentStorage);
              const active = color === currentColor;
              return (
                <Link
                  key={color}
                  href={slug ? `/products/${slug}` : "#"}
                  aria-label={color}
                  title={color}
                  className={`flex h-9 w-9 items-center justify-center rounded-full border-2 transition ${
                    active ? "border-accent" : "border-transparent hover:border-border"
                  }`}
                >
                  <span
                    className="block h-7 w-7 rounded-full border border-black/10"
                    style={{ background: swatchColor(color) }}
                  />
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {storages.length > 1 && (
        <div>
          <p className="mb-2 text-sm font-semibold">Storage</p>
          <div className="flex flex-wrap gap-2">
            {storages.map((storage) => {
              const slug = findSlug(currentColor, storage);
              const active = storage === currentStorage;
              return (
                <Link
                  key={storage}
                  href={slug ? `/products/${slug}` : "#"}
                  className={`rounded-lg border px-4 py-2 text-sm font-medium transition ${
                    active
                      ? "border-accent bg-accent/10 text-accent"
                      : "border-border text-muted hover:border-text hover:text-text"
                  }`}
                >
                  {storage}
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
