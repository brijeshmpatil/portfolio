import { defineProject, type Project } from "@/lib/types";

/** Personal projects and tooling, shown as cards on /work. */
export const personalCards: readonly Project[] = [
  defineProject({
    slug: "figma-shopify-mcp",
    name: "Figma → Shopify MCP",
    tagline: "An MCP server that turns a Figma frame into a Shopify section",
    vertical: "tooling",
    depth: "card",
    order: 40,
    year: "2026",
    role: "Author",
    liveStatus: "internal",
    stack: [
      "TypeScript",
      "Model Context Protocol SDK",
      "Figma API",
      "Handlebars",
      "node-html-parser",
    ],
    metrics: [],
    summary:
      "A Model Context Protocol server that reads a Figma design and emits a Shopify section — Liquid markup, the schema block, and the matching styles. Built because translating designs to sections is the most repetitive part of theme work and the least deserving of a person's attention.",
  }),
  defineProject({
    slug: "manyata-travels",
    name: "Manyata Travels",
    tagline: "Itineraries that generate their own PDF",
    vertical: "product",
    depth: "card",
    order: 41,
    year: "2026",
    role: "Everything",
    liveStatus: "live",
    url: "https://manyata-travels.vercel.app",
    repoUrl: "https://github.com/brijeshmpatil/manyata-travels",
    stack: ["Next.js", "React", "TypeScript", "Tailwind CSS v4", "Framer Motion", "jsPDF"],
    metrics: [],
    summary:
      "A travel agency site where each package renders a printable, downloadable itinerary generated entirely in the browser. No server, no PDF service — the print layout is a real route with its own stylesheet.",
  }),
  defineProject({
    slug: "cod-control",
    name: "COD Control",
    tagline: "Cash-on-delivery risk rules as a Shopify app",
    vertical: "tooling",
    depth: "card",
    order: 42,
    year: "2026",
    role: "Author",
    liveStatus: "internal",
    stack: ["React Router 7", "Vite", "TypeScript", "Prisma", "Shopify App Bridge"],
    metrics: [],
    summary:
      "In progress. An embedded Shopify app for gating cash-on-delivery by order and customer signals — the failure mode COD merchants in India actually lose money to. Listed as work in progress rather than dressed up as finished.",
  }),
  defineProject({
    slug: "spending-tracker",
    name: "Spending Tracker",
    tagline: "Early React, kept for the honesty",
    vertical: "product",
    depth: "card",
    order: 43,
    year: "2024",
    role: "Author",
    liveStatus: "internal",
    repoUrl: "https://github.com/brijeshmpatil/assignment-1",
    stack: ["React", "MUI", "Testing Library"],
    metrics: [],
    summary:
      "A category-budget spending tracker with progress indicators, written early on. It is in this list because a portfolio consisting entirely of one's best current work is not a portfolio, it is a marketing page.",
  }),
];
