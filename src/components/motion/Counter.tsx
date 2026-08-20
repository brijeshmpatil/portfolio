"use client";

import { useRef } from "react";
import { useGSAP } from "@gsap/react";
import { gsap, prefersReducedMotion } from "@/lib/gsap";

type Props = {
  /** The final string, e.g. "40%", "1,000+", "<0.01". */
  readonly value: string;
  readonly className?: string;
};

/**
 * Counts up to a numeric value on scroll.
 *
 * The final value is rendered as server HTML, so it is correct before any
 * JavaScript runs and correct if none ever does. The animation overwrites
 * textContent and restores the exact original string at the end — it never
 * reconstructs it from the parsed number, which would lose separators, symbols
 * and comparison operators.
 */
export function Counter({ value, className }: Props) {
  const el = useRef<HTMLSpanElement>(null);

  useGSAP(
    () => {
      const node = el.current;
      if (!node || prefersReducedMotion()) return;

      // Strip everything that is not part of the number itself.
      const numeric = Number(value.replace(/[^0-9.]/g, ""));
      if (!Number.isFinite(numeric) || numeric === 0) return;

      const decimals = (value.split(".")[1]?.replace(/[^0-9]/g, "") ?? "").length;
      const prefix = value.slice(0, value.search(/[0-9]/));
      const suffix = value.slice(value.search(/[0-9]/)).replace(/^[0-9.,]+/, "");

      const counter = { n: 0 };

      gsap.to(counter, {
        n: numeric,
        duration: 1.6,
        ease: "expo.out",
        scrollTrigger: { trigger: node, start: "top 90%", once: true },
        onUpdate: () => {
          node.textContent = `${prefix}${counter.n.toLocaleString("en-US", {
            minimumFractionDigits: decimals,
            maximumFractionDigits: decimals,
          })}${suffix}`;
        },
        // Restore the authored string exactly, rather than a formatted number.
        onComplete: () => {
          node.textContent = value;
        },
      });
    },
    { scope: el },
  );

  return (
    <span ref={el} className={className}>
      {value}
    </span>
  );
}
