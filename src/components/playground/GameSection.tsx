"use client";

import dynamic from "next/dynamic";

/**
 * Client boundary for the game.
 *
 * Two reasons this indirection exists rather than importing ShipIt directly:
 *
 * 1. `next/dynamic` with `ssr: false` is not allowed inside a Server Component,
 *    and the playground page is one.
 * 2. The game reads its high score from localStorage in a state initialiser. If
 *    it were server-rendered, the server would render 0 and the client would
 *    hydrate with the stored value — a mismatch. Skipping SSR entirely removes
 *    the problem rather than papering over it with a mounted flag.
 */
const ShipIt = dynamic(() => import("./ShipIt").then((m) => m.ShipIt), {
  ssr: false,
  // Reserves the exact aspect ratio so there is no layout shift when it loads.
  loading: () => (
    <div className="aspect-[1000/620] w-full border border-line bg-base" />
  ),
});

export function GameSection() {
  return <ShipIt />;
}
