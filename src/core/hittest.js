// ==== なぞり判定(純関数)。quizモードの region ヒットテスト ====
// すべてワールド座標で判定する。座標変換(画面→ワールド)もここに置く。
// エンジン非依存・DOM非依存なので node のテストでそのまま検証できる。
"use strict";

// 画面ピクセル → ワールド座標(canvas2d の makeG と逆変換)
function screenToWorld(px, py, view) {
  const x = (px - view.ox) / view.scale;
  const y = view.yUp ? (view.oy - py) / view.scale : (py - view.oy) / view.scale;
  return [x, y];
}

// 点が region の shape に含まれるか
// shape: { kind:"rect", x,y,w,h } … x..x+w, y..y+h(向きは数値としてのみ扱う)
//        { kind:"poly", pts:[[x,y],...] }
//        { kind:"seg",  a:[x,y], b:[x,y], r }  … 線分から距離r以内
function pointInShape(p, shape) {
  if (shape.kind === "rect") {
    const x0 = Math.min(shape.x, shape.x + shape.w), x1 = Math.max(shape.x, shape.x + shape.w);
    const y0 = Math.min(shape.y, shape.y + shape.h), y1 = Math.max(shape.y, shape.y + shape.h);
    return p[0] >= x0 && p[0] <= x1 && p[1] >= y0 && p[1] <= y1;
  }
  if (shape.kind === "poly") {
    // ray casting
    const pts = shape.pts;
    let inside = false;
    for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
      const xi = pts[i][0], yi = pts[i][1], xj = pts[j][0], yj = pts[j][1];
      if ((yi > p[1]) !== (yj > p[1]) && p[0] < ((xj - xi) * (p[1] - yi)) / (yj - yi) + xi) inside = !inside;
    }
    return inside;
  }
  if (shape.kind === "seg") {
    return distToSeg(p, shape.a, shape.b) <= (shape.r || 0.5);
  }
  return false;
}

function distToSeg(p, a, b) {
  const vx = b[0] - a[0], vy = b[1] - a[1];
  const wx = p[0] - a[0], wy = p[1] - a[1];
  const c1 = vx * wx + vy * wy;
  if (c1 <= 0) return Math.hypot(wx, wy);
  const c2 = vx * vx + vy * vy;
  if (c2 <= c1) return Math.hypot(p[0] - b[0], p[1] - b[1]);
  const t = c1 / c2;
  return Math.hypot(p[0] - (a[0] + t * vx), p[1] - (a[1] + t * vy));
}

// ストローク(ワールド座標の点列)が region にヒットしたか。
// タップ(点数が少ない)は1点でも中ならヒット。なぞりは過半数の点が中ならヒット。
function strokeHitsShape(strokePts, shape) {
  if (!strokePts.length) return false;
  let inside = 0;
  for (const p of strokePts) if (pointInShape(p, shape)) inside++;
  if (strokePts.length <= 4) return inside >= 1;      // タップ
  return inside / strokePts.length >= 0.5;            // なぞり
}

// ストロークに最もよくヒットする region を1つ返す(なければ null)
function pickRegion(strokePts, regions) {
  let best = null, bestScore = 0;
  for (const r of regions) {
    if (!strokeHitsShape(strokePts, r.shape)) continue;
    let inside = 0;
    for (const p of strokePts) if (pointInShape(p, r.shape)) inside++;
    const score = inside / strokePts.length;
    if (score > bestScore) { best = r; bestScore = score; }
  }
  return best;
}

// node(テスト)用エクスポート
if (typeof module !== "undefined" && module.exports) {
  module.exports = { screenToWorld, pointInShape, distToSeg, strokeHitsShape, pickRegion };
}
