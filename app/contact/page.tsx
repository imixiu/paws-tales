import type { Metadata } from "next";
import Image from "next/image";
import { Mail, MapPin, MessagesSquare } from "lucide-react";
import { CONTACT_IMAGE } from "@/lib/images";
import { SITE_NAME } from "@/lib/site";

export const metadata: Metadata = {
  title: "Contact",
  description: `Get in touch with the ${SITE_NAME} team — story ideas, corrections, or a hello.`,
  alternates: { canonical: "/contact" },
};

export default function ContactPage() {
  return (
    <>
      <section style={{ background: "var(--color-surface-soft)" }}>
        <div
          className="mx-auto px-4 sm:px-6 lg:px-10 py-16 lg:py-24"
          style={{ maxWidth: 960 }}
        >
          <span
            style={{
              fontSize: 12,
              fontWeight: 600,
              letterSpacing: 1.4,
              textTransform: "uppercase",
              color: "var(--color-muted)",
            }}
          >
            Say hello
          </span>
          <h1
            style={{
              fontFamily: "var(--font-display)",
              marginTop: 12,
              marginBottom: 16,
            }}
          >
            We read everything.
          </h1>
          <p
            style={{
              fontSize: 20,
              color: "var(--color-body)",
              lineHeight: 1.5,
              maxWidth: 720,
            }}
          >
            Story ideas, corrections, dog photos — they’re all welcome. Pick
            the channel that suits you and we’ll write back as soon as we can.
          </p>
        </div>
      </section>

      <section style={{ background: "var(--color-canvas)" }}>
        <div
          className="mx-auto px-4 sm:px-6 lg:px-10 py-16 lg:py-24 grid lg:grid-cols-[1fr_1.1fr] gap-10 lg:gap-16 items-start"
          style={{ maxWidth: 1200 }}
        >
          <div className="flex flex-col gap-6">
            <ContactRow
              icon={<Mail size={22} aria-hidden="true" />}
              title="Email"
              body="hello@pawspost.example — for editorial and corrections."
            />
            <ContactRow
              icon={<MessagesSquare size={22} aria-hidden="true" />}
              title="Tip the journal"
              body="Got a story we should cover? Tell us in two sentences and we'll see if we can help."
            />
            <ContactRow
              icon={<MapPin size={22} aria-hidden="true" />}
              title="Where we are"
              body="A small studio with a very large dog bed. Replies usually within two working days."
            />

            <div
              style={{
                marginTop: 8,
                background: "var(--color-surface-cream)",
                border: "1px solid var(--color-hairline-soft)",
                borderRadius: 16,
                padding: 20,
              }}
            >
              <p
                style={{
                  fontSize: 14,
                  color: "var(--color-muted)",
                  margin: 0,
                }}
              >
                Please note: we’re an editorial team, not a clinic. For urgent
                medical concerns about your dog, please contact a vet directly.
              </p>
            </div>
          </div>

          <div
            className="relative"
            style={{
              borderRadius: 24,
              overflow: "hidden",
              aspectRatio: "4 / 3",
              boxShadow: "0 8px 28px rgba(0,0,0,0.12)",
            }}
          >
            <Image
              src={CONTACT_IMAGE}
              alt="A friendly mixed-breed dog looking at the camera"
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

function ContactRow({
  icon,
  title,
  body,
}: {
  icon: React.ReactNode;
  title: string;
  body: string;
}) {
  return (
    <div
      style={{
        display: "flex",
        gap: 16,
        alignItems: "flex-start",
        padding: 20,
        background: "var(--color-surface-soft)",
        borderRadius: 16,
        border: "1px solid var(--color-hairline-soft)",
      }}
    >
      <span
        style={{
          width: 44,
          height: 44,
          borderRadius: 9999,
          background: "var(--color-primary)",
          color: "var(--color-on-primary)",
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}
      >
        {icon}
      </span>
      <div>
        <h3
          style={{
            fontFamily: "var(--font-display)",
            fontSize: 20,
            marginBottom: 6,
          }}
        >
          {title}
        </h3>
        <p style={{ color: "var(--color-body)", fontSize: 15, margin: 0 }}>
          {body}
        </p>
      </div>
    </div>
  );
}
