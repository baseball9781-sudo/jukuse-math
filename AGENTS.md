# AGENTS.md — このリポジトリで作業するAI(CodeX等)への指示 ※CLAUDE.mdと同内容を保つこと

中学受験算数のインタラクティブ教材。**立体図形は3D(Three.js)、平面図形・速さ・割合などは2D(Canvas)** の2バックエンドを、同じ「コマ送り+字幕」エンジンで扱う。新しい問題や単元を足すのが主な作業。
**まず `docs/ARCHITECTURE.md` と `docs/ADD_SCENARIO.md` を読むこと。**

## 鉄則(必ず守る)

1. **変更したら必ず `npm run verify` を通してからコミット**(構文→幾何テスト→実行時テスト→ビルド)。
2. **シナリオはデータ、エンジンは触らない**。問題追加は原則「ビルダー1ファイル + `scenarios.js` に1エントリ + `registry.js` に登録」。`src/engine.js` や結合順(`scripts/build.js`)を変えるなら理由を明記。
3. **配色ルールを厳守**。3Dは `COL`、2Dは `C2D`(`src/core/palette.js`)。モノトーン基調 / 赤=注目 / 青=水。動点の2本目など区別が要るときだけ `green`/`blue` を使う。新色を足さない。
4. **寸法の数字を作画面に散らかさない**。長さ・公式・答えは字幕(caption)と式ボックス(formula)へ。図中に残すのは頂点記号・動点名・水位・面積の現在値など「位置が自明なラベル」だけ。
5. **数値は必ず検算**。面積・体積・速さ・出会いの時刻などは `test/geometry.test.js` にアサーションを足して確認。手計算のまま字幕に書かない。
6. **1手順=1つの動き+1つの気づき**。詰め込みすぎない。

## どちらのバックエンドで作るか

- **立体そのものを回す/展開する/切る** → 3D(`render:"three"`)。ビルダーは `build(scene, params) → { update(st) }`。
- **平面図形・グラフ・ダイヤグラム・数直線・てんびん図** → 2D(`render:"canvas2d"`)。ビルダーは `build(params) → { draw(g, st, screen) }`。`g` は `src/render/canvas2d.js` の描画API(ワールド座標→画面変換つき)。

迷ったら:動きの主役が「立体の内部/展開/回転」なら3D、「点や線の移動・量の変化・グラフ」なら2D。

## よくある作業の最短手順

### 問題を1つ追加する(既存単元)
1. `docs/ADD_SCENARIO.md` の該当バックエンドの雛形で `src/units/<unit>/builders/<name>.js` を作る
2. `src/units/<unit>/scenarios.js` の配列に1エントリ(id, name, type, source, params, base, steps)
3. `src/registry.js` の `BUILDERS` に `<type>: build<Name>` を1行足す
4. 計算があれば `test/geometry.test.js` に検算を追加
5. `npm run verify` → `dist/index.html` をブラウザで目視確認

### 単元を新設する
1. `src/units/<newunit>/builders/` と `scenarios.js`(`make<Name>Scenarios()`)を作る
2. `src/registry.js` に (a)`UNIT_NAMES` (b)`UNITS`配列 (c)`BUILDERS` を追記
3. あとは問題追加と同じ

## やってはいけない
- ブラウザストレージAPIの使用。ただし**進捗・つまずき履歴の記録に限り `localStorage` 可**(v2/P0決定。キーは `jukuse:` プレフィクス、読み失敗は無視して本体は動くこと。サーバ送信は不可)
- 音声の追加(全アニメ無音が仕様)
- Three.js のバージョン変更(r128固定)
- テストを飛ばす、`npm run verify` 未通過でのコミット

## 環境メモ
- Node があれば動く。追加の npm 依存なし(ビルドもテストも標準ライブラリのみ)。
- ブラウザ実行時のみ Three.js r128 を CDN から読む(3Dシナリオ表示時)。2Dのみのビルドなら本来CDN不要だが、現状は常に読み込む。
- 何を作るべきかは `docs/ROADMAP.md`(全単元の網羅計画)。
- v2(タブレット向けインタラクティブ教科書化)の構想は `docs/CONCEPT.md`。CodeXと協働するため、本ファイルと `AGENTS.md` は同内容を保つこと。
