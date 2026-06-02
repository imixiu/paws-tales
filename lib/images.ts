// Curated Unsplash photo IDs — every URL was verified `200` via curl -I.
// We index by category and slug-hash so each article gets a deterministic cover
// without depending on the original DB image (those URLs are private blob storage).

const COVERS: Record<string, string[]> = {
  training: [
    "1543466835-00a7907e9de1",
    "1568393691622-c7ba131d63b4",
    "1551717743-49959800b1f6",
    "1605568427561-40dd23c2acea",
  ],
  "understanding-your-dog": [
    "1561037404-61cd46aa615b",
    "1548199973-03cce0bbc87b",
    "1591946614720-90a587da4a36",
    "1605897472359-85e4b94d685d",
  ],
  "getting-a-dog": [
    "1518717758536-85ae29035b6d",
    "1517849845537-4d257902454a",
    "1583337130417-3346a1be7dee",
  ],
  "health-wellbeing": [
    "1601758228041-f3b2795255f1",
    "1587300003388-59208cc962cb",
    "1537151608828-ea2b11777ee8",
  ],
  "life-with-your-dog": [
    "1450778869180-41d0601e046e",
    "1576201836106-db1758fd1c97",
    "1588269845464-8993565cac3a",
  ],
  "puppy-care": [
    "1583337130417-3346a1be7dee",
    "1517849845537-4d257902454a",
    "1518717758536-85ae29035b6d",
  ],
};

const FALLBACK_COVERS = [
  "1587300003388-59208cc962cb",
  "1561037404-61cd46aa615b",
  "1548199973-03cce0bbc87b",
];

const PORTRAITS: Record<string, string> = {
  "hannah-wickes": "1494790108377-be9c29b29330",
  "marcus-aldridge": "1507003211169-0a1dd7228f2d",
  "priya-sutaria": "1438761681033-6461ffad8d80",
  "jonas-cole": "1500648767791-00dcc994a43e",
  "anouk-beaumont": "1544005313-94ddf0286df2",
  "tom-renshaw": "1472099645785-5658abf4ff4e",
  "beth-carrasco": "1554151228-14d9def656e4",
  "aaron-whyte": "1633332755192-727a05c4013d",
  "robin-maitland": "1607746882042-944635dfe10e",
};

const FALLBACK_PORTRAIT = "1494790108377-be9c29b29330";

function hashSlug(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

function url(id: string, w: number): string {
  return `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=${w}&q=80`;
}

export function coverFor(
  type: string | null | undefined,
  slug: string | null | undefined,
  width = 960
): string {
  const pool = (type && COVERS[type]) || FALLBACK_COVERS;
  const idx = slug ? hashSlug(slug) % pool.length : 0;
  return url(pool[idx], width);
}

export function portraitFor(slug: string, width = 320): string {
  const id = PORTRAITS[slug] ?? FALLBACK_PORTRAIT;
  return url(id, width);
}

export const HERO_IMAGE = url("1450778869180-41d0601e046e", 1600);
export const ABOUT_IMAGE = url("1576201836106-db1758fd1c97", 1200);
export const CONTACT_IMAGE = url("1588269845464-8993565cac3a", 1200);
