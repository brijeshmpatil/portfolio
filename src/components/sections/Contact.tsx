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

        {/* Stacked until xl. Sharing a row with the socials from md left the
            address ~500px to render in and it ran past the gutter. */}
        <div className="mt-12 flex flex-col gap-10 xl:flex-row xl:items-end xl:justify-between">
          {/* The address is one unbreakable 25-character string, so it cannot use
              the shared display scale — that clamp bottoms out at 40px, which
              needs 382px of line and had it overflowing the document by 27px on
              every phone. This clamp is sized from the string itself: it fits
              the gutter from 320px up, and still caps at the same 96px the
              display scale reaches on desktop. */}
          <MagneticLink
            href={`mailto:${SITE.email}`}
            className="inline-block max-w-full font-serif text-[clamp(1.75rem,8.4vw,6rem)] lowercase leading-none text-ink transition-colors hover:text-signal"
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
                  className="link-wipe font-mono text-[0.6875rem] tracking-[0.14em] uppercase text-ink-muted transition-colors hover:text-signal"
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
