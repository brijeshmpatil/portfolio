import Link from "next/link";
import type { ReactNode } from "react";

type Props = {
  readonly href: string;
  readonly children: string;
  readonly className?: string;
  readonly external?: boolean;
  readonly ariaCurrent?: "page";
};

/**
 * A link whose label slides up and is replaced by an accent-coloured copy.
 *
 * Server component — the whole effect is CSS, so this ships no JavaScript. The
 * duplicate label is `aria-hidden`, so a screen reader hears the text once.
 *
 * `children` is typed as `string` rather than ReactNode on purpose: the label
 * has to be duplicated, and duplicating arbitrary nodes would clone anything
 * interactive inside them.
 */
export function SwapLink({
  href,
  children,
  className,
  external = false,
  ariaCurrent,
}: Props) {
  const inner: ReactNode = (
    <span className="link-swap">
      <span className="link-swap__layer">{children}</span>
      <span aria-hidden="true" className="link-swap__layer link-swap__layer--ghost">
        {children}
      </span>
    </span>
  );

  if (external) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noreferrer noopener"
        className={className}
      >
        {inner}
      </a>
    );
  }

  return (
    <Link href={href} className={className} aria-current={ariaCurrent}>
      {inner}
    </Link>
  );
}
