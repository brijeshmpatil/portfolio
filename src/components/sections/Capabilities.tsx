import { Reveal } from "@/components/motion/Reveal";
import { SectionHeading } from "@/components/motion/SectionHeading";
import { CAPABILITIES } from "@/content/capabilities";

/**
 * The work that is not a project — design system, rendering engine, the
 * accessibility baseline, leading the team. Rendered as a two-column list so it
 * reads as prose rather than as a feature grid.
 */
export function Capabilities() {
  return (
    <section className="hairline py-24" aria-labelledby="capabilities-heading">
      <div className="gutter">
        <SectionHeading label="Beyond individual projects" className="max-w-2xl">
          The parts that show up in everything.
        </SectionHeading>

        <div className="mt-16 flex flex-col">
          {CAPABILITIES.map((capability) => (
            <Reveal
              key={capability.id}
              as="article"
              className="hairline grid gap-6 py-10 md:grid-cols-[1fr_1.4fr] md:gap-16"
            >
              <div>
                <h3 className="text-xl text-ink md:text-2xl">{capability.title}</h3>
                <p className="mt-2 font-serif text-base italic text-ink-muted">
                  {capability.lead}
                </p>

                {capability.figure && (
                  <p className="mt-5 font-mono text-2xl text-signal tabular-nums">
                    {capability.figure.value}
                    <span className="mt-1 block text-[0.5625rem] tracking-[0.14em] uppercase text-ink-faint">
                      {capability.figure.label}
                    </span>
                  </p>
                )}
              </div>

              <div className="space-y-4">
                {capability.body.map((paragraph) => (
                  <p key={paragraph.slice(0, 32)} className="text-sm leading-relaxed text-ink-muted">
                    {paragraph}
                  </p>
                ))}
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
