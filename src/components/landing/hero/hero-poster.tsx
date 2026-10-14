"use client";

import Image from "next/image";
import { useSyncExternalStore } from "react";
import { stillUrl } from "../config";
import type { Finish } from "../data";
import { getSceneFinish, subscribeFinish } from "../scene-store";

export function HeroPoster({ finishes, alt }: { finishes: Finish[]; alt: string }) {
  const picked = useSyncExternalStore(subscribeFinish, getSceneFinish, () => null);
  const id = picked?.id ?? finishes[0]?.id ?? null;
  return <Image className="hero-poster" src={stillUrl(id)} alt={alt} fill priority sizes="(max-width: 760px) 90vw, 640px" />;
}
