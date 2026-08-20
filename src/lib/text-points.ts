/**
 * Rasterises text and resamples it into evenly distributed points.
 *
 * Shared by the fluid hero (which injects ink along the letterforms) and the
 * particle shader in the playground (which uses them as morph targets). Returns
 * normalised 0–1 coordinates with y up, so each consumer maps them into whatever
 * space it works in rather than baking a world size in here.
 */

export type TextPoint = { readonly x: number; readonly y: number };

/** Deterministic PRNG, so a layout is identical between renders and reloads. */
function makeRandom(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    // xorshift32
    state ^= state << 13;
    state ^= state >>> 17;
    state ^= state << 5;
    return (state >>> 0) / 4294967296;
  };
}

const CANVAS_W = 1024;
const CANVAS_H = 256;

export type SampleOptions = {
  /** How many points to return. */
  readonly count: number;
  /** Pixel step when scanning the bitmap. Lower is denser and slower. */
  readonly step?: number;
  readonly seed?: number;
};

/**
 * Returns `count` points lying on the glyphs of `text`, or an empty array if a
 * 2D context is unavailable. Callers must handle the empty case.
 */
export function sampleTextPoints(text: string, options: SampleOptions): TextPoint[] {
  const { count, step = 2, seed = 0x5eed } = options;
  const rand = makeRandom(seed);

  const canvas = document.createElement("canvas");
  canvas.width = CANVAS_W;
  canvas.height = CANVAS_H;

  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) return [];

  ctx.fillStyle = "#fff";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  // System stack only. A webfont may not have loaded when this runs, and a
  // fallback swapping mid-sample would produce a garbled wordmark.
  ctx.font = `700 ${CANVAS_H * 0.72}px "Helvetica Neue", Arial, sans-serif`;
  ctx.letterSpacing = "6px";
  ctx.fillText(text, CANVAS_W / 2, CANVAS_H / 2);

  const { data } = ctx.getImageData(0, 0, CANVAS_W, CANVAS_H);

  /* Candidates are collected first and then resampled. Sampling randomly against
     the raw bitmap clumps toward wide glyphs, because a wider letter simply has
     more opaque pixels to hit. */
  const candidates: number[] = [];
  for (let y = 0; y < CANVAS_H; y += step) {
    for (let x = 0; x < CANVAS_W; x += step) {
      if (data[(y * CANVAS_W + x) * 4 + 3] > 128) candidates.push(x, y);
    }
  }

  const pairs = candidates.length / 2;
  if (pairs === 0) return [];

  const points: TextPoint[] = [];
  for (let i = 0; i < count; i += 1) {
    const pick = Math.floor(rand() * pairs) * 2;
    points.push({
      x: candidates[pick] / CANVAS_W,
      // Flip to y-up.
      y: 1 - candidates[pick + 1] / CANVAS_H,
    });
  }

  return points;
}

/** Aspect ratio of the sampling canvas, so callers can preserve proportions. */
export const TEXT_ASPECT = CANVAS_W / CANVAS_H;
