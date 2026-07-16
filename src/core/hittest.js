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
  if (!Array.isArray(p) || p.length < 2 || !shape || !Number.isFinite(p[0]) || !Number.isFinite(p[1])) return false;
  if (shape.kind === "rect") {
    const x0 = Math.min(shape.x, shape.x + shape.w), x1 = Math.max(shape.x, shape.x + shape.w);
    const y0 = Math.min(shape.y, shape.y + shape.h), y1 = Math.max(shape.y, shape.y + shape.h);
    return p[0] >= x0 && p[0] <= x1 && p[1] >= y0 && p[1] <= y1;
  }
  if (shape.kind === "poly") {
    // ray casting
    const pts = shape.pts;
    if (!Array.isArray(pts) || pts.length < 3) return false;
    let inside = false;
    for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
      const xi = pts[i][0], yi = pts[i][1], xj = pts[j][0], yj = pts[j][1];
      if (distToSeg(p, pts[j], pts[i]) <= 1e-9) return true; // 辺上も領域に含める
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

function shapeSampleStep(shape) {
  let span = 1;
  if (shape.kind === "rect") span = Math.min(Math.abs(shape.w), Math.abs(shape.h));
  else if (shape.kind === "poly" && Array.isArray(shape.pts) && shape.pts.length) {
    const xs = shape.pts.map((p) => p[0]), ys = shape.pts.map((p) => p[1]);
    span = Math.min(Math.max(...xs) - Math.min(...xs), Math.max(...ys) - Math.min(...ys));
  } else if (shape.kind === "seg") span = Math.max((shape.r || 0.5) * 2, 0.1);
  return Math.max((Number.isFinite(span) && span > 0 ? span : 1) / 8, 0.02);
}

// PointerEvent の発生頻度に左右されないよう、軌跡を等間隔に再サンプリングする。
// 戻り値は軌跡のうち shape 内にある長さの近似割合。
function strokeHitScore(strokePts, shape) {
  if (!Array.isArray(strokePts) || !strokePts.length) return 0;
  if (strokePts.length === 1) return pointInShape(strokePts[0], shape) ? 1 : 0;
  const step = shapeSampleStep(shape);
  let insideLength = 0, totalLength = 0;
  for (let i = 1; i < strokePts.length; i++) {
    const a = strokePts[i - 1], b = strokePts[i];
    const len = Math.hypot(b[0] - a[0], b[1] - a[1]);
    if (!Number.isFinite(len) || len <= 1e-9) continue;
    const n = Math.min(256, Math.max(1, Math.ceil(len / step)));
    const piece = len / n;
    for (let j = 0; j < n; j++) {
      const t = (j + 0.5) / n;
      if (pointInShape([a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t], shape)) insideLength += piece;
    }
    totalLength += len;
  }
  // 指がほぼ動かなかった場合はタップとして扱う。
  if (totalLength <= 1e-9) return strokePts.some((p) => pointInShape(p, shape)) ? 1 : 0;
  return insideLength / totalLength;
}

// ストローク(ワールド座標の点列)が region にヒットしたか。
// タップは中ならヒット。なぞりは軌跡の過半が中ならヒット。
function strokeHitsShape(strokePts, shape) {
  return strokeHitScore(strokePts, shape) >= 0.5;
}

// ストロークに最もよくヒットする region を1つ返す(なければ null)
function pickRegion(strokePts, regions) {
  let best = null, bestScore = 0;
  for (const r of regions) {
    const score = strokeHitScore(strokePts, r.shape);
    if (score < 0.5) continue;
    if (score > bestScore) { best = r; bestScore = score; }
  }
  return best;
}

// node(テスト)用エクスポート
if (typeof module !== "undefined" && module.exports) {
  module.exports = { screenToWorld, pointInShape, distToSeg, strokeHitScore, strokeHitsShape, pickRegion };
}
