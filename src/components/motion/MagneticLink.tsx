"use client";

import { useRef, type ReactNode } from "react";
import { useGSAP } from "@gsap/react";
import { gsap, prefersReducedMotion } from "@/lib/gsap";

type Props = {
  readonly href: string;
  readonly children: ReactNode;
  readonly className?: string;
  readonly external?: boolean;
  /**
   * Maximum pixels of pull toward the cursor. The default was 12, which is
   * genuinely imperceptible on display-scale type — it measured as a 9px
   * translate on the contact email and read as the effect being broken.
   */
  readonly strength?: number;
};

/**
 * A link that leans toward the cursor.
 *
 * Only enabled for fine pointers — on touch there is no cursor to lean toward,
 * and the listeners would be dead weight. Movement is applied with quickTo,
 * which reuses a single tween instead of creating one per pointermove; that is
 * the difference between this being free and this being an INP problem.
 */
export function MagneticLink({
  href,
  children,
  className,
  external = false,
  strength = 26,
}: Props) {
  const anchor = useRef<HTMLAnchorElement>(null);

  useGSAP(
    () => {
      const node = anchor.current;
      if (!node || prefersReducedMotion()) return;
      if (!window.matchMedia("(pointer: fine)").matches) return;

      const moveX = gsap.quickTo(node, "x", { duration: 0.45, ease: "power3.out" });
      const moveY = gsap.quickTo(node, "y", { duration: 0.45, ease: "power3.out" });

      const onMove = (event: PointerEvent) => {
        const rect = node.getBoundingClientRect();
        const offsetX = event.clientX - (rect.left + rect.width / 2);
        const offsetY = event.clientY - (rect.top + rect.height / 2);
        // Normalise by half-size so the pull is proportional, then clamp.
        moveX(gsap.utils.clamp(-strength, strength, (offsetX / rect.width) * strength * 2));
        moveY(gsap.utils.clamp(-strength, strength, (offsetY / rect.height) * strength * 2));
      };

      const onLeave = () => {
        moveX(0);
        moveY(0);
      };

      node.addEventListener("pointermove", onMove);
      node.addEventListener("pointerleave", onLeave);

      return () => {
        node.removeEventListener("pointermove", onMove);
        node.removeEventListener("pointerleave", onLeave);
      };
    },
    { scope: anchor },
  );

  return (
    <a
      ref={anchor}
      href={href}
      className={className}
      {...(external ? { target: "_blank", rel: "noreferrer noopener" } : {})}
    >
      {children}
    </a>
  );
}
