/* ============================================================
   rittai-anim 幾何コア (THREE非依存・純関数)
   - splitPolyhedron: 凸多面体を平面で2分割し切り口を返す
   - computeUnfold  : 三角すいの展開ヒンジ角を計算
   - solveWaterLevel: おもり沈めの水位を反復計算
   ============================================================ */

// ---- vec utils ([x,y,z]) ----
const vAdd = (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
const vSub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const vScale = (a, s) => [a[0] * s, a[1] * s, a[2] * s];
const vDot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const vCross = (a, b) => [
  a[1] * b[2] - a[2] * b[1],
  a[2] * b[0] - a[0] * b[2],
  a[0] * b[1] - a[1] * b[0],
];
const vLen = (a) => Math.hypot(a[0], a[1], a[2]);
const vNorm = (a) => vScale(a, 1 / vLen(a));
const vLerp = (a, b, t) => [
  a[0] + (b[0] - a[0]) * t,
  a[1] + (b[1] - a[1]) * t,
  a[2] + (b[2] - a[2]) * t,
];

// ---- ロドリゲス回転: point を (origin, axis[単位]) まわりに angle 回転 ----
function rotAxis(p, origin, axis, angle) {
  const v = vSub(p, origin);
  const c = Math.cos(angle), s = Math.sin(angle);
  const term1 = vScale(v, c);
  const term2 = vScale(vCross(axis, v), s);
  const term3 = vScale(axis, vDot(axis, v) * (1 - c));
  return vAdd(origin, vAdd(vAdd(term1, term2), term3));
}

/* ============================================================
   凸多面体の平面分割
   verts: [[x,y,z],...]  faces: 頂点indexのループ(外向き) plane: {n:[..], d}
   戻り値: { below:[面(点配列)…], above:[…], cap:[点…(nに対しCCW)] }
   below = n·x <= d 側
   ============================================================ */
function splitPolyhedron(verts, faces, plane) {
  const EPS = 1e-7;
  const sd = (p) => vDot(plane.n, p) - plane.d;
  const below = [], above = [];
  const capMap = new Map();
  const key = (p) => p.map((x) => Math.round(x * 1e4)).join(",");

  for (const f of faces) {
    const pts = f.map((i) => verts[i]);
    const outB = [], outA = [];
    for (let i = 0; i < pts.length; i++) {
      const a = pts[i], b = pts[(i + 1) % pts.length];
      const da = sd(a), db = sd(b);
      if (da <= EPS) outB.push(a);
      if (da >= -EPS) outA.push(a);
      if (Math.abs(da) <= EPS) capMap.set(key(a), a); // 平面上の頂点も切り口に含める
      if ((da < -EPS && db > EPS) || (da > EPS && db < -EPS)) {
        const t = da / (da - db);
        const p = vLerp(a, b, t);
        outB.push(p); outA.push(p);
        capMap.set(key(p), p);
      }
    }
    if (outB.length >= 3) below.push(outB);
    if (outA.length >= 3) above.push(outA);
  }

  // 切り口の点を平面内で角度ソート (nに対してCCW)
  const capPts = [...capMap.values()];
  let cap = [];
  if (capPts.length >= 3) {
    const c = capPts.reduce((s, p) => vAdd(s, p), [0, 0, 0]).map((x) => x / capPts.length);
    const n = vNorm(plane.n);
    let u = vCross(n, Math.abs(n[0]) < 0.9 ? [1, 0, 0] : [0, 1, 0]);
    u = vNorm(u);
    const v = vCross(n, u);
    cap = capPts
      .map((p) => {
        const r = vSub(p, c);
        return { p, ang: Math.atan2(vDot(r, v), vDot(r, u)) };
      })
      .sort((a, b) => a.ang - b.ang)
      .map((o) => o.p);
  }
  return { below, above, cap };
}


/* 汎用ヒンジ角: 床上のヒンジ辺(a-b)を軸に、点p0(床の上方)を
   固定領域の重心cFixと反対側へ倒して床に落とす回転角を返す */
function hingeAlpha(a, b, p0, cFix) {
  const axis = vNorm(vSub(b, a));
  let dir = vSub(vScale(vAdd(a, b), 0.5), cFix);
  dir = vSub(dir, vScale(axis, vDot(dir, axis)));
  dir[1] = 0;
  const d = vNorm(dir);
  let q = vSub(p0, a);
  q = vSub(q, vScale(axis, vDot(q, axis)));
  const qn = vNorm(q);
  const cr = vCross(qn, d);
  return { axis, alpha: Math.atan2(vDot(cr, axis), vDot(qn, d)) };
}

/* ============================================================
   三角すい O-PQR の展開計算
   面 fixedFace を床(y=0)に固定し、残り3面をヒンジで開く。
   solid: {verts:{name:[x,y,z]}, faces:[ [names...] ], fixed:"OQR面のname配列"}
   戻り値: {
     T,                    // 変換後の頂点座標 {name:[x,y,z]}
     moving: [{names:[a,b,apex], a,b,p0, axis, alpha}],  // ヒンジ情報
     flat:   [apexの展開後座標,...],
     center                // シーン中心(カメラ用)
   }
   ============================================================ */
function computeUnfold(vertsIn, fixedNames, movingDefs) {
  // fixedNames = [n0,n1,n2]: 床に置く面 / movingDefs = [{hinge:[a,b], apex:c}, ...]
  const O = vertsIn[fixedNames[0]], Q = vertsIn[fixedNames[1]], R = vertsIn[fixedNames[2]];
  // 面の法線。頂点(apex)側が +y になるよう符号調整
  let n = vNorm(vCross(vSub(Q, O), vSub(R, O)));
  const anyApex = vertsIn[movingDefs[0].apex];
  if (vDot(vSub(anyApex, O), n) < 0) n = vScale(n, -1);
  const origin = Q;
  const xhat = vNorm(vSub(R, Q));
  const yhat = n;
  const zhat = vCross(xhat, yhat);
  const toWorld = (p) => {
    const d = vSub(p, origin);
    return [vDot(d, xhat), vDot(d, yhat), vDot(d, zhat)];
  };
  const T = {};
  for (const k in vertsIn) T[k] = toWorld(vertsIn[k]);

  // 固定面の重心 (床上)
  const cFix = vScale(vAdd(vAdd(T[fixedNames[0]], T[fixedNames[1]]), T[fixedNames[2]]), 1 / 3);

  const moving = movingDefs.map((def) => {
    const a = T[def.hinge[0]], b = T[def.hinge[1]], p0 = T[def.apex];
    const axis = vNorm(vSub(b, a));
    // 開く方向 d: ヒンジ中点から固定面重心と逆向き・軸に垂直な床方向
    let dir = vSub(vScale(vAdd(a, b), 0.5), cFix);
    dir = vSub(dir, vScale(axis, vDot(dir, axis)));
    dir[1] = 0;
    const d = vNorm(dir);
    // 現在のapex位置の軸垂直成分 q
    let q = vSub(p0, a);
    q = vSub(q, vScale(axis, vDot(q, axis)));
    const qn = vNorm(q);
    const cr = vCross(qn, d);
    const alpha = Math.atan2(vDot(cr, axis), vDot(qn, d));
    return { names: [...def.hinge, def.apex], a, b, p0, axis, alpha };
  });

  const flat = moving.map((m) => rotAxis(m.p0, m.a, m.axis, m.alpha));

  // シーン中心: 展開後の全点のバウンディング中心
  const all = [T[fixedNames[0]], T[fixedNames[1]], T[fixedNames[2]], ...flat];
  const mn = [Infinity, Infinity, Infinity], mx = [-Infinity, -Infinity, -Infinity];
  for (const p of all) for (let i = 0; i < 3; i++) { mn[i] = Math.min(mn[i], p[i]); mx[i] = Math.max(mx[i], p[i]); }
  const center = vScale(vAdd(mn, mx), 0.5);

  return { T, moving, flat, center };
}

/* ============================================================
   水位ソルバー
   baseArea: 容器底面積, waterVol: 水の体積,
   wBottom: おもり底面の高さ, wArea: おもり底面積の和, wHeight: おもりの高さ
   容器の水位 L を  baseArea*L = waterVol + wArea*clamp(L - wBottom, 0, wHeight)
   の不動点反復で解く
   ============================================================ */
function solveWaterLevel(baseArea, waterVol, wBottom, wArea, wHeight) {
  // 場合分けで厳密に解く(区分線形)
  const L0 = waterVol / baseArea;                              // 全く浸からない
  if (L0 <= wBottom) return L0;
  const Lfull = (waterVol + wArea * wHeight) / baseArea;       // 完全に沈む
  if (Lfull >= wBottom + wHeight) return Lfull;
  return (waterVol - wArea * wBottom) / (baseArea - wArea);    // 一部だけ浸かる
}

if (typeof module !== "undefined") {
  module.exports = { hingeAlpha, vAdd, vSub, vScale, vDot, vCross, vLen, vNorm, vLerp, rotAxis, splitPolyhedron, computeUnfold, solveWaterLevel };
}
