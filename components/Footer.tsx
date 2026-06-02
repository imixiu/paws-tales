import Link from "next/link";
import { CATEGORIES, SITE_NAME, SITE_TAGLINE } from "@/lib/site";
import NewsletterForm from "@/components/NewsletterForm";

export default function Footer() {
  const year = new Date().getFullYear();
  return (
    <footer
      style={{
        background: "var(--color-surface-footer)",
        color: "#f7edce",
      }}
    >
      <div
        style={{
          background: "var(--color-primary)",
          color: "var(--color-on-primary)",
        }}
      >
        <div
          className="mx-auto px-4 sm:px-6 lg:px-10 py-10 lg:py-14 flex flex-col md:flex-row items-start md:items-center gap-6 md:gap-10"
          style={{ maxWidth: 1444 }}
        >
          <div className="flex-1">
            <h3 style={{ fontFamily: "var(--font-display)", fontSize: 28 }}>
              Keep up with our pup-dates
            </h3>
            <p style={{ marginTop: 8, fontSize: 16, fontWeight: 500 }}>
              Once-a-week notes from the journal — never sold, never spammy.
            </p>
          </div>
          <NewsletterForm />
        </div>
      </div>

      <div
        className="mx-auto px-4 sm:px-6 lg:px-10 py-12 lg:py-16 grid grid-cols-2 md:grid-cols-4 gap-8"
        style={{ maxWidth: 1444 }}
      >
        <div className="col-span-2">
          <Link
            href="/"
            style={{
              fontFamily: "var(--font-display)",
              fontSize: 28,
              color: "#fff",
            }}
          >
            {SITE_NAME}
          </Link>
          <p
            style={{
              marginTop: 12,
              fontSize: 14,
              fontWeight: 500,
              color: "#cfcabd",
              maxWidth: 360,
            }}
          >
            {SITE_TAGLINE}
          </p>
        </div>

        <div>
          <h4
            style={{
              fontFamily: "var(--font-sans)",
              fontSize: 12,
              fontWeight: 600,
              letterSpacing: 1.2,
              textTransform: "uppercase",
              color: "#fff",
              marginBottom: 16,
            }}
          >
            Explore
          </h4>
          <ul style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {[
              { href: "/blog", label: "All articles" },
              { href: "/categories", label: "Categories" },
              { href: "/authors", label: "Our authors" },
              { href: "/about", label: "About" },
              { href: "/contact", label: "Contact" },
            ].map((l) => (
              <li key={l.href}>
                <Link
                  href={l.href}
                  style={{ color: "#f7edce", fontSize: 14, fontWeight: 500 }}
                >
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h4
            style={{
              fontFamily: "var(--font-sans)",
              fontSize: 12,
              fontWeight: 600,
              letterSpacing: 1.2,
              textTransform: "uppercase",
              color: "#fff",
              marginBottom: 16,
            }}
          >
            Categories
          </h4>
          <ul style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {Object.values(CATEGORIES).map((c) => (
              <li key={c.slug}>
                <Link
                  href={`/categories/${c.slug}`}
                  style={{ color: "#f7edce", fontSize: 14, fontWeight: 500 }}
                >
                  {c.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div
        style={{
          borderTop: "1px solid #3a3a3a",
        }}
      >
        <div
          className="mx-auto px-4 sm:px-6 lg:px-10 py-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-3"
          style={{ maxWidth: 1444, fontSize: 13, color: "#9b9788" }}
        >
          <p>© {year} {SITE_NAME}. A friendly place for dog people.</p>
          <p>Editorial reference and visuals inspired by public dog-welfare publications.</p>
        </div>
      </div>
    </footer>
  );
}
