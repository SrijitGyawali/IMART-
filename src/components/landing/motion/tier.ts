export type Tier = "high" | "mid" | "low";

export interface TierInput {
  webgl2: boolean;
  reducedMotion: boolean;
  saveData: boolean;
  /** navigator.deviceMemory (GB, Chromium only); null when unknown. */
  deviceMemory: number | null;
  cores: number | null;
  coarsePointer: boolean;
}

export function decideTier(input: TierInput): Tier {
  if (!input.webgl2 || input.reducedMotion || input.saveData) return "low";
  if (input.deviceMemory !== null && input.deviceMemory < 4) return "low";
  if (input.coarsePointer) return "mid";
  if (input.cores !== null && input.cores < 4) return "mid";
  if (input.deviceMemory !== null && input.deviceMemory < 8) return "mid";
  return "high";
}

export function readTierOverride(search: string): Tier | null {
  const value = new URLSearchParams(search).get("tier");
  return value === "high" || value === "mid" || value === "low" ? value : null;
}

interface NavigatorHints {
  deviceMemory?: number;
  connection?: { saveData?: boolean };
}

export function readTierInput(win: Window): TierInput {
  const nav = win.navigator as Navigator & NavigatorHints;
  let webgl2 = false;
  try {
    const gl = win.document.createElement("canvas").getContext("webgl2");
    webgl2 = gl !== null;
    gl?.getExtension("WEBGL_lose_context")?.loseContext();
  } catch {
    webgl2 = false;
  }
  return {
    webgl2,
    reducedMotion: win.matchMedia("(prefers-reduced-motion: reduce)").matches,
    saveData: nav.connection?.saveData === true,
    deviceMemory: typeof nav.deviceMemory === "number" ? nav.deviceMemory : null,
    cores: typeof nav.hardwareConcurrency === "number" ? nav.hardwareConcurrency : null,
    coarsePointer: win.matchMedia("(pointer: coarse)").matches,
  };
}
