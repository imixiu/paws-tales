#!/usr/bin/env python3
import os, re, time, random
from datetime import datetime, timedelta
from concurrent.futures import ThreadPoolExecutor, as_completed
from dotenv import load_dotenv
import psycopg2

SITE = "dogstrust"
SCORE_THRESHOLD = 70
CONCURRENCY = 3

AUTHORS = [
    "hannah-wickes", "marcus-aldridge", "priya-sutaria", "jonas-cole",
    "anouk-beaumont", "tom-renshaw", "beth-carrasco", "aaron-whyte", "robin-maitland",
]

IDEAS = [
    ("training", "how-to-stop-a-dog-jumping-up-on-people"),
    ("training", "how-to-teach-a-dog-to-sit-and-stay"),
]

TOPIC_PROMPTS = {
    "training": "Dog training techniques, behavioural science, positive reinforcement. Include specific commands, timings, repetition counts, and references to organisations like the APDT or CCPDT.",
    "understanding-your-dog": "Canine behaviour, body language, ethology.",
    "getting-a-dog": "Dog ownership preparation, breed selection, adoption process.",
    "health-wellbeing": "Dog health, veterinary care, preventive medicine.",
    "life-with-your-dog": "Day-to-day dog ownership, lifestyle integration, practical tips.",
    "puppy-care": "Puppy development, early care, socialisation.",
}
load_dotenv(f"/root/vercel-projects/{SITE}/.env.local")
DATABASE_URL = os.environ["DATABASE_URL"]

FORBIDDEN_TITLES = [
    "About ", "Why ", "Types and Variants", "Key Features", "Pros and Cons",
    "How to Choose", "Conclusion", "FAQs", "The Bottom Line", "In Summary",
]
FORBIDDEN_PHRASES = [
    "In conclusion", "Comprehensive guide", "Ultimate guide", "Delve into",
    "Navigating the world", "Unveil the secrets", "In today's fast-paced",
    "Look no further", "Whether you're a beginner", "Dive deep into",
    "Tapestry", "Testament to", "Embark on a journey",
]


def load_hermes_env():
    env = {}
    with open('/root/.hermes/profiles/theme-site-worker/.env') as f:
        for line in f:
            line = line.strip()
            if line and not line.startswith('#') and '=' in line:
                k, v = line.split('=', 1)
                env[k] = v
    return env


def score_article(html: str) -> int:
    score = 90
    text = re.sub(r'<[^>]+>', '', html)

    # Forbidden titles — only h2/h3 headings
    headings = re.findall(r'<h[23][^>]*>(.*?)</h[23]>', html, re.I | re.S)
    heading_text = ' '.join(re.sub(r'<[^>]+>', '', h) for h in headings)
    if any(f.lower() in heading_text.lower() for f in FORBIDDEN_TITLES):
        score -= 15

    # Forbidden phrases
    if any(f.lower() in html.lower() for f in FORBIDDEN_PHRASES):
        score -= 15

    # Text length
    if len(text) < 3000:
        score -= 10

    # Element counts
    if not (len(re.findall(r'<h2', html)) >= 5 and
            len(re.findall(r'<h3', html)) >= 3 and
            len(re.findall(r'<p',  html)) >= 15 and
            len(re.findall(r'<ul|<ol', html)) >= 2 and
            (len(re.findall(r'<table', html)) >= 1 or
             len(re.findall(r'<blockquote', html)) >= 1)):
        score -= 10

    # Data points
    nums = re.findall(
        r'\b\d+\.?\d*\s*(?:%|degrees?|inches?|feet|foot|lbs?|pounds?|gallons?|'
        r'sq\.?\s*ft|mph|psi|weeks?|days?|months?|years?|°[FC]|times?|hours?|minutes?|per\s+\w+)',
        text, re.I)
    standalone = re.findall(r'\b\d{2,}\b', text)
    if len(nums) + len(standalone) < 5:
        score -= 10

    # Citations
    if len(re.findall(
        r'(?:University|Institute|USDA|EPA|ISA|Journal|Study|Research|according to)[^.]{0,80}\d{4}',
        text, re.I)) < 2:
        score -= 10

    # Named institutions
    if len(re.findall(
        r'\b[A-Z][a-zA-Z&\s\.]+(?:University|College|Institute|Extension|State|County|City|'
        r'Farm|Garden|Park|Department|Association|Foundation)\b', text)) < 3:
        score -= 10

    # Writing quality — sentence length variance
    sentences = re.split(r'[.!?]', text)
    lengths = [len(s.split()) for s in sentences if len(s.split()) > 3]
    if lengths:
        avg = sum(lengths) / len(lengths)
        if sum((l - avg) ** 2 for l in lengths) / len(lengths) < 10:
            score -= 10

    return max(0, score)


def generate_article_html(type_: str, short_title: str) -> str:
    import anthropic
    env = load_hermes_env()
    client = anthropic.Anthropic(
        api_key=env['ANTHROPIC_API_KEY'],
        base_url=env.get('ANTHROPIC_BASE_URL', 'https://api.anthropic.com'),
    )
    title = short_title.replace('-', ' ').title()
    topic_hint = TOPIC_PROMPTS.get(type_, '')
    prompt = f"""Write a high-quality blog article body.

Title: {title}
Category: {type_}
Topic guidance: {topic_hint}

REQUIREMENTS:
- Output ONLY the article body — NO title, NO author, NO date, NO byline
- Pure text >= 3000 characters
- 5+ h2, 3+ h3, 15+ p, 2+ ul/ol, 1+ table or blockquote
- 5+ specific data points with numbers/measurements
- 2+ citations with org name and year
- 3+ real named institutions or locations
- Start directly with first h2 or intro paragraph

FORBIDDEN headings: About [X], Why [X] Is Gaining Popularity, Types and Variants, Key Features and Benefits, Pros and Cons, How to Choose, Conclusion, FAQs, The Bottom Line, In Summary
FORBIDDEN phrases: In conclusion, Comprehensive guide, Ultimate guide, Delve into, Navigating the world of, Unveil the secrets, In today's fast-paced, Look no further, Whether you're a beginner, Dive deep into, Tapestry, Testament to, Embark on a journey

Output ONLY the HTML body content, no markdown fences, no wrapper article tags."""

    resp = client.messages.create(
        model="claude-opus-4-6",
        max_tokens=4096,
        messages=[{"role": "user", "content": prompt}],
        timeout=300,
    )
    html = resp.content[0].text.strip()
    html = re.sub(r'^```html?\s*', '', html)
    html = re.sub(r'\s*```$', '', html)
    return html


def generate_cover_image(short_title: str, type_: str) -> str:
    """Generate via DashScope + upload to Vercel Blob using Node.js (@vercel/blob).
    Falls back to picsum on failure. Temp .mjs written to site dir so node resolves @vercel/blob."""
    import subprocess, json, os

    fallback = f"https://picsum.photos/seed/{short_title}/1024/576"
    title_readable = short_title.replace('-', ' ').title()
    topic_hint = TOPIC_PROMPTS.get(type_, type_)
    prompt = (f"Professional blog cover photo for {title_readable}. "
              f"{topic_hint}. Clean editorial style, natural lighting, no text overlay.")

    site_dir = f"/root/vercel-projects/{SITE}"
    tmp_path = os.path.join(site_dir, f"_cover_{short_title}.mjs")

    js_lines = [
        "import { put } from '@vercel/blob';",
        "import { readFileSync } from 'fs';",
        "const env = {};",
        f"for (const line of readFileSync('{site_dir}/.env.local','utf8').split('\\n')) {{",
        "  const m = line.match(/^([^#=]+)=(.*)/);",
        "  if (m) env[m[1].trim()] = m[2].trim().replace(/^\"|\"$/g,'');",
        "}",
        "const res = await fetch('https://dashscope.aliyuncs.com/api/v1/services/aigc/multimodal-generation/generation', {",
        "  method:'POST',",
        f"  headers:{{Authorization:`Bearer ${{env.DASHSCOPE_API_KEY}}`,'Content-Type':'application/json'}},",
        f"  body:JSON.stringify({{model:'qwen-image-plus',input:{{messages:[{{role:'user',content:[{{text:{json.dumps(prompt)}}}]}}]}},parameters:{{size:'1024*576'}}}}),",
        "});",
        "const data = await res.json();",
        "const ossUrl = data?.output?.choices?.[0]?.message?.content?.[0]?.image;",
        "if (!ossUrl) { process.exit(1); }",
        "const imgBuf = Buffer.from(await (await fetch(ossUrl)).arrayBuffer());",
        "if (imgBuf.length < 1024) { process.exit(1); }",
        f"const blob = await put('covers/{SITE}/{short_title}.png', imgBuf, {{",
        "  access:'public', token:env.BLOB_READ_WRITE_TOKEN, allowOverwrite:true, contentType:'image/png'",
        "});",
        "console.log(blob.url);",
    ]

    open(tmp_path, 'w').write("\n".join(js_lines))
    try:
        result = subprocess.run(
            ["node", tmp_path],
            capture_output=True, text=True,
            cwd=site_dir, timeout=120,
        )
    finally:
        if os.path.exists(tmp_path):
            os.unlink(tmp_path)

    url = result.stdout.strip()
    if url.startswith("https://") and "blob.vercel-storage" in url:
        return url
    return fallback


def insert_article(data: dict):
    """Fresh connection per insert — avoids Neon SSL timeout on long runs."""
    conn = psycopg2.connect(DATABASE_URL)
    try:
        with conn.cursor() as cur:
            cur.execute("""
                INSERT INTO articles
                  (site, type, short_title, language, published_time, modified_time,
                   author, img, title, description, url, body, tag, is_online)
                VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)
                ON CONFLICT DO NOTHING
            """, (data['site'], data['type'], data['short_title'], data['language'],
                  data['published_time'], data['modified_time'], data['author'],
                  data['img'], data['title'], data['description'],
                  data['url'], data['body'], data['tag'], data['is_online']))
        conn.commit()
    finally:
        conn.close()


def get_existing() -> set:
    conn = psycopg2.connect(DATABASE_URL)
    try:
        with conn.cursor() as cur:
            cur.execute("SELECT short_title FROM articles WHERE site=%s", (SITE,))
            return {r[0] for r in cur.fetchall()}
    finally:
        conn.close()


def process_one(args):
    idx, total, type_, short_title, author = args
    title = short_title.replace('-', ' ').title()
    print(f"[{idx}/{total}] {short_title} ...", end=" ", flush=True)

    html = None
    for attempt in range(3):
        try:
            html = generate_article_html(type_, short_title)
            sc = score_article(html)
            print(f"score={sc}", end=" ", flush=True)
            if sc >= SCORE_THRESHOLD:
                break
            print(f"(retry {attempt+1})", end=" ", flush=True)
            html = None
        except Exception as e:
            print(f"ERR:{e}", end=" ", flush=True)
            html = None

    if not html:
        print("FAIL", flush=True)
        return False

    img_url = ''
    try:
        print("img...", end=" ", flush=True)
        img_url = generate_cover_image(short_title, type_)
        print("img OK", end=" ", flush=True)
    except Exception as e:
        print(f"img FAIL({e})", end=" ", flush=True)

    now = datetime.now()
    insert_article({
        'site': SITE, 'type': type_, 'short_title': short_title, 'language': 'en',
        'published_time': now,
        'modified_time': now + timedelta(days=random.randint(1, 30)),
        'author': author, 'img': img_url,
        'title': title,
        'description': f"Learn about {title.lower()} with expert tips and data-backed advice.",
        'url': f"/{type_}/{short_title}", 'body': html, 'tag': type_, 'is_online': '1',
    })
    print("DB OK", flush=True)
    return True


def main():
    existing = get_existing()
    print(f"Existing in DB: {len(existing)}", flush=True)

    tasks = [
        (idx, len(IDEAS), type_, short_title, AUTHORS[idx % len(AUTHORS)])
        for idx, (type_, short_title) in enumerate(IDEAS, 1)
        if short_title not in existing
    ]
    print(f"To generate: {len(tasks)}", flush=True)

    written = failed = 0
    with ThreadPoolExecutor(max_workers=CONCURRENCY) as executor:
        futures = {executor.submit(process_one, t): t for t in tasks}
        for f in as_completed(futures):
            if f.result():
                written += 1
            else:
                failed += 1
            if (written + failed) % 50 == 0:
                print(f"--- Progress: {written} written, {failed} failed ---", flush=True)

    rate = round(written / (written + failed) * 100) if (written + failed) > 0 else 0
    print(f"""
Articles Done!
Site: {SITE}
Articles written: {written}/{len(IDEAS)}
Quality pass rate: {rate}%
DB: Neon (ep-fancy-leaf-a4zukau9)
""")


if __name__ == "__main__":
    main()
