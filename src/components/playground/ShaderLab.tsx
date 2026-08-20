"use client";

import dynamic from "next/dynamic";
import { useId, useState } from "react";
import { PARTICLES_BY_TIER } from "@/lib/device";

const Canvas = dynamic(
  () => import("@/components/playground/LabCanvas").then((m) => m.LabCanvas),
  { ssr: false },
);

const PHASES = [
  { label: "Scatter", value: 0 },
  { label: "Wordmark", value: 1 },
  { label: "Bars", value: 2 },
] as const;

/**
 * The hero's shader, exposed with its controls.
 *
 * Same vertex program, same three target buffers — the difference is that here
 * `uProgress` is a slider rather than a scroll position. Dragging between 0 and
 * 2 is the whole morph, and the count control shows what particle density
 * actually buys: the wordmark stops being legible somewhere below 20k.
 */
export function ShaderLab() {
  const [progress, setProgress] = useState(1);
  const [count, setCount] = useState<number>(PARTICLES_BY_TIER.medium);
  const [size, setSize] = useState(0.028);

  const progressId = useId();
  const countId = useId();
  const sizeId = useId();

  return (
    <div className="border border-line">
      <div className="relative aspect-[16/9] w-full bg-void">
        <Canvas count={count} progress={progress} size={size} />
      </div>

      <div className="grid gap-8 border-t border-line p-6 md:grid-cols-3 md:p-8">
        <div>
          <div className="flex items-baseline justify-between gap-4">
            <label htmlFor={progressId} className="label">
              uProgress
            </label>
            <span className="font-mono text-sm text-signal tabular-nums">
              {progress.toFixed(2)}
            </span>
          </div>
          <input
            id={progressId}
            type="range"
            min={0}
            max={2}
            step={0.01}
            value={progress}
            onChange={(event) => setProgress(Number(event.target.value))}
            className="mt-4 w-full accent-[var(--color-signal)]"
          />
          <div className="mt-3 flex gap-2">
            {PHASES.map((phase) => (
              <button
                key={phase.label}
                type="button"
                onClick={() => setProgress(phase.value)}
                className="border border-line px-2.5 py-1 font-mono text-[0.5625rem] tracking-[0.12em] uppercase text-ink-muted transition-colors hover:border-line-strong hover:text-signal"
              >
                {phase.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <div className="flex items-baseline justify-between gap-4">
            <label htmlFor={countId} className="label">
              particles
            </label>
            <span className="font-mono text-sm text-signal tabular-nums">
              {count.toLocaleString("en-US")}
            </span>
          </div>
          <input
            id={countId}
            type="range"
            min={4_000}
            max={PARTICLES_BY_TIER.high}
            step={2_000}
            value={count}
            onChange={(event) => setCount(Number(event.target.value))}
            className="mt-4 w-full accent-[var(--color-signal)]"
          />
          <p className="mt-3 text-xs text-ink-faint">
            Changing this rebuilds all three position buffers, so the field
            re-seeds rather than interpolating.
          </p>
        </div>

        <div>
          <div className="flex items-baseline justify-between gap-4">
            <label htmlFor={sizeId} className="label">
              uSize
            </label>
            <span className="font-mono text-sm text-signal tabular-nums">
              {size.toFixed(3)}
            </span>
          </div>
          <input
            id={sizeId}
            type="range"
            min={0.008}
            max={0.08}
            step={0.002}
            value={size}
            onChange={(event) => setSize(Number(event.target.value))}
            className="mt-4 w-full accent-[var(--color-signal)]"
          />
          <p className="mt-3 text-xs text-ink-faint">
            World-space radius. Push it up and additive blending saturates the
            accent to flat yellow — the reason per-particle alpha drops as
            particles lock.
          </p>
        </div>
      </div>
    </div>
  );
}
