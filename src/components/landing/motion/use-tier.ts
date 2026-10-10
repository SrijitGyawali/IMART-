"use client";

import { useSyncExternalStore } from "react";
import { decideTier, readTierInput, readTierOverride, type Tier } from "./tier";

let cached: Tier | null = null;

function compute(): Tier {
  return readTierOverride(window.location.search) ?? decideTier(readTierInput(window));
}

function subscribe(onChange: () => void) {
  const query = window.matchMedia("(prefers-reduced-motion: reduce)");
  const handler = () => {
    cached = compute();
    onChange();
  };
  query.addEventListener("change", handler);
  return () => query.removeEventListener("change", handler);
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
