export const SITE_NAME = "Paws&Tales";
export const SITE_TAGLINE = "Stories, science, and warmth — for everyone who shares a life with dogs.";
export const SITE_URL = "https://paws-tales.com";
export const SITE_DESCRIPTION =
  "pawspost is a friendly dog-care journal: training tips, health guidance, behaviour science, and real-life stories from people who love their dogs.";

export interface CategoryMeta {
  slug: string;
  label: string;
  blurb: string;
  accent: string;
}

export const CATEGORIES: Record<string, CategoryMeta> = {
  training: {
    slug: "training",
    label: "Training",
    blurb: "Kind, evidence-based training so your dog grows into a confident companion.",
    accent: "var(--c-accent-field)",
  },
  "understanding-your-dog": {
    slug: "understanding-your-dog",
    label: "Understanding Your Dog",
    blurb: "Reading the signals, the science of doggy emotions, and what your friend is really telling you.",
    accent: "var(--c-accent-pond)",
  },
  "getting-a-dog": {
    slug: "getting-a-dog",
    label: "Getting a Dog",
    blurb: "From first thoughts to first walk home — what to plan, buy, and prepare.",
    accent: "var(--c-accent-tongue)",
  },
  "health-wellbeing": {
    slug: "health-wellbeing",
    label: "Health & Wellbeing",
    blurb: "Vet-reviewed guides on everyday care, warning signs, and life-stage health.",
    accent: "var(--c-accent-sky)",
  },
  "life-with-your-dog": {
    slug: "life-with-your-dog",
    label: "Life With Your Dog",
    blurb: "Travel, holidays, families, and the everyday joys of dog life.",
    accent: "var(--c-accent-sand)",
  },
  "puppy-care": {
    slug: "puppy-care",
    label: "Puppy Care",
    blurb: "The first weeks and months — the foundations that shape a happy life.",
    accent: "var(--c-accent-mud)",
  },
};

export const NAV_LINKS: ReadonlyArray<{ href: string; label: string }> = [
  { href: "/", label: "Home" },
  { href: "/blog", label: "Blog" },
  { href: "/categories", label: "Categories" },
  { href: "/authors", label: "Authors" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
];

export function categoryFor(type: string | null | undefined): CategoryMeta | null {
  if (!type) return null;
  return CATEGORIES[type] ?? null;
}
