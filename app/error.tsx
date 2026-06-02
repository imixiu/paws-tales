"use client";

import Link from "next/link";

export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <section style={{ background: "var(--color-surface-soft)" }}>
      <div
        className="mx-auto px-4 sm:px-6 lg:px-10 py-24 text-center"
        style={{ maxWidth: 720 }}
      >
        <h1 style={{ fontFamily: "var(--font-display)", marginBottom: 16 }}>
          Something went sideways.
        </h1>
        <p
          style={{
            fontSize: 18,
            color: "var(--color-body)",
            marginBottom: 32,
          }}
        >
          We hit an error rendering this page. Try reloading — and please tell
          us if it keeps happening.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            type="button"
            onClick={() => reset()}
            style={{
              background: "var(--color-primary)",
              color: "var(--color-on-primary)",
              borderRadius: 32,
              padding: "0 28px",
              height: 48,
              fontSize: 16,
              fontWeight: 600,
              border: "2px solid var(--color-primary)",
            }}
          >
            Try again
          </button>
          <Link
            href="/"
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
            Back home
          </Link>
        </div>
      </div>
    </section>
  );
}
