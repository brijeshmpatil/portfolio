import type { Metadata } from "next";
import { Timeline } from "@/components/about/Timeline";
import { WebVitals } from "@/components/about/WebVitals";
import { Reveal } from "@/components/motion/Reveal";
import { SectionHeading } from "@/components/motion/SectionHeading";
import { EDUCATION } from "@/content/experience";
import { SKILLS } from "@/content/skills";
import { SITE } from "@/lib/site";

export const metadata: Metadata = {
  title: "About",
  description:
    "Frontend engineer in Bengaluru. SDE 2 and technical lead at ShopTrade — how I work, what I have shipped, and what I have got wrong.",
};

export default function AboutPage() {
  return (
    <div className="pt-40 pb-24">
      <header className="gutter">
        <p className="label">About</p>
        <h1 className="mt-5 max-w-[22ch] text-display text-ink">
          I make things fast, mostly by deleting things.
        </h1>
      </header>

      <section className="gutter mt-16 grid gap-12 md:grid-cols-[1.2fr_1fr] md:gap-20">
        <Reveal className="max-w-[62ch] space-y-5 text-lead leading-relaxed text-ink-muted">
          <p>
            I am a frontend engineer in {SITE.location}. I joined ShopTrade as an
            intern in 2023 and I am now SDE&nbsp;2 and technical lead, owning
            frontend architecture across every client platform and leading three
            engineers.
          </p>
          <p>
            Almost all of my production experience is commerce and healthcare:
            regulated, high-consequence storefronts where a slow page costs money
            directly and an incorrect order costs considerably more than that.
            Two of the estates I work on sell medical equipment through
            insurance. That context has made me a more careful engineer than a
            greenfield product would have — you cannot ship a hopeful guess into
            a flow that decides whether somebody receives a breast pump.
          </p>
          <p>
            What I actually enjoy is the unglamorous half of the job. Reading a
            waterfall. Deleting a script nobody remembers adding. Making an
            interaction interruptible. Getting a keyboard path right. Most
            performance work is subtraction, and most of the rest is noticing
            that something is being done twice.
          </p>
          <p>
            I use AI coding assistants — Claude Code, Cursor, Copilot — as daily
            tools rather than as a novelty, with repo-level standards files so
            generated code starts from the project&apos;s conventions. I also
            review all of it before commit, because generated code fails
            differently from human code: it is confidently plausible, and
            plausible is the hardest thing to catch in review.
          </p>
        </Reveal>

        <Reveal delay={0.15}>
          <WebVitals />
        </Reveal>
      </section>

      <section className="gutter mt-28">
        <SectionHeading label="Experience">
          Three years, one company, a lot of different problems.
        </SectionHeading>
        <Timeline />
      </section>

      <section className="gutter mt-24">
        <SectionHeading label="Toolkit">What I reach for.</SectionHeading>

        <div className="mt-14 grid gap-x-12 gap-y-10 md:grid-cols-2 lg:grid-cols-3">
          {SKILLS.map((group) => (
            <Reveal key={group.label} className="border-t border-line pt-5">
              <h3 className="font-mono text-[0.625rem] tracking-[0.14em] uppercase text-signal">
                {group.label}
              </h3>
              <ul className="mt-4 flex flex-wrap gap-x-3 gap-y-2">
                {group.items.map((item) => (
                  <li key={item} className="text-sm text-ink-muted">
                    {item}
                  </li>
                ))}
              </ul>
            </Reveal>
          ))}
        </div>
      </section>

      <section className="gutter mt-24">
        <SectionHeading label="Education">Where I studied.</SectionHeading>

        <dl className="mt-12 grid gap-8 sm:grid-cols-2">
          {EDUCATION.map((entry) => (
            <div key={entry.degree} className="border-t border-line pt-5">
              <dt className="text-base text-ink">{entry.degree}</dt>
              <dd className="mt-2 text-sm text-ink-muted">
                {entry.institution}
              </dd>
              <dd className="mt-1 font-mono text-[0.625rem] tracking-[0.14em] uppercase text-ink-faint">
                {entry.years}
              </dd>
            </div>
          ))}
        </dl>
      </section>
    </div>
  );
}
