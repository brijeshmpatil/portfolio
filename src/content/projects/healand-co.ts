import { defineProject } from "@/lib/types";

export const healandCo = defineProject({
  slug: "healand-co",
  name: "Heal + Co.",
  tagline: "Svelte islands inside Liquid, and why not React here",
  vertical: "ecommerce",
  depth: "case-study",
  order: 8,
  year: "2025",
  role: "Frontend engineer",
  liveStatus: "live",
  url: "https://healco.com",
  stack: ["Shopify Liquid", "TypeScript", "Svelte", "PhotoSwipe", "IndexedDB", "webpack 5"],
  metrics: [
    { value: "~0", label: "runtime framework cost", note: "Svelte compiles the runtime away" },
  ],
  summary:
    "A supplements storefront, and the clearest example of a decision I make often and get asked about: choosing Svelte over React for interactive islands in a server-rendered theme.",
  sections: [
    {
      heading: "The decision",
      body: [
        "A Shopify theme is already server-rendered and already fast at delivering HTML. The interactive parts — a filter, a gallery, a quantity selector, a drawer — are small, numerous, and independent. What they need is state and events. What they do not need is a framework runtime shipped ahead of them.",
        "React's runtime is a fixed cost paid before the first island does anything, and on a theme with a dozen small islands across a dozen templates that cost is paid on every route whether or not the island is used. Svelte compiles to direct DOM operations with effectively no runtime, so the cost of an island is the island. For this shape of problem that is simply the right trade.",
      ],
    },
    {
      heading: "Where I do reach for React",
      body: [
        "The inverse case is a single large stateful surface — a multi-step configurator, an authenticated ordering flow, an admin app. There the runtime is amortised across a lot of behaviour, and the ecosystem access, the type maturity and the fact that every engineer on the team already reads it fluently all start to dominate.",
        "The honest version of this is that both work, and the reason to have a rule is consistency rather than performance. Many small independent islands: Svelte. One large stateful application: React. The mistake is not picking wrong, it is picking differently on every project and leaving the next engineer to figure out which convention applies where.",
      ],
      points: [
        "Many small, independent, mostly-presentational islands → Svelte",
        "One large stateful flow, or anything needing the wider ecosystem → React",
        "Either way: the surrounding page stays server-rendered Liquid",
      ],
    },
    {
      heading: "The build itself",
      body: [
        "Product galleries via PhotoSwipe with proper focus trapping and keyboard navigation, catalogue caching in IndexedDB for repeat visits on mobile, and the shared webpack pipeline that treats each section as its own entry point so a template only downloads the JavaScript it actually uses.",
      ],
    },
  ],
});
