import { defineProject } from "@/lib/types";

export const buildSystem = defineProject({
  slug: "build-system",
  name: "Theme Build System",
  tagline: "Giving a dozen Shopify themes one TypeScript toolchain",
  vertical: "tooling",
  depth: "case-study",
  order: 11,
  year: "2025 — 2026",
  role: "Author",
  liveStatus: "internal",
  stack: [
    "TypeScript",
    "webpack 5",
    "Babel",
    "fork-ts-checker",
    "Sass",
    "Tailwind CSS",
    "Terser",
  ],
  metrics: [
    { value: "1 entry", label: "per section", note: "a template downloads only its own code" },
    { value: "auto", label: "shared chunk extraction", note: "code used by 2+ entries" },
  ],
  summary:
    "The toolchain underneath most of the client work above. Shopify themes have no build step by default — this adds strict TypeScript, per-section bundling and automatic shared-chunk extraction, without changing how a theme is deployed.",
  sections: [
    {
      heading: "Why it exists",
      body: [
        "A Shopify theme ships hand-written JavaScript in the asset folder. There is no module system, no type checking and no bundler — which is survivable on one small theme and becomes the dominant cost across a dozen large ones. The same carousel is reimplemented four times, a rename breaks a template nobody opened, and every page downloads every script.",
        "The constraint is that none of the fixes can change how a theme deploys. Shopify expects specific files in specific folders, and the CLI has to keep working.",
      ],
    },
    {
      heading: "How it works",
      body: [
        "Each section gets its own entry point, compiled to its own bundle. Anything imported by two or more entries is automatically extracted into a shared chunk instead of being duplicated. The output lands exactly where Shopify expects it, so deployment is unchanged and the theme remains a normal theme.",
        "Babel does the transpiling and type checking runs in parallel as a separate process — TypeScript never emits. That keeps the watch rebuild fast while still failing the build on a type error, which is the combination that makes strict mode tolerable on a large theme rather than something the team turns off.",
      ],
      points: [
        "One entry point per section — a template loads its own code and nothing else",
        "Automatic shared-chunk extraction for anything used by two or more entries",
        "Strict TypeScript with noUnusedLocals and noUnusedParameters enforced",
        "Type checking in a parallel process; Babel owns compilation, tsc never emits",
        "Sass marked as the only side-effectful module type, so unused JavaScript tree-shakes cleanly",
      ],
    },
    {
      heading: "The organisational half",
      body: [
        "Rolling this across existing themes was the harder part, and it is mostly not a technical problem. A build step that a teammate does not understand is a build step that gets bypassed at the first deadline, and a bypassed build step is worse than none because now the repository has two conventions.",
        "So it shipped incrementally, one theme at a time, alongside the onboarding and pairing that is a large part of my current role — and the measure of whether it worked is not the bundle sizes, it is that engineers who did not write it reach for it by default.",
      ],
    },
  ],
});
