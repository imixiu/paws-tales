#!/usr/bin/env bash
# paws-tales 图片回填进度查看
cd /root/vercel-projects/paws-tales || exit 1

echo "═══ tmux 会话状态 ═══"
SESSIONS=$(tmux list-sessions 2>/dev/null | grep img_paws)
if [ -z "$SESSIONS" ]; then
  echo "  (无运行中会话 — 任务已结束或已退出，看下方 DB 覆盖率确认)"
else
  echo "$SESSIONS" | sed 's/^/  /'
fi

echo ""
echo "═══ 各分片最新日志 ═══"
for i in 0 1 2 3; do
  last=$(grep -E '^\[' output/img_shard$i.log 2>/dev/null | tail -1)
  done_line=$(grep 'Complete!' output/img_shard$i.log 2>/dev/null | tail -1)
  if [ -n "$done_line" ]; then
    echo "  shard$i: ✅ $done_line"
  elif [ -n "$last" ]; then
    echo "  shard$i: $last"
  else
    echo "  shard$i: (无进度行)"
  fi
done

echo ""
echo "═══ DB 封面覆盖率（新批次 created_at>=2026-09-10）═══"
node -e "
const { query, endAll } = require('/root/.hermes/lib/db_router');
(async () => {
  const q = await query('paws-tales', \"SELECT COUNT(*) total, SUM(img LIKE 'http%') has_img, SUM(img IS NULL OR img='') no_img FROM articles WHERE site='paws-tales' AND DATE(created_at) >= '2026-09-10'\");
  const r = q.rows[0];
  const pct = (100 * r.has_img / r.total).toFixed(1);
  console.log('  已有图: ' + r.has_img + ' / ' + r.total + ' (' + pct + '%)  剩余: ' + r.no_img);
  const bar = Math.round(pct / 2.5);
  console.log('  [' + '█'.repeat(bar) + '░'.repeat(40 - bar) + '] ' + pct + '%');
  await endAll();
})().catch(e => { console.error('  DB查询失败:', e.message); process.exit(1); });
"
