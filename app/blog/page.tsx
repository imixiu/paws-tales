import type { Metadata } from "next";
import Link from "next/link";
import { getAllArticles } from "@/lib/db";
import ArticleCard from "@/components/ArticleCard";
import EmptyState from "@/components/EmptyState";
import { CATEGORIES } from "@/lib/site";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "All articles",
  description:
    "Browse every story in the pawspost journal — training, health, behaviour, puppy care, and life with your dog.",
  alternates: { canonical: "/blog" },
};

export default async function BlogIndex() {
  const articles = (await getAllArticles()).slice(0, 200);

  return (
    <>
      {/* Hero strip */}
      <section style={{ background: "var(--color-surface-soft)" }}>
        <div
          className="mx-auto px-4 sm:px-6 lg:px-10 py-12 lg:py-20"
          style={{ maxWidth: 1444 }}
        >
          <div className="flex flex-col gap-3" style={{ maxWidth: 760 }}>
            <span
              style={{
                fontSize: 12,
                fontWeight: 600,
                letterSpacing: 1.4,
                textTransform: "uppercase",
                color: "var(--color-muted)",
              }}
            >
              The journal
            </span>
            <h1 style={{ fontFamily: "var(--font-display)" }}>
              Stories, science, and softness — every week.
            </h1>
            <p
              style={{
                fontSize: 18,
                color: "var(--color-body)",
                lineHeight: 1.6,
              }}
            >
              {articles.length} articles from vets, trainers, and behaviour
              specialists who love their dogs the way you love yours.
            </p>
          </div>

          <div
            className="mt-8 flex flex-wrap gap-3"
            aria-label="Filter by category"
          >
            <Link
              href="/blog"
              style={pillStyle(true)}
            >
              All
            </Link>
            {Object.values(CATEGORIES).map((c) => (
              <Link
                key={c.slug}
                href={`/categories/${c.slug}`}
                style={pillStyle(false)}
              >
                {c.label}
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section style={{ background: "var(--color-canvas)" }}>
        <div
          className="mx-auto px-4 sm:px-6 lg:px-10 py-12 lg:py-20"
          style={{ maxWidth: 1444 }}
        >
          {articles.length === 0 ? (
            <EmptyState
              title="No articles yet"
              message="The journal is still warming up — check back soon for our first stories."
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

function pillStyle(active: boolean): React.CSSProperties {
  return {
    background: active ? "var(--color-primary)" : "transparent",
    color: "var(--color-ink)",
    border: active ? "2px solid var(--color-primary)" : "2px solid var(--color-ink)",
    borderRadius: 9999,
    padding: "8px 18px",
    fontSize: 14,
    fontWeight: 600,
    height: 40,
    display: "inline-flex",
    alignItems: "center",
  };
}
