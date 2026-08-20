import { ArrowUpRight } from "lucide-react";
import type { LiveStatus, Project } from "@/lib/types";

const STATUS_NOTE: Readonly<Record<LiveStatus, string | null>> = {
  live: null,
  gated: "Storefront password-protected — no public link",
  offline: "Storefront no longer serving — no public link",
  internal: "Internal tool — no public URL",
};

type Props = {
  readonly project: Project;
};

/** Server component — the case-study masthead and metadata block. */
export function CaseStudyHeader({ project }: Props) {
  const note = STATUS_NOTE[project.liveStatus];

  const facts: ReadonlyArray<readonly [string, string]> = [
    ["Sector", project.vertical],
    ["Year", project.year],
    ["Role", project.role],
  ];

  return (
    <header className="gutter pt-40">
      <p className="label">Case study</p>

      <h1 className="mt-5 max-w-[20ch] text-display text-ink">{project.name}</h1>

      <p className="mt-6 max-w-[30ch] font-serif text-title italic leading-[1.15] text-ink-muted">
        {project.tagline}
      </p>

      <dl className="mt-14 grid gap-x-8 gap-y-6 border-t border-line-strong pt-6 sm:grid-cols-2 lg:grid-cols-4">
        {facts.map(([term, value]) => (
          <div key={term}>
            <dt className="label">{term}</dt>
            <dd className="mt-2 text-sm capitalize text-ink">{value}</dd>
          </div>
        ))}

        <div>
          <dt className="label">Live</dt>
          <dd className="mt-2 text-sm">
            {project.url ? (
              <a
                href={project.url}
                target="_blank"
                rel="noreferrer noopener"
                className="group inline-flex items-center gap-1.5 text-ink underline decoration-signal decoration-1 underline-offset-4 transition-colors hover:text-signal"
              >
                {new URL(project.url).hostname.replace(/^www\./, "")}
                <ArrowUpRight
                  aria-hidden="true"
                  className="size-3.5 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
                />
              </a>
            ) : (
              <span className="text-ink-faint">{note}</span>
            )}
          </dd>
        </div>
      </dl>

      {project.metrics.length > 0 && (
        <dl className="mt-16 grid gap-x-8 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
          {project.metrics.map((metric) => (
            <div key={metric.label} className="border-t border-line pt-5">
              <dd className="font-mono text-3xl text-signal tabular-nums">
                {metric.value}
              </dd>
              <dt className="mt-3 text-sm text-ink">{metric.label}</dt>
              {metric.note && (
                <p className="mt-1 text-xs text-ink-faint">{metric.note}</p>
              )}
            </div>
          ))}
        </dl>
      )}

      <ul className="mt-16 flex flex-wrap gap-2">
        {project.stack.map((tech) => (
          <li
            key={tech}
            className="border border-line px-3 py-1.5 font-mono text-[0.625rem] tracking-[0.12em] uppercase text-ink-muted"
          >
            {tech}
          </li>
        ))}
      </ul>
    </header>
  );
}
