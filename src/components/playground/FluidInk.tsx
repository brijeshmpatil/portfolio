"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";
import {
  DEFAULT_SETTINGS,
  FluidSimulation,
  isFluidSupported,
  type FluidSettings,
} from "@/lib/fluid/simulation";

/**
 * Amber, with enough hue drift that overlapping strokes read as separate.
 *
 * Values well above 1.0 on purpose. The dye texture is half-float, so it holds
 * them, and advection immediately spreads a splat over many texels — inject at
 * 1.0 and by the time it is visible it has diluted to a barely-there smudge.
 */
function inkColor(seed: number): [number, number, number] {
  const warmth = 0.5 + 0.5 * Math.sin(seed);
  const gain = 2.6;
  return [
    (0.85 + warmth * 0.15) * gain,
    (0.34 + warmth * 0.3) * gain,
    (0.06 + warmth * 0.1) * gain,
  ];
}

export function FluidInk() {
  const canvas = useRef<HTMLCanvasElement>(null);
  const sim = useRef<FluidSimulation | null>(null);
  // Read before the first paint, so the fallback is never a swap.
  const [supported] = useState(isFluidSupported);
  const [settings, setSettings] = useState<FluidSettings>(DEFAULT_SETTINGS);
  const [touched, setTouched] = useState(false);

  const curlId = useId();
  const dyeId = useId();
  const pressId = useId();

  const touchedRef = useRef(false);

  /* Pushes slider changes into the simulation. Separate from the loop effect on
     purpose: the loop must not be torn down and rebuilt — losing every
     framebuffer and all the ink — every time a slider moves one step. */
  useEffect(() => {
    sim.current?.setSettings(settings);
  }, [settings]);

  useEffect(() => {
    const node = canvas.current;
    if (!node || !supported) return;

    const simulation = new FluidSimulation(node);
    sim.current = simulation;
    simulation.setSettings(settings);

    let raf = 0;
    let last = performance.now();
    let running = true;
    let idleSeed = 0;
    let idleClock = 0;

    const resize = () => {
      const rect = node.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      simulation.resize(Math.round(rect.width * dpr), Math.round(rect.height * dpr));
    };
    resize();
    const observer = new ResizeObserver(resize);
    observer.observe(node);

    const frame = (now: number) => {
      raf = requestAnimationFrame(frame);
      // Clamped: the solver is stable at any dt, but a multi-second step after a
      // tab switch would teleport all the ink off screen in one frame.
      const dt = Math.min((now - last) / 1000, 1 / 30);
      last = now;
      if (!running) return;

      /* Draw itself until the visitor takes over. A still canvas gives no clue
         that it is interactive, and "drag to paint" as a caption is a worse
         answer than simply demonstrating it. */
      if (!touchedRef.current) {
        idleClock += dt;
        if (idleClock > 0.55) {
          idleClock = 0;
          idleSeed += 1.7;
          const x = 0.5 + 0.32 * Math.cos(idleSeed * 0.9);
          const y = 0.5 + 0.28 * Math.sin(idleSeed * 1.3);
          simulation.splat(
            x,
            y,
            Math.cos(idleSeed) * 900,
            Math.sin(idleSeed * 1.1) * 900,
            inkColor(idleSeed),
          );
        }
      }

      simulation.step(dt);
    };
    raf = requestAnimationFrame(frame);

    const visibility = new IntersectionObserver(
      ([entry]) => {
        running = entry.isIntersecting && !document.hidden;
        last = performance.now();
      },
      { threshold: 0.2 },
    );
    visibility.observe(node);

    const onVisibility = () => {
      running = !document.hidden;
      last = performance.now();
    };
    document.addEventListener("visibilitychange", onVisibility);

    /* ---- pointer ---- */
    let prevX = 0;
    let prevY = 0;
    let down = false;

    const toUv = (event: PointerEvent) => {
      const rect = node.getBoundingClientRect();
      return {
        x: (event.clientX - rect.left) / rect.width,
        // Flip: texture space has y up, the DOM has y down.
        y: 1 - (event.clientY - rect.top) / rect.height,
      };
    };

    const onDown = (event: PointerEvent) => {
      down = true;
      const { x, y } = toUv(event);
      prevX = x;
      prevY = y;
      if (!touchedRef.current) {
        touchedRef.current = true;
        setTouched(true);
      }
    };

    const onMove = (event: PointerEvent) => {
      const { x, y } = toUv(event);
      // Hovering paints faintly; dragging paints hard. Requiring a press to see
      // anything makes the canvas feel dead to someone just moving through it.
      const gain = down ? 6200 : 1500;
      const dx = (x - prevX) * gain;
      const dy = (y - prevY) * gain;
      prevX = x;
      prevY = y;

      if (Math.abs(dx) + Math.abs(dy) < 0.6) return;
      if (!touchedRef.current) {
        touchedRef.current = true;
        setTouched(true);
      }
      simulation.splat(x, y, dx, dy, inkColor(x * 9 + y * 5));
    };

    const onUp = () => {
      down = false;
    };

    node.addEventListener("pointerdown", onDown);
    node.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);

    return () => {
      cancelAnimationFrame(raf);
      observer.disconnect();
      visibility.disconnect();
      document.removeEventListener("visibilitychange", onVisibility);
      node.removeEventListener("pointerdown", onDown);
      node.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      simulation.dispose();
      sim.current = null;
    };
    // `settings` is deliberately excluded: it is applied by the effect above.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [supported]);

  const reset = useCallback(() => {
    sim.current?.clear();
    touchedRef.current = false;
    setTouched(false);
  }, []);

  if (!supported) {
    return (
      <div className="border border-line p-8">
        <p className="label">Fluid unavailable</p>
        <p className="mt-4 max-w-prose text-sm leading-relaxed text-ink-muted">
          This needs WebGL2 with floating-point render targets, and your browser
          does not report them. Velocity and pressure are signed and range well
          outside 0–1, so an 8-bit target genuinely cannot hold the fields — this
          is a hard requirement rather than a nice-to-have, so there is no
          degraded version to fall back to.
        </p>
      </div>
    );
  }

  return (
    <div className="border border-line">
      <div className="relative aspect-[16/9] w-full bg-base">
        <canvas ref={canvas} className="absolute inset-0 h-full w-full touch-none" />

        {!touched && (
          <p className="pointer-events-none absolute inset-x-0 bottom-6 text-center font-mono text-[0.625rem] tracking-[0.14em] uppercase text-ink-faint">
            drag to paint
          </p>
        )}
      </div>

      <div className="grid gap-8 border-t border-line p-6 md:grid-cols-4 md:p-8">
        <Slider
          id={curlId}
          label="vorticity"
          value={settings.curl}
          min={0}
          max={50}
          step={1}
          onChange={(curl) => setSettings((s) => ({ ...s, curl }))}
          note="Pushes energy back into small eddies that numerical dissipation would eat. At 0 it is a blur; this is what makes it look like ink."
        />
        <Slider
          id={dyeId}
          label="dye decay"
          value={settings.dyeDissipation}
          min={0}
          max={4}
          step={0.05}
          onChange={(dyeDissipation) => setSettings((s) => ({ ...s, dyeDissipation }))}
          note="How fast the ink fades. Exponential, so it is framerate-independent."
        />
        <Slider
          id={pressId}
          label="pressure iters"
          value={settings.pressureIterations}
          min={1}
          max={40}
          step={1}
          onChange={(pressureIterations) =>
            setSettings((s) => ({ ...s, pressureIterations }))
          }
          note="Jacobi passes enforcing incompressibility. Drop it low and the flow visibly loses volume."
        />

        <div className="flex flex-col justify-between gap-4">
          <p className="text-xs leading-relaxed text-ink-faint">
            Nine full-screen shader passes per frame over half-float textures.
            The velocity grid is 128², the ink 512² — velocity is smooth and does
            not need the resolution the visible dye does.
          </p>
          <button
            type="button"
            onClick={reset}
            className="self-start border border-line px-4 py-2 font-mono text-[0.625rem] tracking-[0.14em] uppercase text-ink-muted transition-colors hover:border-signal hover:text-signal"
          >
            Clear
          </button>
        </div>
      </div>
    </div>
  );
}

function Slider({
  id,
  label,
  value,
  min,
  max,
  step,
  onChange,
  note,
}: {
  readonly id: string;
  readonly label: string;
  readonly value: number;
  readonly min: number;
  readonly max: number;
  readonly step: number;
  readonly onChange: (value: number) => void;
  readonly note: string;
}) {
  return (
    <div>
      <div className="flex items-baseline justify-between gap-4">
        <label htmlFor={id} className="label">
          {label}
        </label>
        <span className="font-mono text-sm text-signal tabular-nums">
          {Number.isInteger(step) ? value : value.toFixed(2)}
        </span>
      </div>
      <input
        id={id}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
        className="mt-4 w-full accent-[var(--color-signal)]"
      />
      <p className="mt-3 text-xs leading-relaxed text-ink-faint">{note}</p>
    </div>
  );
}
