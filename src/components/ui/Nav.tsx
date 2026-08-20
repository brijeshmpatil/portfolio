"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { MobileMenu } from "@/components/ui/MobileMenu";
import { NAV, SITE } from "@/lib/site";

/**
 * Fixed header.
 *
 * Hides on scroll-down and reveals on scroll-up, driven by a raw scroll listener
 * rather than a ScrollTrigger — it has to work from the first scroll event,
 * before GSAP has finished setting anything up.
 *
 * Below md the links are replaced by a full-screen menu. Inline links did not
 * fit at 390px and were being silently clipped by the body's overflow rule,
 * which is worse than overflowing: the last item simply vanished.
 */
export function Nav() {
  const pathname = usePathname();
  const [hidden, setHidden] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
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

  /* Close the menu on navigation — otherwise the panel stays open over the new
     route, which matters for back/forward where no link was clicked.
     This is React's documented reset-state-on-prop-change pattern: adjusting
     state during render is fine and re-renders immediately without committing
     the stale value, whereas doing it in an effect paints the wrong UI first. */
  const [lastPath, setLastPath] = useState(pathname);
  if (pathname !== lastPath) {
    setLastPath(pathname);
    setMenuOpen(false);
  }

  const closeMenu = useCallback(() => setMenuOpen(false), []);

  return (
    <>
      <header
        className={[
          "fixed inset-x-0 top-0 z-50 transition-transform duration-500",
          "[transition-timing-function:var(--ease-out-expo)]",
          // Never hide the header while the menu is open — the close button
          // lives in it.
          hidden && !menuOpen ? "-translate-y-full" : "translate-y-0",
        ].join(" ")}
      >
        <div
          className={[
            "gutter flex items-center justify-between py-4 transition-colors duration-300",
            scrolled || menuOpen
              ? "border-b border-line bg-void/80 backdrop-blur-xl"
              : "border-b border-transparent",
          ].join(" ")}
        >
          <Link
            href="/"
            className="relative z-50 font-mono text-xs tracking-[0.2em] uppercase text-ink transition-colors hover:text-signal"
          >
            {SITE.shortName}
            <span className="text-signal">.</span>
          </Link>

          {/* Desktop links */}
          <nav aria-label="Primary" className="hidden md:block">
            <ul className="flex items-center gap-2">
              {NAV.map((item) => {
                const active =
                  pathname === item.href || pathname.startsWith(`${item.href}/`);
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      aria-current={active ? "page" : undefined}
                      className={[
                        "block px-3 py-2 font-mono text-[0.6875rem] tracking-[0.14em] uppercase transition-colors",
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

          {/* Mobile trigger */}
          <button
            type="button"
            onClick={() => setMenuOpen((open) => !open)}
            aria-expanded={menuOpen}
            aria-controls="mobile-menu"
            className="relative z-50 -mr-2 flex items-center gap-2 px-2 py-2 font-mono text-[0.625rem] tracking-[0.14em] uppercase text-ink md:hidden"
          >
            {menuOpen ? "Close" : "Menu"}
            <span aria-hidden="true" className="flex flex-col gap-1">
              <span
                className={[
                  "block h-px w-4 bg-current transition-transform duration-300",
                  menuOpen ? "translate-y-[2.5px] rotate-45" : "",
                ].join(" ")}
              />
              <span
                className={[
                  "block h-px w-4 bg-current transition-transform duration-300",
                  menuOpen ? "-translate-y-[2.5px] -rotate-45" : "",
                ].join(" ")}
              />
            </span>
          </button>
        </div>
      </header>

      <div id="mobile-menu">
        <MobileMenu open={menuOpen} onClose={closeMenu} pathname={pathname} />
      </div>
    </>
  );
}
