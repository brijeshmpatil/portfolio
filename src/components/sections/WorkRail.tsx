"use client";

import { useRef, type ReactNode } from "react";
import { useGSAP } from "@gsap/react";
import { gsap, prefersReducedMotion } from "@/lib/gsap";

type Props = {
  readonly children: ReactNode;
  readonly header: ReactNode;
  readonly count: number;
};

/**
 * Horizontal rail.
 *
 * The panel sticks and the track translates on the x-axis as the page scrolls,
 * so the work reads as a single sweep rather than a stack of cards. The header
 * sticks with it and stays legible throughout.
 *
 * Three deliberate constraints:
 *  - Sticking is CSS `position: sticky` inside a tall wrapper, not
 *    ScrollTrigger's `pin`. A pin injects its spacer after hydration, which
 *    relayouts everything below it — measurably the largest single source of CLS
 *    on this page before it was removed. The tall wrapper is in the server HTML.
 *  - Below the lg breakpoint this is a plain native horizontal scroller with
 *    snap points. Hijacking vertical scroll to move content sideways is actively
 *    unpleasant on touch and breaks the browser's own gestures.
 *  - Reduced-motion users get the same native scroller. Nothing is unreachable
 *    in either fallback, which is the test that matters.
 */
export function WorkRail({ children, header, count }: Props) {
  const section = useRef<HTMLDivElement>(null);
  const track = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      if (prefersReducedMotion()) return;

      // gsap.matchMedia tears the tween down cleanly when the query stops
      // matching, which a bare ScrollTrigger with a media check does not.
      const mm = gsap.matchMedia();

      mm.add("(min-width: 1024px)", () => {
        const node = track.current;
        const wrapper = section.current;
        if (!node || !wrapper) return;

        // Travel is the overflow past the viewport, plus the right-hand gutter
        // so the final card is not flush against the edge when it lands.
        const distance = () => Math.max(0, node.scrollWidth - window.innerWidth + 64);

        const tween = gsap.to(node, {
          x: () => -distance(),
          ease: "none",
          scrollTrigger: {
            trigger: wrapper,
            start: "top top",
            // The wrapper's own height is the runway, so the sticky panel is
            // held for exactly as long as the track needs to travel.
            end: "bottom bottom",
            scrub: 1,
            invalidateOnRefresh: true,
          },
        });

        return () => tween.kill();
      });

      return () => mm.revert();
    },
    { scope: section },
  );

  return (
    <div ref={section} className="lg:h-[260svh] lg:motion-reduce:h-auto">
      <div className="lg:sticky lg:top-0 lg:flex lg:h-[100svh] lg:flex-col lg:justify-center lg:overflow-hidden lg:motion-reduce:static lg:motion-reduce:h-auto">
        {header}

        <div
          ref={track}
          className={[
            "flex gap-5 pb-4",
            // Native scroller below lg, GSAP-driven track at lg and up.
            "snap-x snap-mandatory overflow-x-auto px-5 md:px-10",
            "lg:mt-4 lg:overflow-visible lg:px-16 lg:snap-none",
            "[scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
          ].join(" ")}
          role="list"
          aria-label={`${count} selected projects`}
        >
          {children}
        </div>
      </div>
    </div>
  );
}
