"use client";

import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import type { Finish } from "../data";
import { playFinishChange } from "../motion/finish-change";

export function FinishPicker({ finishes }: { finishes: Finish[] }) {
  const [selected, setSelected] = useState(0);
  const selectedRef = useRef(0);

  function choose(index: number) {
    selectedRef.current = index;
    setSelected(index);
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
    const down = (e: PointerEvent) => {
      if (e.pointerType === "touch") startX = e.clientX;
    };
    const up = (e: PointerEvent) => {
      if (startX === null) return;
      const dx = e.clientX - startX;
      startX = null;
      if (Math.abs(dx) < 40) return;
      const next = (selectedRef.current + (dx < 0 ? 1 : -1) + finishes.length) % finishes.length;
      selectedRef.current = next;
      setSelected(next);
      playFinishChange(finishes[next]);
    };
    slot.addEventListener("pointerdown", down);
    slot.addEventListener("pointerup", up);
    return () => {
      slot.removeEventListener("pointerdown", down);
      slot.removeEventListener("pointerup", up);
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
            tabIndex={i === selected ? 0 : -1}
            className="finish-option"
            data-cursor="select"
            onClick={() => choose(i)}
          >
            <span className="finish-swatch" style={{ background: finish.aluminium }} aria-hidden="true" />
            {finish.label}
          </button>
        ))}
      </div>
    </div>
  );
}
