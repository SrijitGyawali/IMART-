"use client";

import { useSyncExternalStore } from "react";
import { capTier, decideTier, lowerTier, parseTier, readTierInput, readTierOverride, type Tier } from "./tier";

const CAP_KEY = "imart-tier-cap";
const listeners = new Set<() => void>();
let cached: Tier | null = null;

function readCap(): Tier | null {
  try {
    return parseTier(sessionStorage.getItem(CAP_KEY));
  } catch {
    return null;
  }
}

function compute(): Tier {
  const forced = readTierOverride(window.location.search);
  // A failure cap (low) applies even to a forced tier; slow-frame caps never do.
  const cap = readCap();
  if (forced) return cap === "low" ? "low" : forced;
  return capTier(decideTier(readTierInput(window)), cap);
}

function setCap(tier: Tier) {
  try {
    sessionStorage.setItem(CAP_KEY, tier);
  } catch {}
  cached = compute();
  listeners.forEach((listener) => listener());
}

/** True when ?tier= pins the tier (testing); runtime step-downs are then off. */
export function isTierForced(): boolean {
  return readTierOverride(window.location.search) !== null;
}

/** Slow frames: one step down for the rest of the session (never back up). */
export function stepDownTier() {
  if (cached === null || cached === "low" || isTierForced()) return;
  setCap(lowerTier(cached));
}

/** The 3D failed (load error, render error, lost context): the Low presentation, in place. */
export function dropToLowTier() {
  if (cached === "low") return;
  setCap("low");
}

function subscribe(onChange: () => void) {
  const query = window.matchMedia("(prefers-reduced-motion: reduce)");
  const handler = () => {
    cached = compute();
    onChange();
  };
  listeners.add(onChange);
  query.addEventListener("change", handler);
  return () => {
    listeners.delete(onChange);
    query.removeEventListener("change", handler);
  };
}

function getSnapshot(): Tier {
  if (cached === null) cached = compute();
  return cached;
}

function getServerSnapshot(): Tier | null {
  return null;
}

/** The device's quality tier; null during server rendering and hydration. */
export function useTier(): Tier | null {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
