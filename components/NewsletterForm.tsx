"use client";

import { useState } from "react";

export default function NewsletterForm() {
  const [submitted, setSubmitted] = useState(false);
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        setSubmitted(true);
      }}
      className="w-full md:w-auto flex flex-col sm:flex-row gap-3"
    >
      {submitted ? (
        <p
          style={{
            color: "var(--color-on-primary)",
            fontSize: 16,
            fontWeight: 600,
            margin: 0,
            paddingTop: 12,
          }}
        >
          Thanks — we’ll be in touch soon.
        </p>
      ) : (
        <>
          <input
            type="email"
            required
            placeholder="you@email.com"
            aria-label="Email address"
            style={{
              background: "#fff",
              border: "1px solid #707070",
              borderRadius: 9999,
              padding: "10px 18px",
              height: 48,
              minWidth: 240,
              fontSize: 16,
              color: "var(--color-ink)",
            }}
          />
          <button
            type="submit"
            style={{
              background: "var(--color-ink)",
              color: "var(--color-primary)",
              borderRadius: 9999,
              padding: "0 24px",
              height: 48,
              fontSize: 16,
              fontWeight: 600,
              border: "2px solid var(--color-ink)",
            }}
          >
            Subscribe
          </button>
        </>
      )}
    </form>
  );
}
