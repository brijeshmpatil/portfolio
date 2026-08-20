"use client";

import { Canvas } from "@react-three/fiber";
import { useEffect, useRef, useState } from "react";
import { ParticleField } from "@/components/webgl/ParticleField";

type Props = {
  readonly count: number;
  readonly progress: number;
  readonly size: number;
};

/**
 * Playground canvas.
 *
 * Same render-loop discipline as the hero: paused when scrolled out of view and
 * when the tab is hidden. A demo left spinning at the bottom of a page the
 * visitor has scrolled past is exactly the kind of waste this site is arguing
 * against.
 */
export function LabCanvas({ count, progress, size }: Props) {
  const wrapper = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const node = wrapper.current;
    if (!node) return;

    const observer = new IntersectionObserver(
      ([entry]) => setVisible(entry.isIntersecting),
      { rootMargin: "15% 0px" },
    );
    observer.observe(node);

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
        dpr={[1, 1.5]}
        frameloop={visible ? "always" : "never"}
        camera={{ position: [0, 0, 9], fov: 45, near: 0.1, far: 60 }}
        gl={{ antialias: false, alpha: true, powerPreference: "high-performance" }}
      >
        <ParticleField count={count} progress={progress} size={size} />
      </Canvas>
    </div>
  );
}
