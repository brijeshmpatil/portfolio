import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import type { LiveStatus, Project } from "@/lib/types";

/** Human-readable note for a project with no linkable URL. */
const STATUS_NOTE: Readonly<Record<LiveStatus, string | null>> = {
  live: null,
  gated: "Storefront password-protected",
  offline: "Storefront no longer serving",
  internal: "Internal — no public URL",
};

type Props = {
  readonly project: Project;
  /** Fixed width for the horizontal rail; omit to fill the grid cell. */
  readonly fixedWidth?: boolean;
};

/**
 * The single card used by both the home rail and /work.
 *
 * Server component. A case study links to its own route; a card-depth project
 * links out to the live site if there is one, and is a non-interactive block if
 * there is not — a card that looks clickable and is not is worse than a card
 * that plainly is not.
 */
export function ProjectCard({ project, fixedWidth = false }: Props) {
  const note = STATUS_NOTE[project.liveStatus];
  const isCaseStudy = project.depth === "case-study";
  const href = isCaseStudy ? `/work/${project.slug}` : project.url;

  const body = (
    <>
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="label">{project.vertical}</p>
          <h3 className="mt-3 text-2xl text-ink transition-colors group-hover:text-signal md:text-3xl">
            {project.name}
          </h3>
        </div>
        <span className="shrink-0 font-mono text-[0.625rem] tracking-[0.14em] text-ink-faint">
          {project.year}
        </span>
      </div>

      <p className="mt-4 font-serif text-lg italic text-ink-muted">
        {project.tagline}
      </p>

      <p className="mt-5 flex-1 text-sm leading-relaxed text-ink-muted">
        {project.summary}
      </p>

      {project.metrics.length > 0 && (
        <dl className="mt-6 flex flex-wrap gap-x-8 gap-y-3">
          {project.metrics.slice(0, 3).map((metric) => (
            <div key={metric.label}>
              <dt className="sr-only">{metric.label}</dt>
              <dd className="font-mono text-lg text-signal tabular-nums">
                {metric.value}
              </dd>
              <p className="mt-0.5 font-mono text-[0.5625rem] tracking-[0.12em] uppercase text-ink-faint">
                {metric.label}
              </p>
            </div>
          ))}
        </dl>
      )}

      <div className="mt-6 flex flex-wrap items-center gap-x-2 gap-y-1 font-mono text-[0.5625rem] tracking-[0.12em] uppercase text-ink-faint">
        {project.stack.slice(0, 5).map((tech) => (
          <span key={tech} className="border border-line px-2 py-1">
            {tech}
          </span>
        ))}
      </div>

      <div className="hairline mt-6 flex items-center justify-between pt-4 font-mono text-[0.625rem] tracking-[0.14em] uppercase">
        <span className={href ? "text-ink-muted" : "text-ink-faint"}>
          {isCaseStudy ? "Read case study" : note ?? "Visit site"}
        </span>
        {href && (
          <ArrowUpRight
            aria-hidden="true"
            className="size-4 text-ink-faint transition-all group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-signal"
          />
        )}
      </div>
    </>
  );

  const shell = [
    "group flex flex-col border border-line bg-base/40 p-6 transition-colors md:p-8",
    fixedWidth ? "w-[85vw] shrink-0 md:w-[30rem]" : "h-full",
    href ? "hover:border-line-strong" : "",
  ].join(" ");

  if (!href) {
    return <article className={shell}>{body}</article>;
  }

  if (isCaseStudy) {
    return (
      <Link href={href} className={shell}>
        {body}
      </Link>
    );
  }

  return (
    <a href={href} target="_blank" rel="noreferrer noopener" className={shell}>
      {body}
    </a>
  );
}
