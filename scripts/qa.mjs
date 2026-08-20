import { chromium } from "playwright";
import AxeBuilder from "@axe-core/playwright";
import { mkdir } from "node:fs/promises";

/**
 * Accessibility and responsive QA sweep.
 *
 * Runs axe-core against every route, captures each one at the breakpoint set
 * used across the client work, and separately verifies the reduced-motion path
 * — the branch most likely to rot, because nobody browses in it by accident.
 *
 *   node scripts/qa.mjs            against the dev server
 *   BASE=https://…  node scripts/qa.mjs
 */

const BASE = process.env.BASE ?? "http://localhost:4321";
const OUT = process.env.OUT ?? "./qa-output";

const ROUTES = [
  "/",
  "/work",
  "/work/besynchro",
  "/work/job-application",
  "/about",
  "/playground",
  "/resume",
];

/* `touch` matters, not just width. Device tiering keys off pointer coarseness,
   so a 390px-wide window with a mouse still loads the WebGL hero while a real
   phone gets the static poster. Capturing without touch emulation produces
   screenshots of a state no phone ever renders. */
const BREAKPOINTS = [
  { name: "390", width: 390, height: 844, touch: true },
  { name: "768", width: 768, height: 1024, touch: true },
  { name: "1024", width: 1024, height: 768, touch: false },
  { name: "1280", width: 1280, height: 900, touch: false },
  { name: "1550", width: 1550, height: 900, touch: false },
];

await mkdir(OUT, { recursive: true });

const browser = await chromium.launch({
  args: ["--use-angle=metal", "--enable-gpu", "--ignore-gpu-blocklist"],
});

let violations = 0;
let consoleErrors = 0;

/* ---------- accessibility + console, one pass per route ---------- */

console.log("── accessibility (axe-core, wcag2a/wcag2aa) ──\n");

// axe-core requires a page from an explicit context rather than browser.newPage().
const axeContext = await browser.newContext({ viewport: { width: 1280, height: 900 } });

for (const route of ROUTES) {
  const page = await axeContext.newPage();

  const errors = [];
  page.on("console", (m) => m.type() === "error" && errors.push(m.text()));
  page.on("pageerror", (e) => errors.push(`pageerror: ${e.message}`));

  await page.goto(`${BASE}${route}`, { waitUntil: "networkidle" });
  await page.waitForTimeout(2500);

  const results = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
    .analyze();

  const serious = results.violations.filter(
    (v) => v.impact === "serious" || v.impact === "critical",
  );

  violations += results.violations.length;
  consoleErrors += errors.length;

  const status = results.violations.length === 0 ? "PASS" : "FAIL";
  console.log(
    `${status.padEnd(5)} ${route.padEnd(24)} ${results.violations.length} violations (${serious.length} serious+)`,
  );

  for (const v of results.violations) {
    console.log(`        [${v.impact}] ${v.id}: ${v.help}`);
    for (const node of v.nodes.slice(0, 3)) {
      console.log(`          ${node.target.join(" ")}`);
    }
  }

  if (errors.length) {
    for (const e of errors) console.log(`        console: ${e}`);
  }

  await page.close();
}

await axeContext.close();

/* ---------- responsive captures ---------- */

console.log("\n── responsive captures ──\n");

for (const bp of BREAKPOINTS) {
  const page = await browser.newPage({
    viewport: { width: bp.width, height: bp.height },
    hasTouch: bp.touch,
    isMobile: bp.touch,
  });

  for (const route of ROUTES) {
    await page.goto(`${BASE}${route}`, { waitUntil: "networkidle" });
    await page.waitForTimeout(2000);

    const slug = route === "/" ? "home" : route.replace(/\//g, "-").slice(1);
    await page.screenshot({ path: `${OUT}/${bp.name}-${slug}.png` });

    // Horizontal overflow is the classic responsive failure and is invisible in
    // a screenshot that has already been clipped to the viewport.
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - window.innerWidth,
    );
    if (overflow > 1) {
      console.log(`OVERFLOW ${bp.name}px ${route} — ${overflow}px wider than viewport`);
    }
  }

  console.log(`captured ${bp.name}px`);
  await page.close();
}

/* ---------- reduced motion ---------- */

console.log("\n── reduced motion ──\n");

const reduced = await browser.newPage({
  viewport: { width: 1280, height: 900 },
  reducedMotion: "reduce",
});

for (const route of ["/", "/work"]) {
  await reduced.goto(`${BASE}${route}`, { waitUntil: "networkidle" });
  await reduced.waitForTimeout(2000);

  const state = await reduced.evaluate(() => ({
    // The canvas must not exist at all: detectTier returns "off" for
    // reduced-motion, so the chunk should never even be fetched.
    canvas: Boolean(document.querySelector("canvas")),
    // Nothing may be left invisible by an animation that never ran.
    hidden: Array.from(document.querySelectorAll("h1, h2, h3, p"))
      .filter((el) => getComputedStyle(el).opacity === "0").length,
    h1: document.querySelector("h1")?.textContent?.trim().slice(0, 40),
  }));

  const ok = !state.canvas && state.hidden === 0 && Boolean(state.h1);
  console.log(
    `${ok ? "PASS " : "FAIL "} ${route.padEnd(12)} canvas=${state.canvas} invisible-text=${state.hidden}`,
  );
  await reduced.screenshot({ path: `${OUT}/reduced-motion${route === "/" ? "-home" : "-work"}.png` });
}

await reduced.close();

/* ---------- keyboard reachability ---------- */

console.log("\n── keyboard ──\n");

const kb = await browser.newPage({ viewport: { width: 1280, height: 900 } });
await kb.goto(BASE, { waitUntil: "networkidle" });
await kb.waitForTimeout(1500);

const tabbed = [];
for (let i = 0; i < 12; i += 1) {
  await kb.keyboard.press("Tab");
  tabbed.push(
    await kb.evaluate(() => {
      const el = document.activeElement;
      if (!el) return "none";
      const text = (el.textContent ?? "").trim().slice(0, 28);
      const visible = getComputedStyle(el).outlineStyle !== "none";
      return `${el.tagName.toLowerCase()}${visible ? "" : " (NO OUTLINE)"}: ${text}`;
    }),
  );
}
console.log(tabbed.map((t, i) => `  ${i + 1}. ${t}`).join("\n"));
await kb.close();

await browser.close();

console.log(
  `\n── summary ──\naxe violations: ${violations}\nconsole errors: ${consoleErrors}\ncaptures in: ${OUT}`,
);

process.exit(violations > 0 || consoleErrors > 0 ? 1 : 0);
