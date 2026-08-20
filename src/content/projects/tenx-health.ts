import { defineProject } from "@/lib/types";

export const tenxHealth = defineProject({
  slug: "10x-health",
  name: "10X Health Network",
  tagline: "Putting mandatory consent inside checkout, where it cannot be skipped",
  vertical: "healthcare",
  depth: "case-study",
  order: 4,
  year: "2026",
  role: "Frontend engineer",
  liveStatus: "live",
  url: "https://10xhealthnetwork.com",
  stack: [
    "Shopify Checkout UI Extensions",
    "TypeScript",
    "React",
    "Playwright",
    "pixelmatch",
    "GSAP",
    "zustand",
  ],
  metrics: [
    { value: "in-checkout", label: "consent capture", note: "blocking, not advisory" },
    { value: "px-diff", label: "visual regression gate", note: "Playwright + pixelmatch in CI" },
  ],
  summary:
    "A precision-wellness membership selling diagnostics and protocols. Regulated products need explicit consent before purchase — and consent collected on a page before checkout is consent the customer can navigate around.",
  sections: [
    {
      heading: "The problem",
      body: [
        "Certain products could not be sold without the customer affirmatively acknowledging specific terms. The obvious implementation — a checkbox on the product page, or a modal in the cart — is not actually a control. Carts are recoverable, links are shareable, and checkout can be reached directly. Anything outside checkout is a suggestion.",
        "Shopify's checkout is also not yours to modify. You cannot inject a script into it.",
      ],
    },
    {
      heading: "Approach",
      body: [
        "The consent forms are a Checkout UI extension: they render inside Shopify's own checkout, in a sandboxed context, and they can genuinely block completion until satisfied. Which products require which consent is driven by configuration rather than hardcoded, so adding a regulated product later is a merchandising change and not a deploy.",
        "The constraint that shaped the code is that extensions run in a restricted sandbox with a component-only rendering surface — no DOM access, no arbitrary CSS. Everything has to be expressed through the provided primitives, which is genuinely a better discipline than it sounds: the result is accessible and native-looking by construction rather than by effort.",
      ],
      points: [
        "Consent requirements resolved per-product from configuration, not from hardcoded IDs",
        "Completion blocked until required acknowledgements are given",
        "Built entirely within the checkout extension component surface — no DOM escape hatches",
      ],
    },
    {
      heading: "The testing harness",
      body: [
        "The wider theme is where I set up visual regression: Playwright drives the storefront across the breakpoint set, and pixelmatch diffs the captures against approved baselines in CI. Themes are exceptionally prone to invisible breakage — a change to a shared snippet can shift a section on a page nobody thought to open — and unit tests do not catch layout.",
        "The value is not in catching bugs I knew about. It is in catching the ones on pages I was not looking at.",
      ],
      points: [
        "Screenshot baselines at every supported breakpoint, from 390px up",
        "Pixel-diff thresholds tuned per surface so antialiasing noise does not produce false failures",
        "Runs in CI, so a regression blocks the merge rather than reaching the store",
      ],
    },
  ],
});
