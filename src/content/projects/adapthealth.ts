import { defineProject } from "@/lib/types";

export const adapthealth = defineProject({
  slug: "adapthealth",
  name: "AdaptHealth Marketplace",
  tagline: "A configurator for medical equipment, where a wrong choice has consequences",
  vertical: "healthcare",
  depth: "case-study",
  order: 2,
  year: "2025 — 2026",
  role: "Frontend engineer",
  liveStatus: "live",
  url: "https://www.adapthealthmarketplace.com",
  stack: [
    "Shopify Liquid",
    "TypeScript",
    "React islands",
    "Azure MSAL",
    "PDF viewer (embedpdf)",
    "react-simple-maps",
    "Playwright",
  ],
  metrics: [
    { value: "3-step", label: "guided configurator", note: "device → accessories → services" },
    { value: "AAD", label: "authenticated ordering", note: "Azure MSAL browser flow" },
  ],
  summary:
    "Durable medical equipment sold online — CPAP machines, masks, accessories and the service plans attached to them. The frontend problem is that the catalogue is a compatibility graph, not a list, and customers do not know which parts of it apply to them.",
  sections: [
    {
      heading: "The problem",
      body: [
        "Buying a CPAP machine is not buying a product. It is buying a device, then a mask that fits both your face and that device, then the tubing and filters that fit the mask, then optionally a service plan — and every one of those choices constrains the next. Presented as a flat catalogue with variant dropdowns, it produces incorrect orders, and incorrect orders in medical supply are not a returns problem, they are a care problem.",
      ],
    },
    {
      heading: "Approach",
      body: [
        "I built the purchase as a guided three-step flow — device, then add-ons, then services — where each step only offers what is genuinely compatible with what came before, and the running configuration stays visible the whole way through. Selection state is held in a single store rather than in the URL or in the cart, so a customer can change their mind at step three without unwinding steps one and two.",
        "The surrounding storefront stays server-rendered Liquid. Only the configurator itself is a React island, which keeps the JavaScript cost on the pages that need it instead of across the whole catalogue.",
      ],
      points: [
        "Compatibility-aware option filtering, so incompatible combinations are never selectable rather than rejected after the fact",
        "Persistent configuration summary, so the customer always knows what is in the order",
        "Authenticated ordering via Azure MSAL for accounts that need identity before pricing",
        "In-page PDF viewing for product documentation and insurance paperwork, rather than a download that leaves the flow",
        "Coverage maps rendered client-side to show service availability by region",
        "Playwright end-to-end coverage over the full flow, because a regression here is invisible until an order is wrong",
      ],
    },
    {
      heading: "Accessibility was not optional",
      body: [
        "The buyer for durable medical equipment is frequently older, frequently on assistive technology, and frequently not the patient. Every step of the configurator is keyboard-operable, every selection change is announced, and focus is managed explicitly across step transitions — a multi-step flow that silently moves focus is unusable with a screen reader, no matter how correct the visuals are.",
      ],
    },
  ],
});
