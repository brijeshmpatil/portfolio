"use client";

import { useEffect, useRef, useState } from "react";
import { FluidSimulation, isFluidSupported } from "@/lib/fluid/simulation";
import { sampleTextPoints, TEXT_ASPECT } from "@/lib/text-points";

const WORDMARK = "BRIJESH";
/** Points of ink laid along the letterforms. Enough to read, few enough to bloom. */
const INK_POINTS = 340;

/** Amber, with hue drift so overlapping strokes stay distinguishable. */
function ink(seed: number, gain = 2.4): [number, number, number] {
  const warmth = 0.5 + 0.5 * Math.sin(seed);
  return [
    (0.85 + warmth * 0.15) * gain,
    (0.34 + warmth * 0.3) * gain,
    (0.06 + warmth * 0.1) * gain,
  ];
}

/**
 * Hero fluid.
 *
 * A Navier–Stokes solver behind the headline, seeded with the letterforms of
 * BRIJESH so the name blooms out of the ink and then dissolves as it is pushed
 * around. The wordmark matters: a generic fluid canvas is decoration, whereas
 * this still says whose site it is.
 *
 * Fullscreen is cheaper here than it was for the particle field. The nine solver
 * passes run at fixed 128² and 512² texture sizes no matter how large the canvas
 * is, so only the final display pass scales with the viewport — the simulation
 * cost is independent of how big the hero is.
 *
 * Mount order is unchanged from the particle version: the canvas is only created
 * after LCP has been reported, so it cannot affect the metric.
 */
export function HeroFluid() {
  const canvas = useRef<HTMLCanvasElement>(null);
  const [supported] = useState(() =>
    typeof window === "undefined" ? false : isFluidSupported(),
  );
  const [ready, setReady] = useState(false);
  const [entered, setEntered] = useState(false);

  // Reduced motion and touch both get the static poster, matching the previous
  // hero: on touch this is a WebGL2 chunk that a phone should not be parsing.
  const [allowed] = useState(() => {
    if (typeof window === "undefined") return false;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return false;
    if (window.matchMedia("(pointer: coarse)").matches) return false;
    return true;
  });

  useEffect(() => {
    if (!allowed || !supported) return;

    let idle = 0;
    let settled = false;
    const schedule =
      window.requestIdleCallback ?? ((cb: IdleRequestCallback) => window.setTimeout(cb, 400));
    const cancelIdle = window.cancelIdleCallback ?? window.clearTimeout;

    const load = () => {
      if (settled) return;
      settled = true;
      idle = schedule(() => setReady(true)) as number;
    };

    /* Wait for LCP before mounting. Idle alone is not enough of a guard — the
       browser reports idle early, the WebGL work then runs on the main thread,
       and the paint it delays is the one being measured. */
    let observer: PerformanceObserver | undefined;
    if (typeof PerformanceObserver !== "undefined") {
      try {
        observer = new PerformanceObserver(() => load());
        observer.observe({ type: "largest-contentful-paint", buffered: true });
      } catch {
        // Entry type unsupported; the timeout below covers it.
      }
    }
    const fallback = window.setTimeout(load, 2500);

    return () => {
      observer?.disconnect();
      window.clearTimeout(fallback);
      if (idle) cancelIdle(idle);
    };
  }, [allowed, supported]);

  useEffect(() => {
    const node = canvas.current;
    if (!node || !ready) return;

    let simulation: FluidSimulation;
    try {
      simulation = new FluidSimulation(node);
    } catch {
      return;
    }

  /* Hero tuning. Tighter splats than the playground default so letterforms are
     crisp, and slow dye decay so the name lingers before dissolving. */
  const HELD = { curl: 0, velocityDissipation: 6 } as const;
  const RELEASED = { curl: 22, velocityDissipation: 0.5 } as const;

    simulation.setSettings({
      radius: 0.00018,
      dyeDissipation: 0.2,
      ...HELD,
    });

    let raf = 0;
    let last = performance.now();
    let running = true;

    const resize = () => {
      const rect = node.getBoundingClientRect();
      // Only the display pass scales with this, so 2x is affordable here.
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      simulation.resize(
        Math.max(2, Math.round(rect.width * dpr)),
        Math.max(2, Math.round(rect.height * dpr)),
      );
    };
    resize();
    const observer = new ResizeObserver(resize);
    observer.observe(node);

    /* Lays ink along the glyphs. The wordmark is scaled to a fraction of the
       viewport and given a small outward velocity, so it blooms into legibility
       over about a second rather than appearing as flat stamped text. */
    const seedWordmark = () => {
      const points = sampleTextPoints(WORDMARK, { count: INK_POINTS, step: 3 });
      if (points.length === 0) return;

      /* Preserve the glyph proportions on screen. For the wordmark to occupy
         `width` of the canvas without distortion, its uv height must satisfy
         (width * canvasW) / (height * canvasH) === TEXT_ASPECT, so the canvas
         aspect multiplies here rather than divides. Dividing squashed it to a
         10%-tall band and the letters merged into an illegible stripe. */
      const width = 0.62;
      const height = (width * Math.max(simulation.aspectRatio, 0.2)) / TEXT_ASPECT;

      /* Almost no velocity. The first version pushed each point outward on a
         circle, which read beautifully and destroyed the letterforms within a
         second — the ink was gone before the name could be read. A gentle,
         coherent upward drift lets the glyphs resolve first and dissolve after. */
      points.forEach((point, i) => {
        const x = 0.5 + (point.x - 0.5) * width;
        // Sits above the headline rather than through it.
        const y = 0.64 + (point.y - 0.5) * height;
        simulation.splat(
          x,
          y,
          (Math.random() - 0.5) * 6,
          8 + Math.random() * 10,
          ink(i * 0.31, 0.8),
        );
      });
    };

    /* Two-phase seed, and this is the thing that made the name readable at all.
       A fluid solver's entire job is to destroy structure — advection plus
       vorticity turns crisp type into a beautiful illegible cloud within about a
       second, which is exactly what the first three attempts here produced. So
       the flow is held almost completely still while the ink lands and resolves,
       and only then released to start dissolving it. The name is legible for
       roughly two seconds, then becomes the abstract field. */
    const hold = () => {
      simulation.setSettings(HELD);
      seedWordmark();
      window.setTimeout(() => simulation.setSettings(RELEASED), 2200);
    };

    // One frame in, so the first splats land on an already-cleared field.
    const seedTimer = window.setTimeout(hold, 120);
    // Re-ink periodically while untouched, so a hero left alone stays alive.
    const reseed = window.setInterval(() => {
      if (!running) return;
      hold();
    }, 16_000);

    const frame = (now: number) => {
      raf = requestAnimationFrame(frame);
      const dt = Math.min((now - last) / 1000, 1 / 30);
      last = now;
      if (!running) return;
      simulation.step(dt);
    };
    raf = requestAnimationFrame(frame);

    const visibility = new IntersectionObserver(
      ([entry]) => {
        running = entry.isIntersecting && !document.hidden;
        last = performance.now();
      },
      { threshold: 0.05 },
    );
    visibility.observe(node);

    const onVisibility = () => {
      running = !document.hidden;
      last = performance.now();
    };
    document.addEventListener("visibilitychange", onVisibility);

    /* Pointer. Listeners are on the window rather than the canvas: the canvas
       sits behind the headline text, so pointer events over the copy would
       otherwise never reach it and the top half of the hero would feel dead. */
    let prevX = 0.5;
    let prevY = 0.5;
    let primed = false;

    const onMove = (event: PointerEvent) => {
      const rect = node.getBoundingClientRect();
      if (
        event.clientY < rect.top ||
        event.clientY > rect.bottom ||
        event.clientX < rect.left ||
        event.clientX > rect.right
      ) {
        primed = false;
        return;
      }

      const x = (event.clientX - rect.left) / rect.width;
      const y = 1 - (event.clientY - rect.top) / rect.height;

      if (!primed) {
        primed = true;
        prevX = x;
        prevY = y;
        return;
      }

      const dx = (x - prevX) * 5200;
      const dy = (y - prevY) * 5200;
      prevX = x;
      prevY = y;
      if (Math.abs(dx) + Math.abs(dy) < 0.5) return;

      simulation.splat(x, y, dx, dy, ink(x * 8 + y * 4));
    };

    window.addEventListener("pointermove", onMove, { passive: true });

    const enter = requestAnimationFrame(() => setEntered(true));

    return () => {
      cancelAnimationFrame(raf);
      cancelAnimationFrame(enter);
      window.clearTimeout(seedTimer);
      window.clearInterval(reseed);
      observer.disconnect();
      visibility.disconnect();
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("pointermove", onMove);
      simulation.dispose();
    };
  }, [ready]);

  return (
    <div className="absolute inset-0 overflow-hidden">
      {/* Static poster. Also the final state for touch, reduced motion, and any
          browser without float render targets. */}
      <div
        aria-hidden="true"
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(120% 80% at 50% 45%, #1c1a17 0%, #101315 48%, #08090a 100%)",
        }}
      />

      {allowed && supported && ready && (
        <canvas
          ref={canvas}
          aria-hidden="true"
          className={[
            "absolute inset-0 h-full w-full transition-opacity duration-1000 ease-out",
            entered ? "opacity-100" : "opacity-0",
          ].join(" ")}
        />
      )}
    </div>
  );
}
