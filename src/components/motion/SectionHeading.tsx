"use client";

import { useRef } from "react";
import { useGSAP } from "@gsap/react";
import { gsap, SplitText, prefersReducedMotion } from "@/lib/gsap";

type Props = {
  readonly label: string;
  readonly children: string;
  readonly level?: 2 | 3;
  readonly className?: string;
};

/**
 * Section heading with a mono eyebrow label and a line-masked reveal.
 *
 * The heading text is a plain string rather than nodes, because SplitText
 * rewrites the DOM inside it — passing arbitrary children would let a nested
 * element be silently destroyed on revert.
 */
export function SectionHeading({ label, children, level = 2, className }: Props) {
  const root = useRef<HTMLDivElement>(null);
  const Tag = level === 2 ? "h2" : "h3";

  useGSAP(
    () => {
      const heading = root.current?.querySelector(Tag);
      if (!heading || prefersReducedMotion()) return;

      const split = SplitText.create(heading, {
        type: "lines",
        mask: "lines",
        aria: "auto",
      });

      gsap.from(split.lines, {
        yPercent: 110,
        duration: 1.1,
        stagger: 0.08,
        ease: "expo.out",
        scrollTrigger: { trigger: root.current, start: "top 85%", once: true },
      });

      return () => split.revert();
    },
    { scope: root },
  );

  return (
    <div ref={root} className={className}>
      <p className="label">{label}</p>
      <Tag className="mt-4 max-w-[26ch] text-title text-ink">{children}</Tag>
    </div>
  );
}
