// ==== ビルダー(2D): 点の移動と面積 ====
// 長方形ABCDの周上を点Pが A→B→C→D と動く。三角形ABPの面積が
// どう変わるかを、図形の塗りとグラフで同時に見せる。
//
// params: { w, h }  長方形の横w・縦h。頂点 A(0,0) B(w,0) C(w,h) D(0,h)
//   Pは A→B→C→D の順に周を進む(辺AD上は面積0付近なので今回はA→B→C→Dで一周手前まで)
function buildMovePoint(params) {
  const { w, h } = params;
  const A = [0, 0], B = [w, 0], C = [w, h], D = [0, h];
  // 周の道のり: A→B(長さw) →B→C(長さh) →C→D(長さw)。合計 2w+h
  const total = w + h + w;
  function P(dparam) {           // dparam: 0..total
    if (dparam <= w) return [dparam, 0];                     // AB
    if (dparam <= w + h) return [w, dparam - w];             // BC
    return [w - (dparam - w - h), h];                        // CD
  }
  // 三角形ABPの面積 = AB(=w) × (Pの底辺ABからの高さ) ÷ 2 = w × Py ÷ 2
  function area(dparam) { return w * P(dparam)[1] / 2; }
  const areaMax = w * h / 2;

  return {
    draw(g, st, screen) {
      const d = st.d * total;          // Pの現在位置(道のり)
      const p = P(d);

      // --- 左: 長方形と三角形 ---
      // 長方形
      g.poly([A, B, C, D], { color: C2D.edge, w: 2.5, fill: C2D.solid, fillAlpha: 1 });
      // 三角形ABP(塗り)
      if (st.showTri > 0.01) {
        g.poly([A, B, p], { color: C2D.red, w: 2, fill: C2D.redFill, fillAlpha: 1, alpha: st.showTri });
        // 高さの点線
        g.line(p[0], p[1], p[0], 0, { color: C2D.ghost, dash: [4, 4], w: 1, alpha: st.showTri });
      }
      // 頂点ラベル
      g.text(A[0], A[1], "A", { dx: -12, dy: 12, color: C2D.ink });
      g.text(B[0], B[1], "B", { dx: 12, dy: 12, color: C2D.ink });
      g.text(C[0], C[1], "C", { dx: 12, dy: -12, color: C2D.ink });
      g.text(D[0], D[1], "D", { dx: -12, dy: -12, color: C2D.ink });
      // 動点P
      g.dot(p[0], p[1], { color: C2D.red, rp: 7, ring: true });
      g.badge(p[0], p[1], "P", { dx: 14, dy: -12, bg: C2D.red });

      // --- 右: 面積グラフ(横=道のり / 縦=面積) ---
      if (st.showGraph > 0.01) {
        const gx0 = st.gx0, gy0 = st.gy0, sx = st.gsx, sy = st.gsy;
        // 軸
        g.arrow(gx0, gy0, gx0 + total * sx + 0.8, gy0, { color: C2D.axis, w: 1.5, head: 9 });
        g.arrow(gx0, gy0, gx0, gy0 + areaMax * sy + 1.2, { color: C2D.axis, w: 1.5, head: 9, });
        g.text(gx0 + total * sx + 0.8, gy0, "動いた長さ", { dx: 4, dy: 12, align: "left", color: C2D.axis, size: 11 });
        g.text(gx0, gy0 + areaMax * sy + 1.2, "面積", { dy: -10, color: C2D.axis, size: 11 });
        // 区切り(B,C の位置)
        [w, w + h].forEach((dd) => {
          g.line(gx0 + dd * sx, gy0, gx0 + dd * sx, gy0 + areaMax * sy, { color: C2D.grid, w: 1 });
        });
        g.text(gx0 + w * sx, gy0, "B", { dy: 14, size: 11, color: C2D.axis });
        g.text(gx0 + (w + h) * sx, gy0, "C", { dy: 14, size: 11, color: C2D.axis });
        // 面積の折れ線(0..d)
        const pts = [];
        const NS = 60;
        for (let i = 0; i <= NS; i++) {
          const dd = (i / NS) * d;
          pts.push([gx0 + dd * sx, gy0 + area(dd) * sy]);
        }
        g.path(pts, { color: C2D.red, w: 2.5, alpha: st.showGraph });
        // 現在の面積の点
        g.dot(gx0 + d * sx, gy0 + area(d) * sy, { color: C2D.red, rp: 5, alpha: st.showGraph });
        // 面積の値
        g.text(gx0 + d * sx, gy0 + area(d) * sy, `${area(d).toFixed(0)}cm²`, { dx: 6, dy: -12, align: "left", size: 12, color: C2D.red, alpha: st.showGraph });
      }
    },
  };
}
