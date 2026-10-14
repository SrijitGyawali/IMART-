"use client";

import { useSyncExternalStore } from "react";
import { capTier, decideTier, lowerTier, parseTier, readTierInput, readTierOverride, type Tier } from "./tier";

const CAP_KEY = "imart-tier-cap";
const listeners = new Set<() => void>();
let cached: Tier | null = null;
let memoryCap: Tier | null = null;

function readCap(): Tier | null {
  try {
    return parseTier(sessionStorage.getItem(CAP_KEY));
  } catch {
    return null;
  }
}

function compute(): Tier {
  const forced = readTierOverride(window.location.search);
  if (forced) return forced;
  const stored = readCap();
  if (stored) memoryCap = capTier(stored, memoryCap);
  return capTier(decideTier(readTierInput(window)), memoryCap);
}

function setCap(tier: Tier) {
  memoryCap = capTier(tier, memoryCap);
  try {
    sessionStorage.setItem(CAP_KEY, memoryCap);
  } catch {}
  cached = capTier(cached ?? compute(), memoryCap);
  listeners.forEach((listener) => listener());
}

export function isTierForced(): boolean {
  return readTierOverride(window.location.search) !== null;
}

export function stepDownTier() {
  if (cached === null || cached === "low" || isTierForced()) return;
  setCap(lowerTier(cached));
}

export function dropToLowTier() {
  if (cached === "low" || isTierForced()) return;
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

export function useTier(): Tier | null {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
