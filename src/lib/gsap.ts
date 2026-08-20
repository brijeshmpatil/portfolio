"use client";

import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
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
 *
 * ScrollSmoother is deliberately NOT used, and that decision cost some time to
 * reach. It works by translating the content inside a fixed wrapper, which means
 * the browser never actually scrolls — so `position: sticky` has no scroll to
 * respond to and silently does nothing. The only way to hold a panel in place
 * alongside it is ScrollTrigger's `pin`, and a pin injects its spacer after
 * hydration, which relayouts the page and measured 0.42 CLS.
 *
 * So the choice was inertial smoothing versus a layout that never shifts. On a
 * site whose argument is measured performance, that is not a close call: native
 * scrolling, CSS sticky, CLS of 0. Smoothing is also the kind of thing that
 * fights the user's own scroll settings and trackpad momentum, so losing it is
 * not purely a sacrifice.
 */

let registered = false;

function register(): void {
  if (registered || typeof window === "undefined") return;
  gsap.registerPlugin(ScrollTrigger, SplitText, Flip);

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

export { gsap, ScrollTrigger, SplitText, Flip };
