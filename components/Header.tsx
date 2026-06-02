"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Menu, X } from "lucide-react";
import { NAV_LINKS, SITE_NAME } from "@/lib/site";

function PawLogo() {
  return (
    <svg
      viewBox="0 0 64 64"
      width={36}
      height={36}
      aria-hidden="true"
      style={{ display: "block" }}
    >
      <circle cx="32" cy="32" r="32" fill="#ffc800" />
      <ellipse cx="20" cy="22" rx="5" ry="7" fill="#222" />
      <ellipse cx="32" cy="18" rx="5" ry="7" fill="#222" />
      <ellipse cx="44" cy="22" rx="5" ry="7" fill="#222" />
      <ellipse cx="50" cy="33" rx="4.5" ry="6" fill="#222" />
      <ellipse cx="14" cy="33" rx="4.5" ry="6" fill="#222" />
      <path
        d="M20 46c0-8 5-12 12-12s12 4 12 12-5 10-12 10-12-2-12-10z"
        fill="#222"
      />
    </svg>
  );
}

export default function Header() {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (open) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <header
      className="sticky top-0 z-40 bg-[var(--color-canvas)]"
      style={{ borderBottom: "1px solid var(--color-hairline-soft)" }}
    >
      <div
        className="mx-auto flex items-center justify-between gap-4 px-4 sm:px-6 lg:px-10"
        style={{ maxWidth: 1444, height: 80 }}
      >
        <Link
          href="/"
          className="flex items-center gap-3"
          style={{ fontFamily: "var(--font-display)" }}
        >
          <PawLogo />
          <span style={{ fontSize: 22, fontWeight: 500, letterSpacing: 0.2 }}>
            {SITE_NAME}
          </span>
        </Link>

        <nav className="hidden lg:flex items-center gap-8">
          {NAV_LINKS.filter((l) => l.href !== "/").map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="hover:text-[var(--color-on-primary)]"
              style={{
                fontSize: 16,
                fontWeight: 500,
                color: "var(--color-ink)",
              }}
            >
              {l.label}
            </Link>
          ))}
        </nav>

        <div className="hidden lg:flex items-center gap-3">
          <Link
            href="/blog"
            className="inline-flex items-center justify-center transition-colors"
            style={{
              background: "var(--color-primary)",
              color: "var(--color-on-primary)",
              borderRadius: 32,
              height: 48,
              padding: "0 24px",
              fontSize: 16,
              fontWeight: 600,
              border: "2px solid var(--color-primary)",
            }}
          >
            Read the journal
          </Link>
        </div>

        <button
          type="button"
          aria-label="Open menu"
          aria-expanded={open}
          onClick={() => setOpen(true)}
          className="lg:hidden inline-flex items-center justify-center"
          style={{
            width: 48,
            height: 48,
            borderRadius: 9999,
            border: "2px solid var(--color-ink)",
            background: "transparent",
            color: "var(--color-ink)",
          }}
        >
          <Menu size={20} />
        </button>
      </div>

      {mounted && open
        ? createPortal(
            <div
              role="dialog"
              aria-modal="true"
              style={{
                position: "fixed",
                inset: 0,
                zIndex: 1000,
                background: "rgba(34,34,34,0.55)",
              }}
              onClick={() => setOpen(false)}
            >
              <div
                onClick={(e) => e.stopPropagation()}
                style={{
                  position: "absolute",
                  top: 0,
                  right: 0,
                  bottom: 0,
                  width: "min(86vw, 360px)",
                  background: "var(--color-canvas)",
                  display: "flex",
                  flexDirection: "column",
                  padding: 24,
                  gap: 20,
                  boxShadow: "0 0 32px rgba(0,0,0,0.18)",
                }}
              >
                <div className="flex items-center justify-between">
                  <Link
                    href="/"
                    onClick={() => setOpen(false)}
                    className="flex items-center gap-3"
                    style={{ fontFamily: "var(--font-display)" }}
                  >
                    <PawLogo />
                    <span style={{ fontSize: 20, fontWeight: 500 }}>
                      {SITE_NAME}
                    </span>
                  </Link>
                  <button
                    type="button"
                    aria-label="Close menu"
                    onClick={() => setOpen(false)}
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: 9999,
                      border: "2px solid var(--color-ink)",
                      background: "transparent",
                    }}
                  >
                    <X size={18} />
                  </button>
                </div>
                <nav className="flex flex-col gap-1">
                  {NAV_LINKS.map((l) => (
                    <Link
                      key={l.href}
                      href={l.href}
                      onClick={() => setOpen(false)}
                      style={{
                        padding: "14px 12px",
                        fontFamily: "var(--font-display)",
                        fontSize: 22,
                        color: "var(--color-ink)",
                        borderBottom: "1px solid var(--color-hairline-soft)",
                      }}
                    >
                      {l.label}
                    </Link>
                  ))}
                </nav>
                <Link
                  href="/blog"
                  onClick={() => setOpen(false)}
                  className="inline-flex items-center justify-center mt-auto"
                  style={{
                    background: "var(--color-primary)",
                    color: "var(--color-on-primary)",
                    borderRadius: 32,
                    height: 48,
                    fontSize: 16,
                    fontWeight: 600,
                    border: "2px solid var(--color-primary)",
                  }}
                >
                  Read the journal
                </Link>
              </div>
            </div>,
            document.body
          )
        : null}
    </header>
  );
}
