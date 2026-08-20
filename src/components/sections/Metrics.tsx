import { Counter } from "@/components/motion/Counter";
import { Reveal } from "@/components/motion/Reveal";
import { HEADLINE_METRICS } from "@/lib/site";

export function Metrics() {
  return (
    <section className="hairline py-24" aria-labelledby="metrics-heading">
      <div className="gutter">
        <h2 id="metrics-heading" className="label">
          Measured outcomes
        </h2>

        <Reveal stagger className="mt-12 grid gap-x-8 gap-y-12 sm:grid-cols-2 lg:grid-cols-4">
          {HEADLINE_METRICS.map((metric) => (
            <div key={metric.label} className="border-t border-line-strong pt-5">
              <Counter
                value={metric.value}
                className="block font-mono text-4xl text-signal tabular-nums md:text-5xl"
              />
              <p className="mt-3 text-sm text-ink">{metric.label}</p>
              <p className="mt-1 text-xs text-ink-faint">{metric.detail}</p>
            </div>
          ))}
        </Reveal>

        <p className="mt-12 max-w-2xl text-sm text-ink-faint">
          Every figure above traces to a specific piece of shipped work rather
          than an average. The case studies say which, and where the number
          came from.
        </p>
      </div>
    </section>
  );
}
