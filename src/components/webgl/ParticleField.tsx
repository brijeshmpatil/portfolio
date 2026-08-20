"use client";

import { useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { useGSAP } from "@gsap/react";
import { gsap, ScrollTrigger } from "@/lib/gsap";
import { buildParticleTargets } from "@/lib/particle-targets";
import { PARTICLE_FRAGMENT, PARTICLE_VERTEX } from "./shaders/particles";

const WORDMARK = "BRIJESH";
/** One cell per production application shipped. */
const GRID_CELLS = 11;

type Props = {
  readonly count: number;
};

export function ParticleField({ count }: Props) {
  const points = useRef<THREE.Points>(null);
  const { viewport, invalidate } = useThree();

  // Target buffers are built once. `count` only changes if the device tier
  // changes, which it does not after mount.
  const targets = useMemo(
    () => buildParticleTargets(count, WORDMARK, GRID_CELLS),
    [count],
  );

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uProgress: { value: 0 },
      uSize: { value: 26 },
      uPointer: { value: new THREE.Vector3() },
      uPointerForce: { value: 0 },
      uAspect: { value: 1 },
      uColorDrift: { value: new THREE.Color("#3b4148") },
      uColorLocked: { value: new THREE.Color("#ffae35") },
    }),
    [],
  );

  const geometry = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    // `position` is required by three even though the vertex shader ignores it;
    // seed it with the scatter buffer so bounding-sphere maths stays sane.
    geo.setAttribute("position", new THREE.BufferAttribute(targets.scatter, 3));
    geo.setAttribute("aScatter", new THREE.BufferAttribute(targets.scatter, 3));
    geo.setAttribute("aWord", new THREE.BufferAttribute(targets.word, 3));
    geo.setAttribute("aGrid", new THREE.BufferAttribute(targets.grid, 3));
    geo.setAttribute("aRandom", new THREE.BufferAttribute(targets.random, 1));
    // The shader displaces well beyond the source positions; a generous manual
    // sphere avoids incorrect frustum culling without a per-frame recompute.
    geo.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 24);
    return geo;
  }, [targets]);

  // Scroll drives uProgress 0 -> 2 across the hero. Scrubbed, so the morph is
  // fully reversible and tracks the scrollbar exactly.
  useGSAP(() => {
    const trigger = ScrollTrigger.create({
      trigger: "#main",
      start: "top top",
      end: "+=140%",
      scrub: 0.6,
      onUpdate: (self) => {
        uniforms.uProgress.value = self.progress * 2;
        invalidate();
      },
    });

    // Pointer force eases in only once the cursor is actually over the hero,
    // so the field is not permanently deformed by a resting cursor.
    const onEnter = () => gsap.to(uniforms.uPointerForce, { value: 1, duration: 0.8 });
    const onLeave = () => gsap.to(uniforms.uPointerForce, { value: 0, duration: 1.2 });

    window.addEventListener("pointerover", onEnter, { once: true });
    document.addEventListener("pointerleave", onLeave);

    return () => {
      trigger.kill();
      document.removeEventListener("pointerleave", onLeave);
    };
  }, [uniforms, invalidate]);

  useFrame(({ clock, pointer }, delta) => {
    uniforms.uTime.value = clock.elapsedTime;
    // Keep point size consistent regardless of canvas height.
    uniforms.uAspect.value = viewport.height * 12;

    // Lerp toward the pointer rather than snapping — the trailing feels
    // physical and hides pointer-event coalescing on high-refresh displays.
    const target = uniforms.uPointer.value;
    const damping = 1 - Math.pow(0.0015, delta);
    target.x += (pointer.x * viewport.width * 0.5 - target.x) * damping;
    target.y += (pointer.y * viewport.height * 0.5 - target.y) * damping;

    if (points.current) points.current.rotation.z = Math.sin(clock.elapsedTime * 0.05) * 0.02;
  });

  return (
    <points ref={points} geometry={geometry} frustumCulled={false}>
      <shaderMaterial
        uniforms={uniforms}
        vertexShader={PARTICLE_VERTEX}
        fragmentShader={PARTICLE_FRAGMENT}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}
