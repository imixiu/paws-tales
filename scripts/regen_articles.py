#!/usr/bin/env python3
"""Regenerate body/img for existing articles by short_title (UPDATE, not INSERT)."""

import os, re, time, random
from datetime import datetime, timedelta
from concurrent.futures import ThreadPoolExecutor, as_completed
from dotenv import load_dotenv
import psycopg2

SITE = "dogstrust"
SCORE_THRESHOLD = 75
CONCURRENCY = 3

TOPIC_PROMPTS = {
    "training": "Focus on positive reinforcement methods, include specific step-by-step techniques, cite studies on dog learning (e.g. APDT, Karen Pryor research), give real trainer examples.",
    "understanding-your-dog": "Include canine ethology research, specific body language signals, cite scientists like Alexandra Horowitz or Stanley Coren, give real-world scenarios.",
    "getting-a-dog": "Cover practical preparation steps, include costs/timelines, cite UK/US rescue statistics, give real owner experiences.",
    "health-wellbeing": "Include vet-reviewed guidance, specific product recommendations, cite veterinary sources (BVDA, AVMA), give real case examples.",
    "life-with-your-dog": "Cover practical tips for everyday dog life, include specific product/service recommendations, cite dog welfare organisations, give real owner stories.",
    "puppy-care": "Include developmental milestones, specific age-based guidance, cite puppy development research, give real breeder/owner examples.",
}

# Old 20 articles to regenerate
IDEAS = [
    ("understanding-your-dog","understanding-dog-play-styles-between-two-dogs"),
    ("health-wellbeing",     "dental-care-routine-for-dogs-at-home"),
    ("understanding-your-dog","how-to-read-dog-body-language-quickly"),
]

FORBIDDEN_TITLES = ["About ", "Why ", "Types and Variants", "Key Features", "Pros and Cons",
    "How to Choose", "Conclusion", "FAQs", "The Bottom Line", "In Summary"]
FORBIDDEN_PHRASES = ["In conclusion", "Comprehensive guide", "Ultimate guide", "Delve into",
    "Navigating the world", "Unveil the secrets", "In today's fast-paced",
    "Look no further", "Whether you're a beginner", "Dive deep into",
    "Tapestry", "Testament to", "Embark on a journey"]

load_dotenv(f"/root/vercel-projects/{SITE}/.env.local")
DATABASE_URL = os.environ["DATABASE_URL"]


def load_hermes_env():
    env = {}
    with open('/root/.hermes/profiles/theme-site-worker/.env') as f:
        for line in f:
            line = line.strip()
            if line and not line.startswith('#') and '=' in line:
                k, v = line.split('=', 1)
                env[k] = v
    return env


def score_article(html):
    score = 90
    text = re.sub(r'<[^>]+>', '', html)
    headings = re.findall(r'<h[23][^>]*>(.*?)</h[23]>', html, re.I | re.S)
    heading_text = ' '.join(re.sub(r'<[^>]+>', '', h) for h in headings)
    if any(f.lower() in heading_text.lower() for f in FORBIDDEN_TITLES):
        score -= 15
    if any(f.lower() in html.lower() for f in FORBIDDEN_PHRASES):
        score -= 15
    if len(text) < 3000:
        score -= 10
    if not (len(re.findall(r'<h2', html)) >= 5 and
            len(re.findall(r'<h3', html)) >= 3 and
            len(re.findall(r'<p', html)) >= 15 and
            len(re.findall(r'<ul|<ol', html)) >= 2 and
            (len(re.findall(r'<table', html)) >= 1 or
             len(re.findall(r'<blockquote', html)) >= 1)):
        score -= 10
    return score


def generate_article_html(type_, short_title):
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
        model="claude-opus-4-6", max_tokens=4096,
        messages=[{"role": "user", "content": prompt}], timeout=300,
    )
    html = resp.content[0].text.strip()
    html = re.sub(r'^```html?\s*', '', html)
    html = re.sub(r'\s*```$', '', html)
    return html


def generate_cover_image(short_title, type_):
    import urllib.request, json, subprocess
    env = {}
    with open(f'/root/vercel-projects/{SITE}/.env.local') as f:
        for line in f:
            line = line.strip()
            if '=' in line and not line.startswith('#'):
                k, v = line.split('=', 1)
                env[k] = v.strip('"')
    api_key = env.get('DASHSCOPE_API_KEY', '')
    blob_token = env.get('BLOB_READ_WRITE_TOKEN', '')
    title_readable = short_title.replace('-', ' ').title()
    topic_hint = TOPIC_PROMPTS.get(type_, type_)
    UNSPLASH_FALLBACK = "https://images.unsplash.com/photo-1501004318641-b39e6451bec6?w=1024&h=576&fit=crop"
    try:
        prompt = (f"Professional blog cover photo for an article about {title_readable}. "
                  f"{topic_hint}. Clean editorial style, natural lighting, no text overlay.")
        data = json.dumps({
            "model": "qwen-image-plus",
            "input": {"messages": [{"role": "user", "content": [{"text": prompt}]}]},
            "parameters": {"size": "1024*576"},
        }).encode()
        req = urllib.request.Request(
            "https://dashscope.aliyuncs.com/api/v1/services/aigc/multimodal-generation/generation",
            data=data,
            headers={"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"},
            method="POST",
        )
        with urllib.request.urlopen(req, timeout=120) as r:
            result = json.loads(r.read())
        oss_url = result["output"]["choices"][0]["message"]["content"][0]["image"]
    except Exception:
        return UNSPLASH_FALLBACK
    tmp_path = f"/tmp/{SITE}-{short_title}.png"
    try:
        urllib.request.urlretrieve(oss_url, tmp_path)
        if os.path.getsize(tmp_path) < 1024:
            return UNSPLASH_FALLBACK
    except Exception:
        return UNSPLASH_FALLBACK
    if not blob_token:
        return UNSPLASH_FALLBACK
    result = subprocess.run(
        ["npx", "vercel", "blob", "put", tmp_path,
         "--pathname", f"covers/{SITE}/{short_title}.png",
         "--access", "public", "--allow-overwrite", "true", "--rw-token", blob_token],
        cwd=f"/root/vercel-projects/{SITE}",
        capture_output=True, text=True, timeout=60,
    )
    if os.path.exists(tmp_path):
        os.remove(tmp_path)
    for line in (result.stdout + result.stderr).splitlines():
        if line.startswith("> Success!"):
            return line.split("> Success! ", 1)[1].strip()
    return UNSPLASH_FALLBACK


def update_article(short_title, body, img):
    conn = psycopg2.connect(DATABASE_URL)
    try:
        with conn.cursor() as cur:
            cur.execute(
                "UPDATE articles SET body=%s, img=%s, modified_time=%s WHERE site=%s AND short_title=%s",
                (body, img, datetime.now(), SITE, short_title)
            )
        conn.commit()
    finally:
        conn.close()


def process_one(args):
    idx, total, type_, short_title = args
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
    try:
        print("img...", end=" ", flush=True)
        img_url = generate_cover_image(short_title, type_)
        print("img OK", end=" ", flush=True)
    except Exception as e:
        img_url = "https://images.unsplash.com/photo-1501004318641-b39e6451bec6?w=1024&h=576&fit=crop"
        print(f"img FAIL({e})", end=" ", flush=True)
    update_article(short_title, html, img_url)
    print("DB OK", flush=True)
    return True


def main():
    print(f"Regenerating {len(IDEAS)} articles for {SITE}...", flush=True)
    written = failed = 0
    tasks = [(idx, len(IDEAS), t, s) for idx, (t, s) in enumerate(IDEAS, 1)]
    with ThreadPoolExecutor(max_workers=CONCURRENCY) as executor:
        futures = {executor.submit(process_one, t): t for t in tasks}
        for f in as_completed(futures):
            if f.result():
                written += 1
            else:
                failed += 1
    print(f"\nDone! Updated: {written}/{len(IDEAS)}, Failed: {failed}")


if __name__ == "__main__":
    main()
