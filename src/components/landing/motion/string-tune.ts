import type { StringTune } from "@fiddle-digital/string-tune";
import { getGsap } from "./gsap";

// StringTune is a singleton whose destroy() tears down its scroll engine for good,
// so it is started once per page load and only switched between smooth and native.
let instance: StringTune | null = null;
let booting: Promise<StringTune> | null = null;
let users = 0;

async function boot(): Promise<StringTune> {
  const mod = await import("@fiddle-digital/string-tune");
  const st = mod.StringTune.getInstance();
  st.use(mod.StringParallax);
  st.use(mod.StringMagnetic);
  st.use(mod.StringSplit);
  st.use(mod.StringCursor);
  st.use(mod.StringSpotlight);
  st.use(mod.StringTilt);
  st.use(mod.StringProgress);
  st.scrollMobileMode = "default";
  st.scrollDesktopMode = "default";
  // StringTune writes the real scroll position; keep ScrollTrigger in the same frame.
  const { ScrollTrigger } = getGsap();
  st.on("scroll", () => ScrollTrigger.update());
  st.start(0);
  return st;
}

/** Turns smooth scrolling on (desktop) for as long as the caller holds it. */
export async function acquireStringTune(smooth: boolean): Promise<() => void> {
  users += 1;
  if (!instance) {
    booting ??= boot();
    instance = await booting;
  }
  const st = instance;
  st.scrollDesktopMode = smooth ? "smooth" : "default";
  document.documentElement.dataset.scroll = smooth ? "smooth" : "native";

  let released = false;
  return () => {
    if (released) return;
    released = true;
    users -= 1;
    if (users === 0) {
      st.scrollDesktopMode = "default";
      document.documentElement.dataset.scroll = "native";
    }
  };
}
