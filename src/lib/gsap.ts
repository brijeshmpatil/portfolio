"use client";

import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { ScrollSmoother } from "gsap/ScrollSmoother";
import { SplitText } from "gsap/SplitText";
import { Flip } from "gsap/Flip";

/**
 * Single registration site for GSAP plugins.
 *
 * Every module that animates imports `gsap` from here, never from "gsap"
 * directly — that guarantees plugins are registered exactly once and keeps the
 * SSR guard in one place.
 *
 * GSAP has been free for all uses, including every plugin above, since
 * May 2025 (Webflow acquisition). No licence key is required.
 */

let registered = false;

function register(): void {
  if (registered || typeof window === "undefined") return;
  gsap.registerPlugin(ScrollTrigger, ScrollSmoother, SplitText, Flip);

  // Global defaults so individual timelines stay terse and consistent.
  gsap.defaults({ ease: "expo.out", duration: 0.9 });

  // Honour the OS reduced-motion setting globally: matchMedia contexts created
  // via gsap.matchMedia() elsewhere read this, and we additionally force any
  // timeline created under it to zero duration.
  gsap.config({ nullTargetWarn: false });

  registered = true;
}

register();

/** True when the user has asked the OS to minimise animation. */
export function prefersReducedMotion(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export { gsap, ScrollTrigger, ScrollSmoother, SplitText, Flip };
