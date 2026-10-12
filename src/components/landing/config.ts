/** Versioned so it can be cached immutably; bump when the model changes. */
export const MODEL_URL = "/models/iphone.v1.glb";

export const STILL_VERSION = "v2";
export const RENDERED_FINISHES = ["cosmic-orange", "deep-blue", "silver"];

/** Pre-rendered still of the hero phone in a finish (poster, intro fallback, Low tier). */
export function stillUrl(finishId: string | null | undefined): string {
  const id = finishId && RENDERED_FINISHES.includes(finishId) ? finishId : "fallback";
  return `/renders/hero-${id}.${STILL_VERSION}.webp`;
}

/** Phone height as a share of the still's frame — the live phone uses the same share of the slot. */
export const STILL_FILL = 0.86;

export const BOOT_KEY = "imart-boot";

/** `?capture=1&finish=<id>` renders the bare phone for the stills script. */
export function readCapture(search: string): string | null {
  const params = new URLSearchParams(search);
  return params.get("capture") === "1" ? (params.get("finish") ?? "fallback") : null;
}
