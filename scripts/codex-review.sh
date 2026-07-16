#!/bin/bash
# ============================================================
# Claude実装 → 【CodeXレビュー&修正】 → Claude確認 のループの2段目。
# CodeX CLI(codex exec)をヘッドレスで呼び、作業ツリーの変更を
# レビューさせ、問題があればその場で修正までさせる。
#
# 使い方:
#   scripts/codex-review.sh                    # 未コミットの変更をレビュー
#   scripts/codex-review.sh "focus: つるかめ算のヒント判定"   # 観点を追加指定
#   RANGE=main..HEAD scripts/codex-review.sh   # コミット済み範囲をレビュー
#
# 前提: codex CLI ログイン済み / ネット不要(verifyはオフラインで通る)
# ============================================================
set -euo pipefail
cd "$(dirname "$0")/.."

RANGE="${RANGE:-}"
if [ -n "$RANGE" ]; then
  TARGET="git diff ${RANGE} の範囲"
else
  TARGET="未コミットの変更(git status / git diff で確認できる分)"
fi

codex exec --sandbox workspace-write "あなたはこのリポジトリのコードレビュアー兼修正担当です。

まず AGENTS.md と docs/ARCHITECTURE.md と docs/CONCEPT.md を読むこと。

レビュー対象: ${TARGET}
${1:-}

レビュー観点(優先順):
1. 算数として正しいか(数値・式・検算テストの妥当性)
2. エンジン規約の遵守(シナリオ=データ、エンジン改変には理由が要る)
3. 配色・字幕ルール(palette.jsの色のみ / 寸法数字は字幕へ)
4. タブレットでの見え方(キャンバス最小529×325に収まるか)
5. 子ども(小4〜6)向けの文言として自然か

問題を見つけたら、指摘だけで終わらせず**ファイルを直接修正する**こと。
修正したら必ず npm run verify を実行し、通ることを確認すること。
エンジン(src/engine.js, src/render/)への変更が必要だと思ったら、修正せず提案に留めること。

最後に必ず次の形式で報告:
## 修正した点
## 見送った点(理由つき)
## エンジンへの提案(あれば)"
