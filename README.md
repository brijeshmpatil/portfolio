# Portfolio — Brijesh M Patil

Source for my portfolio. Next.js 16, React 19, TypeScript, Tailwind v4, GSAP and a
WebGL hero. No CMS, no UI kit, one animation library.

## Measured

Lighthouse, production build, real (`devtools`) throttling:

| | Performance | Accessibility | Best practices | SEO | LCP | CLS | TBT |
|---|---|---|---|---|---|---|---|
| Mobile | 96 | 100 | 100 | 100 | 1.6s | 0 | 170ms |
| Desktop | 99–100 | 100 | 100 | 100 | 0.1s | 0 | 30–80ms |

The hero runs 110,000 GPU particles in a single draw call at a locked 60fps
(17.5ms worst frame, vsync-capped) on an Apple M4. `/about` reports the page's
own Core Web Vitals in your browser, so none of this has to be taken on trust.

## The point of the hero

Each particle carries three positions as vertex attributes — scattered, sampled
from the rasterised letterforms of `BRIJESH`, and inside one of eleven bars, one
per production application I have shipped. A single `uProgress` uniform, driven
by scroll, blends between them. Nothing is recomputed per frame on the CPU and no
geometry is rebuilt, which is why 110k particles cost one draw call.

`/playground` exposes the same shader with `uProgress`, particle count and size
as live controls, alongside a **GPU fluid simulation** — a Navier–Stokes solver
for incompressible flow you can paint into, running as nine full-screen shader
passes per frame over half-float textures. Raw WebGL2, no library: it is a chain
of framebuffers ping-ponging between each other, and a scene graph has nothing to
contribute to that. 60fps at dpr 2 with zero dropped frames.

## Decisions worth knowing about

Each of these was a measurement, not a preference. The reasoning is in a comment
at the relevant place in the code.

- **The WebGL chunk does not load until LCP has been reported.** Idle time alone
  was not enough — the browser reports idle early, three.js then evaluates on the
  main thread, and the paint it delays is the one being measured. A
  `PerformanceObserver` on `largest-contentful-paint` makes it structurally
  impossible for the shader to affect the metric. (`components/webgl/HeroCanvas.tsx`)
- **Touch devices get a static poster, not a smaller shader.** Shipping three.js
  to a phone cost 2.2s of script evaluation and dragged mobile performance from 99
  to 50. No particle count fixes that — the cost is parsing the library.
  (`lib/device.ts`)
- **Panels stick with CSS `position: sticky`, not ScrollTrigger's `pin`.** A pin
  injects its spacer after hydration, so 220vh of height appears after first paint
  and everything below it moves: 0.42 CLS. (`components/sections/Hero.tsx`)
- **ScrollSmoother is not used.** It translates content inside a fixed wrapper, so
  the browser never scrolls and `position: sticky` silently does nothing. The
  choice was inertial smoothing versus a layout that never shifts.
  (`lib/gsap.ts`)
- **Fonts use `display: optional`, not `swap`.** On a throttled connection the
  swap landed at ~1.3s and the metric change moved the hero text 16px — 0.093 CLS.
  (`app/layout.tsx`)
- **Link hovers are CSS, not GSAP.** A hover fires hundreds of times as a pointer
  crosses a nav, and each GSAP tween would be main-thread work. `link-wipe` and
  `link-swap` animate transform only, so the compositor owns them and they stay
  smooth while the WebGL hero runs. (`app/link.css`)
- **The hero morph holds on plateaus, but raw scroll is published too.** Mapping
  progress linearly left the wordmark formed for ~250px of a 1980px runway; adding
  plateaus fixed that but created a stretch where nothing moved and the page read
  as frozen. The store publishes both, so the point cloud always has something to
  respond to. (`lib/hero-progress.ts`)
- **`body` has no `overflow-x`.** It makes body a clipping container, which breaks
  sticky descendants, and it was hiding a real mobile nav overflow rather than
  fixing it. (`app/globals.css`)

## Running it

```bash
yarn install
yarn dev              # http://localhost:3000
yarn build && yarn start
```

## Verification scripts

These are the ones that found most of the above. All expect a running server;
pass `BASE=` to point at a deployment.

```bash
node scripts/qa.mjs           # axe-core on every route, captures at 5 breakpoints,
                              # reduced-motion and keyboard checks, overflow assertions
node scripts/perf.mjs         # reads the hero's own render-stats HUD, on a real GPU
node scripts/morph.mjs        # captures the morph as stills
node scripts/check-links.mjs  # asserts every outbound client link still resolves
```

`scripts/perf.mjs` forces ANGLE Metal deliberately. Headless Chromium defaults to
SwiftShader, a software rasteriser, where frame times are roughly constant no
matter what the shader does — it will tell you a change made no difference when on
real hardware it halved the frame time.

## Structure

```
src/app/            routes — all static, case studies prerendered
src/components/     webgl/ motion/ sections/ work/ case-study/ about/ ui/
src/content/        typed project data, zod-validated at module load
src/lib/            gsap registration, device tiering, particle targets, fluid solver, types
scripts/            QA and measurement tooling
```

Project content is authored in TypeScript and parsed through zod schemas, so a
malformed entry fails the build rather than rendering a broken card. Live-URL
status is explicit: storefronts that are password-gated or no longer serving are
listed without a link rather than pointing you at an error page.
