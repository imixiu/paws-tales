import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CATEGORIES, categoryFor } from "@/lib/site";
import { getArticlesByType } from "@/lib/db";
import ArticleCard from "@/components/ArticleCard";
import EmptyState from "@/components/EmptyState";

export const revalidate = 3600;

export async function generateStaticParams() {
  return Object.keys(CATEGORIES).map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const cat = categoryFor(slug);
  if (!cat) return { title: "Category not found" };
  return {
    title: cat.label,
    description: cat.blurb,
    alternates: { canonical: `/categories/${slug}` },
  };
}

export default async function CategoryDetail({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const cat = categoryFor(slug);
  if (!cat) notFound();

  const articles = await getArticlesByType(slug);

  return (
    <>
      <section style={{ background: "var(--color-primary)" }}>
        <div
          className="mx-auto px-4 sm:px-6 lg:px-10 py-12 lg:py-20"
          style={{ maxWidth: 1444 }}
        >
          <nav
            aria-label="Breadcrumb"
            style={{
              fontSize: 13,
              color: "var(--color-on-primary)",
              fontWeight: 500,
              marginBottom: 24,
            }}
          >
            <Link href="/" style={{ textDecoration: "underline" }}>
              Home
            </Link>
            <span style={{ margin: "0 8px" }}>›</span>
            <Link href="/categories" style={{ textDecoration: "underline" }}>
              Categories
            </Link>
            <span style={{ margin: "0 8px" }}>›</span>
            <span>{cat.label}</span>
          </nav>
          <h1
            style={{
              fontFamily: "var(--font-display)",
              color: "var(--color-on-primary)",
              marginBottom: 16,
            }}
          >
            {cat.label}
          </h1>
          <p
            style={{
              fontSize: 20,
              color: "var(--color-on-primary)",
              fontWeight: 500,
              lineHeight: 1.5,
              maxWidth: 760,
            }}
          >
            {cat.blurb}
          </p>
        </div>
      </section>

      <section style={{ background: "var(--color-canvas)" }}>
        <div
          className="mx-auto px-4 sm:px-6 lg:px-10 py-12 lg:py-20"
          style={{ maxWidth: 1444 }}
        >
          {articles.length === 0 ? (
            <EmptyState
              title="No articles in this topic yet"
              message={`We haven’t published anything in “${cat.label}” yet. The journal is small but growing — please check back soon.`}
              cta={{ label: "Browse all articles", href: "/blog" }}
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
              {articles.map((a) => (
                <ArticleCard key={a.id} article={a} />
              ))}
            </div>
          )}
        </div>
      </section>
    </>
  );
}
