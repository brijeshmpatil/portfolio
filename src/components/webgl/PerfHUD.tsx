"use client";

import { useEffect, useRef, useState } from "react";
import type { Tier } from "@/lib/device";
import { onHeroProgress } from "@/lib/hero-progress";

type Props = {
  readonly particles: number;
  readonly tier: Tier;
};

type Sample = {
  readonly fps: number;
  readonly frameMs: number;
};

/**
 * Live render telemetry, printed over the hero.
 *
 * Deliberately opt-in and off by default: it is a talking point, not furniture.
 * Sampling is done from a single rAF loop that writes to a ref and flushes to
 * state twice a second — reading `performance.now()` every frame is free, but
 * re-rendering React every frame would not be.
 */
export function PerfHUD({ particles, tier }: Props) {
  const [open, setOpen] = useState(false);
  const [sample, setSample] = useState<Sample>({ fps: 0, frameMs: 0 });

  const [morph, setMorph] = useState(0);

  const frames = useRef(0);
  const worst = useRef(0);
  const last = useRef(0);

  // Morph progress is read from the same store the shader uses, so the HUD
  // reports the real uniform rather than a second estimate of it.
  useEffect(() => {
    if (!open) return;
    let queued = 0;
    return onHeroProgress(({ progress }) => {
      // Throttle to animation frames; scroll fires far more often than this
      // needs to update.
      if (queued) return;
      queued = requestAnimationFrame(() => {
        setMorph(progress);
        queued = 0;
      });
    });
  }, [open]);

  useEffect(() => {
    if (!open) return;

    let raf = 0;
    let windowStart = performance.now();
    last.current = windowStart;

    const tick = (now: number) => {
      const delta = now - last.current;
      last.current = now;
      frames.current += 1;
      if (delta > worst.current) worst.current = delta;

      if (now - windowStart >= 500) {
        setSample({
          fps: Math.round((frames.current * 1000) / (now - windowStart)),
          frameMs: Number(worst.current.toFixed(1)),
        });
        frames.current = 0;
        worst.current = 0;
        windowStart = now;
      }

      raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [open]);

  const rows: ReadonlyArray<readonly [string, string]> = [
    ["fps", String(sample.fps)],
    ["worst frame", `${sample.frameMs}ms`],
    ["particles", particles.toLocaleString("en-US")],
    ["draw calls", "1"],
    ["morph", morph.toFixed(2)],
    ["tier", tier],
  ];

  return (
    <div className="pointer-events-auto absolute bottom-4 right-4 z-20 font-mono text-[0.625rem] tracking-[0.1em] uppercase md:bottom-6 md:right-6">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex items-center gap-2 border border-line px-3 py-2 text-ink-faint transition-colors hover:border-line-strong hover:text-ink"
      >
        <span
          aria-hidden="true"
          className={[
            "block h-1.5 w-1.5 rounded-full transition-colors",
            open ? "bg-signal" : "bg-line-strong",
          ].join(" ")}
        />
        render stats
      </button>

      {open && (
        <dl className="mt-2 min-w-[13rem] border border-line bg-void/85 p-3 backdrop-blur-md">
          {rows.map(([key, value]) => (
            <div key={key} className="flex justify-between gap-6 py-0.5">
              <dt className="text-ink-faint">{key}</dt>
              <dd className="text-signal tabular-nums">{value}</dd>
            </div>
          ))}
        </dl>
      )}
    </div>
  );
}
