import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CATEGORIES, categoryFor } from "@/lib/site";
import { getArticlesByTypePaginated } from "@/lib/db";
import ArticleCard from "@/components/ArticleCard";
import EmptyState from "@/components/EmptyState";

export const revalidate = 3600;
const PAGE_SIZE = 48;

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
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ page?: string }>;
}) {
  const { slug } = await params;
  const cat = categoryFor(slug);
  if (!cat) notFound();

  const sp = await searchParams;
  const page = Math.max(1, parseInt(sp.page || "1", 10) || 1);
  const { articles, total } = await getArticlesByTypePaginated(slug, page, PAGE_SIZE);
  const totalPages = Math.ceil(total / PAGE_SIZE);
  const basePath = `/categories/${slug}`;

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
              message={`We haven't published anything in "${cat.label}" yet. The journal is small but growing — please check back soon.`}
              cta={{ label: "Browse all articles", href: "/blog" }}
            />
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
                {articles.map((a) => (
                  <ArticleCard key={a.id} article={a} />
                ))}
              </div>
              {totalPages > 1 && (
                <nav className="flex items-center justify-center gap-2 mt-12 flex-wrap">
                  {page > 1 && (
                    <Link href={page === 2 ? basePath : `${basePath}?page=${page - 1}`} className="px-4 py-2 rounded-lg border text-sm font-medium hover:opacity-80 transition-colors" style={{ borderColor: "var(--color-hairline-soft)" }}>
                      ← Prev
                    </Link>
                  )}
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => {
                    if (p === 1 || p === totalPages || Math.abs(p - page) <= 2) {
                      return p === page ? (
                        <span key={p} className="px-3 py-2 rounded-lg text-sm font-medium text-white" style={{ background: "var(--color-primary)" }}>{p}</span>
                      ) : (
                        <Link key={p} href={p === 1 ? basePath : `${basePath}?page=${p}`} className="px-3 py-2 rounded-lg border text-sm hover:opacity-80 transition-colors" style={{ borderColor: "var(--color-hairline-soft)" }}>{p}</Link>
                      );
                    }
                    if (p === page - 3 || p === page + 3) {
                      return <span key={p} className="px-2" style={{ color: "var(--color-muted)" }}>…</span>;
                    }
                    return null;
                  })}
                  {page < totalPages && (
                    <Link href={`${basePath}?page=${page + 1}`} className="px-4 py-2 rounded-lg border text-sm font-medium hover:opacity-80 transition-colors" style={{ borderColor: "var(--color-hairline-soft)" }}>
                      Next →
                    </Link>
                  )}
                </nav>
              )}
            </>
          )}
        </div>
      </section>
    </>
  );
}
