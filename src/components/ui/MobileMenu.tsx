"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import { NAV, SOCIALS } from "@/lib/site";

type Props = {
  readonly open: boolean;
  readonly onClose: () => void;
  readonly pathname: string;
};

/**
 * Full-screen mobile navigation.
 *
 * The behaviour here is the part that usually gets skipped: focus moves into the
 * panel on open and is trapped inside it, Escape closes, focus returns to the
 * trigger, and the page behind cannot scroll. A menu that leaves focus on the
 * page underneath is unusable with a screen reader or a keyboard — the user
 * tabs into content they cannot see.
 */
export function MobileMenu({ open, onClose, pathname }: Props) {
  const panel = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    const node = panel.current;
    if (!node) return;

    const previouslyFocused = document.activeElement as HTMLElement | null;

    // Lock the page behind the panel. Compensating for the scrollbar width
    // avoids a layout shift as it disappears.
    const scrollbar = window.innerWidth - document.documentElement.clientWidth;
    const { overflow, paddingRight } = document.body.style;
    document.body.style.overflow = "hidden";
    if (scrollbar > 0) document.body.style.paddingRight = `${scrollbar}px`;

    const focusable = () =>
      Array.from(
        node.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])',
        ),
      ).filter((el) => el.offsetParent !== null);

    focusable()[0]?.focus();

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
        return;
      }

      if (event.key !== "Tab") return;

      const items = focusable();
      if (items.length === 0) return;

      const first = items[0];
      const last = items[items.length - 1];

      // Wrap at both ends so focus can never leave the panel.
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", onKeyDown);

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = overflow;
      document.body.style.paddingRight = paddingRight;
      previouslyFocused?.focus();
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      ref={panel}
      // Not aria-modal on a non-dialog element; role="dialog" plus the trap
      // above is what actually makes this behave modally.
      role="dialog"
      aria-modal="true"
      aria-label="Navigation"
      className="fixed inset-0 z-40 flex flex-col justify-between bg-void/97 px-5 pb-10 pt-24 backdrop-blur-xl md:hidden"
    >
      <nav>
        <ul className="flex flex-col">
          {NAV.map((item, index) => {
            const active =
              pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <li key={item.href} className="border-b border-line">
                <Link
                  href={item.href}
                  onClick={onClose}
                  aria-current={active ? "page" : undefined}
                  className={[
                    "flex items-baseline gap-4 py-5 text-title transition-colors",
                    active ? "text-signal" : "text-ink",
                  ].join(" ")}
                >
                  <span className="font-mono text-[0.625rem] tracking-[0.14em] text-ink-faint">
                    0{index + 1}
                  </span>
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <ul className="flex flex-wrap gap-x-6 gap-y-2">
        {SOCIALS.map((social) => (
          <li key={social.label}>
            <a
              href={social.href}
              target={social.href.startsWith("mailto:") ? undefined : "_blank"}
              rel="noreferrer noopener"
              className="font-mono text-[0.625rem] tracking-[0.14em] uppercase text-ink-muted transition-colors hover:text-signal"
            >
              {social.label}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}
