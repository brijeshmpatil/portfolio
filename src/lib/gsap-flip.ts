"use client";

import { gsap } from "gsap";
import { Flip } from "gsap/Flip";

/**
 * Flip, split out of the main GSAP module.
 *
 * Flip is ~9.5KB gzipped and is used by exactly one component — the filter grid
 * on /work. Registering it alongside ScrollTrigger in lib/gsap.ts meant every
 * route paid for it, including the home page, which never flips anything.
 *
 * Importing it from its own module keeps it in whichever chunk actually uses it.
 */

let registered = false;

if (!registered && typeof window !== "undefined") {
  gsap.registerPlugin(Flip);
  registered = true;
}

export { Flip };
