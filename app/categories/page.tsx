import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { CATEGORIES } from "@/lib/site";
import { getAllArticles } from "@/lib/db";
import { coverFor } from "@/lib/images";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Categories",
  description:
    "Find articles by topic — training, understanding your dog, getting a dog, health, life with your dog, and puppy care.",
  alternates: { canonical: "/categories" },
};

export default async function CategoriesIndex() {
  const all = await getAllArticles();
  const counts: Record<string, number> = {};
  for (const a of all) {
    if (!a.type) continue;
    counts[a.type] = (counts[a.type] ?? 0) + 1;
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
              Topics
            </span>
            <h1
              style={{
                fontFamily: "var(--font-display)",
                marginTop: 8,
                marginBottom: 16,
              }}
            >
              Find your dog moment by topic.
            </h1>
            <p
              style={{
                fontSize: 18,
                color: "var(--color-body)",
                lineHeight: 1.6,
              }}
            >
              Six gentle starting points — wherever you are in dog life, there’s
              a guide for you.
            </p>
          </div>
        </div>
      </section>

      <section style={{ background: "var(--color-canvas)" }}>
        <div
          className="mx-auto px-4 sm:px-6 lg:px-10 py-12 lg:py-20"
          style={{ maxWidth: 1444 }}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
            {Object.values(CATEGORIES).map((c, i) => {
              const cover = coverFor(c.slug, c.slug, 720);
              return (
                <Link
                  key={c.slug}
                  href={`/categories/${c.slug}`}
                  style={{
                    background:
                      i % 3 === 0
                        ? "var(--color-surface)"
                        : i % 3 === 1
                          ? "var(--color-surface-cream)"
                          : "var(--color-surface-strong)",
                    borderRadius: 24,
                    overflow: "hidden",
                    display: "flex",
                    flexDirection: "column",
                    minHeight: 360,
                  }}
                  className="hover:-translate-y-1 transition-transform"
                >
                  <div className="relative" style={{ aspectRatio: "16 / 9" }}>
                    <Image
                      src={cover}
                      alt={`${c.label} category cover`}
                      fill
                      sizes="(max-width: 768px) 100vw, 33vw"
                      style={{ objectFit: "cover" }}
                    />
                  </div>
                  <div
                    style={{
                      padding: 28,
                      display: "flex",
                      flexDirection: "column",
                      gap: 10,
                      flex: 1,
                    }}
                  >
                    <span
                      style={{
                        fontSize: 12,
                        fontWeight: 600,
                        color: "var(--color-muted)",
                        letterSpacing: 1.2,
                        textTransform: "uppercase",
                      }}
                    >
                      {counts[c.slug] ?? 0} article
                      {(counts[c.slug] ?? 0) === 1 ? "" : "s"}
                    </span>
                    <h2
                      style={{
                        fontFamily: "var(--font-display)",
                        fontSize: 26,
                        margin: 0,
                      }}
                    >
                      {c.label}
                    </h2>
                    <p
                      style={{
                        color: "var(--color-body)",
                        fontSize: 16,
                        lineHeight: 1.5,
                        margin: 0,
                      }}
                    >
                      {c.blurb}
                    </p>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </section>
    </>
  );
}
