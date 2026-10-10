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

export function parseTier(value: string | null): Tier | null {
  return value === "high" || value === "mid" || value === "low" ? value : null;
}

export function readTierOverride(search: string): Tier | null {
  return parseTier(new URLSearchParams(search).get("tier"));
}

const RANK: Record<Tier, number> = { low: 0, mid: 1, high: 2 };

/** One step down: high → mid → low. */
export function lowerTier(tier: Tier): Tier {
  return tier === "high" ? "mid" : "low";
}

/** The lower of the decided tier and the session's cap (set by runtime step-downs). */
export function capTier(tier: Tier, cap: Tier | null): Tier {
  return cap !== null && RANK[cap] < RANK[tier] ? cap : tier;
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
