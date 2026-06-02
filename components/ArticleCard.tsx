import Image from "next/image";
import Link from "next/link";
import type { Article } from "@/lib/db";
import { categoryFor } from "@/lib/site";
import { coverFor } from "@/lib/images";

export default function ArticleCard({
  article,
  variant = "default",
}: {
  article: Article;
  variant?: "default" | "compact";
}) {
  const cat = categoryFor(article.type);
  const slug = article.short_title ?? "";
  const cover = article.img || coverFor(article.type, slug, variant === "compact" ? 480 : 720);

  return (
    <Link
      href={`/blog/${slug}`}
      style={{
        background: "#fff",
        borderRadius: 16,
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        boxShadow: "0 0 9px rgba(0,0,0,0.08)",
        transition: "transform 200ms ease, box-shadow 200ms ease",
      }}
      className="group hover:-translate-y-1 hover:shadow-[0_6px_18px_rgba(0,0,0,0.12)]"
    >
      <div className="relative" style={{ aspectRatio: "4 / 3" }}>
        <Image
          src={cover}
          alt={article.title ?? "Dog story cover"}
          fill
          sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 33vw"
          style={{ objectFit: "cover" }}
        />
      </div>
      <div
        style={{
          padding: 24,
          display: "flex",
          flexDirection: "column",
          gap: 12,
          flex: 1,
        }}
      >
        {cat ? (
          <span
            style={{
              alignSelf: "flex-start",
              background: "var(--color-surface)",
              color: "var(--color-ink)",
              borderRadius: 9999,
              padding: "4px 14px",
              fontSize: 12,
              fontWeight: 600,
              letterSpacing: 1.1,
              textTransform: "uppercase",
            }}
          >
            {cat.label}
          </span>
        ) : null}
        <h3
          style={{
            fontFamily: "var(--font-display)",
            fontSize: variant === "compact" ? 22 : 24,
            color: "var(--color-ink)",
            lineHeight: 1.2,
            margin: 0,
          }}
        >
          {article.title}
        </h3>
        {variant === "default" && article.description ? (
          <p
            style={{
              color: "var(--color-body)",
              fontSize: 16,
              lineHeight: 1.5,
              margin: 0,
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
            }}
          >
            {article.description}
          </p>
        ) : null}
        <span
          style={{
            marginTop: "auto",
            fontSize: 13,
            color: "var(--color-muted)",
            fontWeight: 500,
          }}
        >
          {article.author ?? "pawspost"}
        </span>
      </div>
    </Link>
  );
}
