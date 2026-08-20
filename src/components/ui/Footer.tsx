import Link from "next/link";
import { NAV, SITE, SOCIALS } from "@/lib/site";

/** Server component — static content, ships no JS. */
export function Footer() {
  const year = 2026;

  return (
    <footer className="hairline mt-32">
      <div className="gutter grid gap-12 py-16 md:grid-cols-[1.5fr_1fr_1fr]">
        <div>
          <p className="label">Available for senior frontend roles</p>
          <a
            href={`mailto:${SITE.email}`}
            className="mt-4 block font-serif text-title lowercase text-ink transition-colors hover:text-signal"
          >
            {SITE.email}
          </a>
          <p className="mt-4 max-w-sm text-sm text-ink-faint">
            {SITE.location} · open to remote and relocation
          </p>
        </div>

        <nav aria-label="Footer">
          <p className="label">Pages</p>
          <ul className="mt-4 space-y-2">
            {NAV.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className="link-wipe text-sm text-ink-muted transition-colors hover:text-signal"
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div>
          <p className="label">Elsewhere</p>
          <ul className="mt-4 space-y-2">
            {SOCIALS.map((social) => (
              <li key={social.label}>
                <a
                  href={social.href}
                  target={social.href.startsWith("mailto:") ? undefined : "_blank"}
                  rel="noreferrer noopener"
                  className="link-wipe text-sm text-ink-muted transition-colors hover:text-signal"
                >
                  {social.label}
                </a>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="gutter hairline flex flex-col gap-2 py-6 font-mono text-[0.625rem] tracking-[0.14em] uppercase text-ink-faint md:flex-row md:items-center md:justify-between">
        <span>
          © {year} {SITE.name}
        </span>
        <span>Next.js · React · GSAP · WebGL — no UI kit, no CMS</span>
      </div>
    </footer>
  );
}
