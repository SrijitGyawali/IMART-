/** Versioned so it can be cached immutably; bump when the model changes. */
export const MODEL_URL = "/models/iphone.v1.glb";

/** The spec's three motion speeds (ms) and their easings. */
export const MOTION = {
  fast: { min: 100, max: 250, ease: "cubic-bezier(.2,.7,.2,1)" },
  normal: { min: 400, max: 700, ease: "cubic-bezier(.16,1,.3,1)" },
  cinematic: { min: 900, max: 1800, ease: "power3.inOut" },
} as const;
