import type { MetadataRoute } from "next";
import { getAllArticles, getAllAuthors } from "@/lib/db";
import { CATEGORIES, SITE_URL } from "@/lib/site";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [articles, authors] = await Promise.all([
    getAllArticles(),
    getAllAuthors(),
  ]);

  const now = new Date();

  const staticEntries: MetadataRoute.Sitemap = [
    { url: `${SITE_URL}/`, lastModified: now, priority: 1 },
    { url: `${SITE_URL}/blog`, lastModified: now, priority: 0.9 },
    { url: `${SITE_URL}/categories`, lastModified: now, priority: 0.8 },
    { url: `${SITE_URL}/authors`, lastModified: now, priority: 0.7 },
    { url: `${SITE_URL}/about`, lastModified: now, priority: 0.5 },
    { url: `${SITE_URL}/contact`, lastModified: now, priority: 0.5 },
  ];

  const categoryEntries = Object.keys(CATEGORIES).map((slug) => ({
    url: `${SITE_URL}/categories/${slug}`,
    lastModified: now,
    priority: 0.7,
  }));

  const articleEntries = articles
    .filter((a) => a.short_title)
    .map((a) => ({
      url: `${SITE_URL}/blog/${a.short_title}`,
      lastModified: a.modified_time ? new Date(a.modified_time) : now,
      priority: 0.7,
    }));

  const authorEntries = authors
    .filter((a) => a.slug)
    .map((a) => ({
      url: `${SITE_URL}/authors/${a.slug}`,
      lastModified: now,
      priority: 0.6,
    }));

  return [...staticEntries, ...categoryEntries, ...articleEntries, ...authorEntries];
}
