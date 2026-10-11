"use client";

import { useEffect, useSyncExternalStore, type KeyboardEvent } from "react";
import type { Finish } from "../data";
import { playFinishChange } from "../motion/finish-change";
import { getSceneFinish, subscribeFinish } from "../scene-store";

export function FinishPicker({ finishes }: { finishes: Finish[] }) {
  const finish = useSyncExternalStore(subscribeFinish, getSceneFinish, () => null);
  const selected = Math.max(0, finishes.findIndex((f) => f.id === finish?.id));
  const activeFinish = finishes[selected] ?? finishes[0];

  function choose(index: number) {
    playFinishChange(finishes[index]);
  }

  function onKeyDown(e: KeyboardEvent<HTMLDivElement>) {
    if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
    e.preventDefault();
    const step = e.key === "ArrowRight" ? 1 : -1;
    const next = (selected + step + finishes.length) % finishes.length;
    choose(next);
    e.currentTarget.querySelectorAll<HTMLButtonElement>("[role=radio]")[next]?.focus();
  }

  // Phones: swiping horizontally across the device also moves through the finishes.
  useEffect(() => {
    const slot = document.querySelector<HTMLElement>(".hero-device-slot");
    if (!slot || finishes.length < 2) return;
    let startX: number | null = null;
    let startY = 0;
    const down = (e: PointerEvent) => {
      if (e.pointerType === "touch") { startX = e.clientX; startY = e.clientY; }
    };
    const up = (e: PointerEvent) => {
      if (startX === null) return;
      const dx = e.clientX - startX;
      startX = null;
      if (Math.abs(dx) < 40 || Math.abs(e.clientY - startY) > Math.abs(dx)) return;
      const current = Math.max(0, finishes.findIndex((f) => f.id === getSceneFinish()?.id));
      const next = (current + (dx < 0 ? 1 : -1) + finishes.length) % finishes.length;
      playFinishChange(finishes[next]);
    };
    slot.addEventListener("pointerdown", down);
    slot.addEventListener("pointerup", up);
    const cancel = () => { startX = null; };
    slot.addEventListener("pointercancel", cancel);
    return () => {
      slot.removeEventListener("pointerdown", down);
      slot.removeEventListener("pointerup", up);
      slot.removeEventListener("pointercancel", cancel);
    };
  }, [finishes]);

  return (
    <div className="finish-picker">
      <p id="finish-label" className="landing-label">Pick your finish</p>
      <div className="finish-options" role="radiogroup" aria-labelledby="finish-label" onKeyDown={onKeyDown}>
        {finishes.map((finish, i) => (
          <button
            key={finish.id}
            type="button"
            role="radio"
            aria-checked={i === selected}
            aria-label={finish.label}
            title={finish.label}
            tabIndex={i === selected ? 0 : -1}
            className="finish-option"
            data-cursor="select"
            onClick={() => choose(i)}
          >
            <span className="finish-swatch" style={{ background: finish.aluminium }} aria-hidden="true" />
            <span className="finish-option-name">{finish.label}</span>
          </button>
        ))}
      </div>
      <p className="finish-current" aria-live="polite">{activeFinish?.label}<span>Swipe to explore</span></p>
    </div>
  );
}
