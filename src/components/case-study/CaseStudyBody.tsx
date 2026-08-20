import { Reveal } from "@/components/motion/Reveal";
import type { CaseStudySection } from "@/lib/types";

type Props = {
  readonly sections: readonly CaseStudySection[];
};

/**
 * Case-study prose.
 *
 * Two columns at desktop with the heading in the narrow one, so a reader can
 * skim headings down the left edge and drop into whichever section they care
 * about. Measure is capped well below the column width — long-form technical
 * prose at full container width is genuinely harder to read.
 */
export function CaseStudyBody({ sections }: Props) {
  return (
    <div className="gutter mt-24">
      {sections.map((section, index) => (
        <Reveal
          key={section.heading}
          as="section"
          className="hairline grid gap-6 py-14 md:grid-cols-[1fr_1.9fr] md:gap-16"
        >
          <div>
            <p className="label">
              {String(index + 1).padStart(2, "0")}
            </p>
            <h2 className="mt-4 text-2xl text-ink md:sticky md:top-28">
              {section.heading}
            </h2>
          </div>

          <div>
            <div className="max-w-[66ch] space-y-5">
              {section.body.map((paragraph) => (
                <p
                  key={paragraph.slice(0, 40)}
                  className="text-lead leading-relaxed text-ink-muted"
                >
                  {paragraph}
                </p>
              ))}
            </div>

            {section.points && (
              <ul className="mt-8 max-w-[66ch] space-y-3">
                {section.points.map((point) => (
                  <li
                    key={point.slice(0, 40)}
                    className="flex gap-4 text-sm leading-relaxed text-ink-muted"
                  >
                    <span
                      aria-hidden="true"
                      className="mt-2.5 h-px w-4 shrink-0 bg-signal"
                    />
                    {point}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </Reveal>
      ))}
    </div>
  );
}
