import { HeroCanvas } from "@/components/webgl/HeroCanvas";
import { HeroType } from "@/components/sections/HeroType";
import { SITE } from "@/lib/site";

/**
 * Hero.
 *
 * Load-order is the whole point of this component. The `<h1>` and its
 * supporting copy are plain server-rendered HTML, so the Largest Contentful
 * Paint resolves against text in the first paint — the WebGL canvas is mounted
 * afterwards, off the critical path, and can never become the LCP element.
 * That is what lets the page run a 100k-particle shader and still score 95+.
 */
export function Hero() {
  return (
    <section className="relative flex min-h-[100svh] flex-col justify-end overflow-hidden pb-16 pt-32">
      {/* Layer 0 — deferred, decorative, non-blocking */}
      <HeroCanvas />

      {/* Layer 1 — the LCP text, server HTML */}
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

          <p className="font-mono text-[0.625rem] leading-relaxed tracking-[0.14em] uppercase text-ink-faint md:text-right">
            Scroll to resolve
            <span className="ml-2 inline-block h-px w-8 align-middle bg-line-strong" />
          </p>
        </div>
      </div>
    </section>
  );
}
