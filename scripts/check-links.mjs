/**
 * Verifies every outbound URL in the project content is reachable.
 *
 * A portfolio linking to a dead client site is worse than not linking at all, so
 * this runs before a deploy. Several of these stores have been password-gated or
 * taken down since the work shipped, which is exactly why liveStatus is explicit
 * in the content and why this check exists to keep it honest.
 *
 *   node scripts/check-links.mjs
 */

import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";

const DIR = "src/content/projects";

const files = (await readdir(DIR)).filter((f) => f.endsWith(".ts") && f !== "index.ts");

/** Collect url/repoUrl literals along with the file they came from. */
const targets = [];

for (const file of files) {
  const source = await readFile(join(DIR, file), "utf8");
  for (const match of source.matchAll(/(?:url|repoUrl):\s*"([^"]+)"/g)) {
    targets.push({ file, url: match[1] });
  }
}

// Some storefronts reject a bare programmatic client with 403 while serving
// browsers fine, so send a realistic UA.
const HEADERS = {
  "user-agent":
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0 Safari/537.36",
  accept: "text/html,application/xhtml+xml",
};

async function check(url) {
  // HEAD is cheaper but a lot of Shopify storefronts do not implement it
  // correctly, so fall back to GET on anything non-2xx.
  for (const method of ["HEAD", "GET"]) {
    try {
      const response = await fetch(url, {
        method,
        headers: HEADERS,
        redirect: "follow",
        signal: AbortSignal.timeout(15_000),
      });
      if (response.ok) return { status: response.status, final: response.url };
      if (method === "GET") return { status: response.status, final: response.url };
    } catch (error) {
      if (method === "GET") return { status: 0, error: String(error.message ?? error) };
    }
  }
  return { status: 0, error: "unreachable" };
}

const results = await Promise.all(
  targets.map(async (target) => ({ ...target, ...(await check(target.url)) })),
);

let failed = 0;

for (const result of results.sort((a, b) => a.url.localeCompare(b.url))) {
  const ok = result.status >= 200 && result.status < 400;
  if (!ok) failed += 1;

  const redirected =
    result.final && new URL(result.final).origin !== new URL(result.url).origin
      ? ` -> ${new URL(result.final).origin}`
      : "";

  console.log(
    `${ok ? "OK  " : "FAIL"} ${String(result.status).padEnd(4)} ${result.url}${redirected}${
      result.error ? `  (${result.error})` : ""
    }`,
  );
}

console.log(`\n${results.length} links checked, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
