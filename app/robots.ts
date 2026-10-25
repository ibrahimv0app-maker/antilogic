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

export default function robots(): MetadataRoute.Robots {
  if (process.env.VERCEL_ENV === "preview") return { rules: [{ userAgent: "*", disallow: "/" }] };
  const siteUrl = getSiteUrl();
  return {
    rules: [{
      userAgent: "*",
      allow: "/",
      disallow: ["/app/", "/admin/", "/auth/", "/api/"],
    }],
    ...(siteUrl ? { sitemap: new URL("/sitemap.xml", siteUrl).toString() } : {}),
  };
}
