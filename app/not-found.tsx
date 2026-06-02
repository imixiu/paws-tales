import Link from "next/link";

export default function NotFound() {
  return (
    <section style={{ background: "var(--color-primary)" }}>
      <div
        className="mx-auto px-4 sm:px-6 lg:px-10 py-24 lg:py-32 text-center"
        style={{ maxWidth: 720 }}
      >
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
          404 — page lost in a hedge
        </span>
        <h1
          style={{
            fontFamily: "var(--font-display)",
            color: "var(--color-on-primary)",
            marginBottom: 16,
          }}
        >
          We can’t find that page.
        </h1>
        <p
          style={{
            fontSize: 18,
            color: "var(--color-on-primary)",
            fontWeight: 500,
            marginBottom: 32,
          }}
        >
          It might have moved, or the link could be misspelled. Try one of these
          instead.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/"
            className="inline-flex items-center justify-center"
            style={{
              background: "var(--color-ink)",
              color: "var(--color-primary)",
              borderRadius: 32,
              padding: "0 28px",
              height: 48,
              fontSize: 16,
              fontWeight: 600,
              border: "2px solid var(--color-ink)",
            }}
          >
            Back home
          </Link>
          <Link
            href="/blog"
            className="inline-flex items-center justify-center"
            style={{
              background: "transparent",
              color: "var(--color-ink)",
              borderRadius: 32,
              padding: "0 28px",
              height: 48,
              fontSize: 16,
              fontWeight: 600,
              border: "2px solid var(--color-ink)",
            }}
          >
            Browse the journal
          </Link>
        </div>
      </div>
    </section>
  );
}
