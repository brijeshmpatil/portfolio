"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  Bodies,
  Body,
  Composite,
  Engine,
  Mouse,
  MouseConstraint,
  Runner,
  type IChamferableBodyDefinition,
} from "matter-js";

/** What gets dropped in. Each becomes one rigid body. */
const GLYPHS = "BRIJESH".split("");
const STACK = ["REACT", "TS", "GSAP", "WEBGL"];

/* Short and wide on purpose. Gravity settles everything into a pile at the
   bottom, so a tall world just means a large empty box above the interesting
   part — at 560 high the pile occupied under a fifth of the frame. */
const WORLD = { w: 1000, h: 400 } as const;
const WALL = 60;

type Kind = "glyph" | "tag";

type Piece = {
  readonly body: Body;
  readonly label: string;
  readonly kind: Kind;
  readonly w: number;
  readonly h: number;
};

/**
 * Rigid-body typography.
 *
 * matter-js does the physics; the rendering is hand-written canvas rather than
 * matter's built-in renderer, which draws debug wireframes and has no concept of
 * a glyph. So matter owns positions and rotations, and this owns everything
 * visible — which is the right split, and the reason the result looks like type
 * rather than like a physics demo.
 *
 * Bodies are rectangles, not glyph outlines. Per-letter concave hulls would be
 * more faithful and considerably worse: concave collision is expensive and
 * unstable, and at this size nobody can tell that the R is colliding as a box.
 */
export function TypePhysics() {
  const canvas = useRef<HTMLCanvasElement>(null);
  const wrapper = useRef<HTMLDivElement>(null);
  const engineRef = useRef<Engine | null>(null);
  const piecesRef = useRef<Piece[]>([]);
  const [count, setCount] = useState(0);

  const build = useCallback((engine: Engine) => {
    Composite.clear(engine.world, false);
    piecesRef.current = [];

    const walls: IChamferableBodyDefinition = {
      isStatic: true,
      render: { visible: false },
    };
    Composite.add(engine.world, [
      // Floor and side walls sunk half their thickness outside the play area, so
      // the visible boundary is exactly the canvas edge.
      Bodies.rectangle(WORLD.w / 2, WORLD.h + WALL / 2, WORLD.w * 2, WALL, walls),
      Bodies.rectangle(-WALL / 2, WORLD.h / 2, WALL, WORLD.h * 3, walls),
      Bodies.rectangle(WORLD.w + WALL / 2, WORLD.h / 2, WALL, WORLD.h * 3, walls),
    ]);

    const pieces: Piece[] = [];

    // The name, dropped from above in sequence.
    GLYPHS.forEach((label, i) => {
      const w = 92;
      const h = 108;
      const x = WORLD.w / 2 + (i - (GLYPHS.length - 1) / 2) * (w + 14);
      const body = Bodies.rectangle(x, -140 - i * 130, w, h, {
        restitution: 0.42,
        friction: 0.35,
        frictionAir: 0.008,
        density: 0.0016,
        angle: (Math.random() - 0.5) * 0.5,
      });
      pieces.push({ body, label, kind: "glyph", w, h });
    });

    // A few stack tags, wider and lighter, to give the pile some variety.
    STACK.forEach((label, i) => {
      const w = 34 + label.length * 19;
      const h = 52;
      const body = Bodies.rectangle(
        160 + i * 210,
        -700 - i * 160,
        w,
        h,
        {
          restitution: 0.5,
          friction: 0.3,
          frictionAir: 0.01,
          density: 0.001,
          angle: (Math.random() - 0.5) * 1.1,
        },
      );
      pieces.push({ body, label, kind: "tag", w, h });
    });

    Composite.add(engine.world, pieces.map((p) => p.body));
    piecesRef.current = pieces;
    setCount(pieces.length);
  }, []);

  useEffect(() => {
    const node = canvas.current;
    const box = wrapper.current;
    if (!node || !box) return;

    const ctx = node.getContext("2d", { alpha: false });
    if (!ctx) return;

    const engine = Engine.create({ gravity: { x: 0, y: 1.1, scale: 0.001 } });
    engineRef.current = engine;
    build(engine);

    // Matter's Runner keeps its own fixed timestep, which is exactly what a
    // physics engine should own — no accumulator needed on this side.
    const runner = Runner.create();
    Runner.run(runner, engine);

    /* Drag support. The mouse has to be scaled from CSS pixels into world units
       or the grab point drifts away from the cursor as the canvas is resized. */
    const mouse = Mouse.create(node);
    const constraint = MouseConstraint.create(engine, {
      mouse,
      constraint: { stiffness: 0.18, render: { visible: false } },
    });
    Composite.add(engine.world, constraint);

    /* matter-js attaches wheel handlers that swallow page scrolling over the
       canvas, so scrolling stalls whenever the pointer is over the demo.
       `mousewheel` is real at runtime but missing from the published types,
       hence the cast — narrowed to exactly the shape being used rather than any. */
    const wheelHandler = (mouse as unknown as { mousewheel: EventListener })
      .mousewheel;
    node.removeEventListener("wheel", wheelHandler);
    node.removeEventListener("DOMMouseScroll", wheelHandler);

    let width = 0;
    let height = 0;
    let scale = 1;
    let dpr = 1;

    const resize = () => {
      const rect = box.getBoundingClientRect();
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = rect.width;
      height = rect.height;
      node.width = Math.round(width * dpr);
      node.height = Math.round(height * dpr);
      scale = Math.min(width / WORLD.w, height / WORLD.h);
      mouse.pixelRatio = 1 / scale;
    };
    resize();
    const observer = new ResizeObserver(resize);
    observer.observe(box);

    let raf = 0;
    let running = true;

    const draw = () => {
      raf = requestAnimationFrame(draw);
      if (!running) return;

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.fillStyle = "#0d0f11";
      ctx.fillRect(0, 0, width, height);

      const offsetX = (width - WORLD.w * scale) / 2;
      const offsetY = (height - WORLD.h * scale) / 2;
      ctx.translate(offsetX, offsetY);
      ctx.scale(scale, scale);

      ctx.textAlign = "center";
      ctx.textBaseline = "middle";

      for (const piece of piecesRef.current) {
        const { position, angle } = piece.body;
        ctx.save();
        ctx.translate(position.x, position.y);
        ctx.rotate(angle);

        if (piece.kind === "glyph") {
          ctx.fillStyle = "#14171a";
          ctx.strokeStyle = "#ffae35";
          ctx.lineWidth = 1.5;
          ctx.fillRect(-piece.w / 2, -piece.h / 2, piece.w, piece.h);
          ctx.strokeRect(-piece.w / 2, -piece.h / 2, piece.w, piece.h);
          ctx.fillStyle = "#ffae35";
          ctx.font = "700 66px ui-sans-serif, system-ui, sans-serif";
        } else {
          ctx.fillStyle = "#1d2227";
          ctx.strokeStyle = "#2c333a";
          ctx.lineWidth = 1.5;
          ctx.fillRect(-piece.w / 2, -piece.h / 2, piece.w, piece.h);
          ctx.strokeRect(-piece.w / 2, -piece.h / 2, piece.w, piece.h);
          ctx.fillStyle = "#9aa7b4";
          ctx.font = "600 20px ui-monospace, monospace";
        }

        ctx.fillText(piece.label, 0, 2);
        ctx.restore();
      }

      ctx.setTransform(1, 0, 0, 1, 0, 0);
    };
    raf = requestAnimationFrame(draw);

    const visibility = new IntersectionObserver(
      ([entry]) => {
        running = entry.isIntersecting && !document.hidden;
        // Pause the physics too, not just the drawing: a simulation running
        // off-screen is the same waste as a render loop running off-screen.
        runner.enabled = running;
      },
      { threshold: 0.15 },
    );
    visibility.observe(box);

    const onVisibility = () => {
      running = !document.hidden;
      runner.enabled = running;
    };
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      cancelAnimationFrame(raf);
      observer.disconnect();
      visibility.disconnect();
      document.removeEventListener("visibilitychange", onVisibility);
      Runner.stop(runner);
      Composite.clear(engine.world, false);
      Engine.clear(engine);
      engineRef.current = null;
    };
  }, [build]);

  const shake = useCallback(() => {
    for (const piece of piecesRef.current) {
      Body.applyForce(piece.body, piece.body.position, {
        x: (Math.random() - 0.5) * 0.42,
        y: -Math.random() * 0.5,
      });
    }
  }, []);

  const reset = useCallback(() => {
    const engine = engineRef.current;
    if (engine) build(engine);
  }, [build]);

  return (
    <div className="border border-line">
      <div
        ref={wrapper}
        className="relative aspect-[1000/400] w-full cursor-grab touch-none bg-base active:cursor-grabbing"
      >
        <canvas ref={canvas} className="absolute inset-0 h-full w-full" />
      </div>

      <div className="flex flex-wrap items-center justify-between gap-x-8 gap-y-4 border-t border-line p-6 md:p-8">
        <p className="max-w-lg text-xs leading-relaxed text-ink-faint">
          {count} rigid bodies. matter-js owns positions and rotations; the
          drawing is hand-written canvas, because matter&apos;s own renderer draws
          debug wireframes and has no concept of a glyph. Grab a letter and throw
          it.
        </p>

        <div className="flex gap-3">
          <button
            type="button"
            onClick={shake}
            className="border border-line px-4 py-2 font-mono text-[0.625rem] tracking-[0.14em] uppercase text-ink-muted transition-colors hover:border-signal hover:text-signal"
          >
            Shake
          </button>
          <button
            type="button"
            onClick={reset}
            className="border border-line px-4 py-2 font-mono text-[0.625rem] tracking-[0.14em] uppercase text-ink-muted transition-colors hover:border-signal hover:text-signal"
          >
            Drop again
          </button>
        </div>
      </div>
    </div>
  );
}
