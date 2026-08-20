import { defineProject } from "@/lib/types";

export const snsHealth = defineProject({
  slug: "sns-health",
  name: "Sports Nutrition Source",
  tagline: "The first one I owned end to end",
  vertical: "ecommerce",
  depth: "case-study",
  order: 9,
  year: "2024",
  role: "Frontend engineer",
  // snshealth.com and snshealth.ca both return HTTP 423 — the storefront is
  // behind a password page, so there is nothing to link a visitor to.
  liveStatus: "gated",
  stack: ["Shopify Liquid", "TypeScript", "Svelte", "print-js", "webpack 5"],
  metrics: [],
  summary:
    "A Canadian sports nutrition retailer, and the earliest build in this set — the first storefront where I was responsible for the whole frontend rather than a section of one.",
  sections: [
    {
      heading: "Why it is here",
      body: [
        "The storefront is currently behind a password page, so there is nothing to link to and no live work to point at. It is in this list anyway, because it is where a habit started that shows up in everything above it.",
      ],
    },
    {
      heading: "What it taught me",
      body: [
        "This was the first build where I could not blame an existing pattern for anything, and the first where I had to answer for the whole page weight rather than my part of it. Two things came out of it that I have not stopped doing.",
        "The first is treating each template as its own JavaScript budget rather than treating the theme as one bundle. Once you can see that a collection page is downloading the code for a product configurator it will never render, you cannot un-see it, and the fix is a build configuration rather than an optimisation project.",
        "The second is that print output is a real feature, not an afterthought. Wholesale and B2B customers print things — order summaries, product sheets — and a page that has never been checked in a print stylesheet prints badly in a way that is immediately visible to the customer and invisible to the developer.",
      ],
      points: [
        "Per-template JavaScript budgets rather than a single theme bundle",
        "Print stylesheets treated as a supported output, not an accident",
        "Svelte islands for interactive sections, static Liquid everywhere else",
      ],
    },
  ],
});
