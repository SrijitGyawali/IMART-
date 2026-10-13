import type { StringTune } from "@fiddle-digital/string-tune";

// StringTune is a singleton whose destroy() tears down its engine for good, so it is started
// once per page load and shared by every caller.
//
// Scrolling stays native on every device. JS smooth scrolling made the browser finish style and
// layout on the main thread before every scroll step and re-raster page tiles each frame; on this
// WebGL-heavy page that cost ~40% more main-thread time in the film and made the page trail the
// wheel. Native scrolling runs on the compositor, and the film keeps its easing from GSAP's scrub.
let booting: Promise<StringTune> | null = null;

async function boot(): Promise<StringTune> {
  const mod = await import("@fiddle-digital/string-tune");
  const st = mod.StringTune.getInstance();
  // Only the modules the markup uses (data-string="parallax" | "magnetic"): every registered
  // module does work on each scroll and pointer frame, used or not.
  st.use(mod.StringParallax);
  st.use(mod.StringMagnetic);
  st.scrollMobileMode = "default";
  st.scrollDesktopMode = "default";
  st.start(0);
  return st;
}

/** Starts StringTune (magnetic buttons, parallax) once; later calls reuse the running instance. */
export async function startStringTune(): Promise<void> {
  booting ??= boot();
  await booting;
  document.documentElement.dataset.scroll = "native";
}
