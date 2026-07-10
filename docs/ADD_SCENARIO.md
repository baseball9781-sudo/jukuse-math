# 問題・単元の追加手順

## どちらのバックエンドか決める

- 立体を回す/展開する/切る/水を入れる → **3D**(`render:"three"`)
- 平面図形・点や線の移動・グラフ・ダイヤグラム・数直線・てんびん図 → **2D**(`render:"canvas2d"`)

---

## 3D問題を足す

### 1. ビルダー `src/units/geometry-solid/builders/<name>.js`
```js
function buildMyShape(scene, params) {
  const { size } = params;
  makeGrid(scene, 30, 15, 0, 0);
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(size, size, size), solidMat(COL.solid));
  scene.add(mesh);
  scene.add(new THREE.LineSegments(new THREE.EdgesGeometry(mesh.geometry), new THREE.LineBasicMaterial({ color: COL.edge })));
  return { update(st) { mesh.rotation.y = (st.spin ?? 0) * Math.PI * 2; } };
}
```
使えるヘルパー(`src/render/three-helpers.js`):`solidMat/redOverlayMat/polysToGeometry/polysToEdges/makeLabel/setLabelText/makeGrid/dynQuad/boxVerts/cubeFaceIdx/V3`。
幾何計算(`src/math.js`):`splitPolyhedron/computeUnfold/hingeAlpha/solveWaterLevel/vAdd..vNorm/rotAxis`。

### 2. シナリオ `src/units/geometry-solid/scenarios.js`
`makeSolidScenarios()` の配列に:
```js
{
  id:"myShape", name:"⑭ マイ立体", type:"myShape",
  source:"単元XX/○○",
  params:{ size:6 },
  base:{ camPos:[16,8.5,19], camTarget:[3,2.8,3], spin:0 },
  steps:[
    { dur:1.4, caption:"問題文。" },
    { dur:2.4, caption:"動き。", formula:"式 = ...", state:{ spin:1 } },
  ],
}
```

### 3. 登録 `src/registry.js` の `BUILDERS`
```js
myShape: buildMyShape,
```

---

## 2D問題を足す

### 1. ビルダー `src/units/<unit>/builders/<name>.js`
```js
function buildMyGraph(params) {
  const { n } = params;
  return {
    draw(g, st, screen) {
      // g はワールド座標で描く。view は st.view(base で指定)から。
      g.grid(0, 0, 10, 6, 1, { boldEvery: 5 });
      g.line(0, 0, st.x, st.y, { color: C2D.red, w: 2 });
      g.dot(st.x, st.y, { color: C2D.red, rp: 6, ring: true });
      g.badge(st.x, st.y, "P", { dy: -14 });
      g.text(5, 5.5, `${st.val}cm²`, { color: C2D.red });
    },
  };
}
```
`g` のAPI:
- `line(x1,y1,x2,y2,{color,w,dash,alpha})` / `path(pts,{...})` / `poly(pts,{color,w,fill,fillAlpha})`
- `circle(x,y,r,{...})` / `dot(x,y,{color,rp,ring})` / `arc(x,y,r,a0deg,a1deg,{...})`
- `arrow(x1,y1,x2,y2,{color,head})` / `text(x,y,str,{color,size,align,dx,dy})` / `badge(x,y,str,{bg,fg,dx,dy})`
- `grid(x0,y0,x1,y1,step,{boldEvery,alpha})`
- 色は `C2D`(`palette.js`)。座標はワールド単位、`view` が画面へ変換する。

`view = { ox, oy, scale, yUp }` を `base.view` に置く(`yUp:true` でグラフ的な上向き)。ズーム/パンは `step.state.view` で動かす。

### 2. シナリオ `src/units/<unit>/scenarios.js`
```js
function makeMyUnitScenarios() {
  return [{
    id:"myGraph", name:"① ○○", type:"myGraph",
    source:"単元/○○",
    params:{ n:3 },
    base:{ view:{ ox:60, oy:60, scale:30, yUp:true }, x:0, y:0, val:0 },
    steps:[
      { dur:1.4, caption:"問題文。" },
      { dur:3.0, caption:"動き。", formula:"式", state:{ x:6, y:4, val:12 } },
    ],
  }];
}
```

### 3. 登録 `src/registry.js`
- 新単元なら `UNIT_NAMES` に表示名、`UNITS` に `{ id, render:"canvas2d", scenarios: makeMyUnitScenarios }`
- `BUILDERS` に `myGraph: buildMyGraph`

---

## 共通:検算とビルド

計算があれば `test/geometry.test.js` の末尾に:
```js
{ const v = 6*4/2; ok(near(v,12), `三角形の面積 = 12 (got ${v})`); }
```
最後に必ず:
```
npm run verify   # 構文 → 幾何 → 実行時 → ビルド
```
`dist/index.html` をブラウザで開いて、カメラ/ビュー・字幕の温度感・1手順の情報量を目視確認。

## 状態設計のコツ
- アニメの主役は **0→1 に動く値**(展開角 `t`、進んだ道のり `d`、時刻 `t`)。ビルダーがそれを変形に変換
- 出し入れは **不透明度 0→1**(`showGraph`, `showTri` など)
- カメラ/ビューも状態:寄る・引く・真上・ズームは `camPos`/`camTarget` や `view` を step で動かすだけ
- `update`/`draw` は「その瞬間の状態だけで絵が決まる」書き方に(前フレーム依存の差分更新をしない)
