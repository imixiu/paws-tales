#!/usr/bin/env python3
"""Unified parse for paws-tales batch JSONL (LLM batch output).
Handles: fenced JSON, strict=False, missing site/type (infer), type mapping,
in-batch dedup, slug sanitization, empty-src img strip.
Usage: python3 parse_all.py <src.jsonl> <out.jsonl> <bad.jsonl>
"""
import json, re, sys
from collections import Counter

SRC, OUT, BAD = sys.argv[1], sys.argv[2], sys.argv[3]

VALID_TYPES = {'training', 'understanding-your-dog', 'getting-a-dog',
               'health-wellbeing', 'life-with-your-dog', 'puppy-care',
               'canine-science', 'breed-profile'}
TYPE_MAP = {'health-guide': 'health-wellbeing', 'behavior': 'understanding-your-dog',
            'nutrition': 'health-wellbeing', 'food-safety': 'health-wellbeing',
            'breed-profiles': 'breed-profile', 'canine-behavior': 'understanding-your-dog',
            'health': 'health-wellbeing', 'science': 'canine-science',
            'breed-guide': 'breed-profile', 'breed-comparison': 'breed-profile',
            'medication-guide': 'health-wellbeing', 'cost-guide': 'getting-a-dog',
            'dog-names': 'getting-a-dog'}
EMPTY_SRC_IMG = re.compile(r'<img[^>]*src\s*=\s*(""|\'\')\s*[^>]*>', re.I)

def sanitize_slug(s):
    s = s.strip().lower()
    s = re.sub(r'[^a-z0-9]+', '-', s)   # spaces/underscores/etc -> hyphen
    s = re.sub(r'-+', '-', s).strip('-')
    return s

def infer_type(title, short, desc):
    t = (title + ' ' + short + ' ' + desc).lower()
    if 'breed-profile' in short or 'breed profile' in t or re.search(r'breed (guide|profile|info|overview|characteristics)', t):
        return 'breed-profile', 'breed'
    if short.endswith('-science') or '-science-' in short or 'the science' in t or 'science behind' in t or 'scientific' in t:
        return 'canine-science', 'science'
    if re.search(r'\bpupp(y|ies)\b', t):
        return 'puppy-care', 'puppy'
    if re.search(r'\b(names?|naming)\b', t) and 'dog' in t:
        return 'getting-a-dog', 'names'
    if re.search(r'\b(train|training|teach|housebreak|potty train|leash train|command|obedience)\b', t):
        return 'training', 'train'
    if re.search(r'\b(symptom|treatment|disease|infection|vet|veterinar|illness|sick|pain|remedy|medication|dosage|surgery|diarrhea|vomit|seizure|heatstroke)\b', t):
        return 'health-wellbeing', 'health'
    if re.search(r"buyer'?s guide|buying guide|top picks|\breview(?:ed|s)?\b|\bbest\b|\bvs\.?\b", t) and \
       re.search(r'\b(crate|crates|bed|beds|fence|fences|collar|collars|harness|harnesses|leash|leashes|dryer|dryers|bowl|bowls|muzzle|carrier|backpack|coat|coats|gps|sofa|holder|toy|toys|shampoo|brush|gate|stroller|boots|gear|product|products|supplies|accessor\w*|id tag|tags)\b', t):
        return 'life-with-your-dog', 'gear'
    if re.search(r'^why |why does|why do|why is|why are|what does|meaning|body language|behavior|behaviour|emotion|psycholog', t):
        return 'understanding-your-dog', 'why'
    if re.search(r'\b(travel|holiday|vacation|family|kids|children|home|garden|apartment|moving|walk|park|beach)\b', t):
        return 'life-with-your-dog', 'life'
    if re.search(r'\b(adopt|adoption|buy|cost|price|prepare|getting|first dog|new dog|choose|selecting)\b', t):
        return 'getting-a-dog', 'adopt'
    if re.search(r'\b(health|wellbeing|well-being|nutrition|diet|food|grooming|care)\b', t):
        return 'health-wellbeing', 'health2'
    if re.search(r'\b(best|guide|picks|review|tested|top|durable|sizes?)\b', t) and 'dog' in t:
        return 'life-with-your-dog', 'gear-fallback'
    return None, 'none'

def extract_items(obj):
    """Return list of dict items from a batch-output record, tolerant parsing."""
    content = obj.get('response', {}).get('body', {}).get('choices', [{}])[0].get('message', {}).get('content')
    if content is None:
        return None
    c = content.strip()
    if c.startswith('```'):
        c = re.sub(r'^```(?:json)?\s*', '', c)
        c = re.sub(r'\s*```$', '', c)
    try:
        items = json.loads(c, strict=False)
    except Exception:
        # try to find the last fenced json block (model self-correction pattern)
        blocks = re.findall(r'```json\s*(.*?)```', content, re.S)
        for b in reversed(blocks):
            try:
                items = json.loads(b.strip(), strict=False)
                break
            except Exception:
                continue
        else:
            return None
    if isinstance(items, dict):
        items = [items]
    if not isinstance(items, list):
        return None
    return items

stats = Counter()
type_counter = Counter()
rules = Counter()
seen = set()
pending_join = []   # buffer for records split across physical lines

out_f = open(OUT, 'w', encoding='utf-8')
bad_f = open(BAD, 'w', encoding='utf-8')

def emit(it, lineno):
    site = str(it.get('site', '') or '')
    if site and site.replace('-', '').replace('_', '') != 'pawstales':
        stats['wrong_site'] += 1
        bad_f.write(json.dumps({'lineno': lineno, 'reason': 'wrong_site', 'site': site, 'short': it.get('short_title')}) + '\n')
        return
    title = str(it.get('title', '') or '').strip()
    short_raw = str(it.get('short_title', '') or '').strip()
    desc = str(it.get('description', '') or '').strip()
    body = it.get('body', '') or ''
    t = str(it.get('type', '') or '')
    if t in TYPE_MAP:
        t = TYPE_MAP[t]
        stats['type_mapped'] += 1
    if t not in VALID_TYPES:
        if not short_raw or not title or len(body) < 200:
            stats['incomplete'] += 1
            bad_f.write(json.dumps({'lineno': lineno, 'reason': 'incomplete', 'short': short_raw[:80]}) + '\n')
            return
        t, rule = infer_type(title, short_raw, desc)
        if t is None:
            stats['type_unresolved'] += 1
            bad_f.write(json.dumps({'lineno': lineno, 'reason': 'type_unresolved', 'title': title[:100], 'short': short_raw[:80]}) + '\n')
            return
        rules[rule] += 1
        stats['type_inferred'] += 1
    if not short_raw or not title or len(body) < 200:
        stats['incomplete'] += 1
        bad_f.write(json.dumps({'lineno': lineno, 'reason': 'incomplete', 'short': short_raw[:80], 'title_len': len(title), 'body_len': len(body)}) + '\n')
        return
    if 'Article at URL' in title:
        stats['placeholder_title'] += 1
        bad_f.write(json.dumps({'lineno': lineno, 'reason': 'placeholder_title', 'short': short_raw}) + '\n')
        return
    short = sanitize_slug(short_raw)
    if short != short_raw:
        stats['slug_sanitized'] += 1
    if not short:
        stats['incomplete'] += 1
        return
    if short in seen:
        stats['dup_in_batch'] += 1
        bad_f.write(json.dumps({'lineno': lineno, 'reason': 'dup_in_batch', 'short': short}) + '\n')
        return
    seen.add(short)
    body_clean, n = EMPTY_SRC_IMG.subn('', body)
    if n:
        stats['empty_src_img_removed'] += n
    out_f.write(json.dumps({'title': title, 'short_title': short, 'description': desc,
                            'body': body_clean, 'type': t, 'language': it.get('language') or 'en'},
                           ensure_ascii=False) + '\n')
    stats['accepted'] += 1
    type_counter[t] += 1

with open(SRC, encoding='utf-8') as f:
    for lineno, line in enumerate(f, 1):
        s = line.strip()
        if not s:
            stats['empty_line'] += 1
            continue
        try:
            obj = json.loads(s, strict=False)
        except Exception as e:
            # possibly a record split by raw newlines: buffer and try joining with subsequent lines
            pending_join.append(s)
            stats['join_buffered'] += 1
            if len(pending_join) >= 2:
                joined = '\n'.join(pending_join)
                try:
                    obj = json.loads(joined, strict=False)
                    pending_join = []
                    stats['join_recovered'] += 1
                except Exception:
                    if len(pending_join) > 12:
                        stats['join_abandoned'] += 1
                        bad_f.write(json.dumps({'lineno': lineno, 'reason': 'join_abandoned', 'head': pending_join[0][:150]}) + '\n')
                        pending_join = []
                    continue
            else:
                continue
        if pending_join and len(pending_join) > 0 and not isinstance(obj, dict):
            continue
        if obj.get('response', {}).get('status_code') not in (None, 200):
            stats['non200'] += 1
            bad_f.write(json.dumps({'lineno': lineno, 'reason': 'non200'}) + '\n')
            continue
        items = extract_items(obj)
        if items is None:
            stats['content_parse_fail'] += 1
            bad_f.write(json.dumps({'lineno': lineno, 'reason': 'content_parse_fail', 'id': obj.get('id')}) + '\n')
            continue
        for it in items:
            if not isinstance(it, dict):
                stats['non_dict_item'] += 1
                continue
            emit(it, lineno)

out_f.close(); bad_f.close()
print('=== STATS ===')
for k, v in sorted(stats.items()):
    print(f'  {k}: {v}')
print('\n=== TYPE distribution ===')
for k, v in type_counter.most_common():
    print(f'  {k}: {v}')
if rules:
    print('\n=== inference rules ===')
    for k, v in rules.most_common():
        print(f'  {k}: {v}')
print('\nTOTAL accepted:', stats['accepted'])
