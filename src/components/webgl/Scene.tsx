"use client";

import { Canvas } from "@react-three/fiber";
import { useEffect, useRef, useState } from "react";
import { ParticleField } from "./ParticleField";

type Props = {
  readonly particles: number;
  readonly dpr: readonly [number, number];
};

/**
 * The R3F canvas.
 *
 * The render loop is paused whenever the hero leaves the viewport, via an
 * IntersectionObserver on the wrapper. That matters more than it sounds: an
 * always-on rAF loop keeps the GPU and the main thread busy for the entire
 * scroll of the page and shows up directly in INP.
 */
export function Scene({ particles, dpr }: Props) {
  const wrapper = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const node = wrapper.current;
    if (!node) return;

    const observer = new IntersectionObserver(
      ([entry]) => setVisible(entry.isIntersecting),
      { rootMargin: "10% 0px" },
    );
    observer.observe(node);

    // Also stop rendering when the tab is hidden — browsers throttle rAF, but
    // not reliably, and a backgrounded shader is pure waste.
    const onVisibility = () => setVisible(!document.hidden);
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      observer.disconnect();
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, []);

  return (
    <div ref={wrapper} className="absolute inset-0" aria-hidden="true">
      <Canvas
        dpr={dpr as [number, number]}
        frameloop={visible ? "always" : "never"}
        camera={{ position: [0, 0, 9], fov: 45, near: 0.1, far: 60 }}
        gl={{
          antialias: false,
          alpha: true,
          powerPreference: "high-performance",
          // Nothing reads the buffer back, so let the driver discard it.
          preserveDrawingBuffer: false,
        }}
      >
        <ParticleField count={particles} />
      </Canvas>
    </div>
  );
}
