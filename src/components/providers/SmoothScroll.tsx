"use client";

import { useRef, type ReactNode } from "react";
import { useGSAP } from "@gsap/react";
import { ScrollSmoother, prefersReducedMotion } from "@/lib/gsap";

type Props = {
  readonly children: ReactNode;
};

/**
 * Wraps the page in the ScrollSmoother wrapper/content pair.
 *
 * Notes:
 * - Smoothing is skipped entirely for reduced-motion users and for touch
 *   devices, where native momentum scrolling is better than anything we fake.
 * - `normalizeScroll` is deliberately off: it hijacks touch events and is a
 *   common cause of INP regressions on mobile.
 */
export function SmoothScroll({ children }: Props) {
  const wrapper = useRef<HTMLDivElement>(null);
  const content = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    if (prefersReducedMotion()) return;

    // Coarse pointers keep native scrolling.
    if (window.matchMedia("(pointer: coarse)").matches) return;

    const smoother = ScrollSmoother.create({
      wrapper: wrapper.current,
      content: content.current,
      smooth: 1.1,
      effects: true,
      normalizeScroll: false,
      ignoreMobileResize: true,
    });

    return () => smoother.kill();
  });

  return (
    <div ref={wrapper} id="smooth-wrapper">
      <div ref={content} id="smooth-content">
        {children}
      </div>
    </div>
  );
}
