// ==== ビルダー(2D): 図形の転がり(正方形) ====
// 1辺aの正方形が直線上をすべらずに転がる。90度ごとに回転中心が
// 右どなりの頂点へ移り、頂点Aは半径のちがう1/4円弧をつないだ軌跡をえがく。
//
// params: { a }  正方形の1辺(cm)
function buildRolling(params) {
  const a = params.a;
  const SQ0 = [[0, 0], [a, 0], [a, a], [0, a]]; // 初期の正方形(Aは[0,0])

  // 点pを中心cのまわりに deg 度回転(反時計回りが正)
  function rotAround(p, c, deg) {
    const r = deg * Math.PI / 180;
    const dx = p[0] - c[0], dy = p[1] - c[1];
    return [c[0] + dx * Math.cos(r) - dy * Math.sin(r),
            c[1] + dx * Math.sin(r) + dy * Math.cos(r)];
  }
  // 合計回転角 theta(0..270度)での点の位置。90度ごとに中心が右へ移る。
  function transform(p, theta) {
    let k = Math.min(2, Math.floor(theta / 90)); // 何回転り終えたか
    const phi = theta - 90 * k;                  // いまの回転の進み
    let q = p;
    for (let j = 0; j < k; j++) q = rotAround(q, [(j + 1) * a, 0], -90);
    return rotAround(q, [(k + 1) * a, 0], -phi);
  }

  return {
    draw(g, st, screen) {
      const theta = st.rot;
      const k = Math.min(2, Math.floor(theta / 90));
      const pivot = [(k + 1) * a, 0];

      // --- 地面 ---
      g.line(-1, 0, 4 * a + 1.5, 0, { color: C2D.edge, w: 2.5 });

      // --- Aの軌跡(0..theta をサンプリング) ---
      const NS = 80;
      const pathPts = [];
      for (let i = 0; i <= NS; i++) pathPts.push(transform(SQ0[0], (i / NS) * theta));

      // 軌跡と直線で囲まれた面積
      if (st.showArea > 0.01 && theta > 1) {
        const region = pathPts.slice();
        region.push([pathPts[pathPts.length - 1][0], 0], [pathPts[0][0], 0]);
        g.poly(region, { color: null, fill: C2D.redFill, fillAlpha: st.showArea });
      }
      if (theta > 0.5) g.path(pathPts, { color: C2D.red, w: 2.5 });

      // --- 正方形(いまの位置) ---
      const sq = SQ0.map((p) => transform(p, theta));
      g.poly(sq, { color: C2D.edge, w: 2.5, fill: C2D.solid, fillAlpha: 0.9 });

      // --- 回転中心と半径 ---
      if (st.showRadius > 0.01 && theta > 0.5 && theta < 269.5) {
        const al = st.showRadius;
        g.dot(pivot[0], pivot[1], { color: C2D.ink, rp: 5, alpha: al });
        g.line(pivot[0], pivot[1], sq[0][0], sq[0][1], { color: C2D.red, w: 1.5, dash: [5, 4], alpha: al });
      }

      // --- 頂点A ---
      g.dot(sq[0][0], sq[0][1], { color: C2D.red, rp: 7, ring: true });
      g.badge(sq[0][0], sq[0][1], "A", { dy: -20, bg: C2D.red });
    },
  };
}
