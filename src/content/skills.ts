/** Technical skills, grouped as on the resume. */

export type SkillGroup = {
  readonly label: string;
  readonly items: readonly string[];
};

export const SKILLS: readonly SkillGroup[] = [
  {
    label: "Languages",
    items: ["TypeScript", "JavaScript (ES6+)", "HTML5", "CSS3", "SCSS", "SQL"],
  },
  {
    label: "Frameworks & libraries",
    items: ["React", "Next.js", "Svelte", "Tailwind CSS", "GSAP", "three.js"],
  },
  {
    label: "UI architecture",
    items: [
      "Component design systems",
      "Design tokens",
      "Reusable component libraries",
      "Figma to code",
    ],
  },
  {
    label: "Performance",
    items: [
      "Core Web Vitals (LCP, CLS, INP)",
      "Lighthouse",
      "Rendering performance",
      "Code splitting",
      "Lazy loading",
      "Memory profiling",
    ],
  },
  {
    label: "Responsive & cross-browser",
    items: [
      "Responsive web design",
      "Adaptive design",
      "Cross-browser compatibility",
      "Mobile web",
    ],
  },
  {
    label: "APIs & cloud",
    items: ["REST APIs", "GraphQL", "JSON", "Webhooks", "AWS S3", "AWS Lambda"],
  },
  {
    label: "Build & testing",
    items: ["webpack", "Vite", "Babel", "Playwright", "pixelmatch"],
  },
  {
    label: "Accessibility & security",
    items: [
      "WCAG 2.1 AA",
      "ARIA patterns",
      "Screen readers",
      "XSS prevention",
      "CSP",
      "CORS",
    ],
  },
  {
    label: "AI-assisted development",
    items: [
      "Claude Code",
      "Cursor",
      "GitHub Copilot",
      "Model Context Protocol",
      "Repo-level standards files",
    ],
  },
];
