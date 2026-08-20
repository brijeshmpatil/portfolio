import type { Metadata } from "next";
import { Reveal } from "@/components/motion/Reveal";
import { SectionHeading } from "@/components/motion/SectionHeading";
import { ShaderLab } from "@/components/playground/ShaderLab";
import { getProject } from "@/content/projects";

export const metadata: Metadata = {
  title: "Playground",
  description:
    "The hero shader with its controls exposed, plus the tooling I have written — a Figma to Shopify MCP server and a TypeScript theme build system.",
};

const TOOLING_SLUGS = ["build-system", "figma-shopify-mcp", "job-application"] as const;

export default function PlaygroundPage() {
  const tooling = TOOLING_SLUGS.map(getProject).filter(
    (project): project is NonNullable<typeof project> => Boolean(project),
  );

  return (
    <div className="pt-40 pb-24">
      <header className="gutter">
        <p className="label">Playground</p>
        <h1 className="mt-5 max-w-[22ch] text-display text-ink">
          The shader, with the lid off.
        </h1>
        <p className="mt-8 max-w-2xl text-lead text-ink-muted">
          This is the same vertex program that runs the hero — the same three
          target buffers, the same flow field. The difference is that here
          <code className="mx-1.5 font-mono text-sm text-signal">uProgress</code>
          is a slider instead of a scroll position, so you can sit inside the
          morph and see where it breaks.
        </p>
      </header>

      <section className="gutter mt-16">
        <ShaderLab />
      </section>

      <section className="gutter mt-24">
        <SectionHeading label="How it works">
          One draw call, three positions per particle.
        </SectionHeading>

        <Reveal className="mt-12 grid gap-x-16 gap-y-8 md:grid-cols-2">
          <div className="max-w-[62ch] space-y-5 text-sm leading-relaxed text-ink-muted">
            <p>
              Each particle carries three candidate positions as vertex
              attributes: a scattered position, a position sampled from the
              rasterised letterforms of <em>BRIJESH</em>, and a position inside
              one of eleven bars — one per production application I have
              shipped. The vertex shader blends between them from a single
              uniform.
            </p>
            <p>
              Nothing is recomputed on the CPU per frame and no geometry is
              rebuilt. The entire morph is one interpolation on the GPU, which is
              why 110,000 particles cost one draw call and stay inside a frame
              budget.
            </p>
          </div>

          <div className="max-w-[62ch] space-y-5 text-sm leading-relaxed text-ink-muted">
            <p>
              The wordmark positions come from drawing the text to an offscreen
              2D canvas, reading the pixels back, and resampling the ones above
              an alpha threshold. Sampling the bitmap directly clumps toward wide
              glyphs, so candidates are collected first and then resampled
              evenly.
            </p>
            <p>
              The two details that took the longest were both counter-intuitive.
              Drift has to fall off as the square of lock, because otherwise the
              residual motion is wider than a letter stroke and the type
              dissolves. And per-particle alpha has to <em>drop</em> on lock, not
              rise — packing the field into a few glyphs stacks additive blending
              past 1.0 and turns the amber into flat yellow.
            </p>
          </div>
        </Reveal>
      </section>

      <section className="gutter mt-24">
        <SectionHeading label="Tooling">
          Things I built so I would stop doing them by hand.
        </SectionHeading>

        <div className="mt-12 flex flex-col">
          {tooling.map((project) => (
            <Reveal
              key={project.slug}
              as="article"
              className="hairline grid gap-6 py-10 md:grid-cols-[1fr_1.6fr] md:gap-16"
            >
              <div>
                <h3 className="text-xl text-ink">{project.name}</h3>
                <p className="mt-2 font-serif text-base italic leading-snug text-ink-muted">
                  {project.tagline}
                </p>
                <ul className="mt-5 flex flex-wrap gap-2">
                  {project.stack.slice(0, 5).map((tech) => (
                    <li
                      key={tech}
                      className="border border-line px-2 py-1 font-mono text-[0.5625rem] tracking-[0.12em] uppercase text-ink-faint"
                    >
                      {tech}
                    </li>
                  ))}
                </ul>
              </div>

              <p className="text-sm leading-relaxed text-ink-muted">
                {project.summary}
              </p>
            </Reveal>
          ))}
        </div>
      </section>
    </div>
  );
}
