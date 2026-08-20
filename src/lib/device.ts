/**
 * Device capability tiering for the WebGL hero.
 *
 * The particle count is chosen from real signals rather than a viewport-width
 * guess, because a 1440px-wide low-end laptop is a far worse target than a
 * flagship phone. Everything degrades: a machine that reports nothing useful
 * gets the conservative tier, never the expensive one.
 */

export type Tier = "off" | "low" | "medium" | "high";

/**
 * Counts tuned against measured frame time, not picked for the headline number.
 *
 * `high` is verified at a locked 60fps with a 17.7ms worst frame on an Apple M4
 * across all three morph phases — vsync-capped rather than GPU-bound, so there
 * is real headroom. Measure with `node scripts/perf.mjs`, which forces a real
 * GPU: headless Chromium defaults to SwiftShader and its numbers are useless
 * here.
 *
 * `low` and `medium` are conservative extrapolations and have NOT been verified
 * on physical mid-range hardware. Check before trusting them.
 */
export const PARTICLES_BY_TIER: Readonly<Record<Tier, number>> = {
  off: 0,
  low: 18_000,
  medium: 55_000,
  high: 110_000,
};

type NavigatorWithHints = Navigator & {
  readonly deviceMemory?: number;
  readonly connection?: { readonly saveData?: boolean };
};

/** True when the browser can actually give us a WebGL2 context. */
function hasWebGL2(): boolean {
  try {
    const canvas = document.createElement("canvas");
    return Boolean(canvas.getContext("webgl2"));
  } catch {
    // Some hardened/privacy browsers throw rather than return null.
    return false;
  }
}

export function detectTier(): Tier {
  if (typeof window === "undefined") return "off";

  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return "off";
  if (!hasWebGL2()) return "off";

  const nav = navigator as NavigatorWithHints;

  // Respect Data Saver — a shader is pure decoration.
  if (nav.connection?.saveData) return "off";

  const cores = nav.hardwareConcurrency ?? 4;
  // `deviceMemory` is Chromium-only and reports GiB, clamped to 8.
  const memory = nav.deviceMemory ?? 4;
  const coarse = window.matchMedia("(pointer: coarse)").matches;

  if (cores <= 4 || memory <= 4) return "low";
  if (coarse) return "medium";
  if (cores >= 8 && memory >= 8) return "high";

  return "medium";
}

/**
 * Device pixel ratio capped for fill-rate. Above 2x the extra fragments are
 * invisible on a particle field but cost real milliseconds.
 */
export function cappedDpr(tier: Tier): [number, number] {
  return tier === "high" ? [1, 2] : [1, 1.5];
}
