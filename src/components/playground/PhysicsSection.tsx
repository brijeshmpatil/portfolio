"use client";

import dynamic from "next/dynamic";

/**
 * Client boundary for the physics demo.
 *
 * `next/dynamic` with `ssr: false` is not allowed in a Server Component, and the
 * playground page is one. Skipping SSR also keeps matter-js (~90KB) out of the
 * server bundle and out of any route that is not this one.
 */
const TypePhysics = dynamic(
  () => import("./TypePhysics").then((m) => m.TypePhysics),
  {
    ssr: false,
    loading: () => <div className="aspect-[1000/400] w-full border border-line bg-base" />,
  },
);

export function PhysicsSection() {
  return <TypePhysics />;
}
