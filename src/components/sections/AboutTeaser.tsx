import Link from "next/link";
import { Reveal } from "@/components/motion/Reveal";
import { SectionHeading } from "@/components/motion/SectionHeading";

export function AboutTeaser() {
  return (
    <section className="hairline py-24" aria-labelledby="about-teaser-heading">
      <div className="gutter grid gap-12 md:grid-cols-[1fr_1.3fr] md:gap-20">
        <SectionHeading label="About">Three years, eleven applications.</SectionHeading>

        <Reveal className="space-y-5 text-lead text-ink-muted">
          <p>
            I joined ShopTrade as an intern in 2023 and I am now SDE&nbsp;2 and
            technical lead there, responsible for frontend architecture across
            every client platform and for three engineers.
          </p>
          <p>
            The work is mostly commerce and healthcare — regulated,
            high-consequence storefronts where a slow page costs money and a
            wrong order costs more than that. It has made me a much more careful
            engineer than a greenfield product would have.
          </p>
          <p>
            What I actually enjoy is the unglamorous half: reading a waterfall,
            deleting a script nobody remembers adding, making an interaction
            reversible, getting a keyboard path right.
          </p>

          <p className="pt-4">
            <Link
              href="/about"
              className="font-mono text-[0.6875rem] tracking-[0.14em] uppercase text-ink underline decoration-signal decoration-1 underline-offset-8 transition-colors hover:text-signal"
            >
              More about how I work
            </Link>
          </p>
        </Reveal>
      </div>
    </section>
  );
}
