import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  getAllAuthors,
  getArticlesByAuthor,
  getAuthorBySlug,
} from "@/lib/db";
import { portraitFor } from "@/lib/images";
import ArticleCard from "@/components/ArticleCard";
import EmptyState from "@/components/EmptyState";

export const revalidate = 3600;

export async function generateStaticParams() {
  // Return empty array to avoid DB connection during build
  // Pages will be generated on-demand at runtime
  return [];
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const author = await getAuthorBySlug(slug);
  if (!author) return { title: "Author not found" };
  return {
    title: author.name ?? "Author",
    description:
      author.description ?? `Articles by ${author.name} on pawspost.`,
    alternates: { canonical: `/authors/${slug}` },
  };
}

export default async function AuthorDetail({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const author = await getAuthorBySlug(slug);
  if (!author) notFound();

  const articles = await getArticlesByAuthor(slug);
  const portrait = portraitFor(slug, 480);

  return (
    <>
      <section style={{ background: "var(--color-surface-soft)" }}>
        <div
          className="mx-auto px-4 sm:px-6 lg:px-10 py-12 lg:py-20 grid lg:grid-cols-[260px_1fr] gap-8 lg:gap-16 items-start"
          style={{ maxWidth: 1444 }}
        >
          <div
            className="relative mx-auto lg:mx-0"
            style={{
              width: 220,
              height: 220,
              borderRadius: 9999,
              overflow: "hidden",
              boxShadow: "0 8px 28px rgba(0,0,0,0.12)",
            }}
          >
            <Image
              src={portrait}
              alt={author.name ?? "Author portrait"}
              fill
              priority
              sizes="220px"
              style={{ objectFit: "cover" }}
            />
          </div>
          <div>
            <nav
              aria-label="Breadcrumb"
              style={{
                fontSize: 13,
                color: "var(--color-muted)",
                fontWeight: 500,
                marginBottom: 16,
              }}
            >
              <Link href="/" style={{ textDecoration: "underline" }}>
                Home
              </Link>
              <span style={{ margin: "0 8px" }}>›</span>
              <Link href="/authors" style={{ textDecoration: "underline" }}>
                Authors
              </Link>
              <span style={{ margin: "0 8px" }}>›</span>
              <span>{author.name}</span>
            </nav>
            <h1
              style={{
                fontFamily: "var(--font-display)",
                marginBottom: 16,
              }}
            >
              {author.name}
            </h1>
            {author.description ? (
              <p
                style={{
                  fontSize: 18,
                  color: "var(--color-body)",
                  lineHeight: 1.65,
                  maxWidth: 720,
                }}
              >
                {author.description}
              </p>
            ) : null}
          </div>
        </div>
      </section>

      <section style={{ background: "var(--color-canvas)" }}>
        <div
          className="mx-auto px-4 sm:px-6 lg:px-10 py-12 lg:py-20"
          style={{ maxWidth: 1444 }}
        >
          <h2
            style={{
              fontFamily: "var(--font-display)",
              marginBottom: 28,
            }}
          >
            Articles by {author.name}
          </h2>
          {articles.length === 0 ? (
            <EmptyState
              title="Nothing published yet"
              message={`${author.name} is preparing their first piece for pawspost.`}
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
