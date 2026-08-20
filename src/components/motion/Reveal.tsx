"use client";

import { useRef, type ReactNode, type RefObject } from "react";
import { useGSAP } from "@gsap/react";
import { gsap, prefersReducedMotion } from "@/lib/gsap";

/**
 * Only the tags this is actually used with.
 *
 * A fully polymorphic `as` prop cannot be typed alongside a forwarded ref
 * without casting, and rendering it via `createElement` puts the ref inside a
 * plain props object — which React's lint rules correctly flag, since a
 * function receiving that object could read `.current` during render. Three
 * explicit JSX branches are more code and no cleverness, which is the point.
 */
type Tag = "div" | "section" | "article";

type Props = {
  readonly children: ReactNode;
  readonly as?: Tag;
  readonly className?: string;
  /** Seconds of delay before this element's reveal begins. */
  readonly delay?: number;
  /** Reveal direct children in sequence instead of the element as a whole. */
  readonly stagger?: boolean;
};

/**
 * Scroll-triggered reveal. The single reveal primitive used across the site —
 * having exactly one means the timing is identical everywhere, which is most of
 * what makes a page feel authored rather than assembled.
 *
 * Children render at full opacity in the server HTML and are only hidden once
 * the effect runs, so there is no flash of invisible content if JavaScript is
 * slow, and no invisible content at all if it never arrives.
 */
export function Reveal({
  children,
  as = "div",
  className,
  delay = 0,
  stagger = false,
}: Props) {
  const root = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const node = root.current;
      if (!node || prefersReducedMotion()) return;

      const targets = stagger ? Array.from(node.children) : node;

      gsap.from(targets, {
        y: 28,
        opacity: 0,
        duration: 1,
        delay,
        stagger: stagger ? 0.08 : 0,
        ease: "expo.out",
        scrollTrigger: {
          trigger: node,
          // Fires a little before the element is fully in view, so the motion
          // has finished by the time the reader's eye arrives.
          start: "top 88%",
          once: true,
        },
      });
    },
    { scope: root },
  );

  // Semantic elements share HTMLElement rather than a specific interface, so
  // the div-typed ref is widened for those branches.
  const wide = root as RefObject<HTMLElement | null>;

  if (as === "article") {
    return (
      <article ref={wide} className={className}>
        {children}
      </article>
    );
  }

  if (as === "section") {
    return (
      <section ref={wide} className={className}>
        {children}
      </section>
    );
  }

  return (
    <div ref={root} className={className}>
      {children}
    </div>
  );
}
