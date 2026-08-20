import type { Project, Vertical } from "@/lib/types";
import { adapthealth } from "./adapthealth";
import { besynchro } from "./besynchro";
import { buildSystem } from "./build-system";
import { chamelo } from "./chamelo";
import { clientCards } from "./cards-client";
import { glovida } from "./glovida";
import { healandCo } from "./healand-co";
import { jobApplication } from "./job-application";
import { personalCards } from "./cards-personal";
import { snsHealth } from "./sns-health";
import { stickersBanners } from "./stickers-banners";
import { storkpump } from "./storkpump";
import { tenxHealth } from "./tenx-health";

/** Everything, sorted by authored weight. Immutable — never sort in place. */
export const PROJECTS: readonly Project[] = [
  besynchro,
  adapthealth,
  storkpump,
  tenxHealth,
  stickersBanners,
  glovida,
  chamelo,
  healandCo,
  snsHealth,
  jobApplication,
  buildSystem,
  ...clientCards,
  ...personalCards,
]
  .slice()
  .sort((a, b) => a.order - b.order);

export const CASE_STUDIES: readonly Project[] = PROJECTS.filter(
  (p) => p.depth === "case-study",
);

/** The subset featured on the home page rail. */
export const FEATURED: readonly Project[] = CASE_STUDIES.slice(0, 6);

const BY_SLUG: ReadonlyMap<string, Project> = new Map(
  PROJECTS.map((p) => [p.slug, p]),
);

export function getProject(slug: string): Project | undefined {
  return BY_SLUG.get(slug);
}

export function projectsByVertical(vertical: Vertical): readonly Project[] {
  return PROJECTS.filter((p) => p.vertical === vertical);
}

/** Verticals that actually have projects, in a stable display order. */
export const ACTIVE_VERTICALS: readonly Vertical[] = (
  ["healthcare", "ecommerce", "b2b", "tooling", "product"] as const
).filter((v) => PROJECTS.some((p) => p.vertical === v));

/** Distinct client-facing brands, for the marquee. */
export const BRANDS: readonly string[] = PROJECTS.filter(
  (p) => p.liveStatus === "live" && p.vertical !== "product",
).map((p) => p.name);

// Duplicate slugs would silently shadow a route, so fail the build instead.
if (BY_SLUG.size !== PROJECTS.length) {
  throw new Error("Duplicate project slug detected in content/projects.");
}
