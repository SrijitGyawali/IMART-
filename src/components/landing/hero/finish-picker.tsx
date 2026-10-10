"use client";

import { useState, type KeyboardEvent } from "react";
import type { Finish } from "../data";
import { setSceneFinish } from "../scene-store";

export function FinishPicker({ finishes }: { finishes: Finish[] }) {
  const [selected, setSelected] = useState(0);

  function choose(index: number) {
    setSelected(index);
    setSceneFinish(finishes[index]);
  }

  function onKeyDown(e: KeyboardEvent<HTMLDivElement>) {
    if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
    e.preventDefault();
    const step = e.key === "ArrowRight" ? 1 : -1;
    const next = (selected + step + finishes.length) % finishes.length;
    choose(next);
    e.currentTarget.querySelectorAll<HTMLButtonElement>("[role=radio]")[next]?.focus();
  }

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
