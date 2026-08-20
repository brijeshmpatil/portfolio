import { Reveal } from "@/components/motion/Reveal";
import { EXPERIENCE } from "@/content/experience";

/** Career timeline. Server component — static content, no JS beyond the reveal. */
export function Timeline() {
  return (
    <ol className="mt-16">
      {EXPERIENCE.map((role) => (
        <Reveal
          key={`${role.title}-${role.from}`}
          as="li"
          className="hairline grid gap-6 py-12 md:grid-cols-[1fr_2fr] md:gap-16"
        >
          <div>
            <p className="font-mono text-[0.625rem] tracking-[0.14em] uppercase text-ink-faint">
              {role.from} — {role.to}
              {role.current && (
                <span className="ml-2 inline-flex items-center gap-1.5 text-signal">
                  <span
                    aria-hidden="true"
                    className="block size-1 rounded-full bg-signal"
                  />
                  now
                </span>
              )}
            </p>

            <h3 className="mt-4 text-xl leading-tight text-ink">{role.title}</h3>
            <p className="mt-2 text-sm text-ink-muted">
              {role.company} · {role.location}
            </p>
          </div>

          <ul className="space-y-4">
            {role.points.map((point) => (
              <li
                key={point.slice(0, 40)}
                className="flex gap-4 text-sm leading-relaxed text-ink-muted"
              >
                <span
                  aria-hidden="true"
                  className="mt-2.5 h-px w-4 shrink-0 bg-line-strong"
                />
                {point}
              </li>
            ))}
          </ul>
        </Reveal>
      ))}
    </ol>
  );
}
