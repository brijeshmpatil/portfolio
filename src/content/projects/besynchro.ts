import { defineProject } from "@/lib/types";

export const besynchro = defineProject({
  slug: "besynchro",
  name: "Synchro",
  tagline: "Cutting 1.5–3s off a landing page without touching the design",
  vertical: "ecommerce",
  depth: "case-study",
  order: 1,
  year: "2025 — 2026",
  role: "Performance lead",
  liveStatus: "live",
  url: "https://besynchro.com",
  stack: [
    "Shopify Liquid",
    "TypeScript",
    "three.js",
    "GSAP",
    "Svelte islands",
    "webpack 5",
  ],
  metrics: [
    { value: "1.5–3s", label: "mobile load saved", note: "landing page, measured field + lab" },
    { value: "80KB", label: "render-blocking CSS removed", note: "FontAwesome alone" },
    { value: "8", label: "bottlenecks shipped", note: "from a two-pass speed audit" },
  ],
  summary:
    "A wellness supplements storefront on a heavily customised Shopify theme. Ran a two-pass speed audit on the highest-traffic landing page and shipped eight fixes — all of them in the critical path, none of them visible to the user.",
  sections: [
    {
      heading: "The problem",
      body: [
        "The Gold Liposomal landing page was the single highest-spend acquisition surface on the store, and the slowest. It ran on its own bespoke layout, several generations removed from the base theme, and had accumulated the usual archaeology: a marketing tag added directly to the layout rather than through the tag manager, an A/B testing script loading synchronously, an icon font nobody was using at full weight.",
        "Nothing was broken. That is what made it hard — every individual addition had been reasonable at the time, and the page looked exactly as designed. The cost was entirely in load order.",
      ],
    },
    {
      heading: "Approach",
      body: [
        "I audited the layout twice: once against lab traces to find what was blocking the render path, then again against the live document to confirm each script was actually still needed. Two of the eight findings turned out to be duplicates of things the tag manager was already loading — the cheapest wins available, because removing them changed nothing except the waterfall.",
        "The fixes were ordered by risk, not by size, so the zero-risk changes shipped first and the ones needing client sign-off did not hold up the rest.",
      ],
      points: [
        "Added font-display: swap to three @font-face rules — eliminated the invisible-text window at zero risk",
        "Added preconnect and dns-prefetch resource hints for the tag manager, font hosts and the review, payment and testing vendors",
        "Removed a Google Ads gtag snippet loading separately from the tag manager, and moved the Bing UET pixel into the container alongside it",
        "Removed a synchronous, render-blocking A/B testing script once it was confirmed no test was running",
        "Deferred an ~80KB render-blocking icon-font stylesheet using the media=\"print\" onload pattern",
        "Deferred ~20KB of inline review-widget CSS behind an IntersectionObserver, so it loads on scroll rather than on paint",
        "Dropped a chat-widget stylesheet and disabled the corresponding app embed",
      ],
    },
    {
      heading: "The part worth talking about",
      body: [
        "The audit also surfaced a third-party script using eval() and calling two domains that had nothing to do with any vendor the client had knowingly installed. I stopped, flagged it for verification rather than removing it unilaterally, and documented exactly what it was doing.",
        "That is the less glamorous half of performance work: most of the wins are deletions, and you cannot delete anything safely until you know who put it there and why.",
      ],
    },
    {
      heading: "Elsewhere on the same build",
      body: [
        "Beyond the landing page, this theme is where most of the store's interactive work lives — a three.js hero, GSAP scroll sequences, and Svelte islands mounted into Liquid sections for the pieces that genuinely needed state. It also ran a three-way homepage banner test, which is the reason the layout had accumulated as much tooling as it had.",
      ],
    },
  ],
});
