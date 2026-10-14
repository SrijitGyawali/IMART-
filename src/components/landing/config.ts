export const MODEL_URL = "/models/iphone.v1.glb";

export const STILL_VERSION = "v2";
export const RENDERED_FINISHES = ["cosmic-orange", "deep-blue", "silver"];

export function stillUrl(finishId: string | null | undefined): string {
  const id = finishId && RENDERED_FINISHES.includes(finishId) ? finishId : "fallback";
  return `/renders/hero-${id}.${STILL_VERSION}.webp`;
}

export const STILL_FILL = 0.86;

export const BOOT_KEY = "imart-boot";

export function readCapture(search: string): string | null {
  const params = new URLSearchParams(search);
  return params.get("capture") === "1" ? (params.get("finish") ?? "fallback") : null;
}
