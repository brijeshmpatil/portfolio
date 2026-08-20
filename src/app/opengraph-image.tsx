import { ImageResponse } from "next/og";
import { HEADLINE_METRICS, SITE } from "@/lib/site";

export const alt = `${SITE.name} — ${SITE.role}`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/**
 * Social card, generated at build time.
 *
 * Deliberately typographic rather than a screenshot of the hero: the hero is a
 * dark particle field that reads as noise at 1200×630 in a Slack preview, and a
 * screenshot would need regenerating every time the site changed. The numbers
 * are pulled from the same constants the page uses, so the card cannot go stale.
 *
 * No webfont is fetched — that would mean a network request during build for
 * marginal gain. The system sans is fine at this size.
 */
export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "#08090a",
          padding: "72px 80px",
          color: "#edede9",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <span
            style={{
              fontSize: 22,
              letterSpacing: 6,
              textTransform: "uppercase",
              color: "#767f88",
            }}
          >
            {SITE.role} · {SITE.location}
          </span>
          <span style={{ fontSize: 22, letterSpacing: 6, color: "#ffae35" }}>
            {new URL(SITE.url).hostname}
          </span>
        </div>

        <div style={{ display: "flex", flexDirection: "column" }}>
          <span style={{ fontSize: 104, letterSpacing: -3, lineHeight: 1 }}>
            Interfaces that ship,
          </span>
          <span style={{ fontSize: 104, letterSpacing: -3, lineHeight: 1.05 }}>
            then get <span style={{ color: "#ffae35" }}>faster</span>.
          </span>
        </div>

        <div style={{ display: "flex", gap: 64, borderTop: "1px solid #2c333a", paddingTop: 28 }}>
          {HEADLINE_METRICS.map((metric) => (
            <div key={metric.label} style={{ display: "flex", flexDirection: "column" }}>
              <span style={{ fontSize: 40, color: "#ffae35" }}>{metric.value}</span>
              <span
                style={{
                  fontSize: 18,
                  letterSpacing: 3,
                  textTransform: "uppercase",
                  color: "#767f88",
                  marginTop: 6,
                }}
              >
                {metric.label}
              </span>
            </div>
          ))}
        </div>
      </div>
    ),
    size,
  );
}
