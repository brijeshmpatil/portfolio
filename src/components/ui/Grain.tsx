/**
 * Fixed film-grain overlay.
 *
 * Implemented as an inline SVG feTurbulence data URI rather than a PNG: it is
 * ~400 bytes, needs no network request, and therefore cannot affect LCP. The
 * layer is `pointer-events-none` and `aria-hidden` so it is invisible to both
 * input and assistive tech.
 *
 * Server component — there is no interactivity here, so it ships zero JS.
 */
const GRAIN = `data:image/svg+xml,${encodeURIComponent(
  `<svg xmlns="http://www.w3.org/2000/svg" width="140" height="140"><filter id="n"><feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="3" stitchTiles="stitch"/><feColorMatrix type="saturate" values="0"/></filter><rect width="140" height="140" filter="url(#n)" opacity="0.55"/></svg>`,
)}`;

export function Grain() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-[100] opacity-[0.035] mix-blend-screen"
      style={{ backgroundImage: `url("${GRAIN}")`, backgroundRepeat: "repeat" }}
    />
  );
}
