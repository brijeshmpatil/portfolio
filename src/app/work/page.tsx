import type { Metadata } from "next";
import { WorkGrid } from "@/components/work/WorkGrid";
import { ACTIVE_VERTICALS, CASE_STUDIES, PROJECTS } from "@/content/projects";

export const metadata: Metadata = {
  title: "Work",
  description:
    "Production storefronts and applications shipped for global brands across healthcare, e-commerce and B2B, plus personal projects and tooling.",
};

export default function WorkPage() {
  const live = PROJECTS.filter((p) => p.liveStatus === "live").length;

  return (
    <div className="pt-40 pb-24">
      <header className="gutter">
        <p className="label">Work</p>
        <h1 className="mt-5 max-w-[24ch] text-display text-ink">
          Everything I have shipped.
        </h1>

        <p className="mt-8 max-w-2xl text-lead text-ink-muted">
          {PROJECTS.length} builds — {CASE_STUDIES.length} with a full case
          study, {live} with a live link you can open right now. Where a
          storefront is password-protected or no longer serving, it is listed
          without a link rather than pointing you at an error page.
        </p>
      </header>

      <WorkGrid projects={PROJECTS} verticals={ACTIVE_VERTICALS} />
    </div>
  );
}
