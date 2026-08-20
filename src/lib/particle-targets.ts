/**
 * Builds the three position buffers the hero shader blends between.
 *
 * All of this runs once, on the client, inside the deferred canvas chunk — so
 * the cost never lands on the critical path. Buffers are plain Float32Arrays
 * handed straight to WebGL; nothing is recomputed per frame.
 */

import { sampleTextPoints, TEXT_ASPECT } from "@/lib/text-points";

export type ParticleTargets = {
  readonly scatter: Float32Array;
  readonly word: Float32Array;
  readonly grid: Float32Array;
  readonly random: Float32Array;
};

/** Deterministic PRNG so the layout is identical between renders and reloads. */
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

/**
 * World-space positions for the wordmark, from the shared text sampler.
 *
 * The sampler returns normalised 0–1 points with y up; this maps them into the
 * particle field's world units and adds jitter so the wordmark reads as made of
 * particles rather than as filled type.
 */
function sampleText(text: string, count: number, width: number): Float32Array {
  const positions = new Float32Array(count * 3);
  const rand = makeRandom(0x5eed);
  const points = sampleTextPoints(text, { count });
  const height = width / TEXT_ASPECT;

  if (points.length === 0) {
    // Without a 2D context there is no wordmark to sample. Fall back to a
    // scattered slab so the morph still has somewhere to go.
    for (let i = 0; i < count; i += 1) {
      positions[i * 3] = (rand() - 0.5) * width;
      positions[i * 3 + 1] = (rand() - 0.5) * 2;
      positions[i * 3 + 2] = 0;
    }
    return positions;
  }

  for (let i = 0; i < count; i += 1) {
    const point = points[i % points.length];
    positions[i * 3] = (point.x - 0.5) * width + (rand() - 0.5) * 0.045;
    positions[i * 3 + 1] = (point.y - 0.5) * height + (rand() - 0.5) * 0.045;
    positions[i * 3 + 2] = (rand() - 0.5) * 0.18;
  }

  return positions;
}

/**
 * `cells` evenly spaced vertical bars in a single centred row — one per shipped
 * production application.
 *
 * A row rather than a grid, for two reasons: eleven does not factor into a
 * balanced grid (5/5/1 reads as a mistake, not a choice), and a horizontal row
 * is the visual handoff into the horizontally-scrolling work rail directly
 * below it.
 */
function buildBars(count: number, cells: number, width: number): Float32Array {
  const positions = new Float32Array(count * 3);
  const rand = makeRandom(0xc0ffee);

  // Inset from the full width so the outer bars are not clipped by the frame —
  // the wordmark can bleed off the edges, a countable row of bars cannot.
  const span = width * 0.86;
  const pitch = span / cells;
  const barW = pitch * 0.52;
  const barH = width * 0.26;
  const perCell = Math.ceil(count / cells);

  for (let i = 0; i < count; i += 1) {
    const cell = Math.min(Math.floor(i / perCell), cells - 1);
    const originX = (cell - (cells - 1) / 2) * pitch;

    positions[i * 3] = originX + (rand() - 0.5) * barW;
    positions[i * 3 + 1] = (rand() - 0.5) * barH;
    positions[i * 3 + 2] = (rand() - 0.5) * 0.3;
  }

  return positions;
}

/** Loose cloud the field starts in — biased wide and flat to fill the viewport. */
function buildScatter(count: number, width: number): Float32Array {
  const positions = new Float32Array(count * 3);
  const rand = makeRandom(0xbeef);

  for (let i = 0; i < count; i += 1) {
    // Slightly wider than the frame so the field has no visible edge, but not
    // so wide that a large share of the particle budget is spent off-screen.
    positions[i * 3] = (rand() - 0.5) * width * 1.15;
    // Biased toward the vertical centre — a uniform spread reads as an even
    // grey wash, whereas a denser core reads as a cloud.
    const v = rand() + rand() - 1;
    positions[i * 3 + 1] = v * width * 0.3;
    positions[i * 3 + 2] = (rand() - 0.5) * 3;
  }

  return positions;
}

export function buildParticleTargets(
  count: number,
  wordmark: string,
  cells: number,
  width = 12,
): ParticleTargets {
  const random = new Float32Array(count);
  const rand = makeRandom(0xa11ce);
  for (let i = 0; i < count; i += 1) random[i] = rand();

  return {
    scatter: buildScatter(count, width),
    word: sampleText(wordmark, count, width),
    grid: buildBars(count, cells, width),
    random,
  };
}
