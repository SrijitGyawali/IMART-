/** The stylised delivery map, in screen space: x ∈ [-0.23, 0.23], y ∈ [-0.5, 0.5] (y up). */
export const STREETS: ReadonlyArray<readonly [number, number, number, number]> = [
  [-0.23, 0.3, 0.23, 0.24], [-0.23, 0.02, 0.23, 0.1], [-0.23, -0.16, 0.23, -0.1],
  [-0.12, 0.38, -0.06, -0.3], [0.1, 0.4, 0.04, -0.3], [-0.23, 0.19, 0, 0.08],
  [0, 0.08, 0.23, -0.02], [-0.18, -0.3, 0.18, -0.22], [0.18, 0.4, 0.23, 0.2],
];

/** The phone screen's aspect (width / height); screen space spans [-ASPECT/2, ASPECT/2] × [-0.5, 0.5]. */
export const SCREEN_ASPECT = 0.4605;

/** The same streets as a GLSL constant, so the shader and the escaping SVG lines can never drift. */
export function glslStreets(): string {
  const items = STREETS.map((s) => `vec4(${s.map((v) => v.toFixed(3)).join(", ")})`).join(", ");
  return `const vec4 STREETS[${STREETS.length}] = vec4[${STREETS.length}](${items});`;
}
