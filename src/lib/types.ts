import { z } from "zod";

/**
 * Content schemas.
 *
 * Project data is authored by hand in TypeScript rather than fetched from a
 * CMS, so the "system boundary" that needs validating is the authoring step.
 * Every module in content/projects is parsed through these schemas at module
 * load, which means a malformed entry fails the build rather than rendering a
 * broken card in production.
 */

export const VERTICALS = [
  "healthcare",
  "ecommerce",
  "b2b",
  "tooling",
  "product",
] as const;

export const verticalSchema = z.enum(VERTICALS);
export type Vertical = z.infer<typeof verticalSchema>;

/** Where a project sits in the site's hierarchy. */
export const depthSchema = z.enum(["case-study", "card"]);
export type Depth = z.infer<typeof depthSchema>;

/**
 * Live-URL status. Several client stores are password-protected or have lapsed
 * since the work shipped, and linking to a 402/423 would be worse than not
 * linking at all — so the status is explicit and the UI renders accordingly.
 */
export const liveStatusSchema = z.enum([
  "live", // verified 200
  "gated", // exists but password-protected / not publicly reachable
  "offline", // store no longer serving
  "internal", // never had a public URL
]);
export type LiveStatus = z.infer<typeof liveStatusSchema>;

export const metricSchema = z.object({
  value: z.string().min(1),
  label: z.string().min(1),
  /** Optional qualifier — how it was measured, or over what surface. */
  note: z.string().optional(),
});
export type Metric = z.infer<typeof metricSchema>;

export const caseStudySectionSchema = z.object({
  heading: z.string().min(1),
  /** Paragraphs. Kept as an array so the renderer controls spacing, not markup. */
  body: z.array(z.string().min(1)).min(1),
  /** Optional bullet list rendered after the body. */
  points: z.array(z.string().min(1)).optional(),
});
export type CaseStudySection = z.infer<typeof caseStudySectionSchema>;

export const screenshotSchema = z.object({
  src: z.string().min(1),
  alt: z.string().min(1),
  width: z.number().int().positive(),
  height: z.number().int().positive(),
  caption: z.string().optional(),
});
export type Screenshot = z.infer<typeof screenshotSchema>;

export const projectSchema = z.object({
  slug: z
    .string()
    .regex(/^[a-z0-9-]+$/, "slug must be lowercase kebab-case"),
  /** Client or product name as it should appear publicly. */
  name: z.string().min(1),
  /** One line, sentence case, no trailing period. */
  tagline: z.string().min(1),
  vertical: verticalSchema,
  depth: depthSchema,
  /** Ordering weight — lower sorts first. */
  order: z.number().int(),
  year: z.string().min(4),
  role: z.string().min(1),

  liveStatus: liveStatusSchema,
  /** Required when liveStatus is "live", forbidden otherwise. */
  url: z.string().url().optional(),
  repoUrl: z.string().url().optional(),

  stack: z.array(z.string().min(1)).min(1),
  metrics: z.array(metricSchema).default([]),

  /** Card-level summary. Shown on /work and in the home rail. */
  summary: z.string().min(1),

  /** Case-study body. Required for depth "case-study". */
  sections: z.array(caseStudySectionSchema).default([]),
  screenshots: z.array(screenshotSchema).default([]),
});

export type Project = z.infer<typeof projectSchema>;

/**
 * Parses a project and enforces the cross-field rules the object schema cannot
 * express on its own. Throws with the offending slug so a bad entry is trivial
 * to locate at build time.
 */
export function defineProject(input: unknown): Project {
  const parsed = projectSchema.safeParse(input);

  if (!parsed.success) {
    const slug =
      typeof input === "object" && input !== null && "slug" in input
        ? String((input as { slug: unknown }).slug)
        : "<unknown>";
    throw new Error(
      `Invalid project "${slug}":\n${z.prettifyError(parsed.error)}`,
    );
  }

  const project = parsed.data;

  if (project.liveStatus === "live" && !project.url) {
    throw new Error(`Project "${project.slug}" is marked live but has no url.`);
  }

  if (project.depth === "case-study" && project.sections.length === 0) {
    throw new Error(
      `Project "${project.slug}" is a case study but has no sections.`,
    );
  }

  return project;
}
