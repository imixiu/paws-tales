import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  getAllArticles,
  getArticleBySlug,
  getRelatedArticles,
} from "@/lib/db";
import { categoryFor, SITE_NAME, SITE_URL } from "@/lib/site";
import { coverFor } from "@/lib/images";
import ArticleCard from "@/components/ArticleCard";

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
  const post = await getArticleBySlug(slug);
  if (!post) return { title: "Not found" };
  const cover = post.img || coverFor(post.type, post.short_title, 1200);
  return {
    title: post.title ?? "Article",
    description: post.description ?? undefined,
    alternates: { canonical: `/blog/${slug}` },
    openGraph: {
      title: post.title ?? "Article",
      description: post.description ?? undefined,
      images: [cover],
    },
  };
}

function formatDate(s: string | null | undefined): string {
  if (!s) return "";
  try {
    return new Date(s).toLocaleDateString("en-GB", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  } catch {
    return "";
  }
}

export default async function BlogDetail({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = await getArticleBySlug(slug);
  if (!post) notFound();

  const cat = categoryFor(post.type);
  const cover = post.img || coverFor(post.type, post.short_title, 1600);
  const related = (await getRelatedArticles(post.id, post.type ?? "")).slice(0, 3);

  const articleSchema = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.title,
    description: post.description,
    image: cover,
    datePublished: post.published_time,
    dateModified: post.modified_time,
    author: { "@type": "Person", name: post.author ?? SITE_NAME },
    publisher: { "@type": "Organization", name: SITE_NAME, url: SITE_URL },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }}
      />

      <section style={{ background: "var(--color-primary)" }}>
        <div
          className="mx-auto px-4 sm:px-6 lg:px-10 pt-10 pb-6"
          style={{ maxWidth: 1200 }}
        >
          <nav
            aria-label="Breadcrumb"
            style={{
              fontSize: 13,
              color: "var(--color-on-primary)",
              fontWeight: 500,
            }}
          >
            <Link href="/" style={{ textDecoration: "underline" }}>
              Home
            </Link>
            <span style={{ margin: "0 8px" }}>›</span>
            <Link href="/blog" style={{ textDecoration: "underline" }}>
              Blog
            </Link>
            {cat ? (
              <>
                <span style={{ margin: "0 8px" }}>›</span>
                <Link
                  href={`/categories/${cat.slug}`}
                  style={{ textDecoration: "underline" }}
                >
                  {cat.label}
                </Link>
              </>
            ) : null}
          </nav>
        </div>
      </section>

      <section style={{ background: "var(--color-primary)" }}>
        <div
          className="mx-auto px-4 sm:px-6 lg:px-10 pb-16 lg:pb-24 pt-2"
          style={{ maxWidth: 1200 }}
        >
          <div style={{ maxWidth: 860 }}>
            {cat ? (
              <span
                style={{
                  display: "inline-block",
                  background: "#fff",
                  color: "var(--color-ink)",
                  padding: "4px 14px",
                  borderRadius: 9999,
                  fontSize: 12,
                  fontWeight: 600,
                  letterSpacing: 1.2,
                  textTransform: "uppercase",
                  marginBottom: 16,
                }}
              >
                {cat.label}
              </span>
            ) : null}
            <h1
              style={{
                fontFamily: "var(--font-display)",
                color: "var(--color-on-primary)",
                marginBottom: 16,
              }}
            >
              {post.title}
            </h1>
            {post.description ? (
              <p
                style={{
                  fontSize: 20,
                  color: "var(--color-on-primary)",
                  fontWeight: 500,
                  lineHeight: 1.5,
                  maxWidth: 720,
                  marginBottom: 16,
                }}
              >
                {post.description}
              </p>
            ) : null}
            <div
              style={{
                fontSize: 14,
                color: "var(--color-on-primary)",
                fontWeight: 500,
              }}
            >
              {post.author ? <>By {post.author}</> : null}
              {post.author && post.published_time ? <> · </> : null}
              {post.published_time ? formatDate(post.published_time) : null}
            </div>
          </div>
        </div>
      </section>

      <section style={{ background: "var(--color-surface-soft)" }}>
        <div
          className="mx-auto px-4 sm:px-6 lg:px-10"
          style={{
            maxWidth: 1200,
            position: "relative",
          }}
        >
          <div
            className="relative"
            style={{
              borderRadius: 24,
              overflow: "hidden",
              aspectRatio: "16 / 9",
              marginTop: -64,
              boxShadow: "0 12px 36px rgba(0,0,0,0.18)",
            }}
          >
            <Image
              src={cover}
              alt={post.title ?? "Article cover"}
              fill
              priority
              sizes="(max-width: 1024px) 100vw, 1200px"
              style={{ objectFit: "cover" }}
            />
          </div>
        </div>

        <div
          className="mx-auto px-4 sm:px-6 md:px-10 py-16 lg:py-20 max-w-full md:max-w-[720px] lg:max-w-[760px] xl:max-w-[820px] 2xl:max-w-[880px]"
        >
          {post.body ? (
            <div
              className="prose-article"
              dangerouslySetInnerHTML={{ __html: post.body }}
            />
          ) : (
            <p
              style={{
                color: "var(--color-body)",
                fontSize: 18,
                lineHeight: 1.7,
              }}
            >
              {post.description}
            </p>
          )}

          <div
            style={{
              marginTop: 56,
              padding: 28,
              background: "var(--color-canvas)",
              border: "1px solid var(--color-hairline-soft)",
              borderRadius: 16,
              display: "flex",
              flexDirection: "column",
              gap: 12,
            }}
          >
            <span
              style={{
                fontSize: 12,
                fontWeight: 600,
                letterSpacing: 1.2,
                textTransform: "uppercase",
                color: "var(--color-muted)",
              }}
            >
              Written by
            </span>
            <p
              style={{
                fontFamily: "var(--font-display)",
                fontSize: 22,
                color: "var(--color-ink)",
              }}
            >
              {post.author ?? SITE_NAME}
            </p>
            <p
              style={{
                fontSize: 15,
                color: "var(--color-body)",
              }}
            >
              All our authors care for dogs every day — read more of their work
              on{" "}
              <Link
                href="/authors"
                style={{ textDecoration: "underline", color: "var(--color-accent-pond)" }}
              >
                the authors page
              </Link>
              .
            </p>
          </div>
        </div>
      </section>

      {related.length > 0 ? (
        <section style={{ background: "var(--color-canvas)" }}>
          <div
            className="mx-auto px-4 sm:px-6 lg:px-10 py-16 lg:py-24"
            style={{ maxWidth: 1444 }}
          >
            <h2
              style={{
                fontFamily: "var(--font-display)",
                marginBottom: 32,
              }}
            >
              Related stories
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
              {related.map((a) => (
                <ArticleCard key={a.id} article={a} />
              ))}
            </div>
          </div>
        </section>
      ) : null}
    </>
  );
}
