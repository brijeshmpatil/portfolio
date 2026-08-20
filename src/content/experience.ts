/** Professional history. Mirrors the resume — kept in one place so the two never drift. */

export type Role = {
  readonly title: string;
  readonly company: string;
  readonly location: string;
  readonly from: string;
  readonly to: string;
  readonly current: boolean;
  readonly points: readonly string[];
};

export const EXPERIENCE: readonly Role[] = [
  {
    title: "SDE 2 — Frontend Engineer & Team Lead",
    company: "ShopTrade",
    location: "Bengaluru, India",
    from: "April 2026",
    to: "Present",
    current: true,
    points: [
      "Own frontend architecture across all client platforms — component design systems, design tokens, state patterns and the performance budgets that keep Core Web Vitals in target as features ship.",
      "Lead a team of three engineers, and personally onboard and train new joiners and trainees — running their code reviews and pairing sessions until they ship independently.",
      "Architected a strictly-typed TypeScript component library of 50+ primitives used across four concurrent products, cutting feature delivery time roughly 30%.",
      "Drive performance engineering across production sites: LCP down 40%, CLS held below 0.01, Lighthouse above 90 on mobile and desktop, via code splitting, render-path work and asset strategy.",
      "Work directly with product managers and UX designers to turn Figma wireframes into reusable, accessible, production-ready components.",
      "Use AI coding assistants as a primary daily tool for component generation, refactoring, tests and documentation — maintaining repo-level standards files and reviewing all generated output for security, bundle size and accessibility before commit.",
    ],
  },
  {
    title: "SDE 1 — Frontend Engineer",
    company: "ShopTrade",
    location: "Bengaluru, India",
    from: "September 2023",
    to: "May 2026",
    current: false,
    points: [
      "Engineered a data-driven rendering engine generating 1,000+ pages from structured content models, removing manual page creation entirely and cutting content deployment from days to minutes.",
      "Built a chunked media upload pipeline handling files over 1GB, with segmented transfer, progress tracking, automatic retry on failure, S3 pre-signed URLs and Lambda-side processing.",
      "Designed GPU-accelerated animation systems including parallax and scroll-driven sequences, sustaining 60fps on mid-range mobile devices across multiple browsers.",
      "Delivered full WCAG 2.1 AA compliance across interactive components — keyboard navigation, focus trapping, ARIA patterns, screen-reader optimisation and reduced-motion support.",
      "Shipped 11 production web applications for global brands across e-commerce, healthcare, B2B and consumer verticals.",
      "Triaged and resolved production issues on live client sites — reproducing, diagnosing and shipping fixes under deadline pressure to minimise customer impact.",
    ],
  },
  {
    title: "Frontend Engineer Intern",
    company: "ShopTrade",
    location: "Bengaluru, India",
    from: "May 2023",
    to: "August 2023",
    current: false,
    points: [
      "Shipped client-facing features within six weeks, built responsive UI components to design specification, and contributed to a shared component architecture adopted across three active projects.",
    ],
  },
];

export type Education = {
  readonly degree: string;
  readonly institution: string;
  readonly years: string;
};

export const EDUCATION: readonly Education[] = [
  {
    degree: "Master of Computer Applications (MCA)",
    institution: "Gogte Institute of Technology, Belgaum",
    years: "2021 — 2023",
  },
  {
    degree: "Bachelor of Computer Applications (BCA)",
    institution: "Govt. First Grade College, Shikaripura",
    years: "2018 — 2021",
  },
];
