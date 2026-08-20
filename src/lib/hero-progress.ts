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

type Listener = (progress: number) => void;

let progress = 0;
const listeners = new Set<Listener>();

export function setHeroProgress(next: number): void {
  progress = next;
  for (const listener of listeners) listener(next);
}

export function getHeroProgress(): number {
  return progress;
}

/** Subscribe to progress changes. Returns an unsubscribe function. */
export function onHeroProgress(listener: Listener): () => void {
  listeners.add(listener);
  // Push the current value immediately, so a late subscriber (the deferred
  // canvas) is not stuck at 0 if the user has already scrolled.
  listener(progress);
  return () => listeners.delete(listener);
}
