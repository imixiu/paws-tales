import type { MetadataRoute } from "next";
import { CATEGORIES, SITE_URL } from "@/lib/site";
import { getSitemapArticleCount, getArticleUrlsForSitemapPaged } from "@/lib/db";

// Sharded at 5000 URLs per file (well under the 50,000 per-file limit).
// NOTE: no force-dynamic here — with generateSitemaps, Next 16 only registers
// the /sitemap.xml INDEX route when built statically (force-dynamic => 404 index).
// Sitemap refreshes on every build/deploy (article imports always deploy).

const CHUNK = 5000;

const STATIC_PATHS: ReadonlyArray<{ path: string; freq: "daily" | "weekly" | "monthly" }> = [
  { path: "/", freq: "daily" },
  { path: "/blog", freq: "daily" },
  { path: "/categories", freq: "weekly" },
  ...Object.keys(CATEGORIES).map((slug) => ({ path: `/${slug}`, freq: "daily" as const })),
  { path: "/about", freq: "monthly" },
  { path: "/contact", freq: "monthly" },
  { path: "/privacy-policy", freq: "monthly" },
  { path: "/terms-of-service", freq: "monthly" },
];

function staticEntries(): MetadataRoute.Sitemap {
  const now = new Date();
  return STATIC_PATHS.map((p) => ({
    url: `${SITE_URL}${p.path}`,
    lastModified: now,
    changeFrequency: p.freq,
  }));
}

export async function generateSitemaps(): Promise<{ id: number }[]> {
  const total = await getSitemapArticleCount();
  const shards = Math.max(1, Math.ceil((STATIC_PATHS.length + total) / CHUNK));
  return Array.from({ length: shards }, (_, i) => ({ id: i }));
}

export default async function sitemap(props: { id: Promise<string> }): Promise<MetadataRoute.Sitemap> {
  // Next 16: id is a Promise<string> (breaking change). Awaiting is required —
  // destructuring `{ id }: { id: number }` yields NaN math and a silent EMPTY urlset.
  const id = Number(await props.id);
  const total = await getSitemapArticleCount();
  const statics = staticEntries();
  const S = statics.length;
  const start = id * CHUNK;
  const end = Math.min(start + CHUNK, S + total);
  if (start >= end) return [];

  const entries: MetadataRoute.Sitemap = [];
  if (start < S) entries.push(...statics.slice(start, Math.min(S, end)));

  const artStart = Math.max(0, start - S);
  const artEnd = Math.max(0, end - S);
  if (artEnd > artStart) {
    const rows = await getArticleUrlsForSitemapPaged(artEnd - artStart, artStart);
    for (const a of rows) {
      entries.push({
        url: `${SITE_URL}/${a.type ?? "blog"}/${a.short_title ?? ""}`,
        lastModified: a.modified_time ? new Date(a.modified_time) : new Date(),
        changeFrequency: "weekly",
      });
    }
  }
  return entries;
}
