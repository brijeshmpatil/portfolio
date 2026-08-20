import {
  ADVECTION,
  CLEAR,
  CURL,
  DISPLAY,
  DIVERGENCE,
  GRADIENT_SUBTRACT,
  PRESSURE,
  SPLAT,
  VERT,
  VORTICITY,
} from "./shaders";

/**
 * GPU fluid solver, raw WebGL2.
 *
 * Deliberately not built on three.js even though it is already a dependency.
 * This is a chain of nine full-screen passes swapping between float
 * framebuffers; three's scene graph, material system and render-target
 * abstraction all have to be worked around rather than used, and the result is
 * longer and harder to follow than the WebGL calls it wraps.
 */

export type FluidSettings = {
  /** How fast the ink fades. Higher clears faster. */
  dyeDissipation: number;
  /** How fast the flow field loses energy. */
  velocityDissipation: number;
  /** Vorticity confinement — the difference between ink and a blur. */
  curl: number;
  /** Jacobi iterations for the pressure solve. More is rounder, and costlier. */
  pressureIterations: number;
  /** Splat size. */
  radius: number;
};

export const DEFAULT_SETTINGS: FluidSettings = {
  // Low enough that a stroke lingers and can be built on, high enough that the
  // canvas eventually returns to black instead of saturating to a solid wash.
  dyeDissipation: 0.6,
  velocityDissipation: 0.2,
  curl: 26,
  pressureIterations: 20,
  radius: 0.00045,
};

type Fbo = {
  texture: WebGLTexture;
  fbo: WebGLFramebuffer;
  width: number;
  height: number;
  texelX: number;
  texelY: number;
};

type DoubleFbo = { read: Fbo; write: Fbo; swap: () => void };

type Program = {
  program: WebGLProgram;
  uniforms: Record<string, WebGLUniformLocation | null>;
};

/** A program that has been linked but whose status has not been queried yet. */
type PendingProgram = { program: WebGLProgram; shaders: WebGLShader[] };

/** Simulation grid. Deliberately far below the dye grid: velocity is smooth. */
const SIM_SIZE = 128;
const DYE_SIZE = 512;

function compile(gl: WebGL2RenderingContext, type: number, source: string): WebGLShader {
  const shader = gl.createShader(type);
  if (!shader) throw new Error("Could not create shader");
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    const log = gl.getShaderInfoLog(shader);
    gl.deleteShader(shader);
    throw new Error(`Shader compile failed: ${log}`);
  }
  return shader;
}

/**
 * Starts a link WITHOUT querying its status.
 *
 * That distinction is the whole point. `getProgramParameter(LINK_STATUS)` blocks
 * the calling thread until the driver has finished compiling, so asking for it
 * here serialises all nine programs onto the main thread at mount — measured at
 * 460ms of Total Blocking Time, which took desktop Lighthouse from 100 to 79.
 * Linking is kicked off for every program first and the status is only read once
 * the driver reports completion, via KHR_parallel_shader_compile.
 */
function startLink(gl: WebGL2RenderingContext, fragment: string): PendingProgram {
  const program = gl.createProgram();
  if (!program) throw new Error("Could not create program");

  const vs = compile(gl, gl.VERTEX_SHADER, VERT);
  const fs = compile(gl, gl.FRAGMENT_SHADER, fragment);
  gl.attachShader(program, vs);
  gl.attachShader(program, fs);
  gl.linkProgram(program);

  return { program, shaders: [vs, fs] };
}

/** Reads link status and resolves uniform locations. Blocks if not yet complete. */
function finishLink(gl: WebGL2RenderingContext, pending: PendingProgram): Program {
  const { program, shaders } = pending;

  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    throw new Error(`Program link failed: ${gl.getProgramInfoLog(program)}`);
  }

  // Shaders can be deleted once linked; the program keeps what it needs.
  for (const shader of shaders) gl.deleteShader(shader);

  const uniforms: Record<string, WebGLUniformLocation | null> = {};
  const count = gl.getProgramParameter(program, gl.ACTIVE_UNIFORMS) as number;
  for (let i = 0; i < count; i += 1) {
    const name = gl.getActiveUniform(program, i)?.name;
    if (name) uniforms[name] = gl.getUniformLocation(program, name);
  }

  return { program, uniforms };
}

/**
 * Cheap, cached capability probe.
 *
 * Kept outside React so the answer is available in a state initialiser rather
 * than discovered inside an effect — the difference between rendering the
 * fallback on the first paint and rendering the canvas, failing, and swapping.
 * A throwaway context is created once and the result memoised.
 */
let supported: boolean | null = null;

export function isFluidSupported(): boolean {
  if (supported !== null) return supported;
  if (typeof document === "undefined") return false;

  try {
    const probe = document.createElement("canvas").getContext("webgl2");
    supported = Boolean(probe && probe.getExtension("EXT_color_buffer_float"));
    probe?.getExtension("WEBGL_lose_context")?.loseContext();
  } catch {
    supported = false;
  }

  return supported;
}

const COMPLETION_STATUS_KHR = 0x91b1;

export class FluidSimulation {
  private readonly gl: WebGL2RenderingContext;
  private readonly pending: Record<string, PendingProgram>;
  private readonly parallel: boolean;
  private programs: Record<string, Program> | null = null;

  private velocity!: DoubleFbo;
  private dye!: DoubleFbo;
  private pressure!: DoubleFbo;
  private divergence!: Fbo;
  private curl!: Fbo;

  private settings: FluidSettings = { ...DEFAULT_SETTINGS };
  private aspect = 1;

  constructor(canvas: HTMLCanvasElement) {
    const gl = canvas.getContext("webgl2", {
      alpha: false,
      antialias: false,
      depth: false,
      stencil: false,
      preserveDrawingBuffer: false,
      powerPreference: "high-performance",
    });
    if (!gl) throw new Error("WebGL2 unavailable");

    // Float render targets are the whole basis of this: velocity and pressure
    // are signed and go well outside 0–1, so 8-bit targets cannot hold them.
    if (!gl.getExtension("EXT_color_buffer_float")) {
      throw new Error("Float render targets unavailable");
    }
    gl.getExtension("OES_texture_float_linear");

    this.gl = gl;
    this.parallel = Boolean(gl.getExtension("KHR_parallel_shader_compile"));

    // All nine links are started back-to-back and none is waited on, so the
    // driver can compile them concurrently while the page carries on.
    this.pending = {
      splat: startLink(gl, SPLAT),
      advection: startLink(gl, ADVECTION),
      divergence: startLink(gl, DIVERGENCE),
      curl: startLink(gl, CURL),
      vorticity: startLink(gl, VORTICITY),
      pressure: startLink(gl, PRESSURE),
      gradient: startLink(gl, GRADIENT_SUBTRACT),
      clear: startLink(gl, CLEAR),
      display: startLink(gl, DISPLAY),
    };

    this.allocate();
  }

  private makeFbo(width: number, height: number, internal: number, format: number): Fbo {
    const gl = this.gl;
    const texture = gl.createTexture();
    if (!texture) throw new Error("Could not create texture");

    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    // Clamp, so advecting off the edge samples the border rather than wrapping
    // ink around to the opposite side.
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texImage2D(gl.TEXTURE_2D, 0, internal, width, height, 0, format, gl.HALF_FLOAT, null);

    const fbo = gl.createFramebuffer();
    if (!fbo) throw new Error("Could not create framebuffer");
    gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0);
    gl.viewport(0, 0, width, height);
    gl.clear(gl.COLOR_BUFFER_BIT);

    return { texture, fbo, width, height, texelX: 1 / width, texelY: 1 / height };
  }

  private makeDouble(w: number, h: number, internal: number, format: number): DoubleFbo {
    const pair = {
      read: this.makeFbo(w, h, internal, format),
      write: this.makeFbo(w, h, internal, format),
      swap: () => {
        const temp = pair.read;
        pair.read = pair.write;
        pair.write = temp;
      },
    };
    return pair;
  }

  private allocate(): void {
    const gl = this.gl;
    this.velocity = this.makeDouble(SIM_SIZE, SIM_SIZE, gl.RG16F, gl.RG);
    this.dye = this.makeDouble(DYE_SIZE, DYE_SIZE, gl.RGBA16F, gl.RGBA);
    this.pressure = this.makeDouble(SIM_SIZE, SIM_SIZE, gl.R16F, gl.RED);
    this.divergence = this.makeFbo(SIM_SIZE, SIM_SIZE, gl.R16F, gl.RED);
    this.curl = this.makeFbo(SIM_SIZE, SIM_SIZE, gl.R16F, gl.RED);
  }

  private blit(target: Fbo | null, program: Program, texel: [number, number]): void {
    const gl = this.gl;
    gl.useProgram(program.program);
    if (program.uniforms.uTexel) gl.uniform2f(program.uniforms.uTexel, texel[0], texel[1]);

    if (target) {
      gl.bindFramebuffer(gl.FRAMEBUFFER, target.fbo);
      gl.viewport(0, 0, target.width, target.height);
    } else {
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
      gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);
    }

    gl.drawArrays(gl.TRIANGLES, 0, 3);
  }

  private bind(program: Program, name: string, fbo: Fbo, unit: number): void {
    const gl = this.gl;
    gl.activeTexture(gl.TEXTURE0 + unit);
    gl.bindTexture(gl.TEXTURE_2D, fbo.texture);
    if (program.uniforms[name]) gl.uniform1i(program.uniforms[name], unit);
  }

  /**
   * True once every program has finished linking.
   *
   * Without the extension this reports false exactly once and then blocks to
   * finalise — the same total work as before, but moved off the mount and into a
   * later frame, so it lands after first paint rather than during hydration.
   */
  get ready(): boolean {
    if (this.programs) return true;

    const gl = this.gl;
    const entries = Object.entries(this.pending);

    if (this.parallel) {
      for (const [, pending] of entries) {
        if (!gl.getProgramParameter(pending.program, COMPLETION_STATUS_KHR)) {
          return false;
        }
      }
    }

    const finished: Record<string, Program> = {};
    for (const [name, pending] of entries) finished[name] = finishLink(gl, pending);
    this.programs = finished;
    return true;
  }

  setSettings(next: Partial<FluidSettings>): void {
    this.settings = { ...this.settings, ...next };
  }

  resize(width: number, height: number): void {
    this.aspect = width / height;
    this.gl.canvas.width = width;
    this.gl.canvas.height = height;
  }

  /** Current aspect ratio, so callers can lay out splats without distortion. */
  get aspectRatio(): number {
    return this.aspect;
  }

  /** Injects velocity and colour. `x`/`y` are 0–1 with y up. */
  splat(x: number, y: number, dx: number, dy: number, color: [number, number, number]): void {
    if (!this.ready || !this.programs) return;
    const gl = this.gl;
    const splat = this.programs.splat;

    gl.useProgram(splat.program);
    gl.uniform1f(splat.uniforms.uAspect, this.aspect);
    gl.uniform2f(splat.uniforms.uPoint, x, y);
    gl.uniform1f(splat.uniforms.uRadius, this.settings.radius);

    gl.uniform3f(splat.uniforms.uValue, dx, dy, 0);
    this.bind(splat, "uTarget", this.velocity.read, 0);
    this.blit(this.velocity.write, splat, [this.velocity.read.texelX, this.velocity.read.texelY]);
    this.velocity.swap();

    gl.uniform3f(splat.uniforms.uValue, color[0], color[1], color[2]);
    this.bind(splat, "uTarget", this.dye.read, 0);
    this.blit(this.dye.write, splat, [this.dye.read.texelX, this.dye.read.texelY]);
    this.dye.swap();
  }

  clear(): void {
    const gl = this.gl;
    for (const fbo of [this.dye.read, this.dye.write, this.velocity.read, this.velocity.write]) {
      gl.bindFramebuffer(gl.FRAMEBUFFER, fbo.fbo);
      gl.clearColor(0, 0, 0, 1);
      gl.clear(gl.COLOR_BUFFER_BIT);
    }
  }

  /** One simulation step plus the display pass. `dt` in seconds. */
  step(dt: number): void {
    // Nothing can be drawn until the programs exist; callers just try again next
    // frame rather than needing to know about compilation at all.
    if (!this.ready || !this.programs) return;

    const gl = this.gl;
    const { velocity, dye, pressure, divergence, curl, settings } = this;
    const simTexel: [number, number] = [velocity.read.texelX, velocity.read.texelY];

    gl.disable(gl.BLEND);

    // Vorticity: measure curl, then push energy back into it.
    const curlProgram = this.programs.curl;
    gl.useProgram(curlProgram.program);
    this.bind(curlProgram, "uVelocity", velocity.read, 0);
    this.blit(curl, curlProgram, simTexel);

    const vort = this.programs.vorticity;
    gl.useProgram(vort.program);
    this.bind(vort, "uVelocity", velocity.read, 0);
    this.bind(vort, "uCurl", curl, 1);
    gl.uniform1f(vort.uniforms.uCurlStrength, settings.curl);
    gl.uniform1f(vort.uniforms.uDt, dt);
    this.blit(velocity.write, vort, simTexel);
    velocity.swap();

    // Projection: solve for pressure, then remove its gradient.
    const div = this.programs.divergence;
    gl.useProgram(div.program);
    this.bind(div, "uVelocity", velocity.read, 0);
    this.blit(divergence, div, simTexel);

    const clear = this.programs.clear;
    gl.useProgram(clear.program);
    this.bind(clear, "uTexture", pressure.read, 0);
    // Retaining most of the previous frame's pressure gives the Jacobi solve a
    // warm start, which is why 20 iterations is enough instead of hundreds.
    gl.uniform1f(clear.uniforms.uValue, 0.8);
    this.blit(pressure.write, clear, simTexel);
    pressure.swap();

    const press = this.programs.pressure;
    gl.useProgram(press.program);
    this.bind(press, "uDivergence", divergence, 0);
    for (let i = 0; i < settings.pressureIterations; i += 1) {
      this.bind(press, "uPressure", pressure.read, 1);
      this.blit(pressure.write, press, simTexel);
      pressure.swap();
    }

    const grad = this.programs.gradient;
    gl.useProgram(grad.program);
    this.bind(grad, "uPressure", pressure.read, 0);
    this.bind(grad, "uVelocity", velocity.read, 1);
    this.blit(velocity.write, grad, simTexel);
    velocity.swap();

    // Advection: move the velocity field through itself, then the dye through it.
    const adv = this.programs.advection;
    gl.useProgram(adv.program);
    gl.uniform1f(adv.uniforms.uDt, dt);

    gl.uniform1f(adv.uniforms.uDissipation, settings.velocityDissipation);
    this.bind(adv, "uVelocity", velocity.read, 0);
    this.bind(adv, "uSource", velocity.read, 0);
    this.blit(velocity.write, adv, simTexel);
    velocity.swap();

    gl.uniform1f(adv.uniforms.uDissipation, settings.dyeDissipation);
    this.bind(adv, "uVelocity", velocity.read, 0);
    this.bind(adv, "uSource", dye.read, 1);
    this.blit(dye.write, adv, [dye.read.texelX, dye.read.texelY]);
    dye.swap();

    const display = this.programs.display;
    gl.useProgram(display.program);
    this.bind(display, "uTexture", dye.read, 0);
    this.blit(null, display, [dye.read.texelX, dye.read.texelY]);
  }

  dispose(): void {
    const gl = this.gl;
    const programs = this.programs
      ? Object.values(this.programs).map((p) => p.program)
      : Object.values(this.pending).map((p) => p.program);
    for (const program of programs) gl.deleteProgram(program);
    for (const f of [
      this.velocity.read, this.velocity.write,
      this.dye.read, this.dye.write,
      this.pressure.read, this.pressure.write,
      this.divergence, this.curl,
    ]) {
      gl.deleteTexture(f.texture);
      gl.deleteFramebuffer(f.fbo);
    }
    // Frees the backing GPU memory immediately rather than at GC time; a page
    // with several WebGL contexts will otherwise hit the browser's context limit.
    gl.getExtension("WEBGL_lose_context")?.loseContext();
  }
}
