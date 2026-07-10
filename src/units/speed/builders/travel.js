// ==== ビルダー(2D): 旅人算のダイヤグラム ====
// 上に「道(横一直線)」を置いて2人を動かし、下に距離-時間グラフを同時に描く。
// 状態 st.t(0→1)を「時刻の進み」に対応させ、出会い/追いつきの瞬間を可視化する。
//
// params:
//   dist    : 2地点間の距離(km)
//   tMax    : グラフに描く最大時間(時間)
//   a: { name, x0, v }  A(位置x0から速さv)   v>0 で右へ
//   b: { name, x0, v }  B
//   meetT   : 出会い/追いつきの時刻(事前計算して渡す。null可)
function buildTravel(params) {
  const { dist, tMax } = params;
  const A = params.a, B = params.b;
  const posA = (t) => A.x0 + A.v * t;
  const posB = (t) => B.x0 + B.v * t;

  // レイアウト(ワールド座標): 道は y=roadY の横線、グラフは左下原点
  // ワールドx = 距離(km), ワールドy: 道の表示帯は上、グラフは時間軸(縦)…
  // 2Dは1つのビューに収めるため、道とグラフを別々のワールド領域に配置する。
  // 道:   x∈[0,dist], y = roadY(固定)
  // グラフ:原点(gx0,gy0)、横=距離(x, 0..dist)、縦=時間(t, 0..tMax) を上向きに
  return {
    draw(g, st, screen) {
      const t = st.t * tMax;                 // 現在時刻
      const roadY = st.roadY;
      const gx0 = 0, gy0 = st.graphBase;     // グラフ原点(距離0・時刻0)
      const tScale = st.tScale;              // 時間1 = 距離いくつ分の高さ

      // --- 道(上) ---
      g.line(0, roadY, dist, roadY, { color: C2D.edge, w: 3 });
      g.text(0, roadY, "P", { dy: -18, color: C2D.ink });
      g.text(dist, roadY, "Q", { dy: -18, color: C2D.ink });
      for (let k = 0; k <= dist; k += st.tick || dist) {
        g.line(k, roadY, k, roadY, {});
      }

      // 動く2人(道の上)
      const ax = Math.max(0, Math.min(dist, posA(t)));
      const bx = Math.max(0, Math.min(dist, posB(t)));
      g.dot(ax, roadY, { color: C2D.red, rp: 7, ring: true });
      g.badge(ax, roadY, A.name, { dy: 22, bg: C2D.red });
      g.dot(bx, roadY, { color: C2D.blue, rp: 7, ring: true });
      g.badge(bx, roadY, B.name, { dy: -26, bg: C2D.blue });

      // --- グラフ(下): 横軸=距離 / 縦軸=時間 ---
      const gyTop = gy0 + tMax * tScale;
      // 軸
      g.arrow(gx0, gy0, dist + 0.6, gy0, { color: C2D.axis, w: 1.5, head: 9 });      // 距離軸(右)
      g.arrow(gx0, gy0, gx0, gyTop + 0.6, { color: C2D.axis, w: 1.5, head: 9 });     // 時間軸(上)…yUp=falseなので下で加算=画面下方向。座標系はyUp想定でtScale負で調整
      g.text(dist + 0.6, gy0, "距離", { dx: 6, align: "left", color: C2D.axis, size: 12 });
      g.text(gx0, gyTop + 0.6, "時間", { dy: -10, color: C2D.axis, size: 12 });
      // 目盛り
      for (let k = 0; k <= dist; k += st.gridX || 1) {
        g.line(k, gy0, k, gy0 + 0.12, { color: C2D.axis, w: 1 });
      }
      for (let h = 0; h <= tMax + 1e-9; h += st.gridT || 1) {
        const yy = gy0 + h * tScale;
        g.line(gx0, yy, gx0 - 0.12, yy, { color: C2D.axis, w: 1 });
        g.text(gx0 - 0.2, yy, `${h}`, { align: "right", size: 11, weight: "normal", color: C2D.axis });
      }

      // A,Bの線(時刻0..t まで描く = 進むほど伸びる)
      const gp = (who, tt) => {
        const x = Math.max(0, Math.min(dist, who === "a" ? posA(tt) : posB(tt)));
        return [x, gy0 + tt * tScale];
      };
      const drawGraphLine = (who, color) => {
        const pts = [];
        const NS = 40;
        for (let i = 0; i <= NS; i++) pts.push(gp(who, (i / NS) * t));
        g.path(pts, { color, w: 2.5 });
      };
      if (st.showGraph > 0.01) {
        ctxAlpha(g, st.showGraph, () => {
          drawGraphLine("a", C2D.red);
          drawGraphLine("b", C2D.blue);
        });
      }

      // 出会い/追いつきの点
      if (params.meetT != null && st.showMeet > 0.01 && t >= params.meetT - 1e-9) {
        const mx = posA(params.meetT);
        // 道の上
        g.dot(mx, roadY, { color: C2D.ink, rp: 6, alpha: st.showMeet });
        // グラフの交点
        const my = gy0 + params.meetT * tScale;
        g.dot(mx, my, { color: C2D.ink, rp: 6, alpha: st.showMeet });
        g.line(mx, gy0, mx, my, { color: C2D.ghost, dash: [4, 4], w: 1, alpha: st.showMeet });
        g.line(gx0, my, mx, my, { color: C2D.ghost, dash: [4, 4], w: 1, alpha: st.showMeet });
        g.text(mx, my, st.meetLabel || "出会い", { dy: -14, color: C2D.ink, size: 13, alpha: st.showMeet });
      }
    },
  };
}

// 透明度をまとめてかけるヘルパー(G はステートレスなので簡易に)
function ctxAlpha(g, a, fn) { fn(); }
