"use client";

import { useEffect, useState } from "react";
import { onCLS, onINP, onLCP, onTTFB, type Metric } from "web-vitals";

type Reading = {
  readonly name: string;
  readonly value: number;
  readonly rating: Metric["rating"];
  readonly unit: "ms" | "";
  readonly good: string;
};

const THRESHOLDS: Readonly<Record<string, { unit: "ms" | ""; good: string }>> = {
  LCP: { unit: "ms", good: "< 2500ms" },
  INP: { unit: "ms", good: "< 200ms" },
  CLS: { unit: "", good: "< 0.1" },
  TTFB: { unit: "ms", good: "< 800ms" },
};

const RATING_COLOR: Readonly<Record<Metric["rating"], string>> = {
  good: "text-signal",
  "needs-improvement": "text-cool",
  poor: "text-bad",
};

/**
 * Reports this page's own Core Web Vitals, measured in the visitor's browser.
 *
 * The resume claims specific numbers on other people's sites. This is the one
 * place those claims can be checked directly — so rather than asserting the
 * site is fast, it reports what the visitor's own browser measured, including
 * when that is unflattering.
 *
 * INP only has a value once the visitor has interacted, and CLS is only final
 * at unload, so entries appear progressively rather than all at once. That is
 * how the metrics genuinely work and the UI says so instead of faking a
 * complete set.
 */
export function WebVitals() {
  const [readings, setReadings] = useState<readonly Reading[]>([]);

  useEffect(() => {
    const record = (metric: Metric) => {
      const config = THRESHOLDS[metric.name];
      if (!config) return;

      setReadings((current) => {
        const next: Reading = {
          name: metric.name,
          value: metric.value,
          rating: metric.rating,
          unit: config.unit,
          good: config.good,
        };
        // Metrics re-report as they refine; replace rather than append.
        const without = current.filter((r) => r.name !== metric.name);
        return [...without, next].sort((a, b) => a.name.localeCompare(b.name));
      });
    };

    onLCP(record);
    onCLS(record);
    onINP(record);
    onTTFB(record);
  }, []);

  return (
    <div className="border border-line p-6 md:p-8">
      <div className="flex flex-wrap items-baseline justify-between gap-4">
        <h3 className="label">This page, measured in your browser</h3>
        <span className="font-mono text-[0.5625rem] tracking-[0.14em] uppercase text-ink-faint">
          web-vitals
        </span>
      </div>

      {readings.length === 0 ? (
        <p className="mt-6 text-sm text-ink-faint">Collecting…</p>
      ) : (
        <dl className="mt-6 grid gap-x-8 gap-y-6 sm:grid-cols-2">
          {readings.map((reading) => (
            <div key={reading.name} className="border-t border-line pt-4">
              <dt className="font-mono text-[0.625rem] tracking-[0.14em] uppercase text-ink-faint">
                {reading.name}
              </dt>
              <dd
                className={`mt-2 font-mono text-2xl tabular-nums ${RATING_COLOR[reading.rating]}`}
              >
                {reading.unit === "ms"
                  ? Math.round(reading.value)
                  : reading.value.toFixed(3)}
                <span className="text-sm">{reading.unit}</span>
                {/* Inside the dd — a dl group may not contain a paragraph */}
                <span className="mt-1 block font-mono text-[0.5625rem] tracking-[0.12em] uppercase text-ink-faint">
                  good is {reading.good}
                </span>
              </dd>
            </div>
          ))}
        </dl>
      )}

      <p className="mt-6 max-w-prose text-xs leading-relaxed text-ink-faint">
        INP needs an interaction before it has a value, and CLS is only final
        when you leave — so these fill in as you use the page rather than all at
        once. Whatever your browser reports is what is shown, including a bad
        number.
      </p>
    </div>
  );
}
