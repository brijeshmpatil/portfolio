import { defineProject } from "@/lib/types";

export const glovida = defineProject({
  slug: "glovida",
  name: "Glovida",
  tagline: "An e-pharmacy, where the cart has to be able to say no",
  vertical: "healthcare",
  depth: "case-study",
  order: 6,
  year: "2025",
  role: "Frontend engineer",
  liveStatus: "live",
  url: "https://glovida.com",
  stack: [
    "Shopify Liquid",
    "TypeScript",
    "React islands",
    "Shopify Functions",
    "Checkout UI Extensions",
    "IndexedDB",
    "libphonenumber-js",
  ],
  metrics: [
    { value: "server-side", label: "cart validation", note: "Shopify Function, not client JS" },
  ],
  summary:
    "Singapore's consumer-facing online pharmacy, selling both over-the-counter and prescription products. Pharmacy retail has rules — quantity limits, product combinations, delivery eligibility — and rules enforced only in the browser are not enforced.",
  sections: [
    {
      heading: "The problem",
      body: [
        "Regulated retail imposes constraints that ordinary commerce does not: caps on quantities of particular products, restrictions on what can be bought together, and eligibility that depends on the customer rather than the catalogue. A client-side check on the cart page satisfies none of these — the cart is mutable from the API, and checkout is reachable directly.",
      ],
    },
    {
      heading: "Approach",
      body: [
        "Validation lives in a Shopify Function running server-side inside the platform's own cart and checkout evaluation, with a companion checkout extension surfacing the reason clearly to the customer. The browser gets a fast, friendly version of the same rules for immediate feedback; the browser is not what is trusted.",
        "That split — advisory in the client, authoritative on the server — is the entire design. The client-side copy exists purely so the customer finds out at the point of adding rather than at the point of paying.",
      ],
      points: [
        "Authoritative cart validation as a Shopify Function, evaluated server-side",
        "Checkout UI extension so a rejection explains itself instead of just blocking",
        "Optimistic client-side mirror of the same rules for immediate, non-authoritative feedback",
        "Phone number validation via libphonenumber-js — Singapore-format aware, not a regex",
        "IndexedDB caching for catalogue browsing on unreliable mobile connections",
      ],
    },
    {
      heading: "Also shipped",
      body: [
        "A companion Shopify admin app for the operations side, plus the cart-validation extension package. The storefront work also carried a staging clone used to trial theme changes against production data before release, which is the kind of unglamorous infrastructure that stops a pharmacy storefront breaking on a Friday.",
      ],
    },
  ],
});
