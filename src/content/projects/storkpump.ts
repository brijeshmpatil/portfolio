import { defineProject } from "@/lib/types";

export const storkpump = defineProject({
  slug: "storkpump",
  name: "StorkPump by AdaptHealth",
  tagline: "Insurance-funded ordering, for people with no time to debug a form",
  vertical: "healthcare",
  depth: "case-study",
  order: 3,
  year: "2025 — 2026",
  role: "Frontend engineer",
  liveStatus: "live",
  url: "https://storkpump.com",
  stack: [
    "Shopify Liquid",
    "TypeScript",
    "Svelte islands",
    "Azure MSAL",
    "print-js / react-to-print",
    "PhotoSwipe",
  ],
  metrics: [
    { value: "0", label: "card payments in the happy path", note: "cost is carried by insurance" },
  ],
  summary:
    "Breast pumps ordered through insurance rather than bought outright. The checkout does not take money — it takes eligibility information, which is a materially harder frontend problem and a far less forgiving audience.",
  sections: [
    {
      heading: "The problem",
      body: [
        "The customer is a pregnant or newly postpartum parent. She is not browsing. She has been told by somebody that her insurance covers a pump, she has a limited window in which that is true, and she needs the order placed. If the form loses her progress, or asks for her policy number twice, or fails validation without telling her which field, she does not persevere — she calls a phone line, which costs the business an order of magnitude more to service.",
        "There is also no payment step to anchor the flow. A normal storefront's most reliable signal — the amount due — is zero, so the entire sense of progress has to be constructed.",
      ],
    },
    {
      heading: "Approach",
      body: [
        "The qualification flow validates as the customer types rather than on submit, so an incorrectly formatted policy or member ID surfaces immediately, next to the field, in plain language. Progress persists locally, so a closed tab or a dropped connection does not cost the whole session.",
        "Once qualified, the order paperwork is generated in-browser as a printable document. That sounds like a small thing; it is the difference between the customer having something to give her provider and the customer waiting on an email.",
      ],
      points: [
        "Inline, per-field validation with human-readable errors — never a single summary at the bottom",
        "Locally persisted progress so a dropped session is recoverable",
        "Client-side generation of printable order documentation",
        "Azure MSAL authentication for the account-holder path",
        "Svelte islands for the interactive steps, leaving the marketing pages as static Liquid",
        "Product galleries via PhotoSwipe, keyboard-navigable and focus-trapped",
      ],
    },
    {
      heading: "What I would keep",
      body: [
        "Validating on input rather than on submit was the highest-leverage decision in the build, and it cost almost nothing to implement. Most abandoned flows are not abandoned because the flow is long. They are abandoned because the flow is long and the user cannot tell whether they are getting it right.",
      ],
    },
  ],
});
