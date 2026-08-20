import Link from "next/link";
import { ArrowLeft, ArrowRight } from "lucide-react";
import type { Project } from "@/lib/types";

type Props = {
  readonly previous?: Project;
  readonly next?: Project;
};

/** Previous / next case study, plus a route back to the index. */
export function CaseStudyNav({ previous, next }: Props) {
  return (
    <nav aria-label="Case study navigation" className="gutter mt-24">
      <div className="hairline grid gap-px pt-6 md:grid-cols-2">
        {previous ? (
          <Link
            href={`/work/${previous.slug}`}
            className="group flex items-start gap-4 py-8 pr-8 transition-colors"
          >
            <ArrowLeft
              aria-hidden="true"
              className="mt-1.5 size-4 shrink-0 text-ink-faint transition-all group-hover:-translate-x-1 group-hover:text-signal"
            />
            <span>
              <span className="label block">Previous</span>
              <span className="mt-2 block text-xl text-ink transition-colors group-hover:text-signal">
                {previous.name}
              </span>
            </span>
          </Link>
        ) : (
          <span />
        )}

        {next && (
          <Link
            href={`/work/${next.slug}`}
            className="group flex items-start justify-end gap-4 py-8 text-right transition-colors md:border-l md:border-line md:pl-8"
          >
            <span>
              <span className="label block">Next</span>
              <span className="mt-2 block text-xl text-ink transition-colors group-hover:text-signal">
                {next.name}
              </span>
            </span>
            <ArrowRight
              aria-hidden="true"
              className="mt-1.5 size-4 shrink-0 text-ink-faint transition-all group-hover:translate-x-1 group-hover:text-signal"
            />
          </Link>
        )}
      </div>

      <p className="hairline pt-6">
        <Link
          href="/work"
          className="link-wipe font-mono text-[0.6875rem] tracking-[0.14em] uppercase text-ink-muted transition-colors hover:text-signal"
        >
          All work
        </Link>
      </p>
    </nav>
  );
}
