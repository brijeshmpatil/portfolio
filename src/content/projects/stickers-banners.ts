import { defineProject } from "@/lib/types";

// TODO(brijesh): confirm the 1GB+ chunked upload pipeline belongs to this build.
// The custom-print product configurators here are repo-verified; the upload
// pipeline is attributed from your resume plus the fact that this is the only
// storefront in the set that takes customer artwork. Correct me if it shipped
// on a different client and I will move the case study.
export const stickersBanners = defineProject({
  slug: "stickers-banners",
  name: "Stickers & Banners",
  tagline: "Uploading a 1GB print file over a connection that will drop",
  vertical: "ecommerce",
  depth: "case-study",
  order: 5,
  year: "2025 — 2026",
  role: "Frontend engineer",
  liveStatus: "live",
  url: "https://stickersbanners.com",
  stack: [
    "TypeScript",
    "Shopify Liquid",
    "React islands",
    "AWS S3 pre-signed URLs",
    "AWS Lambda",
    "IndexedDB",
    "Shopify Cart Transform",
  ],
  metrics: [
    { value: "1GB+", label: "single-file uploads", note: "print-resolution artwork" },
    { value: "resumable", label: "on connection failure", note: "per-segment automatic retry" },
  ],
  summary:
    "Custom-printed banners, vinyl stickers and step-and-repeat backdrops. Every order carries customer artwork, and print-resolution artwork is enormous — which turns the humble file input into the hardest component on the site.",
  sections: [
    {
      heading: "The problem",
      body: [
        "A browser file upload is a single HTTP request. For a 1GB print file on an ordinary connection that request runs for many minutes, and the probability that nothing interrupts it over that window is not high. When it fails, it fails completely — no partial credit, no resume, and the customer starts again from zero having already waited.",
        "Routing that through the application server is also the wrong shape: it means paying for the bytes twice and holding a long-lived request open for the duration.",
      ],
    },
    {
      heading: "Approach",
      body: [
        "The file is segmented client-side and each segment is sent directly to object storage against a short-lived pre-signed URL, so the bytes never touch the application server. Each segment succeeds or fails independently, which means a failure costs one segment rather than the whole file, and retries are automatic and invisible.",
        "Server-side processing — validation, dimension and resolution checks, preview generation — runs on upload completion rather than inline, so the customer is not waiting on it and the work scales with orders instead of with request handlers.",
      ],
      points: [
        "Segmented transfer with per-segment automatic retry and exponential backoff",
        "Direct-to-storage via short-lived pre-signed URLs — no bytes through the app server",
        "Real byte-level progress, not an indeterminate spinner: on a multi-minute upload the difference between 'working' and 'stuck' is the only thing the customer cares about",
        "Serverless post-processing triggered on completion for validation and preview generation",
        "Upload state cached in IndexedDB so an accidental navigation does not discard the session",
      ],
    },
    {
      heading: "The rest of the build",
      body: [
        "Custom print is configurator-heavy in a way standard commerce is not — dimensions are continuous rather than variant-based, and price is a function of size, material and finish rather than a lookup. Pricing is computed live as the customer adjusts, and the resulting line items are assembled through a Shopify cart transform so the cart reflects the true configured product rather than a placeholder.",
      ],
    },
    {
      heading: "What I would change",
      body: [
        "Progress reporting should have been built before retry logic, not after. For the first iteration the retries worked correctly and silently, which meant a customer on a bad connection saw a progress bar that appeared to stall — and reloaded the page, discarding work that was actually succeeding. Correct behaviour that the user cannot observe reads as broken behaviour.",
      ],
    },
  ],
});
