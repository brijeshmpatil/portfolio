import { MagneticLink } from "@/components/motion/MagneticLink";
import { SectionHeading } from "@/components/motion/SectionHeading";
import { SITE, SOCIALS } from "@/lib/site";

export function Contact() {
  return (
    <section id="contact" className="hairline py-28" aria-labelledby="contact-heading">
      <div className="gutter">
        <SectionHeading label="Next" className="max-w-2xl">
          Looking for a senior frontend role where performance is a requirement, not a retro item.
        </SectionHeading>

        <div className="mt-12 flex flex-col gap-10 md:flex-row md:items-end md:justify-between">
          <MagneticLink
            href={`mailto:${SITE.email}`}
            className="inline-block font-serif text-display lowercase leading-none text-ink transition-colors hover:text-signal"
          >
            {SITE.email}
          </MagneticLink>

          <ul className="flex flex-wrap gap-x-8 gap-y-3">
            {SOCIALS.filter((s) => s.label !== "Email").map((social) => (
              <li key={social.label}>
                <a
                  href={social.href}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="font-mono text-[0.6875rem] tracking-[0.14em] uppercase text-ink-muted underline decoration-line-strong decoration-1 underline-offset-8 transition-colors hover:text-signal"
                >
                  {social.label}
                </a>
              </li>
            ))}
          </ul>
        </div>

        <p className="mt-12 max-w-xl text-sm text-ink-faint">
          Based in {SITE.location}. Open to remote and to relocation. Fastest way
          to reach me is email — I answer everything that is not a template.
        </p>
      </div>
    </section>
  );
}
