import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ABOUT_IMAGE, HERO_IMAGE } from "@/lib/images";
import { SITE_NAME, SITE_TAGLINE } from "@/lib/site";

export const metadata: Metadata = {
  title: "About",
  description: `About ${SITE_NAME} — a friendly journal for dog people.`,
  alternates: { canonical: "/about" },
};

export default function AboutPage() {
  return (
    <>
      <section style={{ background: "var(--color-primary)" }}>
        <div
          className="mx-auto px-4 sm:px-6 lg:px-10 py-16 lg:py-24"
          style={{ maxWidth: 1200 }}
        >
          <span
            style={{
              fontSize: 12,
              fontWeight: 600,
              letterSpacing: 1.4,
              textTransform: "uppercase",
              color: "var(--color-on-primary)",
              opacity: 0.8,
            }}
          >
            About {SITE_NAME}
          </span>
          <h1
            style={{
              fontFamily: "var(--font-display)",
              color: "var(--color-on-primary)",
              marginTop: 12,
              marginBottom: 20,
            }}
          >
            A small journal with a big soft spot for dogs.
          </h1>
          <p
            style={{
              fontSize: 20,
              color: "var(--color-on-primary)",
              fontWeight: 500,
              lineHeight: 1.5,
              maxWidth: 760,
            }}
          >
            {SITE_TAGLINE}
          </p>
        </div>
      </section>

      <section style={{ background: "var(--color-canvas)" }}>
        <div
          className="mx-auto px-4 sm:px-6 lg:px-10 py-16 lg:py-24"
          style={{ maxWidth: 880 }}
        >
          <div
            className="prose-article"
            style={{ fontSize: 18, color: "var(--color-body)" }}
          >
            <p>
              <strong>{SITE_NAME}</strong> is a journal made by people who have
              spent decades around dogs — vets, trainers, behaviour
              specialists, and lifelong dog people who think kindness should
              come first. We write the kind of guides we wished we had when our
              dogs were puppies.
            </p>
            <p>
              Every story here is something we’ve actually used, or seen work,
              with real dogs. We try to be careful, to be specific, and to
              never talk down to anyone — because the people reading us are
              already brilliant: they’re the ones who showed up to learn.
            </p>
            <h2>What we write about</h2>
            <p>
              Six gentle starting points: training, understanding your dog,
              getting a dog, health and wellbeing, life with your dog, and
              puppy care. New articles arrive most weeks; older articles get
              quietly updated as the science evolves.
            </p>
            <h2>What we don’t do</h2>
            <p>
              We don’t do affiliate-link reviews of doggy products. We don’t do
              fear-based copy. We don’t have a pricing page. The journal is
              free to read and always will be.
            </p>
          </div>
        </div>
      </section>

      <section style={{ background: "var(--color-surface-soft)" }}>
        <div
          className="mx-auto px-4 sm:px-6 lg:px-10 py-16 lg:py-24 grid lg:grid-cols-2 gap-10 lg:gap-16 items-center"
          style={{ maxWidth: 1200 }}
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
              src={ABOUT_IMAGE}
              alt="A small dog napping on a cushion in soft afternoon light"
              fill
              sizes="(max-width: 1024px) 100vw, 50vw"
              style={{ objectFit: "cover" }}
            />
          </div>
          <div>
            <h2 style={{ fontFamily: "var(--font-display)", marginBottom: 16 }}>
              Last year on pawspost
            </h2>
            <p
              style={{
                fontSize: 18,
                color: "var(--color-body)",
                lineHeight: 1.65,
                marginBottom: 28,
              }}
            >
              We published guides read by tens of thousands of dog families,
              quietly answered hundreds of reader emails, and (most
              importantly) gave a lot of dogs unnecessary chin-scratches.
            </p>
            <Link
              href="/authors"
              className="inline-flex items-center justify-center"
              style={{
                background: "transparent",
                color: "var(--color-ink)",
                border: "2px solid var(--color-ink)",
                borderRadius: 32,
                padding: "0 24px",
                height: 48,
                fontSize: 16,
                fontWeight: 600,
              }}
            >
              Meet our authors
            </Link>
          </div>
        </div>
      </section>

      <section style={{ background: "var(--color-canvas)" }}>
        <div
          className="mx-auto px-4 sm:px-6 lg:px-10 py-16 lg:py-24 grid lg:grid-cols-2 gap-10 lg:gap-16 items-center"
          style={{ maxWidth: 1200 }}
        >
          <div>
            <h2 style={{ fontFamily: "var(--font-display)", marginBottom: 16 }}>
              The dogs always come first.
            </h2>
            <p
              style={{
                fontSize: 18,
                color: "var(--color-body)",
                lineHeight: 1.65,
              }}
            >
              When we’re not sure whether to publish something, we ask one
              question: would this make a dog’s life easier or kinder? If yes,
              it goes in. If no, it doesn’t.
            </p>
          </div>
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
              src={HERO_IMAGE}
              alt="A golden dog mid-stride in a green meadow"
              fill
              sizes="(max-width: 1024px) 100vw, 50vw"
              style={{ objectFit: "cover" }}
            />
          </div>
        </div>
      </section>
    </>
  );
}
