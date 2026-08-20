/**
 * Cross-cutting work that is not a single project.
 *
 * These are the things that show up across the whole client estate — the design
 * system, the rendering engine, the accessibility baseline — and would be
 * misrepresented if attributed to one client.
 */

export type Capability = {
  readonly id: string;
  readonly title: string;
  readonly lead: string;
  readonly body: readonly string[];
  readonly figure?: { readonly value: string; readonly label: string };
};

export const CAPABILITIES: readonly Capability[] = [
  {
    id: "design-system",
    title: "Design system",
    lead: "50+ strictly-typed primitives, four concurrent products",
    figure: { value: "~30%", label: "faster feature delivery" },
    body: [
      "A component library where the types carry the design constraints — a variant that does not exist is a compile error, not a visual bug found in review. Tokens are the only source of colour, spacing and type scale, so a brand change is a token change rather than a search across four codebases.",
      "The measurable outcome was roughly 30% faster feature delivery. The unmeasurable one matters more: design review stopped being about whether the spacing was right.",
    ],
  },
  {
    id: "rendering-engine",
    title: "Data-driven rendering",
    lead: "1,000+ pages generated from structured content models",
    figure: { value: "days → minutes", label: "content deployment" },
    body: [
      "Content teams were building pages by hand, which does not scale past a few hundred and does not survive a template change at all. Replacing that with a rendering engine driven by structured content models removed manual page creation entirely and took content deployment from days to minutes.",
      "The hard part was not generation. It was designing content models that non-engineers could actually populate without producing pages that broke.",
    ],
  },
  {
    id: "performance",
    title: "Performance engineering",
    lead: "LCP down 40%, CLS below 0.01, Lighthouse above 90",
    figure: { value: "40%", label: "LCP reduction" },
    body: [
      "Across production storefronts: code splitting, render-path work, asset strategy and third-party script discipline. Most of the wins are deletions — the largest single improvement I have shipped was removing scripts that were loading twice.",
      "The part that makes it stick is treating the budget as a build-time constraint rather than an audit you run afterwards. A regression that fails CI never reaches a customer; a regression found in a quarterly audit has been live for a quarter.",
    ],
  },
  {
    id: "accessibility",
    title: "Accessibility",
    lead: "WCAG 2.1 AA across interactive components",
    body: [
      "Keyboard navigation, focus trapping, ARIA patterns, screen-reader optimisation and reduced-motion support — implemented in the shared components rather than retrofitted per page, which is the only version of this that holds over time.",
      "Two of the client estates are healthcare, where the buyer is frequently older, frequently on assistive technology, and frequently not the patient. That is not an edge case to accommodate. It is the primary user.",
    ],
  },
  {
    id: "leading",
    title: "Leading a team",
    lead: "Three engineers, plus onboarding new joiners and trainees",
    body: [
      "I run code reviews and pairing sessions for three engineers, and personally onboard new joiners and trainees until they are shipping independently. The measure I care about is ramp-up time to independent shipping, not review throughput.",
      "The thing I got wrong early was reviewing for correctness only. A review that catches every bug and teaches nothing means the same bug arrives next week from the same person, and neither of you knows why.",
    ],
  },
  {
    id: "ai-assisted",
    title: "AI-assisted development",
    lead: "A daily tool, with a review gate that does not move",
    body: [
      "Claude Code, Cursor and Copilot are primary daily tools for component generation, refactoring, tests and documentation, backed by repo-level standards files so generated output starts from the project's conventions rather than the model's defaults.",
      "Everything generated is reviewed for security, bundle size and accessibility before commit — and the reason that gate exists is experience rather than policy. Generated code is confidently plausible, which is a different failure mode from code written by a tired human, and it needs a different kind of reading.",
    ],
  },
];
