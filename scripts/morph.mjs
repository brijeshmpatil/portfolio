import { chromium } from "playwright";

/**
 * Captures the hero morph at fixed fractions of the pinned scroll range, so the
 * scatter → wordmark → grid sequence can be reviewed as stills.
 */
const BASE = process.env.BASE ?? "http://localhost:4321";
const OUT = process.env.OUT ?? ".";

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

const errors = [];
page.on("console", (m) => m.type() === "error" && errors.push(m.text()));
page.on("pageerror", (e) => errors.push(`PAGEERROR: ${e.message}`));

await page.goto(BASE, { waitUntil: "networkidle" });
await page.waitForTimeout(3500);

// The hero pins for 220% of viewport height. Sample across that range.
const vh = 900;
for (const [name, fraction] of [
  ["0-scatter", 0],
  ["1-forming", 0.3],
  ["2-wordmark", 0.5],
  ["3-breaking", 0.72],
  ["4-grid", 0.98],
]) {
  await page.evaluate((y) => window.scrollTo(0, y), fraction * vh * 2.2);
  // Scrub is eased, so allow the tween to settle before capturing.
  await page.waitForTimeout(2200);
  await page.screenshot({ path: `${OUT}/morph-${name}.png` });
}

console.log(JSON.stringify({ errors }, null, 2));
await browser.close();
