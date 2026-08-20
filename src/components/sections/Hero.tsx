"use client";

import { useRef } from "react";
import { useGSAP } from "@gsap/react";
import { HeroCanvas } from "@/components/webgl/HeroCanvas";
import { HeroType } from "@/components/sections/HeroType";
import { gsap, prefersReducedMotion } from "@/lib/gsap";
import { setHeroProgress } from "@/lib/hero-progress";
import { SITE } from "@/lib/site";

/**
 * Hero.
 *
 * Two things are load-bearing here.
 *
 * First, order: the `<h1>` and its supporting copy are server-rendered HTML, so
 * the Largest Contentful Paint resolves against text in the first paint. The
 * WebGL canvas mounts afterwards, off the critical path, and can never become
 * the LCP element. That is what lets the page run an 80k-particle shader and
 * still score well.
 *
 * Second, the stick: the particle field morphs scatter → wordmark → grid, and
 * the visible panel stays put for the duration so the morph actually happens on
 * screen. Without that the wordmark resolves somewhere below the fold and nobody
 * ever sees it — which was exactly the first version's bug.
 *
 * The sticking is done with CSS `position: sticky` inside a tall section, NOT
 * with ScrollTrigger's `pin`. This is a CLS fix and it was measured: a pin is
 * created after hydration and inserts a pin-spacer, so 220vh of height appears
 * in the document *after* first paint and everything below it moves. That
 * measured 0.42 CLS on a throttled mobile profile. A CSS height and a sticky
 * child are in the server HTML, so the layout is final before any JavaScript
 * runs and there is nothing to shift. ScrollTrigger is left doing only what it
 * is good at here: reporting progress.
 */
export function Hero() {
  const section = useRef<HTMLElement>(null);
  const textLayer = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      if (prefersReducedMotion()) return;

      // Scrubs across the section's own height — the sticky child provides the
      // hold, so no pin and no injected spacer.
      const timeline = gsap.timeline({
        scrollTrigger: {
          trigger: section.current,
          start: "top top",
          end: "bottom bottom",
          scrub: 0.8,
          invalidateOnRefresh: true,
          onUpdate: (self) => setHeroProgress(self.progress * 2),
        },
      });

      // The headline hands over to the wordmark: as the particles resolve into
      // "BRIJESH", the text lifts away. The two never compete.
      timeline
        .to(textLayer.current, { yPercent: -16, opacity: 0, ease: "power2.in" }, 0)
        .to({}, { duration: 1.6 });

      return () => {
        timeline.scrollTrigger?.kill();
        timeline.kill();
        setHeroProgress(0);
      };
    },
    { scope: section },
  );

  return (
    /* The tall outer section is the scroll runway; the sticky child is what the
       visitor sees. Under reduced motion both collapse to a single screen via
       pure CSS, so there is no long empty scroll and still no layout change. */
    <section
      ref={section}
      className="relative h-[320svh] motion-reduce:h-auto"
    >
      <div className="sticky top-0 flex h-[100svh] flex-col justify-end overflow-hidden pb-16 pt-32 motion-reduce:static motion-reduce:h-auto motion-reduce:min-h-[100svh]">
        {/* Layer 0 — deferred, decorative, non-blocking */}
        <HeroCanvas />

        {/* Layer 1 — the LCP text, present in the server HTML */}
        <div ref={textLayer} className="gutter relative z-10">
          <p className="label">
            {SITE.role} · {SITE.location}
          </p>

          <HeroType />

          <div className="mt-10 flex flex-col gap-8 md:flex-row md:items-end md:justify-between">
            <p className="max-w-xl text-lead text-ink-muted">
              I build production React and TypeScript interfaces, then make them
              fast. Currently SDE&nbsp;2 and technical lead at ShopTrade, where
              I&nbsp;have shipped{" "}
              <span className="text-ink">11 production applications</span> for
              global brands across e-commerce, healthcare and B2B.
            </p>

            <p className="font-mono text-[0.625rem] leading-relaxed tracking-[0.14em] uppercase text-ink-faint md:text-right">
              Scroll to resolve
              <span className="ml-2 inline-block h-px w-8 align-middle bg-line-strong" />
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
