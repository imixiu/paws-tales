"""
Regenerate cover images for dogstrust articles (UPDATE img field only).
Skips articles already using blob.vercel-storage.com.
"""
import os, json, urllib.request, subprocess, psycopg2, traceback
from datetime import datetime
from dotenv import load_dotenv

SITE = "dogstrust"
load_dotenv(f"/root/vercel-projects/{SITE}/.env.local", override=True)

# Read credentials directly from file to bypass any env injection
_env_file = {}
with open(f"/root/vercel-projects/{SITE}/.env.local") as _f:
    for _line in _f:
        _line = _line.strip()
        if "=" in _line and not _line.startswith("#"):
            _k, _v = _line.split("=", 1)
            _env_file[_k.strip()] = _v.strip().strip('"')

DATABASE_URL = _env_file.get("DATABASE_URL") or os.environ["DATABASE_URL"]
DASHSCOPE_API_KEY = _env_file.get("DASHSCOPE_API_KEY") or os.environ["DASHSCOPE_API_KEY"]
BLOB_TOKEN = _env_file.get("BLOB_READ_WRITE_TOKEN") or os.environ.get("BLOB_READ_WRITE_TOKEN", "")
UNSPLASH_FALLBACK = "https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=1024&h=576&fit=crop"

TOPIC_HINTS = {
    "getting-a-dog": "Dog adoption and breed selection, warm family scene",
    "training": "Dog training session, positive reinforcement, handler and dog",
    "health-wellbeing": "Dog health care, veterinary, wellness",
    "life-with-your-dog": "Dog and owner lifestyle, daily life together",
    "puppy-care": "Cute puppy care, nurturing, playful",
    "understanding-your-dog": "Dog behavior and communication, observing dog",
}


def gen_img(st, tp, desc):
    prompt = (
        f"Professional blog cover photo for {st.replace('-', ' ').title()}. "
        f"{TOPIC_HINTS.get(tp, 'dog care')}. {desc[:100]}. "
        f"Clean editorial style, natural lighting, no text overlay."
    )
    data = json.dumps({
        "model": "qwen-image-plus",
        "input": {"messages": [{"role": "user", "content": [{"text": prompt}]}]},
        "parameters": {"size": "1024*576"},
    }).encode()
    req = urllib.request.Request(
        "https://dashscope.aliyuncs.com/api/v1/services/aigc/multimodal-generation/generation",
        data=data,
        headers={"Authorization": f"Bearer {DASHSCOPE_API_KEY}", "Content-Type": "application/json"},
        method="POST",
    )
    with urllib.request.urlopen(req, timeout=120) as r:
        res = json.loads(r.read())
    oss_url = res["output"]["choices"][0]["message"]["content"][0]["image"]

    tmp = f"/tmp/{SITE}-{st}.png"
    urllib.request.urlretrieve(oss_url, tmp)
    if os.path.getsize(tmp) < 1024:
        os.remove(tmp)
        return UNSPLASH_FALLBACK

    blob_env = os.environ.copy()
    blob_env["BLOB_READ_WRITE_TOKEN"] = BLOB_TOKEN
    r = subprocess.run(
        ["npx", "vercel", "blob", "put", tmp,
         "--pathname", f"covers/{SITE}/{st}.png",
         "--access", "public", "--allow-overwrite", "true"],
        cwd=f"/root/vercel-projects/{SITE}",
        capture_output=True, text=True, timeout=60,
        env=blob_env,
    )
    if os.path.exists(tmp):
        os.remove(tmp)
    print(f"  [blob-dbg] rc={r.returncode} token_len={len(BLOB_TOKEN)} stderr={r.stderr[:80]}", flush=True)
    for line in (r.stdout + r.stderr).splitlines():
        if line.startswith("> Success!"):
            return line.split("> Success! ", 1)[1].strip()
    print(f"  blob fail rc={r.returncode} stderr={r.stderr[:120]}", flush=True)
    return UNSPLASH_FALLBACK


def main():
    conn = psycopg2.connect(DATABASE_URL)
    with conn.cursor() as cur:
        cur.execute(
            "SELECT short_title, type, description FROM articles "
            "WHERE site=%s AND img NOT LIKE '%%blob.vercel-storage%%' ORDER BY id",
            (SITE,)
        )
        articles = cur.fetchall()
    conn.close()
    print(f"Pending: {len(articles)}", flush=True)

    ok = fail = 0
    for i, (st, tp, desc) in enumerate(articles, 1):
        print(f"[{i}/{len(articles)}] {st[:50]} ... ", end="", flush=True)
        try:
            url = gen_img(st, tp, desc or "")
            conn = psycopg2.connect(DATABASE_URL)
            with conn.cursor() as cur:
                cur.execute(
                    "UPDATE articles SET img=%s, modified_time=%s WHERE site=%s AND short_title=%s",
                    (url, datetime.now(), SITE, st)
                )
            conn.commit()
            conn.close()
            tag = "blob" if "blob.vercel-storage" in url else "unsplash"
            print(f"OK ({tag})", flush=True)
            ok += 1
        except Exception as e:
            traceback.print_exc()
            print(f"FAIL: {e}", flush=True)
            fail += 1

    print(f"\nDone: {ok} OK, {fail} FAIL", flush=True)


if __name__ == "__main__":
    main()
