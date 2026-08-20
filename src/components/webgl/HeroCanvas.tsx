"use client";

import dynamic from "next/dynamic";
import { useEffect, useState, useSyncExternalStore } from "react";
import { cappedDpr, detectTier, PARTICLES_BY_TIER, type Tier } from "@/lib/device";
import { PerfHUD } from "./PerfHUD";

/* Device capability never changes for the lifetime of the page, so there is
   nothing to subscribe to — but it also cannot be read during SSR. Caching the
   result keeps getSnapshot referentially stable, which useSyncExternalStore
   requires; recomputing it per call would loop. */
let cachedTier: Tier | null = null;

const tierStore = {
  subscribe: () => () => {},
  getSnapshot: (): Tier => (cachedTier ??= detectTier()),
  // The server has no device to inspect, so it renders the poster-only state.
  getServerSnapshot: (): Tier => "off",
};

/**
 * Deferred mount boundary for the WebGL hero.
 *
 * Three separate guards keep the shader off the critical path:
 *  1. `ssr: false` — three.js and the R3F reconciler never enter the server
 *     bundle or the initial HTML payload.
 *  2. The chunk is only imported after the browser reports idle, so it cannot
 *     compete with the LCP text paint or delay hydration.
 *  3. `detectTier()` returns "off" for reduced-motion, Data Saver, missing
 *     WebGL2, or low-core hardware — in which case the chunk is never fetched
 *     at all and the static poster below is the final state.
 */
const Scene = dynamic(() => import("./Scene").then((m) => m.Scene), { ssr: false });

/** Static stand-in. Also the permanent visual for the "off" tier. */
function Poster() {
  return (
    <div
      aria-hidden="true"
      className="absolute inset-0 -z-10"
      style={{
        background:
          "radial-gradient(120% 80% at 50% 42%, #1a1d21 0%, #101315 45%, #08090a 100%)",
      }}
    />
  );
}

export function HeroCanvas() {
  const tier = useSyncExternalStore(
    tierStore.subscribe,
    tierStore.getSnapshot,
    tierStore.getServerSnapshot,
  );

  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (tier === "off") return;

    let idle = 0;
    let settled = false;

    // requestIdleCallback is not in Safari; a timeout is a fine substitute
    // because either way we are explicitly yielding.
    const schedule =
      window.requestIdleCallback ?? ((cb: IdleRequestCallback) => window.setTimeout(cb, 400));
    const cancelIdle = window.cancelIdleCallback ?? window.clearTimeout;

    const load = () => {
      if (settled) return;
      settled = true;
      idle = schedule(() => setReady(true)) as number;
    };

    /* Wait for LCP to be reported before even scheduling the load.
       Idle time alone was not enough of a guard: the browser reports idle early,
       the three.js chunk then evaluates on the main thread, and the paint it
       delays is the one being measured. Observing LCP first makes it
       structurally impossible for the shader to affect the metric rather than
       merely unlikely. */
    let observer: PerformanceObserver | undefined;

    if (typeof PerformanceObserver !== "undefined") {
      try {
        observer = new PerformanceObserver(() => load());
        observer.observe({ type: "largest-contentful-paint", buffered: true });
      } catch {
        // Unsupported entry type — fall through to the timeout below.
      }
    }

    // LCP is not reported on a page the user never sees, and Safari support has
    // been uneven, so a ceiling guarantees the effect still arrives.
    const fallback = window.setTimeout(load, 2500);

    return () => {
      observer?.disconnect();
      window.clearTimeout(fallback);
      if (idle) cancelIdle(idle);
    };
  }, [tier]);

  const particles = PARTICLES_BY_TIER[tier];
  const active = tier !== "off" && ready;

  return (
    <div className="absolute inset-0">
      <Poster />

      {active && (
        <>
          <Scene particles={particles} dpr={cappedDpr(tier)} />
          <PerfHUD particles={particles} tier={tier} />
        </>
      )}
    </div>
  );
}
