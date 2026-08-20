import type { MetadataRoute } from "next";
import { CASE_STUDIES } from "@/content/projects";
import { SITE } from "@/lib/site";

/**
 * Generated from the project registry rather than hand-maintained, so a new case
 * study cannot be added without also appearing in the sitemap.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const staticRoutes = [
    { path: "", priority: 1 },
    { path: "/work", priority: 0.9 },
    { path: "/about", priority: 0.8 },
    { path: "/resume", priority: 0.8 },
    { path: "/playground", priority: 0.6 },
  ];

  return [
    ...staticRoutes.map((route) => ({
      url: `${SITE.url}${route.path}`,
      changeFrequency: "monthly" as const,
      priority: route.priority,
    })),
    ...CASE_STUDIES.map((project) => ({
      url: `${SITE.url}/work/${project.slug}`,
      changeFrequency: "yearly" as const,
      priority: 0.7,
    })),
  ];
}
