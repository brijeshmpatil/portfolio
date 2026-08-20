/**
 * GLSL for the hero particle field.
 *
 * One instanced points draw call. Each particle carries three candidate
 * positions as attributes — scattered, wordmark, grid — and the vertex shader
 * blends between them from a single `uProgress` uniform that ScrollTrigger
 * animates from 0 to 2. No CPU-side position updates, no geometry rebuilds:
 * the entire morph is GPU work.
 */

/** Simplex noise, Ashima/McEwan. Used to build the curl-noise flow field. */
const SIMPLEX_3D = /* glsl */ `
vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec4 permute(vec4 x) { return mod289(((x * 34.0) + 1.0) * x); }
vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }

float snoise(vec3 v) {
  const vec2 C = vec2(1.0 / 6.0, 1.0 / 3.0);
  const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);

  vec3 i  = floor(v + dot(v, C.yyy));
  vec3 x0 = v - i + dot(i, C.xxx);

  vec3 g = step(x0.yzx, x0.xyz);
  vec3 l = 1.0 - g;
  vec3 i1 = min(g.xyz, l.zxy);
  vec3 i2 = max(g.xyz, l.zxy);

  vec3 x1 = x0 - i1 + C.xxx;
  vec3 x2 = x0 - i2 + C.yyy;
  vec3 x3 = x0 - D.yyy;

  i = mod289(i);
  vec4 p = permute(permute(permute(
             i.z + vec4(0.0, i1.z, i2.z, 1.0))
           + i.y + vec4(0.0, i1.y, i2.y, 1.0))
           + i.x + vec4(0.0, i1.x, i2.x, 1.0));

  float n_ = 0.142857142857;
  vec3 ns = n_ * D.wyz - D.xzx;

  vec4 j = p - 49.0 * floor(p * ns.z * ns.z);
  vec4 x_ = floor(j * ns.z);
  vec4 y_ = floor(j - 7.0 * x_);

  vec4 x = x_ * ns.x + ns.yyyy;
  vec4 y = y_ * ns.x + ns.yyyy;
  vec4 h = 1.0 - abs(x) - abs(y);

  vec4 b0 = vec4(x.xy, y.xy);
  vec4 b1 = vec4(x.zw, y.zw);

  vec4 s0 = floor(b0) * 2.0 + 1.0;
  vec4 s1 = floor(b1) * 2.0 + 1.0;
  vec4 sh = -step(h, vec4(0.0));

  vec4 a0 = b0.xzyw + s0.xzyw * sh.xxyy;
  vec4 a1 = b1.xzyw + s1.xzyw * sh.zzww;

  vec3 p0 = vec3(a0.xy, h.x);
  vec3 p1 = vec3(a0.zw, h.y);
  vec3 p2 = vec3(a1.xy, h.z);
  vec3 p3 = vec3(a1.zw, h.w);

  vec4 norm = taylorInvSqrt(vec4(dot(p0, p0), dot(p1, p1), dot(p2, p2), dot(p3, p3)));
  p0 *= norm.x; p1 *= norm.y; p2 *= norm.z; p3 *= norm.w;

  vec4 m = max(0.6 - vec4(dot(x0, x0), dot(x1, x1), dot(x2, x2), dot(x3, x3)), 0.0);
  m = m * m;
  return 42.0 * dot(m * m, vec4(dot(p0, x0), dot(p1, x1), dot(p2, x2), dot(p3, x3)));
}
`;

export const PARTICLE_VERTEX = /* glsl */ `
uniform float uTime;
uniform float uProgress;      // 0 = scatter, 1 = wordmark, 2 = grid
uniform float uSize;          // particle radius in world units
uniform vec3  uPointer;       // world-space cursor, z unused
uniform float uPointerForce;
uniform float uPointScale;    // drawingBufferHeight / (2 * tan(fov/2))

attribute vec3  aScatter;
attribute vec3  aWord;
attribute vec3  aGrid;
attribute float aRandom;

varying float vAlpha;
varying float vHeat;          // 0 = drifting, 1 = locked into target

${SIMPLEX_3D}

/* Flow field.
   A true curl needs six noise samples per vertex; at 100k+ vertices that is
   over half a million noise evaluations per frame and it dominated the frame
   budget. Two decorrelated samples mapped through sin/cos give a field that is
   smooth, swirling and visually indistinguishable here, at a third of the cost.
   Divergence-free was never a requirement — it just has to look like drift. */
vec3 flow(vec3 p) {
  float a = snoise(p);
  float b = snoise(p + vec3(19.3, 7.1, 31.7));

  return vec3(
    sin(a * 3.14159),
    cos(b * 3.14159),
    sin((a + b) * 1.5708)
  ) * 0.8;
}

void main() {
  /* Stagger each particle's arrival so the wordmark assembles rather than
     snaps. The divisor matters: the per-particle offset is subtracted from
     progress and the remainder renormalised, so every particle reaches a
     stagger of exactly 1.0 by the time uProgress hits 1.0. An un-renormalised
     version leaves the late particles permanently short of their target and the
     letterforms never resolve. */
  const float SPREAD = 0.3;
  float stagger = smoothstep(
    0.0, 1.0, clamp((uProgress - aRandom * SPREAD) / (1.0 - SPREAD), 0.0, 1.0)
  );
  float gridPhase = smoothstep(
    0.0, 1.0, clamp((uProgress - 1.0 - aRandom * SPREAD) / (1.0 - SPREAD), 0.0, 1.0)
  );

  vec3 pos = mix(aScatter, aWord, stagger);
  pos = mix(pos, aGrid, gridPhase);

  /* Flow strength has to fall away to essentially nothing once a particle is
     locked. The wordmark's letter strokes are only a few tenths of a world unit
     across, so drift that stays even slightly active is wider than the stroke
     and dissolves the letters into noise — squaring the falloff is what makes
     the text legible. */
  float locked = max(stagger, gridPhase);
  vHeat = locked;
  float drag = (1.0 - locked) * (1.0 - locked);

  vec3 drift = flow(pos * 0.28 + vec3(0.0, 0.0, uTime * 0.08));
  pos += drift * drag * (0.55 + aRandom * 0.65);

  // Slow idle breathing so a still page is never completely static.
  pos.y += sin(uTime * 0.5 + aRandom * 6.2831) * 0.06 * drag;

  /* Cursor repulsion in XY, falling off smoothly over a fixed world radius.
     Scaled down once locked so the pointer nudges the wordmark rather than
     tearing it apart. */
  vec2 toPointer = pos.xy - uPointer.xy;
  float dist = length(toPointer);
  float influence = smoothstep(2.6, 0.0, dist) * uPointerForce;
  pos.xy += normalize(toPointer + 1e-5) * influence * mix(1.15, 0.35, locked);

  vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
  gl_Position = projectionMatrix * mvPosition;

  // Correct perspective size attenuation. uPointScale converts a world-space
  // radius into framebuffer pixels at unit depth, so a particle keeps a stable
  // apparent size across viewport sizes and device pixel ratios.
  float sizeScale = mix(1.0, 0.72, locked) * (0.6 + aRandom * 0.8);
  gl_PointSize = clamp(uSize * sizeScale * uPointScale / -mvPosition.z, 1.5, 18.0);

  /* Alpha falls as particles lock, which is counter-intuitive but necessary.
     Locking packs 80k particles into the area of a few glyphs; under additive
     blending that stacks well past 1.0, the red channel saturates first and the
     amber turns into flat yellow poster paint. Lower per-particle alpha lets the
     accumulation land on the intended colour and keeps the letterforms visibly
     granular instead of solid. */
  vAlpha = mix(0.55, 0.2, locked) * (0.6 + aRandom * 0.4);
}
`;

export const PARTICLE_FRAGMENT = /* glsl */ `
uniform vec3 uColorDrift;
uniform vec3 uColorLocked;

varying float vAlpha;
varying float vHeat;

void main() {
  // Round, soft-edged point. Discarding outside the disc is cheaper than
  // sampling a texture and keeps the payload at zero bytes.
  vec2 uv = gl_PointCoord - 0.5;
  float d = dot(uv, uv);
  if (d > 0.25) discard;

  float falloff = 1.0 - smoothstep(0.0, 0.25, d);
  vec3 color = mix(uColorDrift, uColorLocked, vHeat);

  gl_FragColor = vec4(color, vAlpha * falloff);
}
`;
