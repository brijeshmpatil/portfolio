"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { cappedDpr, detectTier, PARTICLES_BY_TIER, type Tier } from "@/lib/device";
import { PerfHUD } from "./PerfHUD";

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
  const [tier, setTier] = useState<Tier | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const detected = detectTier();
    setTier(detected);
    if (detected === "off") return;

    // requestIdleCallback is not in Safari; a timeout is a fine substitute
    // because either way we are explicitly yielding past first paint.
    const schedule =
      window.requestIdleCallback ?? ((cb: IdleRequestCallback) => window.setTimeout(cb, 400));
    const cancel = window.cancelIdleCallback ?? window.clearTimeout;

    const handle = schedule(() => setReady(true));
    return () => cancel(handle as number);
  }, []);

  const particles = tier ? PARTICLES_BY_TIER[tier] : 0;
  const active = tier !== null && tier !== "off" && ready;

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
