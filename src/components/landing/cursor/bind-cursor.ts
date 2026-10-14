import { createAnimatable, utils } from "animejs";

const LABELS: Record<string, string> = { view: "View", select: "Select", chat: "Chat ↗", map: "Map ↗" };

export function bindCursor(ring: HTMLElement): () => void {
  const label = ring.querySelector<HTMLElement>(".cursor-label");
  const follow = createAnimatable(ring, { x: 160, y: 160, ease: "out(3)" });
  let shown = false;

  const move = (e: PointerEvent) => {
    if (e.pointerType !== "mouse") return;
    if (!shown) {
      utils.set(ring, { x: e.clientX, y: e.clientY });
      ring.dataset.visible = "";
      shown = true;
    }
    follow.x(e.clientX);
    follow.y(e.clientY);
  };
  const over = (e: PointerEvent) => {
    const target = (e.target as Element | null)?.closest<HTMLElement>("[data-cursor], a, button");
    const kind = target?.dataset.cursor;
    ring.dataset.state = kind ? "label" : target ? "link" : "idle";
    if (label) label.textContent = kind ? (LABELS[kind] ?? "") : "";
  };
  const leave = () => {
    delete ring.dataset.visible;
    shown = false;
  };

  window.addEventListener("pointermove", move, { passive: true });
  document.addEventListener("pointerover", over, { passive: true });
  document.documentElement.addEventListener("pointerleave", leave);
  return () => {
    window.removeEventListener("pointermove", move);
    document.removeEventListener("pointerover", over);
    document.documentElement.removeEventListener("pointerleave", leave);
    follow.revert();
  };
}
