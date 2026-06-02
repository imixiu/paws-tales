import Image from "next/image";
import Link from "next/link";
import { getAllArticles } from "@/lib/db";
import ArticleCard from "@/components/ArticleCard";
import { CATEGORIES, SITE_NAME, SITE_TAGLINE, SITE_URL } from "@/lib/site";
import { HERO_IMAGE, ABOUT_IMAGE, coverFor } from "@/lib/images";

export const revalidate = 3600;

export default async function Home() {
  const articles = await getAllArticles();
  const featured = articles[0] ?? null;
  const latest = articles.slice(1, 7);

  const websiteSchema = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: SITE_NAME,
    url: SITE_URL,
    description: SITE_TAGLINE,
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }}
      />

      {/* Hero */}
      <section style={{ background: "var(--color-primary)" }}>
        <div
          className="mx-auto px-4 sm:px-6 lg:px-10 py-16 lg:py-24 grid lg:grid-cols-[1.1fr_1fr] gap-10 lg:gap-16 items-center"
          style={{ maxWidth: 1444 }}
        >
          <div>
            <span
              style={{
                display: "inline-block",
                background: "#fff",
                color: "var(--color-ink)",
                padding: "6px 16px",
                borderRadius: 9999,
                fontSize: 12,
                fontWeight: 600,
                letterSpacing: 1.4,
                textTransform: "uppercase",
                marginBottom: 24,
              }}
            >
              A friendly journal for dog people
            </span>
            <h1
              style={{
                fontFamily: "var(--font-display)",
                color: "var(--color-on-primary)",
                marginBottom: 24,
              }}
            >
              Kindness, in every wag.
            </h1>
            <p
              style={{
                fontSize: 20,
                color: "var(--color-on-primary)",
                fontWeight: 500,
                lineHeight: 1.5,
                maxWidth: 560,
                marginBottom: 32,
              }}
            >
              {SITE_TAGLINE}
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <Link
                href="/blog"
                className="inline-flex items-center justify-center"
                style={{
                  background: "var(--color-ink)",
                  color: "var(--color-primary)",
                  borderRadius: 32,
                  padding: "0 28px",
                  height: 56,
                  fontSize: 16,
                  fontWeight: 600,
                  border: "2px solid var(--color-ink)",
                }}
              >
                Read the journal
              </Link>
              <Link
                href="/categories"
                className="inline-flex items-center justify-center"
                style={{
                  background: "transparent",
                  color: "var(--color-ink)",
                  borderRadius: 32,
                  padding: "0 28px",
                  height: 56,
                  fontSize: 16,
                  fontWeight: 600,
                  border: "2px solid var(--color-ink)",
                }}
              >
                Browse categories
              </Link>
            </div>
          </div>
          <div
            className="relative"
            style={{
              borderRadius: 32,
              overflow: "hidden",
              aspectRatio: "5 / 4",
              boxShadow: "0 12px 40px rgba(0,0,0,0.18)",
            }}
          >
            <Image
              src={HERO_IMAGE}
              alt="A happy golden dog running through a meadow"
              fill
              priority
              sizes="(max-width: 1024px) 100vw, 50vw"
              style={{ objectFit: "cover" }}
            />
          </div>
        </div>
      </section>

      {/* Search-style category strip */}
      <section
        style={{
          background: "var(--color-canvas)",
          borderBottom: "1px solid var(--color-hairline-soft)",
        }}
      >
        <div
          className="mx-auto px-4 sm:px-6 lg:px-10 py-10"
          style={{ maxWidth: 1444 }}
        >
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-6">
            <div>
              <h2 style={{ fontFamily: "var(--font-display)" }}>
                What can we help you with?
              </h2>
              <p
                style={{
                  color: "var(--color-muted)",
                  marginTop: 8,
                  fontSize: 16,
                }}
              >
                Pick a starting point — every guide is friendly, kind, and
                evidence-based.
              </p>
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {Object.values(CATEGORIES).map((c) => (
              <Link
                key={c.slug}
                href={`/categories/${c.slug}`}
                style={{
                  background: "var(--color-surface-cream)",
                  borderRadius: 16,
                  padding: 20,
                  display: "flex",
                  flexDirection: "column",
                  gap: 8,
                  border: "1px solid var(--color-hairline-soft)",
                  transition: "background 200ms ease, transform 200ms ease",
                  minHeight: 120,
                }}
                className="hover:bg-[var(--color-surface)] hover:-translate-y-0.5"
              >
                <span
                  style={{
                    fontFamily: "var(--font-display)",
                    fontSize: 18,
                    color: "var(--color-ink)",
                    lineHeight: 1.2,
                  }}
                >
                  {c.label}
                </span>
                <span
                  style={{
                    color: "var(--color-muted)",
                    fontSize: 13,
                    lineHeight: 1.4,
                  }}
                >
                  {c.blurb.split("—")[0].trim()}
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Featured editorial band */}
      {featured ? (
        <section style={{ background: "var(--color-surface-soft)" }}>
          <div
            className="mx-auto px-4 sm:px-6 lg:px-10 py-16 lg:py-24 grid lg:grid-cols-2 gap-10 lg:gap-16 items-center"
            style={{ maxWidth: 1444 }}
          >
            <div
              className="relative"
              style={{
                borderRadius: 24,
                overflow: "hidden",
                aspectRatio: "5 / 4",
                boxShadow: "0 8px 28px rgba(0,0,0,0.12)",
              }}
            >
              <Image
                src={coverFor(featured.type, featured.short_title, 1200)}
                alt={featured.title ?? "Featured story"}
                fill
                sizes="(max-width: 1024px) 100vw, 50vw"
                style={{ objectFit: "cover" }}
              />
            </div>
            <div>
              <span
                style={{
                  display: "inline-block",
                  background: "var(--color-surface)",
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
                Featured story
              </span>
              <h2
                style={{
                  fontFamily: "var(--font-display)",
                  marginBottom: 16,
                }}
              >
                {featured.title}
              </h2>
              <p
                style={{
                  fontSize: 18,
                  color: "var(--color-body)",
                  marginBottom: 24,
                  lineHeight: 1.6,
                }}
              >
                {featured.description}
              </p>
              <Link
                href={`/blog/${featured.short_title}`}
                className="inline-flex items-center justify-center"
                style={{
                  background: "transparent",
                  color: "var(--color-ink)",
                  borderRadius: 32,
                  padding: "0 24px",
                  height: 48,
                  fontSize: 16,
                  fontWeight: 600,
                  border: "2px solid var(--color-ink)",
                }}
              >
                Read the full story
              </Link>
            </div>
          </div>
        </section>
      ) : null}

      {/* Yellow split-CTA panel */}
      <section
        className="grid lg:grid-cols-2"
        style={{
          background: "var(--color-primary)",
        }}
      >
        <div
          className="px-4 sm:px-6 lg:px-10 py-16 lg:py-20 flex items-center"
          style={{ background: "var(--color-primary)" }}
        >
          <div style={{ maxWidth: 540, marginLeft: "auto" }}>
            <h2
              style={{
                fontFamily: "var(--font-display)",
                color: "var(--color-on-primary)",
                marginBottom: 20,
              }}
            >
              Will you help dogs live their best life?
            </h2>
            <p
              style={{
                fontSize: 18,
                color: "var(--color-on-primary)",
                fontWeight: 500,
                lineHeight: 1.6,
                marginBottom: 28,
              }}
            >
              Our authors — vets, trainers, behaviour specialists — write to
              help dogs and their humans understand each other a little more
              every week. Read their work, share what helps you, tell a friend.
            </p>
            <Link
              href="/authors"
              className="inline-flex items-center justify-center"
              style={{
                background: "var(--color-ink)",
                color: "var(--color-primary)",
                borderRadius: 32,
                padding: "0 28px",
                height: 56,
                fontSize: 16,
                fontWeight: 600,
                border: "2px solid var(--color-ink)",
              }}
            >
              Meet our authors
            </Link>
          </div>
        </div>
        <div
          style={{
            background: "var(--color-canvas)",
            position: "relative",
            minHeight: 320,
          }}
        >
          <Image
            src={ABOUT_IMAGE}
            alt="A small terrier resting on a cushion"
            fill
            sizes="(max-width: 1024px) 100vw, 50vw"
            style={{ objectFit: "cover" }}
          />
        </div>
      </section>

      {/* Latest updates grid */}
      <section style={{ background: "var(--color-canvas)" }}>
        <div
          className="mx-auto px-4 sm:px-6 lg:px-10 py-16 lg:py-24"
          style={{ maxWidth: 1444 }}
        >
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-10">
            <div>
              <h2 style={{ fontFamily: "var(--font-display)" }}>
                Our latest updates
              </h2>
              <p
                style={{
                  color: "var(--color-muted)",
                  marginTop: 8,
                  fontSize: 16,
                }}
              >
                Fresh notes from our authors, every week.
              </p>
            </div>
            <Link
              href="/blog"
              className="inline-flex items-center justify-center self-start md:self-auto"
              style={{
                background: "transparent",
                color: "var(--color-ink)",
                borderRadius: 32,
                padding: "0 24px",
                height: 48,
                fontSize: 16,
                fontWeight: 600,
                border: "2px solid var(--color-ink)",
              }}
            >
              See all articles
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
            {latest.map((a) => (
              <ArticleCard key={a.id} article={a} />
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
