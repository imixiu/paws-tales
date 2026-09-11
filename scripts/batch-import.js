// Import parsed articles into paws-tales (MySQL via db_router)
// Usage: node import_articles.js
// Idempotent: re-run re-checks existing short_titles, skips conflicts.
const fs = require('fs');
const readline = require('readline');
const { query, queryRaw, endAll } = require('/root/.hermes/lib/db_router');

const SITE = 'paws-tales';
const SRC = '/tmp/paws-import2/parsed2.jsonl';
const LOG = '/tmp/paws-import2/import.log';
const BATCH = 50;

function log(msg) {
  const line = `[${new Date().toISOString()}] ${msg}`;
  console.log(line);
  fs.appendFileSync(LOG, line + '\n');
}

(async () => {
  // 1. Authors (display names)
  const authors = await query(SITE, 'SELECT name FROM authors WHERE site = $1', [SITE]);
  const authorNames = authors.rows.map(r => r.name).filter(Boolean);
  if (authorNames.length === 0) throw new Error('no authors found');
  log(`authors: ${authorNames.length} -> ${authorNames.join(', ')}`);

  // 2. Existing short_titles (global uniqueness required: getArticleBySlug queries by short_title only)
  const existing = await query(SITE, 'SELECT short_title FROM articles WHERE site = $1', [SITE]);
  const seen = new Set(existing.rows.map(r => r.short_title));
  log(`existing articles: ${seen.size}`);

  // 3. Stream + insert
  const rl = readline.createInterface({ input: fs.createReadStream(SRC, 'utf8'), crlfDelay: Infinity });
  let batch = [];
  let inserted = 0, skippedDup = 0, skippedInvalid = 0, errors = 0, lineno = 0;
  const now = Date.now();
  const WINDOW_MS = 72 * 3600 * 1000; // spread over last 72h

  async function flush() {
    if (batch.length === 0) return;
    const cols = ['site','type','short_title','language','published_time','modified_time','author','title','description','url','body','is_online','status'];
    const placeholders = batch.map(() => '(' + cols.map(() => '?').join(',') + ')').join(',');
    const params = [];
    for (const r of batch) {
      params.push(r.site, r.type, r.short_title, r.language, r.published_time, r.modified_time,
                  r.author, r.title, r.description, r.url, r.body, r.is_online, r.status);
    }
    const sql = `INSERT INTO articles (${cols.join(',')}) VALUES ${placeholders}`;
    try {
      await queryRaw(SITE, sql, params);
      inserted += batch.length;
    } catch (e) {
      errors++;
      log(`BATCH ERROR (${batch.length} rows): ${e.message.slice(0, 300)}`);
      // fall back to per-row insert to salvage
      for (const r of batch) {
        try {
          await queryRaw(SITE,
            `INSERT INTO articles (${cols.join(',')}) VALUES (${cols.map(() => '?').join(',')})`,
            [r.site, r.type, r.short_title, r.language, r.published_time, r.modified_time,
             r.author, r.title, r.description, r.url, r.body, r.is_online, r.status]);
          inserted++;
        } catch (e2) {
          log(`ROW FAIL ${r.short_title}: ${e2.message.slice(0, 200)}`);
        }
      }
    }
    batch = [];
  }

  for await (const line of rl) {
    lineno++;
    if (!line.trim()) continue;
    let a;
    try { a = JSON.parse(line); } catch { skippedInvalid++; continue; }
    const st = a.short_title;
    if (!st || !a.title || !a.body || !a.type) { skippedInvalid++; continue; }
    if (seen.has(st)) { skippedDup++; continue; }
    seen.add(st);
    const pub = new Date(now - Math.floor(Math.random() * WINDOW_MS));
    batch.push({
      site: SITE, type: a.type, short_title: st, language: a.language || 'en',
      published_time: pub, modified_time: pub,
      author: authorNames[Math.floor(Math.random() * authorNames.length)],
      title: a.title, description: a.description || '',
      url: `/${a.type}/${st}`, body: a.body,
      is_online: 'Y', status: 'published',
    });
    if (batch.length >= BATCH) {
      await flush();
      if (inserted % 500 < BATCH) log(`progress: inserted=${inserted} dup=${skippedDup} invalid=${skippedInvalid} errors=${errors} line=${lineno}`);
    }
  }
  await flush();
  log(`DONE: inserted=${inserted} skippedDup=${skippedDup} skippedInvalid=${skippedInvalid} batchErrors=${errors} lines=${lineno}`);

  // 4. Verify
  const v = await query(SITE, "SELECT type, COUNT(*) cnt FROM articles WHERE site = $1 AND is_online='Y' GROUP BY type ORDER BY cnt DESC", [SITE]);
  log('=== final type distribution ===');
  v.rows.forEach(r => log(`  ${r.type}: ${r.cnt}`));
  const t = await query(SITE, 'SELECT COUNT(*) cnt FROM articles WHERE site = $1', [SITE]);
  log(`TOTAL articles now: ${t.rows[0].cnt}`);
  await endAll();
})().catch(async e => { console.error('FATAL:', e); fs.appendFileSync(LOG, 'FATAL: ' + e.stack + '\n'); process.exit(1); });
