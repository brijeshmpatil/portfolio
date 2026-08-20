/**
 * GLSL for the fluid simulation.
 *
 * This is a Navier–Stokes solver for incompressible flow, run entirely on the
 * GPU as a chain of fragment-shader passes over floating-point textures. Each
 * pass reads one or two field textures and writes another; nothing crosses back
 * to the CPU. The fields are:
 *
 *   velocity    RG16F   the flow field itself
 *   dye         RGBA16F the visible ink being carried by that flow
 *   divergence  R16F    how much the velocity field is compressing per texel
 *   curl        R16F    local rotation, used to feed small vortices back in
 *   pressure    R16F    solved iteratively to cancel the divergence
 *
 * The order matters and is the actual algorithm: advect, then add vorticity,
 * then compute divergence, then solve pressure, then subtract its gradient to
 * make the field divergence-free again.
 */

/** Full-screen triangle. No attributes: the position comes from the vertex ID. */
export const VERT = /* glsl */ `#version 300 es
precision highp float;
out vec2 vUv;
void main() {
  // Two triangles' worth of clip-space coords generated from gl_VertexID, so
  // there is no vertex buffer to allocate or bind at all.
  vec2 pos = vec2(
    (gl_VertexID == 1) ? 3.0 : -1.0,
    (gl_VertexID == 2) ? 3.0 : -1.0
  );
  vUv = pos * 0.5 + 0.5;
  gl_Position = vec4(pos, 0.0, 1.0);
}`;

const HEAD = /* glsl */ `#version 300 es
precision highp float;
precision highp sampler2D;
in vec2 vUv;
out vec4 outColor;
uniform vec2 uTexel;
`;

/** Adds a soft gaussian blob of velocity or colour at the pointer. */
export const SPLAT = `${HEAD}
uniform sampler2D uTarget;
uniform vec3 uValue;
uniform vec2 uPoint;
uniform float uRadius;
uniform float uAspect;

void main() {
  vec2 p = vUv - uPoint;
  p.x *= uAspect;
  // Gaussian rather than a hard disc: a hard edge injects high frequencies the
  // advection step then smears into visible square artefacts.
  float fall = exp(-dot(p, p) / uRadius);
  vec3 base = texture(uTarget, vUv).xyz;
  outColor = vec4(base + fall * uValue, 1.0);
}`;

/**
 * Semi-Lagrangian advection: for each texel, walk backwards along the velocity
 * field and sample where this parcel of fluid came from. Stable at any timestep,
 * which is why it is used instead of pushing particles forwards.
 */
export const ADVECTION = `${HEAD}
uniform sampler2D uVelocity;
uniform sampler2D uSource;
uniform float uDt;
uniform float uDissipation;

void main() {
  vec2 coord = vUv - uDt * texture(uVelocity, vUv).xy * uTexel;
  vec4 result = texture(uSource, coord);
  // Exponential decay, so dissipation is framerate-independent.
  outColor = result / (1.0 + uDissipation * uDt);
}`;

/** Divergence of the velocity field, by central differences. */
export const DIVERGENCE = `${HEAD}
uniform sampler2D uVelocity;

void main() {
  float l = texture(uVelocity, vUv - vec2(uTexel.x, 0.0)).x;
  float r = texture(uVelocity, vUv + vec2(uTexel.x, 0.0)).x;
  float b = texture(uVelocity, vUv - vec2(0.0, uTexel.y)).y;
  float t = texture(uVelocity, vUv + vec2(0.0, uTexel.y)).y;
  outColor = vec4(0.5 * (r - l + t - b), 0.0, 0.0, 1.0);
}`;

/** Local rotation of the flow. */
export const CURL = `${HEAD}
uniform sampler2D uVelocity;

void main() {
  float l = texture(uVelocity, vUv - vec2(uTexel.x, 0.0)).y;
  float r = texture(uVelocity, vUv + vec2(uTexel.x, 0.0)).y;
  float b = texture(uVelocity, vUv - vec2(0.0, uTexel.y)).x;
  float t = texture(uVelocity, vUv + vec2(0.0, uTexel.y)).x;
  outColor = vec4(0.5 * (r - l - t + b), 0.0, 0.0, 1.0);
}`;

/**
 * Vorticity confinement. Numerical dissipation in the advection step quietly
 * eats small eddies; this measures the curl that survived and pushes energy back
 * into it, which is what makes the result look like ink in water rather than
 * like a blurred gradient.
 */
export const VORTICITY = `${HEAD}
uniform sampler2D uVelocity;
uniform sampler2D uCurl;
uniform float uCurlStrength;
uniform float uDt;

void main() {
  float l = texture(uCurl, vUv - vec2(uTexel.x, 0.0)).x;
  float r = texture(uCurl, vUv + vec2(uTexel.x, 0.0)).x;
  float b = texture(uCurl, vUv - vec2(0.0, uTexel.y)).x;
  float t = texture(uCurl, vUv + vec2(0.0, uTexel.y)).x;
  float c = texture(uCurl, vUv).x;

  vec2 force = 0.5 * vec2(abs(t) - abs(b), abs(r) - abs(l));
  // Guard the normalisation: the gradient is exactly zero in still regions.
  force /= length(force) + 1e-4;
  force *= uCurlStrength * c;
  force.y *= -1.0;

  vec2 velocity = texture(uVelocity, vUv).xy + force * uDt;
  outColor = vec4(clamp(velocity, -1000.0, 1000.0), 0.0, 1.0);
}`;

/** One Jacobi iteration of the pressure Poisson solve. */
export const PRESSURE = `${HEAD}
uniform sampler2D uPressure;
uniform sampler2D uDivergence;

void main() {
  float l = texture(uPressure, vUv - vec2(uTexel.x, 0.0)).x;
  float r = texture(uPressure, vUv + vec2(uTexel.x, 0.0)).x;
  float b = texture(uPressure, vUv - vec2(0.0, uTexel.y)).x;
  float t = texture(uPressure, vUv + vec2(0.0, uTexel.y)).x;
  float divergence = texture(uDivergence, vUv).x;
  outColor = vec4((l + r + b + t - divergence) * 0.25, 0.0, 0.0, 1.0);
}`;

/** Subtracting the pressure gradient is what enforces incompressibility. */
export const GRADIENT_SUBTRACT = `${HEAD}
uniform sampler2D uPressure;
uniform sampler2D uVelocity;

void main() {
  float l = texture(uPressure, vUv - vec2(uTexel.x, 0.0)).x;
  float r = texture(uPressure, vUv + vec2(uTexel.x, 0.0)).x;
  float b = texture(uPressure, vUv - vec2(0.0, uTexel.y)).x;
  float t = texture(uPressure, vUv + vec2(0.0, uTexel.y)).x;
  vec2 velocity = texture(uVelocity, vUv).xy - vec2(r - l, t - b);
  outColor = vec4(velocity, 0.0, 1.0);
}`;

/** Multiplies a field by a constant — used to bleed pressure between frames. */
export const CLEAR = `${HEAD}
uniform sampler2D uTexture;
uniform float uValue;

void main() {
  outColor = uValue * texture(uTexture, vUv);
}`;

/**
 * Final pass to the screen. Adds a cheap shaded relief by treating the dye's
 * own luminance as a height field, which gives the ink some body instead of
 * reading as flat colour.
 */
export const DISPLAY = `${HEAD}
uniform sampler2D uTexture;

void main() {
  vec3 c = texture(uTexture, vUv).rgb;

  float lum = dot(c, vec3(0.299, 0.587, 0.114));
  float l = dot(texture(uTexture, vUv - vec2(uTexel.x, 0.0)).rgb, vec3(0.299, 0.587, 0.114));
  float t = dot(texture(uTexture, vUv + vec2(0.0, uTexel.y)).rgb, vec3(0.299, 0.587, 0.114));

  vec3 normal = normalize(vec3(l - lum, t - lum, 0.16));
  float shade = clamp(dot(normal, normalize(vec3(-0.4, 0.5, 0.75))), 0.0, 1.0);
  c += c * shade * 0.55;

  // Composite over the site background rather than pure black, so the canvas
  // does not read as a hole punched in the page.
  vec3 bg = vec3(0.051, 0.059, 0.066);
  outColor = vec4(bg + c, 1.0);
}`;
