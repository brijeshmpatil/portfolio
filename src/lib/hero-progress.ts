/**
 * Shared hero morph progress, 0 → 2.
 *
 * The scroll timeline lives in the hero section (a normal client component)
 * while the value is consumed inside the WebGL scene, which is behind a dynamic
 * `ssr: false` boundary and mounted later. A tiny module-level store is the
 * cheapest correct link between the two: no context provider spanning the
 * boundary, no prop threading through the loader, and — importantly — writes
 * happen on every scroll frame without triggering a React render.
 *
 *   0  scatter
 *   1  wordmark
 *   2  grid
 */

/**
 * Maps raw scroll position (0 → 1) to morph progress (0 → 2).
 *
 * Deliberately not linear. Mapped linearly, `uProgress` passes through exactly
 * 1.0 at a single scroll position, so the wordmark was fully formed for roughly
 * 250px of a 1980px runway — about two wheel notches. It read as a glitch rather
 * than a reveal, because you never actually saw it hold still.
 *
 * So each end state gets a plateau where progress does not advance at all, and
 * the transitions between them are eased rather than linear. The result is
 * assemble → hold → disperse → hold, which is a sequence rather than a swipe.
 */
const PHASES = [
  { until: 0.32, from: 0, to: 1 }, // scatter assembles into the wordmark
  { until: 0.46, from: 1, to: 1 }, // hold: the wordmark is readable here
  { until: 0.82, from: 1, to: 2 }, // wordmark breaks into the bars
  { until: 1.0, from: 2, to: 2 }, // hold: bars, handing off to the work rail
] as const;

/** Smooth acceleration and deceleration, so a plateau is entered and left softly. */
function easeInOut(t: number): number {
  return t < 0.5 ? 2 * t * t : 1 - (1 - t) * (1 - t) * 2;
}

export function mapHeroProgress(scroll: number): number {
  const t = Math.min(Math.max(scroll, 0), 1);

  let start = 0;
  for (const phase of PHASES) {
    if (t <= phase.until) {
      const span = phase.until - start;
      // A plateau has from === to, so the eased local position is irrelevant.
      const local = span > 0 ? (t - start) / span : 1;
      return phase.from + (phase.to - phase.from) * easeInOut(local);
    }
    start = phase.until;
  }

  return 2;
}

export type HeroScroll = {
  /** Morph progress, 0 → 2, with plateaus. Drives uProgress. */
  readonly progress: number;
  /** Raw linear scroll through the runway, 0 → 1. Never plateaus. */
  readonly scroll: number;
};

type Listener = (value: HeroScroll) => void;

/**
 * Both values are published, and the second one matters more than it looks.
 *
 * `progress` deliberately holds still on its plateaus so the wordmark can be
 * read. The side effect is a stretch of scrolling where the shader receives an
 * identical value every frame and nothing on screen changes — which reads as the
 * page having frozen. `scroll` keeps advancing linearly throughout, so the
 * renderer always has something to respond to and scrolling never feels dead.
 */
let current: HeroScroll = { progress: 0, scroll: 0 };
const listeners = new Set<Listener>();

export function setHeroProgress(progress: number, scroll: number): void {
  current = { progress, scroll };
  for (const listener of listeners) listener(current);
}

export function getHeroProgress(): HeroScroll {
  return current;
}

/** Subscribe to scroll changes. Returns an unsubscribe function. */
export function onHeroProgress(listener: Listener): () => void {
  listeners.add(listener);
  // Push the current value immediately, so a late subscriber (the deferred
  // canvas) is not stuck at 0 if the user has already scrolled.
  listener(current);
  return () => listeners.delete(listener);
}
