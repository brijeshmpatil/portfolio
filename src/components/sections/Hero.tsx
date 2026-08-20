"use client";

import dynamic from "next/dynamic";
import { HeroType } from "@/components/sections/HeroType";
import { SITE } from "@/lib/site";

/**
 * Hero.
 *
 * A fluid simulation seeded with the letterforms of BRIJESH, so the name blooms
 * out of the ink and dissolves as the pointer pushes through it.
 *
 * Two things are load-bearing.
 *
 * First, order: the `<h1>` and its supporting copy are server-rendered HTML, so
 * the Largest Contentful Paint resolves against text in the first paint. The
 * canvas mounts only after LCP has been reported, so it cannot become the LCP
 * element or delay it.
 *
 * Second, what is NOT here any more. The previous particle hero needed a 320svh
 * scroll runway and a sticky panel to hold a scatter → wordmark → bars morph on
 * screen, plus a plateau map so the wordmark stayed readable, plus a raw-scroll
 * channel so the plateau did not read as the page freezing. The fluid is driven
 * by the pointer rather than by scroll, so all of that machinery is gone and the
 * hero is one ordinary screen tall. That is a real simplification, not just a
 * swap: no sticky, no scroll store, no CLS risk from either.
 */
const HeroFluid = dynamic(
  () => import("@/components/webgl/HeroFluid").then((m) => m.HeroFluid),
  {
    ssr: false,
    loading: () => (
      <div
        aria-hidden="true"
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(120% 80% at 50% 45%, #1c1a17 0%, #101315 48%, #08090a 100%)",
        }}
      />
    ),
  },
);

export function Hero() {
  return (
    <section className="relative flex min-h-[100svh] flex-col justify-end overflow-hidden pb-16 pt-32">
      {/* Layer 0 — deferred, decorative, non-blocking */}
      <HeroFluid />

      {/* Layer 1 — the LCP text, present in the server HTML */}
      <div className="gutter relative z-10">
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

          {/* Hidden where there is no simulation to disturb — touch devices and
              reduced-motion both get the static poster. */}
          <p className="font-mono text-[0.625rem] leading-relaxed tracking-[0.14em] uppercase text-ink-faint md:text-right pointer-coarse:hidden motion-reduce:hidden">
            Move to disturb
            <span className="ml-2 inline-block h-px w-8 align-middle bg-line-strong" />
          </p>
        </div>
      </div>
    </section>
  );
}
