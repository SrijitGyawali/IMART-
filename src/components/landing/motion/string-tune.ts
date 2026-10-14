import type { StringTune } from "@fiddle-digital/string-tune";

let booting: Promise<StringTune> | null = null;

async function boot(): Promise<StringTune> {
  const mod = await import("@fiddle-digital/string-tune");
  const st = mod.StringTune.getInstance();
  st.use(mod.StringParallax);
  st.use(mod.StringMagnetic);
  st.scrollMobileMode = "default";
  st.scrollDesktopMode = "default";
  st.start(0);
  return st;
}

export async function startStringTune(): Promise<void> {
  booting ??= boot();
  await booting;
  document.documentElement.dataset.scroll = "native";
}
