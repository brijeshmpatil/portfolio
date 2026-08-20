import Link from "next/link";
import { ProjectCard } from "@/components/work/ProjectCard";
import { WorkRail } from "@/components/sections/WorkRail";
import { FEATURED, PROJECTS } from "@/content/projects";

/**
 * The heading sits inside the pinned viewport rather than above it, so while the
 * rail travels sideways the reader keeps the context for what they are looking
 * at. Putting it outside left a large dead gap in the unpinned state and threw
 * the heading away the moment the pin engaged.
 */
export function SelectedWork() {
  return (
    <section id="work" className="hairline">
      <WorkRail
        count={FEATURED.length}
        header={
          <div className="gutter flex flex-wrap items-end justify-between gap-6 pt-20 pb-10 lg:pt-0">
            <div>
              <p className="label">Selected work</p>
              <h2 className="mt-4 max-w-[26ch] text-title text-ink">
                Six builds worth the detail.
              </h2>
            </div>

            <Link
              href="/work"
              className="link-wipe font-mono text-[0.6875rem] tracking-[0.14em] uppercase text-ink-muted transition-colors hover:text-signal"
            >
              All {PROJECTS.length} projects
            </Link>
          </div>
        }
      >
        {FEATURED.map((project) => (
          <div key={project.slug} role="listitem" className="snap-start">
            <ProjectCard project={project} fixedWidth />
          </div>
        ))}
      </WorkRail>
    </section>
  );
}
