"use client";

import { useEffect, useRef } from "react";
import { BOOT_KEY } from "../config";
import { markBootDone } from "../scene-store";
import { InlineScript } from "./inline-script";
import { playBoot } from "./play-boot";

// Decides before first paint: play the boot (first visit this session) or skip it.
const GATE = `(function(){var d=document.documentElement;try{var calm=window.matchMedia("(prefers-reduced-motion: reduce)").matches;var seen=sessionStorage.getItem("${BOOT_KEY}")==="1";d.setAttribute("data-boot",calm||seen?"skip":"play");if(!calm)d.setAttribute("data-entrance","pending");}catch(e){d.setAttribute("data-boot","skip");}})()`;

const LETTERS = ["i", "M", "a", "r", "t"];

export function BootIntro() {
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = rootRef.current;
    if (!root || document.documentElement.dataset.boot !== "play") {
      markBootDone();
      return;
    }
    return playBoot(root);
  }, []);

  return (
    <>
      <div ref={rootRef} className="boot" aria-hidden="true">
        <div className="boot-curtain" />
        <div className="boot-glow" />
        <div className="boot-logo">
          {LETTERS.map((letter, i) => (
            <span key={i} className="boot-letter">{letter}</span>
          ))}
          <span className="boot-dot" />
        </div>
        <span className="boot-signal" />
      </div>
      <InlineScript html={GATE} />
    </>
  );
}
