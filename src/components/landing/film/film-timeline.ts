/** The product film, p = film progress 0..1 (spec §6.7). Everything here is a pure function of p. */

export const LAYER_ORDER = ["backGlass", "battery", "logic", "frame", "display"] as const;
export type LayerName = (typeof LAYER_ORDER)[number];

const clamp01 = (x: number) => Math.min(1, Math.max(0, x));

/** 0 before a, 1 after b, smooth in between. */
export function ramp(p: number, a: number, b: number): number {
  const t = clamp01((p - a) / (b - a));
  return t * t * (3 - 2 * t);
}

/** Rises over [a, b], holds, falls over [c, d]. */
export function window4(p: number, a: number, b: number, c: number, d: number): number {
  return Math.min(ramp(p, a, b), 1 - ramp(p, c, d));
}

export function activeAct(p: number): 1 | 2 | 3 | 4 {
  return p < 0.24 ? 1 : p < 0.55 ? 2 : p < 0.775 ? 3 : 4;
}

export function actOpacity(p: number) {
  return {
    a1: window4(p, 0.06, 0.1, 0.18, 0.22),
    // Act 02's title dims while the camera passes between the layers.
    a2: window4(p, 0.29, 0.33, 0.5, 0.54) * (1 - 0.85 * window4(p, 0.38, 0.4, 0.44, 0.46)),
    a2body: window4(p, 0.45, 0.48, 0.5, 0.54),
    a3: window4(p, 0.6, 0.63, 0.74, 0.77),
    a4: window4(p, 0.79, 0.82, 0.95, 0.99),
    labels: window4(p, 0.31, 0.35, 0.37, 0.4),
  };
}

export interface Pose {
  /** Rotation about the vertical axis; π shows the back. */
  yaw: number;
  pitch: number;
  /** Multiplier on the film's base phone height. */
  scale: number;
  exposure: number;
  /** 0..1 — how much to centre the gap between the logic board and the frame (fly-through). */
  gap: number;
  /** Horizontal offset as a share of the viewport width (act 02 sits right of its headline). */
  x: number;
}

const KEYS: Array<[number, Pose]> = [
  [0, { yaw: -0.1, pitch: 0.04, scale: 1, exposure: 1, gap: 0, x: 0 }],
  [0.08, { yaw: 0.9, pitch: 0.06, scale: 1, exposure: 1, gap: 0, x: 0 }],
  [0.15, { yaw: 2.75, pitch: 0.08, scale: 1.06, exposure: 1, gap: 0, x: 0 }],
  [0.21, { yaw: 2.85, pitch: 0.06, scale: 1.06, exposure: 1, gap: 0, x: 0 }],
  [0.27, { yaw: 2.85, pitch: 0.05, scale: 1, exposure: 1, gap: 0, x: 0.06 }],
  [0.35, { yaw: 2.15, pitch: 0.14, scale: 0.92, exposure: 1, gap: 0, x: 0.13 }],
  [0.41, { yaw: 1.62, pitch: 0.02, scale: 2.8, exposure: 0.35, gap: 1, x: 0 }],
  [0.45, { yaw: 1.45, pitch: 0, scale: 3.4, exposure: 0.12, gap: 1, x: 0 }],
  [0.5, { yaw: 0.45, pitch: 0.06, scale: 1, exposure: 1, gap: 0, x: 0.08 }],
  [0.58, { yaw: 0.22, pitch: 0.04, scale: 1, exposure: 1, gap: 0, x: 0.04 }],
  [0.645, { yaw: 0, pitch: 0, scale: 1.1, exposure: 1, gap: 0, x: 0 }],
  [0.9, { yaw: 0, pitch: 0, scale: 1.1, exposure: 1, gap: 0, x: 0 }],
  // The big transition: the phone falls slightly backward as white light takes over.
  [1, { yaw: 0.12, pitch: -0.32, scale: 0.55, exposure: 1.15, gap: 0, x: 0 }],
];

export function filmPose(p: number): Pose {
  const x = clamp01(p);
  let i = 0;
  while (i < KEYS.length - 2 && x > KEYS[i + 1][0]) i++;
  const [t0, a] = KEYS[i];
  const [t1, b] = KEYS[i + 1];
  const t = ramp(x, t0, t1);
  const mix = (u: number, v: number) => u + (v - u) * t;
  return {
    yaw: mix(a.yaw, b.yaw),
    pitch: mix(a.pitch, b.pitch),
    scale: mix(a.scale, b.scale),
    exposure: mix(a.exposure, b.exposure),
    gap: mix(a.gap, b.gap),
    x: mix(a.x, b.x),
  };
}

// Locks happen back → front, each snapping in with an accelerating ease.
const LOCKS: Record<LayerName, [number, number] | null> = {
  backGlass: [0.5, 0.52],
  battery: [0.52, 0.535],
  logic: [0.535, 0.55],
  frame: null,
  display: [0.555, 0.57],
};

export function filmBeats(p: number) {
  const open = ramp(p, 0.26, 0.32);
  const explode = LAYER_ORDER.map((name) => {
    const lock = LOCKS[name];
    if (!lock) return 0;
    const t = clamp01((p - lock[0]) / (lock[1] - lock[0]));
    return open * (1 - t * t * t);
  });
  const sweepOn = p >= 0.1 && p <= 0.17;
  return {
    explode,
    scan: ramp(p, 0.21, 0.27),
    scanFade: window4(p, 0.205, 0.215, 0.27, 0.295),
    sweep: sweepOn ? ramp(p, 0.1, 0.17) : -1,
    outline: window4(p, 0.165, 0.175, 0.19, 0.205),
    envLive: p >= 0.095 && p <= 0.175,
    power: (1 - window4(p, 0.18, 0.22, 0.56, 0.585)) * (1 - ramp(p, 0.91, 0.95)),
    payCard: window4(p, 0.59, 0.61, 0.69, 0.71),
    pay: ramp(p, 0.62, 0.66),
    qr: ramp(p, 0.655, 0.68),
    qrCollapse: ramp(p, 0.685, 0.71),
    morph: ramp(p, 0.71, 0.735) + ramp(p, 0.745, 0.77),
    map: ramp(p, 0.77, 0.83),
    notify: ramp(p, 0.85, 0.88),
    ui: window4(p, 0.59, 0.61, 0.96, 0.99),
    // Moment 05: lines escape the screen, white floods in, lines become the store's guides, the phone lands.
    escape: ramp(p, 0.9, 0.945),
    flood: ramp(p, 0.92, 0.985),
    guides: ramp(p, 0.945, 0.995),
    land: ramp(p, 0.95, 1),
  };
}

export type Beats = ReturnType<typeof filmBeats>;
