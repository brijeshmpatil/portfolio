"use client";

import { useRef } from "react";
import { useGSAP } from "@gsap/react";
import { gsap, SplitText, prefersReducedMotion } from "@/lib/gsap";

/**
 * The h1 itself.
 *
 * Rendered as real text in the server HTML (not split, not hidden) so it is the
 * LCP candidate and is fully readable with JavaScript disabled. SplitText only
 * runs after hydration, and the mask-reveal it drives is skipped entirely for
 * reduced-motion users.
 */
export function HeroType() {
  const root = useRef<HTMLHeadingElement>(null);

  useGSAP(
    () => {
      if (!root.current || prefersReducedMotion()) return;

      /* Skip on touch. The hero is already static there — no canvas, no scroll
         runway — so splitting the heading into masked lines buys a subtle reveal
         at the cost of DOM surgery and a timeline during hydration, on exactly
         the devices with the least CPU to spare. Total Blocking Time sits right
         on the 200ms threshold on a throttled mobile profile, and this is the
         cheapest thing to give up. */
      if (window.matchMedia("(pointer: coarse)").matches) return;

      // SplitText's `mask` option wraps each line in an overflow-hidden parent,
      // which is what makes the lines rise out of nothing rather than fade.
      const split = SplitText.create(root.current, {
        type: "lines",
        mask: "lines",
        linesClass: "line",
        // Keeps the heading legible to screen readers after splitting.
        aria: "auto",
      });

      gsap.from(split.lines, {
        yPercent: 115,
        duration: 1.2,
        stagger: 0.09,
        ease: "expo.out",
      });

      return () => split.revert();
    },
    { scope: root },
  );

  return (
    <h1
      ref={root}
      className="mt-6 max-w-[22ch] text-display font-medium text-ink"
    >
      Interfaces that ship,
      <br />
      then get{" "}
      <em className="font-serif italic font-normal text-signal">faster</em>.
    </h1>
  );
}
