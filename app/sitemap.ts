import type { MetadataRoute } from "next";

function getSiteUrl(): string | null {
  const configured = process.env.NEXT_PUBLIC_ANTI_LOGIC_SITE_URL || process.env.VERCEL_PROJECT_PRODUCTION_URL;
  if (!configured) return null;
  try {
    const url = new URL(configured.startsWith("http") ? configured : "https://" + configured);
    return url.origin;
  } catch {
    return null;
  }
}

export default function sitemap(): MetadataRoute.Sitemap {
  if (process.env.VERCEL_ENV === "preview") return [];
  const siteUrl = getSiteUrl();
  if (!siteUrl) return [];

  const routes = [
    ["/", 1.0],
    ["/platform", 0.8],
    ["/features", 0.8],
    ["/features/ai-analysis", 0.7],
    ["/features/automation", 0.7],
    ["/features/strategy-lab", 0.7],
    ["/pricing", 0.7],
    ["/blog", 0.7],
    ["/docs", 0.6],
    ["/faq", 0.5],
    ["/about", 0.4],
    ["/contact", 0.4],
    ["/security", 0.5],
    ["/status", 0.2],
    ["/legal/terms", 0.2],
    ["/legal/privacy", 0.2],
    ["/legal/cookies", 0.2],
    ["/legal/risk-disclosure", 0.3],
  ] as const;

  return routes.map(([route, priority]) => ({
    url: new URL(route, siteUrl).toString(),
    lastModified: new Date(),
    changeFrequency: route === "/" ? "weekly" : "monthly",
    priority,
  }));
}
