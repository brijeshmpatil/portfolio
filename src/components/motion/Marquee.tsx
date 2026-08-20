"use client";

import { useRef } from "react";
import { useGSAP } from "@gsap/react";
import { gsap, prefersReducedMotion } from "@/lib/gsap";

type Props = {
  readonly items: readonly string[];
  /** Seconds for one full pass. Larger is slower. */
  readonly duration?: number;
  readonly reverse?: boolean;
};

/**
 * Infinite marquee.
 *
 * Uses a single x-translation on a duplicated track with `gsap.utils.wrap`,
 * rather than animating each item — one transform, promoted to its own layer,
 * so the whole strip costs the compositor essentially nothing.
 *
 * The list is duplicated in markup and the copy is aria-hidden, so a screen
 * reader hears each brand once.
 */
export function Marquee({ items, duration = 32, reverse = false }: Props) {
  const track = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const node = track.current;
      if (!node || prefersReducedMotion()) return;

      // The track holds two identical halves; scrolling exactly half its width
      // returns to a visually identical position, which is what makes the wrap
      // seamless at any width.
      const distance = node.scrollWidth / 2;

      const tween = gsap.to(node, {
        x: reverse ? distance : -distance,
        duration,
        ease: "none",
        repeat: -1,
        modifiers: {
          x: gsap.utils.unitize(gsap.utils.wrap(-distance, 0)),
        },
      });

      // Pausing on hover lets someone actually read a name they recognised.
      const pause = () => tween.timeScale(0.15);
      const resume = () => tween.timeScale(1);
      node.addEventListener("pointerenter", pause);
      node.addEventListener("pointerleave", resume);

      return () => {
        node.removeEventListener("pointerenter", pause);
        node.removeEventListener("pointerleave", resume);
        tween.kill();
      };
    },
    { scope: track },
  );

  const row = (hidden: boolean) =>
    items.map((item, i) => (
      <span
        key={`${hidden ? "b" : "a"}-${item}-${i}`}
        className="flex shrink-0 items-center gap-8 whitespace-nowrap pr-8 text-title text-ink-faint transition-colors"
      >
        {item}
        <span aria-hidden="true" className="text-signal/40">
          /
        </span>
      </span>
    ));

  return (
    <div className="relative overflow-hidden py-2">
      <div ref={track} className="flex w-max will-change-transform">
        {row(false)}
        <span aria-hidden="true" className="flex">
          {row(true)}
        </span>
      </div>

      {/* Edge fades, so items enter and leave rather than being clipped */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-y-0 left-0 w-24 bg-gradient-to-r from-void to-transparent"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-y-0 right-0 w-24 bg-gradient-to-l from-void to-transparent"
      />
    </div>
  );
}
