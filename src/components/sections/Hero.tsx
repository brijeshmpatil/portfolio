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
 * Second, the pin: the particle field morphs scatter → wordmark → grid, and the
 * section stays pinned for the duration so the morph actually happens on
 * screen. Without the pin the wordmark resolves somewhere below the fold and
 * nobody ever sees it — which was exactly the first version's bug.
 */
export function Hero() {
  const section = useRef<HTMLElement>(null);
  const textLayer = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      if (prefersReducedMotion()) return;

      const mm = gsap.matchMedia();

      // Only pin where there is room for it. On a short viewport a pinned hero
      // occupies the whole screen for three scroll-heights, which is hostile.
      mm.add("(min-height: 620px)", () => {
        const timeline = gsap.timeline({
          scrollTrigger: {
            trigger: section.current,
            start: "top top",
            end: "+=220%",
            pin: true,
            scrub: 0.8,
            anticipatePin: 1,
            invalidateOnRefresh: true,
            onUpdate: (self) => setHeroProgress(self.progress * 2),
          },
        });

        // The headline hands over to the wordmark: as the particles resolve
        // into "BRIJESH", the text lifts away. The two never compete.
        timeline
          .to(textLayer.current, { yPercent: -16, opacity: 0, ease: "power2.in" }, 0)
          .to({}, { duration: 1.6 });

        return () => timeline.kill();
      });

      return () => {
        mm.revert();
        setHeroProgress(0);
      };
    },
    { scope: section },
  );

  return (
    <section
      ref={section}
      className="relative flex min-h-[100svh] flex-col justify-end overflow-hidden pb-16 pt-32"
    >
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
    </section>
  );
}
