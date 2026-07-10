# アーキテクチャ

## 全体像:1つのエンジン + 2つのバックエンド

中学受験算数を「コマ送り+カメラ/ビュー+字幕」で解説する教材。核は**「問題データ」と「再生エンジン」の分離**。問題は数値だけの状態オブジェクト、エンジンはそれを補間して描く。描画の実体だけを**バックエンド**として差し替えられる:

- **3Dバックエンド**(`render/backend-three.js`)… 立体図形。Three.js で立体を描き、`camPos`/`camTarget` でカメラを動かす。
- **2Dバックエンド**(`render/canvas2d.js`)… 平面図形・速さ・グラフ。Canvas に毎フレーム描き直す。`view`(原点・スケール・y向き)で見え方を動かす。

エンジン(`engine.js`)は**どちらのバックエンドかを意識せず**、状態を補間して `backend.frame(...)` を呼ぶだけ。シナリオの `render` フィールドでどちらを使うか決まる。

```
scenarios(問題データ) ── registry が全単元を集約 ──▶ ALL_SCENARIOS / BUILDERS
                                                        │
                                    engine.js(状態補間・単元/問題ナビ・ループ)
                                                        │
                                     ┌──────────────────┴───────────────────┐
                              backend-three(3D)                     canvas2d(2D)
                              builder.update(st)                    builder.draw(g, st)
                              THREE を描く                           Canvas に描く
```

## 「状態」と補間

各シナリオは数値・数値配列・(2Dは)`view` などからなる**状態オブジェクト**を持つ。`base`(初期)＋各 `step.state`(差分)をマージして「到達状態」を作り、エンジンが前→次を `easeInOut` で毎フレーム補間する。ビルダーは「今この状態ならどう見えるか」だけを描く(フレーム独立=途中でも破綻しない)。

- 3D共通の予約キー:`camPos` / `camTarget`(配列。補間される)
- 2D共通の予約キー:`view = { ox, oy, scale, yUp }`(ネストも再帰補間される)

## ビルダーの契約

### 3D(`render:"three"`)
```js
function buildXxx(scene, params) {
  // scene に THREE オブジェクトを add(初期化1回)
  return { update(st) { /* st を見て position/opacity/scale を設定 */ } };
}
```

### 2D(`render:"canvas2d"`)
```js
function buildXxx(params) {
  return { draw(g, st, screen) { /* g のAPIでワールド座標に描く */ } };
}
```
`g`(`makeG`)のAPI:`line/path/poly/circle/dot/arc/arrow/text/badge/grid`。すべてワールド座標(問題の単位)で指定し、`view` に従って画面へ変換される。色は `C2D`。

## ファイル構成

```
src/
  math.js                  幾何コア(3Dの切断/展開/水位 計算。純関数 + node用export)
  core/
    util.js                clamp01 / easeInOut / lerp / V3
    palette.js             COL(3D hex) + C2D(2D CSS)
  render/
    three-helpers.js       3D描画ヘルパー(polysToGeometry, makeLabel, makeGrid...)
    canvas2d.js            2D描画API makeG + 2Dバックエンド
    backend-three.js       3Dバックエンド
  units/
    geometry-solid/        立体図形(3D)。builders/*.js + scenarios.js
    geometry-plane/        平面図形(2D)
    speed/                 速さ(2D)
    <新単元>/ ...
  registry.js              全単元を集約(UNIT_NAMES / UNITS / BUILDERS / ALL_SCENARIOS)
  engine.js                バックエンド非依存プレイヤー + 単元/問題2階層ナビ
  shell-head.html / shell-foot.html
scripts/  build.js(結合ビルド) / check-syntax.js
test/     geometry.test.js / runtime.test.js / three-stub.js / canvas-stub.js
dist/     index.html(配布はこれ1枚)
docs/     ARCHITECTURE / ADD_SCENARIO / ROADMAP
```

## ナビゲーション(単元 → 問題の2階層)

`registry` が各シナリオに `unit` を付与し、エンジンが単元でグルーピングしてタブを2段(単元行+問題行)に出す。単元を選ぶとその先頭問題へ、問題タブで個別に切り替わる。

## なぜ `<script>` 連結ビルドか

`file://` で直接開ける(先生が配布HTMLをダブルクリック)ことを最優先。ESモジュールは file:// のCORSで読めないため、**ビルド時に全ソースを1つの `<script>` に連結**する。連結順(`scripts/build.js`)が実行時の健全性を保証する:`math → core → render → units → registry → engine`。関数は巻き上げ、`const`(COL/C2D 等)は init 実行時までに定義済みで安全。

## テスト

- `test/geometry.test.js` … 数値検証(切断面が正六角形、出会いの時刻、面積の変化 など)。**新しい計算を足したらここに検算を追加**。
- `test/runtime.test.js` … 全単元の全シナリオを全ステップ1フレームずつ走らせ、実行時エラーを検出。3Dは `three-stub.js`、2Dは `canvas-stub.js` を使うのでブラウザ不要。
- `scripts/check-syntax.js` … `src/**/*.js` の構文チェック。

`npm run verify` でこの3つ+ビルドを一括。

## オフライン配布(完全自己完結)

現状 `dist/index.html` は3D表示時に Three.js r128 を CDN 取得する。完全オフラインにするには `src/vendor/three.min.js` を置き、`build.js` でインライン連結し、`shell-head.html` の CDN `<script>` を外す。2Dだけの単元セットならThree.js自体が不要になるので、単元を選んでビルドする「単元別ビルド」への拡張も容易(`build.js` に対象単元フィルタを足す)。
