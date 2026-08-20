"use client";

import { useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { useGSAP } from "@gsap/react";
import { gsap } from "@/lib/gsap";
import { onHeroProgress } from "@/lib/hero-progress";
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
  const material = useRef<THREE.ShaderMaterial>(null);
  const { viewport, invalidate } = useThree();

  // Target buffers are built once. `count` only changes if the device tier
  // changes, which it does not after mount.
  const targets = useMemo(
    () => buildParticleTargets(count, WORDMARK, GRID_CELLS),
    [count],
  );

  /**
   * Initial uniform values only.
   *
   * Everything that animates is written through `material.current.uniforms`,
   * never through this object. R3F copies the `uniforms` prop onto the material
   * rather than adopting the reference, so mutating this after mount updates a
   * detached object and the shader never sees it — which is exactly the bug
   * that made the wordmark morph silently do nothing.
   */
  const initialUniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uProgress: { value: 0 },
      // World-space particle radius. Converted to pixels by uPointScale.
      uSize: { value: 0.028 },
      uPointer: { value: new THREE.Vector3() },
      uPointerForce: { value: 0 },
      uPointScale: { value: 1000 },
      // Drifting particles are cool grey and read as noise; locked particles
      // resolve to the accent, so the morph is a colour change as well as a
      // shape change.
      uColorDrift: { value: new THREE.Color("#9aa7b4") },
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

  // The scroll timeline lives in the hero section, which owns the pin. This
  // only consumes the resulting progress — writing straight to the uniform
  // rather than through state, so a scroll frame costs no React render.
  useGSAP(() => {
    const unsubscribe = onHeroProgress((progress) => {
      const uniforms = material.current?.uniforms;
      if (!uniforms) return;
      uniforms.uProgress.value = progress;
      invalidate();
    });

    // Pointer force eases in only once the cursor is actually over the page, so
    // the field is not permanently deformed by a cursor resting where it
    // happened to load. Tweening a plain proxy and copying it across avoids
    // holding a tween against a ref that may not exist yet.
    const force = { value: 0 };
    const to = (value: number, duration: number) =>
      gsap.to(force, {
        value,
        duration,
        onUpdate: () => {
          const uniforms = material.current?.uniforms;
          if (uniforms) uniforms.uPointerForce.value = force.value;
        },
      });

    const onEnter = () => to(1, 0.8);
    const onLeave = () => to(0, 1.2);

    window.addEventListener("pointerover", onEnter, { once: true });
    document.addEventListener("pointerleave", onLeave);

    return () => {
      unsubscribe();
      window.removeEventListener("pointerover", onEnter);
      document.removeEventListener("pointerleave", onLeave);
    };
  }, [invalidate]);

  /* eslint-disable react-hooks/immutability -- Writing to three.js uniforms
     every frame is the sanctioned R3F pattern and the entire point of an
     imperative renderer: these objects are owned by three.js, not by React, and
     are read by the GPU rather than by the render tree. Routing them through
     state would cause a React render per frame. The rule is about React-owned
     values; it does not apply here. */
  useFrame(({ clock, pointer, gl, camera }, delta) => {
    const uniforms = material.current?.uniforms;
    if (!uniforms) return;

    uniforms.uTime.value = clock.elapsedTime;

    // Convert a world radius to framebuffer pixels: half the buffer height
    // divided by the tangent of the half field of view. Recomputed per frame
    // because it depends on the drawing buffer, which changes on resize and on
    // a device-pixel-ratio change — both cheap scalar reads.
    const perspective = camera as THREE.PerspectiveCamera;
    const halfFov = (perspective.fov * Math.PI) / 360;
    uniforms.uPointScale.value =
      gl.getContext().drawingBufferHeight / (2 * Math.tan(halfFov));

    // Lerp toward the pointer rather than snapping — the trailing feels
    // physical and hides pointer-event coalescing on high-refresh displays.
    const target = uniforms.uPointer.value as THREE.Vector3;
    const damping = 1 - Math.pow(0.0015, delta);
    target.x += (pointer.x * viewport.width * 0.5 - target.x) * damping;
    target.y += (pointer.y * viewport.height * 0.5 - target.y) * damping;

    if (points.current) {
      points.current.rotation.z = Math.sin(clock.elapsedTime * 0.05) * 0.02;
    }
  });
  /* eslint-enable react-hooks/immutability */

  return (
    <points ref={points} geometry={geometry} frustumCulled={false}>
      <shaderMaterial
        ref={material}
        uniforms={initialUniforms}
        vertexShader={PARTICLE_VERTEX}
        fragmentShader={PARTICLE_FRAGMENT}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}
