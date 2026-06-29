import { put } from '@vercel/blob';
import { neon } from '@neondatabase/serverless';
import { readFileSync, writeFileSync, unlinkSync, existsSync } from 'fs';
import { createRequire } from 'module';

// Load .env.local manually
const envFile = readFileSync('/root/vercel-projects/dogstrust/.env.local', 'utf8');
const env = {};
for (const line of envFile.split('\n')) {
  const m = line.match(/^([^#=]+)=(.*)$/);
  if (m) env[m[1].trim()] = m[2].trim().replace(/^"|"$/g, '');
}

const SITE = 'dogstrust';
const DASHSCOPE_KEY = env.DASHSCOPE_API_KEY;
const BLOB_TOKEN = env.BLOB_READ_WRITE_TOKEN;
const sql = neon(env.DATABASE_URL);

const UNSPLASH = 'https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=1024&h=576&fit=crop';
const HINTS = {
  'getting-a-dog': 'Dog adoption and breed selection, warm family scene',
  'training': 'Dog training session, positive reinforcement',
  'health-wellbeing': 'Dog health care, veterinary, wellness',
  'life-with-your-dog': 'Dog and owner lifestyle, daily life',
  'puppy-care': 'Cute puppy care, nurturing, playful',
  'understanding-your-dog': 'Dog behavior and communication',
};

async function genImg(st, tp, desc) {
  const prompt = `Professional blog cover photo for ${st.replace(/-/g,' ')}. ${HINTS[tp]||'dog care'}. ${(desc||'').slice(0,100)}. Clean editorial style, natural lighting, no text overlay.`;
  const res = await fetch('https://dashscope.aliyuncs.com/api/v1/services/aigc/multimodal-generation/generation', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${DASHSCOPE_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ model: 'qwen-image-plus', input: { messages: [{ role: 'user', content: [{ text: prompt }] }] }, parameters: { size: '1024*576' } }),
  });
  const data = await res.json();
  const ossUrl = data.output.choices[0].message.content[0].image;

  // Download image
  const imgRes = await fetch(ossUrl);
  const buf = Buffer.from(await imgRes.arrayBuffer());
  if (buf.length < 1024) return UNSPLASH;

  // Upload to Vercel Blob
  const blob = await put(`covers/${SITE}/${st}.png`, buf, {
    access: 'public',
    token: BLOB_TOKEN,
    allowOverwrite: true,
    contentType: 'image/png',
  });
  return blob.url;
}

const articles = await sql`SELECT short_title, type, description FROM articles WHERE site=${SITE} AND img NOT LIKE '%blob.vercel-storage%' ORDER BY id`;
console.log(`Pending: ${articles.length}`);

let ok = 0, fail = 0;
for (let i = 0; i < articles.length; i++) {
  const { short_title: st, type: tp, description: desc } = articles[i];
  process.stdout.write(`[${i+1}/${articles.length}] ${st.slice(0,50)} ... `);
  try {
    const url = await genImg(st, tp, desc);
    await sql`UPDATE articles SET img=${url}, modified_time=${new Date()} WHERE site=${SITE} AND short_title=${st}`;
    console.log(`OK (${url.includes('blob.vercel-storage') ? 'blob' : 'unsplash'})`);
    ok++;
  } catch (e) {
    console.log(`FAIL: ${e.message}`);
    fail++;
  }
}
console.log(`\nDone: ${ok} OK, ${fail} FAIL`);
