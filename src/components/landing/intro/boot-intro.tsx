"use client";

import { useEffect, useRef } from "react";
import { BOOT_KEY } from "../config";
import { markBootDone } from "../scene-store";
import { InlineScript } from "./inline-script";
import { playBoot } from "./play-boot";

const GATE = `(function(){var d=document.documentElement;try{var calm=window.matchMedia("(prefers-reduced-motion: reduce)").matches;var mobile=window.matchMedia("(max-width: 760px)").matches;var seen=sessionStorage.getItem("${BOOT_KEY}")==="1";d.setAttribute("data-boot",calm||seen||mobile?"skip":"play");if(!calm&&!mobile)d.setAttribute("data-entrance","pending");if(calm||seen||mobile)return;var ev=["pointerdown","keydown","wheel","touchstart"];var early=function(){ev.forEach(function(t){removeEventListener(t,early,true);});if(d.getAttribute("data-boot")!=="play")return;d.setAttribute("data-boot","done");try{sessionStorage.setItem("${BOOT_KEY}","1");}catch(e){}};ev.forEach(function(t){addEventListener(t,early,{capture:true,passive:true});});}catch(e){d.setAttribute("data-boot","skip");}})()`;

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
