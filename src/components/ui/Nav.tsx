"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { NAV, SITE } from "@/lib/site";

/**
 * Fixed header. Hides on scroll-down / reveals on scroll-up, driven by a raw
 * scroll listener rather than a GSAP ScrollTrigger — the nav must work before
 * ScrollSmoother has initialised, and on touch devices where it never does.
 */
export function Nav() {
  const pathname = usePathname();
  const [hidden, setHidden] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const lastY = useRef(0);

  useEffect(() => {
    // rAF-throttled so this never becomes an INP problem.
    let frame = 0;

    const onScroll = () => {
      if (frame) return;
      frame = requestAnimationFrame(() => {
        const y = window.scrollY;
        setScrolled(y > 24);
        // Ignore sub-pixel jitter and the rubber-band region at the very top.
        if (Math.abs(y - lastY.current) > 8) {
          setHidden(y > lastY.current && y > 240);
          lastY.current = y;
        }
        frame = 0;
      });
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (frame) cancelAnimationFrame(frame);
    };
  }, []);

  return (
    <header
      className={[
        "fixed inset-x-0 top-0 z-50 transition-transform duration-500",
        "[transition-timing-function:var(--ease-out-expo)]",
        hidden ? "-translate-y-full" : "translate-y-0",
      ].join(" ")}
    >
      <div
        className={[
          "gutter flex items-center justify-between py-4 transition-colors duration-300",
          scrolled
            ? "border-b border-line bg-void/80 backdrop-blur-xl"
            : "border-b border-transparent",
        ].join(" ")}
      >
        <Link
          href="/"
          className="font-mono text-xs tracking-[0.2em] uppercase text-ink transition-colors hover:text-signal"
        >
          {SITE.shortName}
          <span className="text-signal">.</span>
        </Link>

        <nav aria-label="Primary">
          <ul className="flex items-center gap-1 sm:gap-2">
            {NAV.map((item) => {
              const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    aria-current={active ? "page" : undefined}
                    className={[
                      "relative block px-3 py-2 font-mono text-[0.6875rem] tracking-[0.14em] uppercase transition-colors",
                      active ? "text-signal" : "text-ink-muted hover:text-ink",
                    ].join(" ")}
                  >
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      </div>
    </header>
  );
}
