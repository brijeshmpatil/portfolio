import { defineProject } from "@/lib/types";

export const chamelo = defineProject({
  slug: "chamelo",
  name: "Chamelo",
  tagline: "A product matrix that only works if the images are instant",
  vertical: "ecommerce",
  depth: "case-study",
  order: 7,
  year: "2025",
  role: "Frontend engineer",
  liveStatus: "live",
  url: "https://www.chamelo.com",
  stack: ["Shopify Liquid", "TypeScript", "GSAP", "webpack 5", "Tailwind CSS"],
  metrics: [
    { value: "17 × 10", label: "frames × colourways", note: "the visual matrix behind the grid" },
  ],
  summary:
    "Smart eyewear with electronically adjustable tint. The catalogue is a matrix — every frame in every colourway — and the entire buying decision is visual, which puts the whole weight of the site on image delivery and hover choreography.",
  sections: [
    {
      heading: "The problem",
      body: [
        "Nobody buys sunglasses from a specification table. The decision is made by looking, and by looking at several options in quick succession — which means the collection grid is not a navigation aid, it is the product experience. Every frame across every colourway has to be previewable without a page load and without a flash of empty space.",
        "That is a lot of large images on one route, and the naive implementation is either slow to load or janky to interact with. Usually both.",
      ],
    },
    {
      heading: "Approach",
      body: [
        "Hover choreography is driven by a single GSAP timeline per card rather than CSS transitions, which is what makes a fast pointer sweep across the grid read as intentional instead of as a stutter — a timeline can be reversed and re-targeted mid-flight, where a transition can only be interrupted.",
        "Images are strictly prioritised: above-the-fold frames load eagerly with explicit dimensions reserved, everything else is deferred, and colourway variants are prefetched on intent rather than upfront. Reserving the space is the part that matters — a grid of images without declared dimensions is the single most common source of layout shift in commerce, and layout shift in a grid you are actively scanning is genuinely unpleasant.",
      ],
      points: [
        "GSAP timelines per card, reversible mid-animation so rapid pointer movement stays smooth",
        "Explicit dimensions on every image — no layout shift as the grid fills",
        "Colourway variants prefetched on hover intent, not on page load",
        "Deferred loading below the fold, eager and prioritised above it",
      ],
    },
    {
      heading: "QA reality",
      body: [
        "Verifying this meant capturing every frame in every colourway and checking them as a set, because the failure mode is not a broken page — it is one variant out of a hundred and seventy pointing at the wrong asset, which no automated check notices and no casual pass catches.",
      ],
    },
  ],
});
