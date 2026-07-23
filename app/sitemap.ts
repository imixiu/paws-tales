import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";
import { getArticleUrlsForSitemap } from "@/lib/db";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [articles] = await Promise.all([
    getArticleUrlsForSitemap()(),
  ]);

  const staticPages: MetadataRoute.Sitemap = [
    { url: SITE_URL, lastModified: new Date(), changeFrequency: "daily", priority: 1 },
    { url: `${SITE_URL}/blog`, lastModified: new Date(), changeFrequency: "daily", priority: 0.9 },
    { url: `${SITE_URL}/categories`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.8 },
    { url: `${SITE_URL}/about`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.5 },
    { url: `${SITE_URL}/contact`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.5 },
    { url: `${SITE_URL}/privacy-policy`, lastModified: new Date(), changeFrequency: "yearly", priority: 0.3 },
    { url: `${SITE_URL}/terms-of-service`, lastModified: new Date(), changeFrequency: "yearly", priority: 0.3 },
  ];

  const articlePages: MetadataRoute.Sitemap = articles.map((a) => ({
    url: `${SITE_URL}/${a.type ?? "blog"}/${a.short_title ?? ""}`,
    lastModified: a.modified_time ? new Date(a.modified_time) : new Date(),
    changeFrequency: "weekly" as const,
    priority: 0.7,
  }));


  return [...staticPages, ...articlePages];
}
