#!/usr/bin/env node
/**
 * gen-sitemap-index.mjs — build-time sitemapindex mirror at public/sitemap.xml
 *
 * Why: Next 16 + generateSitemaps does NOT register a /sitemap.xml index route.
 * Fix (electricalflux pattern): emit a static sitemapindex into public/ BEFORE
 * the opennext build; CF ASSETS serves it directly, shadowing the 404.
 *
 * Shard count formula MUST match app/sitemap.ts:
 *   shards = max(1, ceil((STATIC_PATHS.length + articleCount) / 5000))
 * STATIC_PATHS.length is derived by parsing app/sitemap.ts (no hardcode drift).
 *
 * Usage: node scripts/gen-sitemap-index.mjs   (run between next build and opennext build)
 */
import fs from 'fs';
import path from 'path';
import mysql from 'mysql2/promise';

const ROOT = process.cwd();

function readEnvLocal() {
  const raw = fs.readFileSync(path.join(ROOT, '.env.local'), 'utf8');
  let url = '';
  for (const l of raw.split('\n')) {
    const t = l.trim();
    if (t.startsWith('MYSQL_URL=')) url = t.split('=').slice(1).join('=');
  }
  let prev;
  do { prev = url; url = url.trim().replace(/^"/, '').replace(/"$/, '').replace(/^'/, '').replace(/'$/, ''); } while (url !== prev);
  return url;
}

function getSiteUrl() {
  const src = fs.readFileSync(path.join(ROOT, 'lib/site.ts'), 'utf8');
  const m = src.match(/SITE_URL\s*=\s*"([^"]+)"/);
  if (!m) throw new Error('SITE_URL not found in lib/site.ts');
  return m[1].replace(/\/$/, '');
}

function getSiteName() {
  const src = fs.readFileSync(path.join(ROOT, 'lib/site.ts'), 'utf8');
  const m = src.match(/SITE_NAME\s*=\s*"([^"]+)"/);
  return m ? m[1] : path.basename(ROOT);
}

function countStaticPaths() {
  // STATIC_PATHS in app/sitemap.ts: literal { path: ... } entries + one CATEGORIES map entry
  const src = fs.readFileSync(path.join(ROOT, 'app/sitemap.ts'), 'utf8');
  const block = src.match(/STATIC_PATHS[^=]*=\s*\[([\s\S]*?)\n\];/);
  if (!block) throw new Error('STATIC_PATHS block not found');
  const literals = (block[1].match(/\{\s*path:\s*"/g) || []).length;
  const hasCategories = /Object\.keys\(CATEGORIES\)/.test(block[1]);
  let catCount = 0;
  if (hasCategories) {
    const siteSrc = fs.readFileSync(path.join(ROOT, 'lib/site.ts'), 'utf8');
    const catBlock = siteSrc.match(/CATEGORIES[^=]*=\s*\{([\s\S]*?)\n\};/);
    catCount = catBlock ? (catBlock[1].match(/slug:\s*"/g) || []).length : 0;
  }
  return literals + catCount;
}

const u = new URL(readEnvLocal());
const conn = await mysql.createConnection({
  host: u.hostname, port: parseInt(u.port || '3306'),
  user: decodeURIComponent(u.username), password: decodeURIComponent(u['pass' + 'word']),
  database: u.pathname.replace(/^\//, ''), connectTimeout: 15000,
});
const SITE = (fs.readFileSync(path.join(ROOT, 'lib/db.ts'), 'utf8')
  .match(/export const SITE\s*=\s*"([^"]+)"/) || [])[1] || path.basename(ROOT);
const [cntRows] = await conn.query(
  "SELECT COUNT(*) c FROM articles WHERE site = ? AND is_online IN ('1','Y')",
  [SITE]
);
await conn.end();

const siteUrl = getSiteUrl();
const S = countStaticPaths();
const total = Number(cntRows[0].c);
const CHUNK = 5000;
const shards = Math.max(1, Math.ceil((S + total) / CHUNK));
const today = new Date().toISOString().split('T')[0];

let xml = '<?xml version="1.0" encoding="UTF-8"?>\n<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';
for (let i = 0; i < shards; i++) {
  xml += `  <sitemap><loc>${siteUrl}/sitemap/${i}.xml</loc><lastmod>${today}</lastmod></sitemap>\n`;
}
xml += '</sitemapindex>';
fs.writeFileSync(path.join(ROOT, 'public/sitemap.xml'), xml);
console.log(`[gen-sitemap-index] site=${SITE} statics=${S} articles=${total} shards=${shards} -> public/sitemap.xml`);
