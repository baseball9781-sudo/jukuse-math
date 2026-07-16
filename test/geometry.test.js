const M = require("../src/math.js");

let fails = 0;
const ok = (cond, msg) => { console.log((cond ? "PASS" : "FAIL") + "  " + msg); if (!cond) fails++; };
const near = (a, b, e = 1e-6) => Math.abs(a - b) < e;

// ---------- 1. 立方体の切断 (x+y+z=9 → 正六角形) ----------
const cubeVerts = [
  [0,0,0],[6,0,0],[6,6,0],[0,6,0],
  [0,0,6],[6,0,6],[6,6,6],[0,6,6],
];
const cubeFaces = [
  [0,3,2,1], // z=0 (外向き -z)
  [4,5,6,7], // z=6
  [0,4,7,3], // x=0
  [1,2,6,5], // x=6
  [0,1,5,4], // y=0
  [3,7,6,2], // y=6
];
const plane = { n: [1,1,1], d: 9 };
const res = M.splitPolyhedron(cubeVerts, cubeFaces, plane);

ok(res.cap.length === 6, `切り口の頂点数 = 6 (got ${res.cap.length})`);
// 全ての辺の長さが等しい (正六角形: 辺 = 3√2)
const sideLens = res.cap.map((p, i) => M.vLen(M.vSub(res.cap[(i+1)%6], p)));
ok(sideLens.every((l) => near(l, 3 * Math.SQRT2, 1e-4)), `切り口の辺長がすべて 3√2 (got ${sideLens.map(l=>l.toFixed(3)).join(",")})`);
// 中心からの距離も等しい
const capC = res.cap.reduce((s,p)=>M.vAdd(s,p),[0,0,0]).map(x=>x/6);
ok(near(capC[0],3)&&near(capC[1],3)&&near(capC[2],3), "切り口の中心 = (3,3,3)");
ok(res.below.length === 6 && res.above.length === 6, `分割後の面数 below=${res.below.length}, above=${res.above.length} (期待6,6: 五角形3+三角形3)`);
// below側の頂点はすべて x+y+z <= 9
const allBelowOk = res.below.every(f => f.every(p => p[0]+p[1]+p[2] <= 9 + 1e-6));
ok(allBelowOk, "below側の全頂点が x+y+z<=9");

// ---------- 2. 三角すいの展開 (→1辺6cmの正方形) ----------
// P(直角の頂点), Q, R が底面 / O が真上6cm
const tetVerts = { P:[0,0,0], Q:[3,0,0], R:[0,3,0], O:[0,0,6] };
const unfold = M.computeUnfold(tetVerts, ["O","Q","R"], [
  { hinge:["O","Q"], apex:"P" },
  { hinge:["Q","R"], apex:"P" },
  { hinge:["R","O"], apex:"P" },
]);
// 固定面3頂点は床(y=0)
ok(["O","Q","R"].every(k => near(unfold.T[k][1], 0)), "固定面OQRが床(y=0)に乗る");
// 折りたたみ時のPは床より上
ok(unfold.moving.every(m => m.p0[1] > 0), "折りたたみ時のPは床の上");
// 展開後のPは床(y=0)
ok(unfold.flat.every(p => near(p[1], 0, 1e-6)), "展開後の3つのPが床に落ちる");
// 展開図が1辺6の正方形: 4隅 = O + 3つのP
const corners = [unfold.T["O"], ...unfold.flat];
// 重心から各隅までの距離 = 対角線の半分 = 3√2
const sc = corners.reduce((s,p)=>M.vAdd(s,p),[0,0,0]).map(x=>x/4);
const rads = corners.map(p => M.vLen(M.vSub(p, sc)));
ok(rads.every(r => near(r, 3*Math.SQRT2, 1e-4)), `正方形: 中心から4隅まで 3√2 (got ${rads.map(r=>r.toFixed(3)).join(",")})`);
// 隣接する隅同士の距離: 6,6,6,6 (角度ソートして確認)
const sorted = corners.map(p => ({p, a: Math.atan2(p[2]-sc[2], p[0]-sc[0])})).sort((x,y)=>x.a-y.a).map(o=>o.p);
const sqSides = sorted.map((p,i)=>M.vLen(M.vSub(sorted[(i+1)%4],p)));
ok(sqSides.every(l => near(l, 6, 1e-4)), `正方形の辺長がすべて6 (got ${sqSides.map(l=>l.toFixed(3)).join(",")})`);

// ---------- 3. 水位ソルバー (43-3(2)) ----------
// 底面積240, 水840cm3, おもり(10x10x10)x2 を底まで沈める → 11 5/6 cm
const L = M.solveWaterLevel(240, 840, 0, 200, 10);
ok(near(L, 11 + 5/6, 1e-9), `おもり2個沈め水位 = 11.8333… (got ${L})`);
// 途中: おもり底面が水面より上なら水位3.5のまま
const L2 = M.solveWaterLevel(240, 840, 12, 200, 10);
ok(near(L2, 3.5, 1e-9), `おもりが水の外なら 3.5cm (got ${L2})`);
// 半分だけ浸かる位置: wBottom=2 → L = (840+200*(L-2))/240 → 240L=840+200L-400 → L=11? 40L=440 → L=11 >? sub=min(11-2,10)=9 → 240*11=2640 = 840+1800 ✓
const L3 = M.solveWaterLevel(240, 840, 2, 200, 10);
ok(near(L3, 11, 1e-6), `おもり底面2cmの高さ → 水位11cm (got ${L3})`);

console.log(fails === 0 ? "\nALL TESTS PASSED" : `\n${fails} TEST(S) FAILED`);


// ---------- 4. 積み木の切断 (41-6): 3x3x3 を3頂点の平面で切る ----------
{
  const s = 2, N = 3, d = N * s;
  const plane = { n: [1,1,1], d };
  let cut = 0, layer = [0,0,0], belowWhole = 0, aboveWhole = 0;
  for (let i=0;i<N;i++) for (let j=0;j<N;j++) for (let k=0;k<N;k++) {
    const minSum = (i+j+k)*s, maxSum = minSum + 3*s;
    if (minSum < d - 1e-9 && maxSum > d + 1e-9) { cut++; layer[j]++; 
      // 実際に分割して切り口が出ることも確認
      const verts = [
        [i*s,j*s,k*s],[(i+1)*s,j*s,k*s],[(i+1)*s,(j+1)*s,k*s],[i*s,(j+1)*s,k*s],
        [i*s,j*s,(k+1)*s],[(i+1)*s,j*s,(k+1)*s],[(i+1)*s,(j+1)*s,(k+1)*s],[i*s,(j+1)*s,(k+1)*s],
      ];
      const faces = [[0,3,2,1],[4,5,6,7],[0,4,7,3],[1,2,6,5],[0,1,5,4],[3,7,6,2]];
      const r = M.splitPolyhedron(verts, faces, plane);
      if (r.cap.length < 3) { console.log("FAIL  切断キューブなのに切り口なし", i,j,k); fails++; }
    }
    else if (maxSum <= d + 1e-9) belowWhole++;
    else aboveWhole++;
  }
  ok(cut === 9, `切られる小立方体 = 9個 (got ${cut})`);
  ok(layer[0]===5 && layer[1]===3 && layer[2]===1, `段別(下から) 5,3,1 (got ${layer})`);
  ok(belowWhole === 1 && aboveWhole === 17, `丸ごと下側1個・上側17個 (got ${belowWhole},${aboveWhole})`);
}

// ---------- 5. 円すいの展開 (42-1) ----------
{
  const r = 4, l = 10;
  const deg = 360 * r / l;
  ok(near(deg, 144), `中心角 = 144度 (got ${deg})`);
  // 展開後の弧の長さ = 底面の円周
  const psi = 2*Math.PI*r/l;
  ok(near(psi * l, 2*Math.PI*r), "扇形の弧の長さ = 底面の円周");
}

// ---------- 6. 仕切り容器 (44-1) ----------
{
  const level = (60*12 + 90*6) / (60 + 90);
  ok(near(level, 8.4), `仕切りを抜いた後の水面 = 8.4cm (got ${level})`);
}
console.log("EXTRA TESTS DONE");

// ---------- 7. 四角すいの展開 (hingeAlpha汎用化の検証) ----------
{
  // 底面6x6(中心原点・床上), 頂点(0,4,0)。辺x=3側の面を倒すと頂点は(8,0,0)へ(斜面の高さ5)
  const a=[3,0,-3], b=[3,0,3], apex=[0,4,0], cFix=[0,0,0];
  const {axis, alpha} = M.hingeAlpha(a,b,apex,cFix);
  const flat = M.rotAxis(apex, a, axis, alpha);
  ok(near(flat[1],0,1e-9), `展開後の頂点が床に落ちる (y=${flat[1].toFixed(6)})`);
  ok(near(flat[0],8,1e-6) && near(flat[2],0,1e-6), `頂点の展開先=(8,0,0) 斜面の高さ5 (got ${flat.map(x=>x.toFixed(3))})`);
}
console.log("PYRAMID TEST DONE");

// ---------- 8. 速さ: 出会い/追いつき ----------
{
  const meet = 12 / (4 + 6);       // 出会い算
  ok(near(meet, 1.2), `出会いの時刻 = 1.2h (got ${meet})`);
  const catchup = 2 / (6 - 4);     // 追いつき算(差2km, 相対2km/h)
  ok(near(catchup, 1), `追いつきの時刻 = 1h (got ${catchup})`);
}

// ---------- 9. 平面: 点の移動と三角形ABPの面積 ----------
{
  const w = 6, h = 4;
  // Pが辺BC上(高さ y)にいるとき 面積 = w*y/2。Cで最大。
  const areaAtC = w * h / 2;
  ok(near(areaAtC, 12), `三角形ABPの最大面積 = 12 (got ${areaAtC})`);
  // AB上(高さ0)は面積0
  ok(near(w * 0 / 2, 0), "AB上では面積0");
  // CD上(高さhのまま)は一定12
  ok(near(w * h / 2, 12), "CD上では面積12で一定");
}
console.log("2D UNIT TESTS DONE");

// ---------- 10. 割合: 食塩水のてんびん図 ----------
{
  const mix = (4 * 300 + 9 * 200) / (300 + 200);
  ok(near(mix, 6), `混ぜた濃さ = 6% (got ${mix})`);
  ok(near(300 * (mix - 4), 200 * (9 - mix)), "モーメントのつり合い 300×2 = 200×3");
  // 距離の比 2:3 = 重さ 300:200 の逆比
  ok(near((mix - 4) / (9 - mix), 200 / 300), "距離の比 = 重さの逆比");
}
console.log("RATIO TESTS DONE");

// ---------- 11. 文章題: つるかめ算 ----------
{
  const kame = (26 - 2 * 10) / (4 - 2);
  ok(near(kame, 3), `カメ = 3匹 (got ${kame})`);
  const tsuru = 10 - kame;
  ok(near(tsuru * 2 + kame * 4, 26), `検算: 7×2 + 3×4 = 26本 (got ${tsuru * 2 + kame * 4})`);
}
console.log("WORD TESTS DONE");

// ---------- 12. 平面: 正方形の転がり(頂点Aの軌跡) ----------
{
  const a = 4;
  const rot = (p, c, deg) => {
    const r = deg * Math.PI / 180, dx = p[0] - c[0], dy = p[1] - c[1];
    return [c[0] + dx * Math.cos(r) - dy * Math.sin(r), c[1] + dx * Math.sin(r) + dy * Math.cos(r)];
  };
  // A(0,0)を90度ずつ3回転がす(中心は (a,0),(2a,0),(3a,0))
  let A = [0, 0];
  const d0 = Math.hypot(A[0] - a, A[1]);            // 1回目の半径
  A = rot(A, [a, 0], -90);
  ok(near(A[0], a) && near(A[1], a), `1回転後 A=(4,4) (got ${A.map((x) => x.toFixed(3))})`);
  const d1 = Math.hypot(A[0] - 2 * a, A[1]);        // 2回目の半径
  A = rot(A, [2 * a, 0], -90);
  ok(near(A[0], 3 * a) && near(A[1], a), `2回転後 A=(12,4) (got ${A.map((x) => x.toFixed(3))})`);
  const d2 = Math.hypot(A[0] - 3 * a, A[1]);        // 3回目の半径
  A = rot(A, [3 * a, 0], -90);
  ok(near(A[0], 4 * a) && near(A[1], 0, 1e-9), `3回転後 Aは地面(16,0) (got ${A.map((x) => x.toFixed(3))})`);
  ok(near(d0, a) && near(d1, a * Math.SQRT2) && near(d2, a), `半径は 4, 4√2, 4 (got ${[d0, d1, d2].map((x) => x.toFixed(3))})`);
  // 軌跡と直線で囲まれた面積 = πa² + a² (π=3.14 で 66.24)
  const area = 3.14 * a * a / 4 * 2 + 3.14 * (2 * a * a) / 4 + a * a;
  ok(near(area, 66.24), `囲まれた面積 = 66.24cm² (got ${area})`);
}
console.log("ROLLING TESTS DONE");

// ---------- 13. 速さ: 往復と2回目の出会い ----------
{
  const dist = 12, vA = 6, vB = 4;
  // 三角波の位置(builderと同じ式)
  const pos = (v, from, t) => {
    const period = 2 * dist / v;
    const u = t % period;
    const x = u < period / 2 ? v * u : 2 * dist - v * u;
    return from === "Q" ? dist - x : x;
  };
  const t1 = dist / (vA + vB), t2 = (dist * 3) / (vA + vB);
  ok(near(t1, 1.2), `1回目の出会い = 1.2h (got ${t1})`);
  ok(near(t2, 3.6), `2回目の出会い = 3.6h = 1回目の3倍 (got ${t2})`);
  ok(near(pos(vA, "P", t1), pos(vB, "Q", t1)), `t=1.2で位置が一致 (${pos(vA, "P", t1)}km)`);
  ok(near(pos(vA, "P", t2), pos(vB, "Q", t2)), `t=3.6で位置が一致 (${pos(vA, "P", t2)}km)`);
  ok(near(pos(vA, "P", t2), 2.4), `2回目の出会いは2.4km地点 (got ${pos(vA, "P", t2)})`);
}
console.log("ROUND TRIP TESTS DONE");

// ---------- 14. 場合の数: 樹形図(順列) ----------
{
  // builderと同じ列挙で 3! = 6 を確認
  const perms = [];
  (function rec(prefix, rest) {
    if (rest.length === 0) { perms.push(prefix.join("")); return; }
    for (let i = 0; i < rest.length; i++) rec(prefix.concat(rest[i]), rest.slice(0, i).concat(rest.slice(i + 1)));
  })([], ["1", "2", "3"]);
  ok(perms.length === 6, `3枚のならべ方 = 6通り (got ${perms.length})`);
  ok(perms.length === 3 * 2 * 1, "6 = 3×2×1 (かけ算と一致)");
  ok(new Set(perms).size === 6, "重複なし(すべて異なる数)");
  ok(perms[0] === "123" && perms[5] === "321", `辞書順に並ぶ (got ${perms[0]}..${perms[5]})`);
}
console.log("CASES TESTS DONE");

// ---------- 15. 立体: 立方体の展開図(ヒンジ木で全面が床に落ちる) ----------
{
  const h = 3, deg = Math.PI / 180;
  const F = {
    front: [[-h, 0, h], [h, 0, h], [h, 2 * h, h], [-h, 2 * h, h]],
    back:  [[h, 0, -h], [-h, 0, -h], [-h, 2 * h, -h], [h, 2 * h, -h]],
    right: [[h, 0, h], [h, 0, -h], [h, 2 * h, -h], [h, 2 * h, h]],
    left:  [[-h, 0, -h], [-h, 0, h], [-h, 2 * h, h], [-h, 2 * h, -h]],
    top:   [[-h, 2 * h, -h], [h, 2 * h, -h], [h, 2 * h, h], [-h, 2 * h, h]],
  };
  const NETS = {
    cross: {
      front: { parent: null,    anchor: [0, 0, h],      axis: [1, 0, 0], angle: 90 },
      back:  { parent: null,    anchor: [0, 0, -h],     axis: [1, 0, 0], angle: -90 },
      right: { parent: null,    anchor: [h, 0, 0],      axis: [0, 0, 1], angle: -90 },
      left:  { parent: null,    anchor: [-h, 0, 0],     axis: [0, 0, 1], angle: 90 },
      top:   { parent: "front", anchor: [0, 2 * h, h],  axis: [1, 0, 0], angle: 90 },
    },
    stairs: {
      front: { parent: null,    anchor: [0, 0, h],      axis: [1, 0, 0], angle: 90 },
      left:  { parent: "front", anchor: [-h, 0, h],     axis: [0, 1, 0], angle: 90 },
      right: { parent: null,    anchor: [h, 0, 0],      axis: [0, 0, 1], angle: -90 },
      back:  { parent: "right", anchor: [h, 0, -h],     axis: [0, 1, 0], angle: -90 },
      top:   { parent: "back",  anchor: [0, 2 * h, -h], axis: [1, 0, 0], angle: -90 },
    },
  };
  const flatVerts = (net, name) => {
    const chain = [];
    for (let cur = name; cur && net[cur]; cur = net[cur].parent) chain.push(net[cur]);
    return F[name].map((v) => {
      let p = v;
      for (const hg of chain) p = M.rotAxis(p, hg.anchor, hg.axis, hg.angle * deg);
      return p;
    });
  };
  for (const netName of ["cross", "stairs"]) {
    const net = NETS[netName];
    // 全展開で全頂点が床(y=0)に落ちる
    const allFlat = Object.keys(net).every((f) => flatVerts(net, f).every((p) => Math.abs(p[1]) < 1e-9));
    ok(allFlat, `${netName}: 展開後、全ての面が床に落ちる`);
    // 面が重ならない(各面の中心が全て異なるマスに落ちる)
    const cells = Object.keys(net).map((f) => {
      const c = flatVerts(net, f).reduce((s, p) => [s[0] + p[0], 0, s[2] + p[2]], [0, 0, 0]);
      return `${Math.round(c[0] / 4 / h * 2)},${Math.round(c[2] / 4 / h * 2)}`;
    });
    ok(new Set(cells).size === 5, `${netName}: 5つの面が別々のマスに落ちる (got ${cells.join(" / ")})`);
  }
  // 十字型: ふた(top)は前面の先 z=2h..4h? → 中心z = 4h = 12
  const topC = flatVerts(NETS.cross, "top").reduce((s, p) => s + p[2], 0) / 4;
  ok(near(topC, 4 * h), `十字型のふたの中心 z = 12 (got ${topC})`);
  // 階段型: ふたは x=4h の列へ
  const topCX = flatVerts(NETS.stairs, "top").reduce((s, p) => s + p[0], 0) / 4;
  ok(near(topCX, 4 * h), `階段型のふたの中心 x = 12 (got ${topCX})`);
}
console.log("CUBE NET TESTS DONE");

// ---------- 16. 立体: 立方体=3つの合同な四角すい(×1/3の正体) ----------
{
  const s = 6, h = 3;
  const b1 = [-h, 0, -h], b2 = [h, 0, -h], b3 = [h, 0, h], b4 = [-h, 0, h];
  const t2 = [h, s, -h], t3 = [h, s, h], t4 = [-h, s, h];
  const apex = [-h, s, -h];
  // 四角すいの体積 = 底面を2つの三角形に分けた四面体の和
  const tetVol = (a, b, c, d) => {
    const u = M.vSub(b, a), v = M.vSub(c, a), w = M.vSub(d, a);
    return Math.abs(M.vDot(u, M.vCross(v, w))) / 6;
  };
  const pyrVol = (base) => tetVol(base[0], base[1], base[2], apex) + tetVol(base[0], base[2], base[3], apex);
  const v1 = pyrVol([b1, b2, b3, b4]);   // 底面のすい
  const v2 = pyrVol([b4, b3, t3, t4]);   // 前面のすい
  const v3 = pyrVol([b2, b3, t3, t2]);   // 右面のすい
  ok(near(v1, 72) && near(v2, 72) && near(v3, 72), `3つのすいの体積 = 72cm³ずつ (got ${[v1, v2, v3]})`);
  ok(near(v1 + v2 + v3, s * s * s), `3つ合わせて立方体 216cm³ (got ${v1 + v2 + v3})`);
  ok(near(v1, s * s * s / 3), "すい1つ = 立方体の1/3 = 底面積×高さ×1/3");
}
console.log("PYRAMID VOLUME TESTS DONE");

// ---------- 17. 速さ: 流水算・通過算 ----------
{
  // 流水算: 静水8km/h・流れ2km/h・30km
  const down = 30 / (8 + 2), up = 30 / (8 - 2);
  ok(near(down, 3), `下り = 3時間 (got ${down})`);
  ok(near(up, 5), `上り = 5時間 (got ${up})`);
  ok(near((10 + 6) / 2, 8) && near((10 - 6) / 2, 2), "和差算で静水8km/h・流れ2km/hにもどる");
  // 通過算: 200mの列車が600mの橋を秒速20mで
  const pass = (600 + 200) / 20;
  ok(near(pass, 40), `橋の通過 = 40秒 (got ${pass})`);
}
console.log("STREAM/PASS TESTS DONE");

// ---------- 18. v2: なぞり判定(hittest) ----------
{
  const H = require("../src/core/hittest.js");
  // 画面→ワールド変換(yUp両対応)
  const vUp = { ox: 80, oy: 258, scale: 38, yUp: true };
  const p1 = H.screenToWorld(80 + 38 * 2, 258 - 38 * 3, vUp);
  ok(near(p1[0], 2) && near(p1[1], 3), `screenToWorld yUp (got ${p1})`);
  const vDn = { ox: 70, oy: 40, scale: 34, yUp: false };
  const p2 = H.screenToWorld(70 + 34 * 5, 40 + 34 * 2, vDn);
  ok(near(p2[0], 5) && near(p2[1], 2), `screenToWorld yDown (got ${p2})`);
  // rect / poly / seg
  ok(H.pointInShape([5, 3], { kind: "rect", x: 0, y: 2, w: 10, h: 2 }), "rect: 中は true");
  ok(!H.pointInShape([5, 1], { kind: "rect", x: 0, y: 2, w: 10, h: 2 }), "rect: 外は false");
  ok(H.pointInShape([1, 1], { kind: "poly", pts: [[0, 0], [3, 0], [0, 3]] }), "poly: 中は true");
  ok(!H.pointInShape([2.6, 2.6], { kind: "poly", pts: [[0, 0], [3, 0], [0, 3]] }), "poly: 外は false");
  ok(H.pointInShape([3, 0.3], { kind: "seg", a: [0, 0], b: [6, 0], r: 0.5 }), "seg: 近くは true");
  ok(!H.pointInShape([3, 0.8], { kind: "seg", a: [0, 0], b: [6, 0], r: 0.5 }), "seg: 遠くは false");
  // ストローク判定: タップ(1点)と、なぞり(過半数ルール)
  ok(H.strokeHitsShape([[5, 3]], { kind: "rect", x: 0, y: 2, w: 10, h: 2 }), "タップ1点でヒット");
  const trace = [[0,3],[2,3],[4,3],[6,3],[8,3],[10,3],[12,3]]; // 7点中6点が中
  ok(H.strokeHitsShape(trace, { kind: "rect", x: 0, y: 2, w: 10, h: 2 }), "なぞり(過半数)でヒット");
  const miss = [[0,9],[2,9],[4,9],[6,9],[8,3],[10,9],[12,9]];  // 7点中1点だけ中
  ok(!H.strokeHitsShape(miss, { kind: "rect", x: 0, y: 2, w: 10, h: 2 }), "かすっただけではヒットしない");
  // pickRegion: よりよく重なる region を選ぶ
  const regions = [
    { id: "a", shape: { kind: "rect", x: 0, y: 0, w: 10, h: 2 } },
    { id: "b", shape: { kind: "rect", x: 0, y: 2, w: 10, h: 2.6 } },
  ];
  const pick = H.pickRegion([[1, 3], [3, 3], [5, 3], [7, 3.5], [9, 1]], regions);
  ok(pick && pick.id === "b", `pickRegion は b を選ぶ (got ${pick && pick.id})`);
}
console.log("HITTEST TESTS DONE");

// ---------- 最終集計(途中のFAILも拾って非0で終了する) ----------
console.log(fails === 0 ? "\nGEOMETRY: ALL PASSED" : `\nGEOMETRY: ${fails} TEST(S) FAILED`);
process.exit(fails === 0 ? 0 : 1);
