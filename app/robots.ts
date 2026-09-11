import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";
import { generateSitemaps } from "./sitemap";

// Next 16 + generateSitemaps does NOT register a /sitemap.xml index route,
// so declare every shard directly in robots.txt (multiple Sitemap: lines are
// standard). Shard list is derived from generateSitemaps() itself so robots
// and sitemap shards can never drift apart.
export default async function robots(): Promise<MetadataRoute.Robots> {
  let sitemaps: string[] = [`${SITE_URL}/sitemap/0.xml`];
  try {
    const ids = await generateSitemaps();
    if (ids.length > 0) {
      sitemaps = ids.map(({ id }) => `${SITE_URL}/sitemap/${id}.xml`);
    }
  } catch {
    // keep fallback single shard
  }
  return {
    rules: [{ userAgent: "*", allow: "/" }],
    sitemap: sitemaps,
  };
}
