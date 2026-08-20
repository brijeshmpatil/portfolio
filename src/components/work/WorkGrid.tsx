"use client";

import { useRef, useState } from "react";
import { useGSAP } from "@gsap/react";
import { gsap, prefersReducedMotion } from "@/lib/gsap";
import { Flip } from "@/lib/gsap-flip";
import type { Project, Vertical } from "@/lib/types";
import { ProjectCard } from "./ProjectCard";

type Filter = Vertical | "all";

type Props = {
  readonly projects: readonly Project[];
  readonly verticals: readonly Vertical[];
};

const LABELS: Readonly<Record<Filter, string>> = {
  all: "Everything",
  healthcare: "Healthcare",
  ecommerce: "E-commerce",
  b2b: "B2B",
  tooling: "Tooling",
  product: "Product",
};

/**
 * Filterable project grid.
 *
 * Filtering uses GSAP Flip rather than a mount/unmount transition: the cards
 * that survive a filter change animate from their old position to their new
 * one, so the eye can follow a specific card instead of the whole grid blinking
 * and reflowing. Cards are hidden with `display: none` rather than removed, so
 * Flip has real before/after geometry to interpolate.
 */
export function WorkGrid({ projects, verticals }: Props) {
  const [filter, setFilter] = useState<Filter>("all");
  const grid = useRef<HTMLDivElement>(null);

  const options: readonly Filter[] = ["all", ...verticals];

  useGSAP(
    () => {
      if (prefersReducedMotion() || !grid.current) return;

      const cards = grid.current.querySelectorAll<HTMLElement>("[data-vertical]");
      const state = Flip.getState(cards);

      for (const card of cards) {
        const matches = filter === "all" || card.dataset.vertical === filter;
        card.style.display = matches ? "" : "none";
      }

      Flip.from(state, {
        duration: 0.55,
        ease: "power3.inOut",
        scale: true,
        stagger: 0.02,
        absolute: true,
        onEnter: (elements) =>
          gsap.fromTo(elements, { opacity: 0, scale: 0.94 }, { opacity: 1, scale: 1, duration: 0.4 }),
        onLeave: (elements) => gsap.to(elements, { opacity: 0, scale: 0.94, duration: 0.25 }),
      });
    },
    { dependencies: [filter], scope: grid },
  );

  const count = projects.filter(
    (p) => filter === "all" || p.vertical === filter,
  ).length;

  return (
    <>
      <div className="gutter mt-12 flex flex-wrap items-center gap-2">
        <div role="group" aria-label="Filter projects by sector" className="flex flex-wrap gap-2">
          {options.map((option) => {
            const active = filter === option;
            return (
              <button
                key={option}
                type="button"
                onClick={() => setFilter(option)}
                aria-pressed={active}
                className={[
                  "border px-4 py-2 font-mono text-[0.625rem] tracking-[0.14em] uppercase transition-colors",
                  active
                    ? "border-signal text-signal"
                    : "border-line text-ink-muted hover:border-line-strong hover:text-ink",
                ].join(" ")}
              >
                {LABELS[option]}
              </button>
            );
          })}
        </div>

        {/* Announced so filtering is not a silent change for screen readers */}
        <p aria-live="polite" className="ml-auto font-mono text-[0.625rem] tracking-[0.14em] uppercase text-ink-faint">
          {count} {count === 1 ? "project" : "projects"}
        </p>
      </div>

      <div
        ref={grid}
        className="gutter mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-3"
      >
        {projects.map((project) => (
          <div key={project.slug} data-vertical={project.vertical}>
            <ProjectCard project={project} />
          </div>
        ))}
      </div>
    </>
  );
}
