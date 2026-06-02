import Link from "next/link";

export default function EmptyState({
  title = "Nothing here yet",
  message = "We haven’t published anything in this corner yet — check back soon.",
  cta = { label: "Back to home", href: "/" },
}: {
  title?: string;
  message?: string;
  cta?: { label: string; href: string };
}) {
  return (
    <div
      style={{
        background: "var(--color-surface-cream)",
        borderRadius: 24,
        padding: 48,
        textAlign: "center",
        border: "1px solid var(--color-hairline-soft)",
      }}
    >
      <h3
        style={{
          fontFamily: "var(--font-display)",
          fontSize: 28,
          color: "var(--color-ink)",
          marginBottom: 12,
        }}
      >
        {title}
      </h3>
      <p
        style={{
          color: "var(--color-body)",
          fontSize: 16,
          maxWidth: 480,
          margin: "0 auto 24px",
        }}
      >
        {message}
      </p>
      <Link
        href={cta.href}
        className="inline-flex items-center justify-center"
        style={{
          background: "var(--color-primary)",
          color: "var(--color-on-primary)",
          borderRadius: 32,
          padding: "0 24px",
          height: 48,
          fontSize: 16,
          fontWeight: 600,
          border: "2px solid var(--color-primary)",
        }}
      >
        {cta.label}
      </Link>
    </div>
  );
}
