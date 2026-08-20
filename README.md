# Portfolio — Brijesh M Patil

Source for my portfolio. Next.js 16, React 19, TypeScript, Tailwind v4, GSAP and
two WebGL simulations. No CMS, no UI kit.

## Measured

Lighthouse, production build, real (`devtools`) throttling:

| | Performance | Accessibility | Best practices | SEO | LCP | CLS | TBT |
|---|---|---|---|---|---|---|---|
| Mobile | 96 | 100 | 100 | 100 | 1.6s | 0 | 170ms |
| Desktop | 99–100 | 100 | 100 | 100 | 0.1s | 0 | 30–80ms |

Locked 60fps with zero dropped frames at dpr 2 on an Apple M4, for both the hero
and the playground. `/about` reports the page's own Core Web Vitals in your
browser, so none of this has to be taken on trust.

## The hero

A Navier–Stokes solver for incompressible flow, seeded with the letterforms of
`BRIJESH` so the name blooms out of the ink and then dissolves as the pointer
pushes through it. Nine full-screen shader passes per frame over half-float
textures — advect, add vorticity, compute divergence, solve pressure, subtract
its gradient — in raw WebGL2. No library: it is a chain of framebuffers
ping-ponging between each other, and a scene graph has nothing to contribute.

Two details carry it:

- **Vorticity confinement.** Numerical dissipation in the advection step quietly
  eats small eddies. Measuring the surviving curl and pushing energy back into it
  is the entire difference between ink in water and a blur.
- **A two-phase seed.** A fluid solver's job is to *destroy* structure, so crisp
  type becomes a beautiful illegible cloud within a second. The flow is held
  almost still while the ink lands and resolves, then released. The name reads for
  about two seconds and becomes the abstract field after that.

Fullscreen is nearly free: the solver passes run at fixed 128² and 512² texture
sizes regardless of viewport, so only the final display pass scales.

`/playground` has the GPU particle field that used to be the hero — 110,000
particles in one draw call, morphing between scattered, the letterforms of my
name, and eleven bars, one per production application, with `uProgress` on a
slider. Plus rigid-body typography on matter-js.

## Decisions worth knowing about

Each of these was a measurement, not a preference. The reasoning is in a comment
at the relevant place in the code.

- **The WebGL chunk does not load until LCP has been reported.** Idle time alone
  was not enough — the browser reports idle early, three.js then evaluates on the
  main thread, and the paint it delays is the one being measured. A
  `PerformanceObserver` on `largest-contentful-paint` makes it structurally
  impossible for the shader to affect the metric. (`components/webgl/HeroCanvas.tsx`)
- **Touch devices get a static poster, not a smaller simulation.** Shipping a
  WebGL2 chunk to a phone cost 2.2s of script evaluation and dragged mobile
  performance from 99 to 50. Turning the quality down does not fix that — the cost
  is parsing, before anything is drawn. (`lib/device.ts`, `components/webgl/HeroFluid.tsx`)
- **Shader programs are linked without querying `LINK_STATUS`.**
  `getProgramParameter(LINK_STATUS)` blocks until the driver has finished
  compiling, so asking for it at mount serialises all nine programs onto the main
  thread: 460ms of Total Blocking Time, desktop Lighthouse 100 → 79. All nine
  links are started first and status is read only once
  `KHR_parallel_shader_compile` reports completion. Back to 0ms.
  (`lib/fluid/simulation.ts`)
- **The work rail sticks with CSS `position: sticky`, not ScrollTrigger's `pin`.**
  A pin injects its spacer after hydration, so height appears after first paint
  and everything below it moves: 0.42 CLS. (`components/sections/WorkRail.tsx`)
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
src/lib/            gsap registration, device tiering, fluid solver, text sampling, types
scripts/            QA and measurement tooling
```

Project content is authored in TypeScript and parsed through zod schemas, so a
malformed entry fails the build rather than rendering a broken card. Live-URL
status is explicit: storefronts that are password-gated or no longer serving are
listed without a link rather than pointing you at an error page.
