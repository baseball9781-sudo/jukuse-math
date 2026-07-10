# jukuse-math — 中学受験算数 インタラクティブ教材

立体図形も、平面図形・速さ・割合なども、「コマ送り + 字幕 + 動くアニメ」で解説する教材基盤。
**立体は3D(Three.js)、平面やグラフは2D(Canvas)** を、同じエンジンで扱う。ブラウザで開くだけの自己完結HTMLを生成する。

## クイックスタート

```bash
npm run build     # dist/index.html を生成
# dist/index.html をブラウザで開く(3D表示時のみ Three.js CDN 取得にネット接続)

npm run verify    # 構文 → 幾何テスト → 実行時テスト → ビルド を一括
npm test          # テストだけ
```

追加の npm 依存なし(Node があれば動く)。

## いま入っている単元・問題

- **立体図形(3D)** 13問:切断/展開/表面積/体積/水位
- **平面図形(2D)** 1問:点の移動と面積(グラフ連動)
- **速さ(2D)** 2問:出会い算・追いつき算(ダイヤグラム連動)

上部の「単元」を選ぶと、その単元の問題タブに切り替わる。

## 設計の要点

**シナリオ=データ、エンジン=状態補間、描画=差し替え可能なバックエンド**。
問題は数値だけの「状態オブジェクト」で書き、エンジンが補間して描く。描画の実体(3D/2D)だけを
バックエンドとして切り替える。だから問題追加は「データを足すだけ」、単元をまたいでも同じ仕組み。
詳細は `docs/ARCHITECTURE.md`。

## これから作業する人へ

- 作業前に **`CLAUDE.md`**(鉄則と最短手順)
- 問題・単元を足す → **`docs/ADD_SCENARIO.md`**(3D/2D両方の雛形)
- 何を作るか → **`docs/ROADMAP.md`**(全単元の網羅計画と優先順位)

## ディレクトリ

```
src/
  math.js              3D幾何コア
  core/                util(補間) / palette(配色 COL・C2D)
  render/              three-helpers / canvas2d(2D描画API) / backend-three
  units/               単元ごと(geometry-solid / geometry-plane / speed / ...)
  registry.js          全単元を集約
  engine.js            バックエンド非依存プレイヤー + 単元/問題ナビ
scripts/  build.js / check-syntax.js
test/     geometry.test.js / runtime.test.js / three-stub.js / canvas-stub.js
dist/     index.html(配布はこれ1枚)
docs/     ARCHITECTURE / ADD_SCENARIO / ROADMAP
```
