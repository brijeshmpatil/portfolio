import type { Metadata } from "next";
import { Download } from "lucide-react";
import { Timeline } from "@/components/about/Timeline";
import { EDUCATION } from "@/content/experience";
import { SKILLS } from "@/content/skills";
import { SITE, SOCIALS } from "@/lib/site";

export const metadata: Metadata = {
  title: "Resume",
  description:
    "Brijesh M Patil — Frontend Engineer. SDE 2 and technical lead at ShopTrade, Bengaluru. React, TypeScript, web performance.",
};

const RESUME_PDF = "/brijesh-m-patil-resume.pdf";

/**
 * Resume as a real page rather than only a PDF.
 *
 * The PDF exists because recruiters ask for one, but a PDF is a bad web
 * document: it is not responsive, not selectable on mobile, and not accessible
 * to a screen reader without work. This is the readable version, and it is built
 * from the same content modules the rest of the site uses, so the two cannot
 * drift apart.
 */
export default function ResumePage() {
  return (
    <div className="pt-40 pb-24">
      <header className="gutter">
        <p className="label">Resume</p>

        <div className="mt-5 flex flex-wrap items-end justify-between gap-8">
          <div>
            <h1 className="text-display text-ink">{SITE.name}</h1>
            <p className="mt-4 text-lead text-ink-muted">
              {SITE.role} — React, TypeScript, web performance
            </p>
          </div>

          <a
            href={RESUME_PDF}
            download
            className="group inline-flex items-center gap-3 border border-signal px-5 py-3 font-mono text-[0.6875rem] tracking-[0.14em] uppercase text-signal transition-colors hover:bg-signal hover:text-void"
          >
            <Download aria-hidden="true" className="size-4" />
            Download PDF
          </a>
        </div>

        <ul className="mt-10 flex flex-wrap gap-x-8 gap-y-3 border-t border-line-strong pt-6 font-mono text-[0.6875rem] tracking-[0.14em] uppercase">
          <li className="text-ink-faint">{SITE.location}</li>
          <li>
            <a
              href={`mailto:${SITE.email}`}
              className="text-ink-muted transition-colors hover:text-signal"
            >
              {SITE.email}
            </a>
          </li>
          <li>
            <a
              href={`tel:${SITE.phone.replace(/\s/g, "")}`}
              className="text-ink-muted transition-colors hover:text-signal"
            >
              {SITE.phone}
            </a>
          </li>
          {SOCIALS.filter((s) => s.label !== "Email").map((social) => (
            <li key={social.label}>
              <a
                href={social.href}
                target="_blank"
                rel="noreferrer noopener"
                className="text-ink-muted transition-colors hover:text-signal"
              >
                {social.label}
              </a>
            </li>
          ))}
        </ul>
      </header>

      <section className="gutter mt-16">
        <h2 className="label">Summary</h2>
        <p className="mt-5 max-w-[70ch] text-lead leading-relaxed text-ink-muted">
          Frontend engineer with 3+ years building production React and
          TypeScript applications, currently SDE&nbsp;2 and technical lead for a
          three-engineer team. Specialised in frontend architecture and
          performance engineering across 11 production applications for global
          brands. Delivered a 40% LCP reduction, CLS under 0.01 and Lighthouse
          above 90, and architected a design system of 50+ strictly-typed
          components adopted across four concurrent products.
        </p>
      </section>

      <section className="gutter mt-20">
        <h2 className="label">Experience</h2>
        <Timeline />
      </section>

      <section className="gutter mt-16">
        <h2 className="label">Technical skills</h2>
        <dl className="mt-10 space-y-6">
          {SKILLS.map((group) => (
            <div
              key={group.label}
              className="grid gap-2 border-t border-line pt-4 md:grid-cols-[14rem_1fr] md:gap-8"
            >
              <dt className="font-mono text-[0.625rem] tracking-[0.14em] uppercase text-signal">
                {group.label}
              </dt>
              <dd className="text-sm leading-relaxed text-ink-muted">
                {group.items.join(" · ")}
              </dd>
            </div>
          ))}
        </dl>
      </section>

      <section className="gutter mt-16">
        <h2 className="label">Education</h2>
        <dl className="mt-10 space-y-6">
          {EDUCATION.map((entry) => (
            <div
              key={entry.degree}
              className="grid gap-2 border-t border-line pt-4 md:grid-cols-[14rem_1fr] md:gap-8"
            >
              <dt className="font-mono text-[0.625rem] tracking-[0.14em] uppercase text-ink-faint">
                {entry.years}
              </dt>
              <dd>
                <p className="text-base text-ink">{entry.degree}</p>
                <p className="mt-1 text-sm text-ink-muted">{entry.institution}</p>
              </dd>
            </div>
          ))}
        </dl>
      </section>
    </div>
  );
}
