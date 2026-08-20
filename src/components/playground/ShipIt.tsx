"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createState, launch, restart, step } from "@/lib/game/engine";
import { render } from "@/lib/game/render";
import { ROUND_SECONDS, STEP, WORLD, type GameState, type Status } from "@/lib/game/types";

const HIGH_SCORE_KEY = "shipit:best";

/**
 * "Ship It" — an arcade round where the bricks are the eleven production
 * applications.
 *
 * Written against requestAnimationFrame with a fixed-timestep accumulator rather
 * than with an animation library. GSAP and Framer Motion are tweening libraries:
 * they interpolate a property from A to B over a duration. A game has no B — the
 * next frame depends on collisions resolved in this one. Using a tween library
 * here would mean fighting it, and a variable timestep would make the physics
 * behave differently on a 60Hz and a 144Hz display.
 *
 * The loop is paused whenever the canvas is off screen or the tab is hidden, the
 * same discipline as the hero.
 */
export function ShipIt() {
  const canvas = useRef<HTMLCanvasElement>(null);
  const wrapper = useRef<HTMLDivElement>(null);

  const state = useRef<GameState>(createState());
  const keyDir = useRef(0);
  const pointerX = useRef<number | null>(null);
  const running = useRef(false);

  // Mirrored into React state only for the HUD, at ~10Hz rather than per frame.
  const [hud, setHud] = useState({
    score: 0,
    combo: 0,
    lives: 3,
    timeLeft: ROUND_SECONDS,
    status: "ready" as Status,
    bricks: 11,
  });
  /* Read once, lazily, on the first client render rather than in an effect.
     localStorage is synchronous and available immediately, so an effect would
     paint a zero first and then correct it. The initialiser is guarded because
     it also runs during the server render of a dynamic() import in some paths. */
  const [best, setBest] = useState(() => {
    if (typeof window === "undefined") return 0;
    const stored = Number(window.localStorage.getItem(HIGH_SCORE_KEY) ?? 0);
    return Number.isFinite(stored) ? stored : 0;
  });

  const commitBest = useCallback((score: number) => {
    setBest((current) => {
      if (score <= current) return current;
      window.localStorage.setItem(HIGH_SCORE_KEY, String(score));
      return score;
    });
  }, []);

  const reset = useCallback(() => {
    state.current = restart();
    setHud({
      score: 0,
      combo: 0,
      lives: 3,
      timeLeft: ROUND_SECONDS,
      status: "ready",
      bricks: state.current.bricks.length,
    });
  }, []);

  /* ---------- the loop ---------- */

  useEffect(() => {
    const node = canvas.current;
    const box = wrapper.current;
    if (!node || !box) return;

    const ctx = node.getContext("2d", { alpha: false });
    if (!ctx) return;

    let raf = 0;
    let last = performance.now();
    let accumulator = 0;
    let hudClock = 0;
    let width = 0;
    let height = 0;
    let dpr = 1;

    const resize = () => {
      const rect = box.getBoundingClientRect();
      // Capped at 2: this is flat colour and large shapes, so beyond 2x the extra
      // fragments buy nothing and cost fill rate on a retina display.
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = rect.width;
      height = rect.height;
      node.width = Math.round(width * dpr);
      node.height = Math.round(height * dpr);
    };

    resize();
    const observer = new ResizeObserver(resize);
    observer.observe(box);

    const frame = (now: number) => {
      raf = requestAnimationFrame(frame);

      const rawDelta = (now - last) / 1000;
      last = now;
      if (!running.current) return;

      // Clamp: after a tab switch or a long stall the delta can be seconds, and
      // feeding that into the accumulator would run thousands of steps at once
      // and freeze the page.
      accumulator += Math.min(rawDelta, 0.1);

      while (accumulator >= STEP) {
        step(state.current, { keyDir: keyDir.current, pointerX: pointerX.current }, STEP);
        accumulator -= STEP;
      }

      render(ctx, state.current, width, height, dpr);

      hudClock += rawDelta;
      if (hudClock >= 0.1) {
        hudClock = 0;
        const s = state.current;
        setHud({
          score: s.score,
          combo: s.combo,
          lives: s.lives,
          timeLeft: s.timeLeft,
          status: s.status,
          bricks: s.bricks.length,
        });
        if (s.status === "won" || s.status === "lost") commitBest(s.score);
      }
    };

    raf = requestAnimationFrame(frame);

    const visibility = new IntersectionObserver(
      ([entry]) => {
        running.current = entry.isIntersecting && !document.hidden;
        last = performance.now();
      },
      { threshold: 0.25 },
    );
    visibility.observe(box);

    const onVisibility = () => {
      running.current = !document.hidden;
      last = performance.now();
    };
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      cancelAnimationFrame(raf);
      observer.disconnect();
      visibility.disconnect();
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [commitBest]);

  /* ---------- input ---------- */

  useEffect(() => {
    const box = wrapper.current;
    if (!box) return;

    const toWorld = (clientX: number) => {
      const rect = box.getBoundingClientRect();
      const scale = Math.min(rect.width / WORLD.w, rect.height / WORLD.h);
      const offsetX = (rect.width - WORLD.w * scale) / 2;
      return (clientX - rect.left - offsetX) / scale;
    };

    const onPointerMove = (event: PointerEvent) => {
      pointerX.current = toWorld(event.clientX);
    };
    const onPointerLeave = () => {
      pointerX.current = null;
    };

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "ArrowLeft" || event.key === "a") {
        pointerX.current = null;
        keyDir.current = -1;
      }
      if (event.key === "ArrowRight" || event.key === "d") {
        pointerX.current = null;
        keyDir.current = 1;
      }
      if (event.key === " " || event.key === "Enter") {
        // Only intercept space while the canvas has focus, so it does not steal
        // page scrolling from someone who is not playing.
        if (document.activeElement === box) {
          event.preventDefault();
          if (state.current.status === "ready") launch(state.current);
          else if (state.current.status !== "playing") reset();
        }
      }
    };

    const onKeyUp = (event: KeyboardEvent) => {
      if (["ArrowLeft", "ArrowRight", "a", "d"].includes(event.key)) keyDir.current = 0;
    };

    const onPointerDown = () => {
      box.focus();
      if (state.current.status === "ready") launch(state.current);
      else if (state.current.status !== "playing") reset();
    };

    box.addEventListener("pointermove", onPointerMove);
    box.addEventListener("pointerleave", onPointerLeave);
    box.addEventListener("pointerdown", onPointerDown);
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);

    return () => {
      box.removeEventListener("pointermove", onPointerMove);
      box.removeEventListener("pointerleave", onPointerLeave);
      box.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
    };
  }, [reset]);

  const over = hud.status === "won" || hud.status === "lost";
  /* A mid-round relaunch is not the same state as the start of a round. Showing
     the full intro every time a ball is lost buries the board under a wall of
     instructions the player has already read, and blurring it hides the brick
     layout they are trying to aim at. */
  const midRound = hud.status === "ready" && hud.lives < 3;
  const showIntro = hud.status === "ready" && !midRound;

  return (
    <div className="border border-line">
      <div className="flex flex-wrap items-center justify-between gap-x-8 gap-y-3 border-b border-line px-5 py-4 font-mono text-[0.625rem] tracking-[0.14em] uppercase md:px-8">
        <Stat label="score" value={hud.score.toLocaleString("en-US")} accent />
        <Stat label="best" value={best.toLocaleString("en-US")} />
        <Stat label="combo" value={hud.combo > 1 ? `×${hud.combo}` : "—"} />
        <Stat label="left" value={String(hud.bricks)} />
        <Stat label="lives" value={"●".repeat(Math.max(0, hud.lives)) || "—"} />
        <Stat label="time" value={`${Math.ceil(hud.timeLeft)}s`} accent={hud.timeLeft < 10} />
      </div>

      <div
        ref={wrapper}
        tabIndex={0}
        role="application"
        aria-label="Ship It — a Breakout round where the bricks are the eleven shipped applications. Move with the pointer or arrow keys, launch with space."
        className={[
          "relative aspect-[1000/620] w-full touch-none bg-base outline-none",
          "focus-visible:ring-2 focus-visible:ring-signal",
          // Hide the cursor only while actually playing; an overlay with a
          // button needs a pointer you can see.
          hud.status === "playing" ? "cursor-none" : "cursor-pointer",
        ].join(" ")}
      >
        <canvas ref={canvas} className="absolute inset-0 h-full w-full" />

        {/* Mid-round: a single unobtrusive line, board fully visible */}
        {midRound && (
          <div className="pointer-events-none absolute inset-x-0 bottom-[22%] flex justify-center">
            <p className="border border-line bg-void/80 px-4 py-2 font-mono text-[0.625rem] tracking-[0.14em] uppercase text-ink-muted">
              Ball lost · {hud.lives} left — click or space
            </p>
          </div>
        )}

        {(showIntro || over) && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-void/70 px-6 text-center backdrop-blur-sm">
            {over ? (
              <>
                <p className="label">{hud.status === "won" ? "Cleared" : "Round over"}</p>
                <p className="font-mono text-4xl text-signal tabular-nums">
                  {hud.score.toLocaleString("en-US")}
                </p>
                <p className="max-w-sm text-sm text-ink-muted">
                  {hud.status === "won"
                    ? "All eleven shipped. Time remaining was added to your score."
                    : hud.lives <= 0
                      ? "Out of lives."
                      : "Out of time."}
                </p>
                {hud.score > 0 && hud.score >= best && (
                  <p className="font-mono text-[0.625rem] tracking-[0.14em] uppercase text-signal">
                    new best
                  </p>
                )}
              </>
            ) : (
              <>
                <p className="label">Ship It</p>
                <p className="max-w-md text-sm text-ink-muted">
                  Eleven bricks, eleven production applications. Amber ones take two
                  hits. Combo counts bricks broken between paddle touches, so keeping
                  the ball up top is worth far more than clearing steadily.
                </p>
              </>
            )}

            <button
              type="button"
              onClick={() => {
                wrapper.current?.focus();
                if (over) reset();
                else launch(state.current);
              }}
              className="mt-2 border border-signal px-5 py-2.5 font-mono text-[0.6875rem] tracking-[0.14em] uppercase text-signal transition-colors hover:bg-signal hover:text-void"
            >
              {over ? "Play again" : "Launch"}
            </button>

            <p className="font-mono text-[0.5625rem] tracking-[0.14em] uppercase text-ink-faint">
              pointer or ← → · space to launch
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

function Stat({
  label,
  value,
  accent = false,
}: {
  readonly label: string;
  readonly value: string;
  readonly accent?: boolean;
}) {
  return (
    <div className="flex items-baseline gap-2">
      <span className="text-ink-faint">{label}</span>
      <span className={`tabular-nums ${accent ? "text-signal" : "text-ink"}`}>{value}</span>
    </div>
  );
}
