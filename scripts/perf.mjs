import { chromium } from "playwright";

/**
 * Reads the hero's own render-stats HUD on real GPU hardware.
 *
 * The GPU flags are essential. Headless Chromium defaults to SwiftShader, a
 * software rasteriser — measurements taken there are roughly constant no matter
 * how much work the shader does, so they will happily tell you a change made no
 * difference when on real hardware it halved the frame time.
 */
const BASE = process.env.BASE ?? "http://localhost:4321";

const browser = await chromium.launch({
  args: [
    "--use-angle=metal",
    "--enable-gpu",
    "--ignore-gpu-blocklist",
    "--enable-features=Vulkan",
  ],
});

const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
await page.goto(BASE, { waitUntil: "networkidle" });
await page.waitForTimeout(3000);

const renderer = await page.evaluate(() => {
  const gl = document.createElement("canvas").getContext("webgl2");
  const ext = gl?.getExtension("WEBGL_debug_renderer_info");
  return ext ? gl?.getParameter(ext.UNMASKED_RENDERER_WEBGL) : "unknown";
});
console.log(`renderer: ${renderer}\n`);

// Scope to the HUD specifically: the mobile menu trigger also carries
// aria-expanded and is display:none at desktop widths, so a bare
// [aria-expanded] selector waits forever on a hidden element.
await page.getByRole("button", { name: /render stats/i }).click();

// Sample at each phase of the morph — drift is most expensive at progress 0,
// where nothing is locked and the flow field is at full strength.
for (const [label, y] of [
  ["scatter", 0],
  ["wordmark", 990],
  ["bars", 1950],
]) {
  await page.evaluate((v) => window.scrollTo(0, v), y);
  // Let the scrub settle, then let the HUD accumulate a few sample windows.
  await page.waitForTimeout(4000);
  const rows = (await page.locator("dl").first().innerText()).split("\n");
  const read = (key) => rows[rows.findIndex((r) => r.toLowerCase() === key) + 1];
  console.log(
    `${label.padEnd(9)} fps=${read("fps")}  worst=${read("worst frame")}  morph=${read("morph")}`,
  );
}

await browser.close();
