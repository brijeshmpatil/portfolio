/**
 * Site-wide constants. Anything that appears in more than one place — and every
 * externally-visible string — lives here rather than inline in a component.
 */

export const SITE = {
  name: "Brijesh M Patil",
  shortName: "Brijesh",
  role: "Frontend Engineer",
  headline: "Frontend engineer, performance obsessed",
  location: "Bengaluru, India",
  email: "brijeshmpatil77@gmail.com",
  phone: "+91 7815840654",
  url: "https://ravers-portfolio.vercel.app",
  description:
    "Frontend engineer with 3+ years shipping production React and TypeScript. SDE 2 and technical lead at ShopTrade — 11+ production applications for global brands, LCP down 40%, CLS under 0.01, a 50+ primitive typed design system.",
} as const;

export const SOCIALS = [
  { label: "GitHub", href: "https://github.com/brijeshmpatil", handle: "brijeshmpatil" },
  {
    label: "LinkedIn",
    href: "https://linkedin.com/in/brijeshmpatil77",
    handle: "brijeshmpatil77",
  },
  { label: "Email", href: `mailto:${SITE.email}`, handle: SITE.email },
] as const;

export const NAV = [
  { label: "Work", href: "/work" },
  { label: "About", href: "/about" },
  { label: "Playground", href: "/playground" },
  { label: "Resume", href: "/resume" },
] as const;

/**
 * Headline numbers. Each one is traceable to a specific piece of shipped work,
 * which is why the source is stored alongside the figure — the case studies
 * link back to these so a claim is never made without somewhere to verify it.
 */
export const HEADLINE_METRICS = [
  {
    value: "40%",
    label: "LCP reduction",
    detail: "across production storefronts",
    source: "besynchro",
  },
  {
    value: "<0.01",
    label: "Cumulative Layout Shift",
    detail: "held on mobile and desktop",
    source: "besynchro",
  },
  {
    value: "50+",
    label: "typed primitives",
    detail: "one design system, 4 concurrent products",
    source: "design-system",
  },
  {
    value: "1,000+",
    label: "pages generated",
    detail: "from structured content models",
    source: "rendering-engine",
  },
] as const;
