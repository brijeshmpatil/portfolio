"use client";

import dynamic from "next/dynamic";

/**
 * Client boundary for the fluid simulation.
 *
 * `next/dynamic` with `ssr: false` is not allowed inside a Server Component, and
 * the playground page is one. Skipping SSR is also correct on its own terms:
 * the component is a WebGL2 canvas that renders nothing without a GPU context,
 * so server-rendering it would only produce markup to throw away.
 */
const FluidInk = dynamic(
  () => import("./FluidInk").then((m) => m.FluidInk),
  {
    ssr: false,
    // Reserves the exact aspect ratio, so nothing shifts when it loads.
    loading: () => <div className="aspect-[16/9] w-full border border-line bg-base" />,
  },
);

export function FluidSection() {
  return <FluidInk />;
}
