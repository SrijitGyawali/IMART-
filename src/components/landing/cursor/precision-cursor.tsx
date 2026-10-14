"use client";

import { useEffect, useRef, useSyncExternalStore } from "react";
import { bindCursor } from "./bind-cursor";

const QUERY = "(pointer: fine)";
function subscribe(onChange: () => void) {
  const query = window.matchMedia(QUERY);
  query.addEventListener("change", onChange);
  return () => query.removeEventListener("change", onChange);
}

export function PrecisionCursor() {
  const fine = useSyncExternalStore(subscribe, () => window.matchMedia(QUERY).matches, () => false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!fine || !ref.current) return;
    return bindCursor(ref.current);
  }, [fine]);
  if (!fine) return null;
  return (
    <div ref={ref} className="cursor-ring" aria-hidden="true">
      <span className="cursor-label" />
    </div>
  );
}
