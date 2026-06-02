import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { getAllAuthors, getAllArticles } from "@/lib/db";
import EmptyState from "@/components/EmptyState";
import { portraitFor } from "@/lib/images";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Our authors",
  description:
    "Meet the vets, trainers, and behaviour specialists writing for pawspost.",
  alternates: { canonical: "/authors" },
};

export default async function AuthorsIndex() {
  const [authors, articles] = await Promise.all([
    getAllAuthors(),
    getAllArticles(),
  ]);

  const counts: Record<string, number> = {};
  for (const a of articles) {
    if (!a.author) continue;
    counts[a.author] = (counts[a.author] ?? 0) + 1;
  }

  return (
    <>
      <section style={{ background: "var(--color-surface-soft)" }}>
        <div
          className="mx-auto px-4 sm:px-6 lg:px-10 py-12 lg:py-20"
          style={{ maxWidth: 1444 }}
        >
          <div style={{ maxWidth: 760 }}>
            <span
              style={{
                fontSize: 12,
                fontWeight: 600,
                letterSpacing: 1.4,
                textTransform: "uppercase",
                color: "var(--color-muted)",
              }}
            >
              The team
            </span>
            <h1
              style={{
                fontFamily: "var(--font-display)",
                marginTop: 8,
                marginBottom: 16,
              }}
            >
              Real people, real dogs, real care.
            </h1>
            <p
              style={{
                fontSize: 18,
                color: "var(--color-body)",
                lineHeight: 1.6,
              }}
            >
              Vets, trainers, behaviour specialists and lifelong dog people —
              each of our authors writes from years of looking after dogs and
              their humans.
            </p>
          </div>
        </div>
      </section>

      <section style={{ background: "var(--color-canvas)" }}>
        <div
          className="mx-auto px-4 sm:px-6 lg:px-10 py-12 lg:py-20"
          style={{ maxWidth: 1444 }}
        >
          {authors.length === 0 ? (
            <EmptyState
              title="No authors yet"
              message="We're still onboarding our first writers."
            />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
              {authors.map((author) => {
                const slug = author.slug ?? "";
                const portrait = portraitFor(slug, 400);
                const count = counts[slug] ?? 0;
                return (
                  <Link
                    key={author.id}
                    href={`/authors/${slug}`}
                    style={{
                      background: "var(--color-canvas)",
                      borderRadius: 24,
                      padding: 28,
                      display: "flex",
                      gap: 20,
                      alignItems: "flex-start",
                      border: "1px solid var(--color-hairline-soft)",
                      boxShadow: "0 0 9px rgba(0,0,0,0.06)",
                      transition: "transform 200ms ease, box-shadow 200ms ease",
                    }}
                    className="hover:-translate-y-1 hover:shadow-[0_6px_18px_rgba(0,0,0,0.10)]"
                  >
                    <div
                      className="relative shrink-0"
                      style={{
                        width: 88,
                        height: 88,
                        borderRadius: 9999,
                        overflow: "hidden",
                        background: "var(--color-surface)",
                      }}
                    >
                      <Image
                        src={portrait}
                        alt={author.name ?? "Author portrait"}
                        fill
                        sizes="88px"
                        style={{ objectFit: "cover" }}
                      />
                    </div>
                    <div style={{ flex: 1 }}>
                      <h3
                        style={{
                          fontFamily: "var(--font-display)",
                          fontSize: 22,
                          marginBottom: 6,
                        }}
                      >
                        {author.name}
                      </h3>
                      <p
                        style={{
                          color: "var(--color-body)",
                          fontSize: 14,
                          lineHeight: 1.5,
                          margin: 0,
                          display: "-webkit-box",
                          WebkitLineClamp: 3,
                          WebkitBoxOrient: "vertical",
                          overflow: "hidden",
                        }}
                      >
                        {author.description ?? "Lifelong dog person."}
                      </p>
                      <span
                        style={{
                          marginTop: 12,
                          display: "inline-block",
                          fontSize: 12,
                          fontWeight: 600,
                          letterSpacing: 1.1,
                          textTransform: "uppercase",
                          color: "var(--color-muted)",
                        }}
                      >
                        {count} article{count === 1 ? "" : "s"}
                      </span>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </section>
    </>
  );
}
