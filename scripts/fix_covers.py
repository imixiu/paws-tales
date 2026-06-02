#!/usr/bin/env python3
"""Regenerate cover images for articles stuck on the fallback URL."""

import os, re, json, time, subprocess, urllib.request
from concurrent.futures import ThreadPoolExecutor, as_completed
import psycopg2
from dotenv import load_dotenv

SITE = "dogstrust"
FALLBACK_URL = "https://images.unsplash.com/photo-1501004318641-b39e6451bec6?w=1024&h=576&fit=crop"
CONCURRENCY = 3

load_dotenv(f"/root/vercel-projects/{SITE}/.env.local")
DATABASE_URL = os.environ["DATABASE_URL"]

env = {}
with open(f"/root/vercel-projects/{SITE}/.env.local") as f:
    for line in f:
        line = line.strip()
        if "=" in line and not line.startswith("#"):
            k, v = line.split("=", 1)
            env[k] = v.strip('"')

API_KEY = env.get("DASHSCOPE_API_KEY", "")
BLOB_TOKEN = env.get("BLOB_READ_WRITE_TOKEN", "")

TOPIC_PROMPTS = {
    "training": "Dog training, positive reinforcement, commands.",
    "understanding-your-dog": "Canine behaviour, body language, ethology.",
    "getting-a-dog": "Dog ownership preparation, breed selection, adoption.",
    "health-wellbeing": "Dog health, veterinary care, preventive medicine.",
    "life-with-your-dog": "Day-to-day dog ownership, lifestyle, practical tips.",
    "puppy-care": "Puppy development, early care, socialisation.",
}

# Unique Unsplash dog photos as fallback pool (different for each article)
UNSPLASH_POOL = [
    "photo-1587300003388-59208cc962cb",  # dog training
    "photo-1548199973-03cce0bbc87b",  # two dogs running
    "photo-1537151625747-768eb6cf92b2",  # dog portrait
    "photo-1477884213360-7e9d7dcc1e48",  # puppy
    "photo-1518717758536-85ae29035b6d",  # dog looking up
    "photo-1552053831-71594a27632d",  # golden retriever
    "photo-1561037404-61cd46aa615b",  # dog outside
    "photo-1583511655857-d19b40a7a54e",  # dog with owner
    "photo-1596492784531-6e6eb5ea9993",  # dog park
    "photo-1530281700549-e82e7bf110d6",  # dog running
    "photo-1450778869180-41d0601e046e",  # two dogs
    "photo-1543466835-00a7907e9de1",  # dog close up
    "photo-1601979031925-424e53b6caaa",  # puppy cute
    "photo-1576201836106-db1758fd1c97",  # dog lying down
    "photo-1568572933382-74d440642117",  # dog sitting
    "photo-1587300003388-59208cc962cb",  # repeat for overflow
]


def get_fallback(short_title: str, idx: int) -> str:
    photo_id = UNSPLASH_POOL[idx % len(UNSPLASH_POOL)]
    return f"https://images.unsplash.com/{photo_id}?w=1024&h=576&fit=crop&auto=format"


def generate_cover(short_title: str, type_: str, idx: int) -> str:
    title_readable = short_title.replace("-", " ").title()
    topic_hint = TOPIC_PROMPTS.get(type_, type_)
    prompt = (
        f"Professional blog cover photo for an article about {title_readable}. "
        f"{topic_hint} Clean editorial style, natural lighting, no text overlay."
    )
    try:
        data = json.dumps({
            "model": "qwen-image-plus",
            "input": {"messages": [{"role": "user", "content": [{"text": prompt}]}]},
            "parameters": {"size": "1024*576"},
        }).encode()
        req = urllib.request.Request(
            "https://dashscope.aliyuncs.com/api/v1/services/aigc/multimodal-generation/generation",
            data=data,
            headers={"Authorization": f"Bearer {API_KEY}", "Content-Type": "application/json"},
            method="POST",
        )
        with urllib.request.urlopen(req, timeout=120) as r:
            result = json.loads(r.read())
        oss_url = result["output"]["choices"][0]["message"]["content"][0]["image"]
    except Exception as e:
        print(f"  DashScope fail: {e}")
        return get_fallback(short_title, idx)

    tmp_path = f"/tmp/{SITE}-fix-{short_title}.png"
    try:
        urllib.request.urlretrieve(oss_url, tmp_path)
        if os.path.getsize(tmp_path) < 1024:
            return get_fallback(short_title, idx)
    except Exception as e:
        print(f"  Download fail: {e}")
        return get_fallback(short_title, idx)

    if not BLOB_TOKEN:
        return get_fallback(short_title, idx)

    result = subprocess.run(
        ["npx", "vercel", "blob", "put", tmp_path,
         "--pathname", f"covers/{SITE}/{short_title}.png",
         "--access", "public", "--allow-overwrite", "true", "--rw-token", BLOB_TOKEN],
        cwd=f"/root/vercel-projects/{SITE}",
        capture_output=True, text=True, timeout=60,
    )
    if os.path.exists(tmp_path):
        os.remove(tmp_path)
    for line in (result.stdout + result.stderr).splitlines():
        if line.startswith("> Success!"):
            return line.split("> Success! ", 1)[1].strip()
    return get_fallback(short_title, idx)


def update_img(short_title: str, img_url: str):
    conn = psycopg2.connect(DATABASE_URL)
    try:
        with conn.cursor() as cur:
            cur.execute(
                "UPDATE articles SET img=%s WHERE site=%s AND short_title=%s",
                (img_url, SITE, short_title)
            )
        conn.commit()
    finally:
        conn.close()


def fix_one(item):
    idx, short_title, type_ = item
    print(f"[{idx}] {short_title} ...", flush=True)
    img = generate_cover(short_title, type_, idx)
    update_img(short_title, img)
    print(f"[{idx}] {short_title} -> {img[:60]}...", flush=True)
    return short_title, img


def main():
    conn = psycopg2.connect(DATABASE_URL)
    with conn.cursor() as cur:
        cur.execute(
            "SELECT short_title, type FROM articles WHERE site=%s AND img=%s ORDER BY type, short_title",
            (SITE, FALLBACK_URL)
        )
        rows = cur.fetchall()
    conn.close()

    print(f"Articles to fix: {len(rows)}")
    items = [(i+1, row[0], row[1]) for i, row in enumerate(rows)]

    with ThreadPoolExecutor(max_workers=CONCURRENCY) as ex:
        futures = {ex.submit(fix_one, item): item for item in items}
        done = 0
        for f in as_completed(futures):
            done += 1
            short_title, img = f.result()

    print(f"\nDone! Fixed {done}/{len(rows)} articles.")


if __name__ == "__main__":
    main()
