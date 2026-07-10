// ==== ビルダー(2D): 往復のダイヤグラム ====
// 縦=距離(PからQ)、横=時間。2人がPQ間を往復し、折れ線(山型)の交点が出会い。
// 左に縦の「道」を置いて2人を動かし、右のダイヤグラムと連動させる。
//
// params:
//   dist  : PQ間の距離(km)
//   tMax  : 描く最大時間(h)
//   a: { name, v, from } from:"P"ならPから、"Q"ならQから出発して往復
//   b: { name, v, from }
//   meets : [{ t, d, label }] 出会いの時刻と位置(事前計算して渡す)
function buildTravelRound(params) {
  const { dist, tMax } = params;
  // 往復の位置(三角波)。from"P": 0→dist→0→…, from"Q": dist→0→dist→…
  function pos(who, t) {
    const period = 2 * dist / who.v;
    let u = t % period;
    if (u < 0) u += period;
    const x = u < period / 2 ? who.v * u : 2 * dist - who.v * u;
    return who.from === "Q" ? dist - x : x;
  }

  return {
    draw(g, st, screen) {
      const t = st.t * tMax;
      const xs = st.xScale;      // 時間1h = ワールド何単位
      const roadX = -1.6;        // 縦の道のx位置
      const A = params.a, B = params.b;

      // --- 道(左・縦) ---
      g.line(roadX, 0, roadX, dist, { color: C2D.edge, w: 3 });
      g.text(roadX, 0, "P", { dx: -16, color: C2D.ink });
      g.text(roadX, dist, "Q", { dx: -16, color: C2D.ink });
      const ay = pos(A, t), by = pos(B, t);
      g.dot(roadX, ay, { color: C2D.red, rp: 7, ring: true });
      g.badge(roadX, ay, A.name, { dx: -28, bg: C2D.red });
      g.dot(roadX, by, { color: C2D.blue, rp: 7, ring: true });
      g.badge(roadX, by, B.name, { dx: 28, bg: C2D.blue });

      // --- ダイヤグラム(横=時間・縦=距離) ---
      g.arrow(0, 0, tMax * xs + 0.8, 0, { color: C2D.axis, w: 1.5, head: 9 });
      g.arrow(0, 0, 0, dist + 1.2, { color: C2D.axis, w: 1.5, head: 9 });
      g.text(tMax * xs + 0.8, 0, "時間", { dx: 6, dy: 12, align: "left", size: 11, color: C2D.axis });
      g.text(0, dist + 1.2, "距離", { dy: -10, size: 11, color: C2D.axis });
      for (let h = 1; h <= tMax + 1e-9; h++) {
        g.line(h * xs, 0, h * xs, 0.18, { color: C2D.axis, w: 1 });
        g.text(h * xs, -0.7, `${h}`, { size: 11, weight: "normal", color: C2D.axis });
      }
      [0, dist].forEach((d) => {
        g.line(0, d, -0.15, d, { color: C2D.axis, w: 1 });
        g.text(-0.3, d, d === 0 ? "P" : "Q", { align: "right", size: 12, weight: "normal", color: C2D.axis });
      });
      g.line(0, dist, tMax * xs, dist, { color: C2D.grid, w: 1, dash: [4, 4] });

      // 2人の折れ線(0..t)
      if (st.showGraph > 0.01) {
        const NS = 120;
        const mk = (who) => {
          const pts = [];
          for (let i = 0; i <= NS; i++) {
            const tt = (i / NS) * t;
            pts.push([tt * xs, pos(who, tt)]);
          }
          return pts;
        };
        g.path(mk(A), { color: C2D.red, w: 2.5, alpha: st.showGraph });
        g.path(mk(B), { color: C2D.blue, w: 2.5, alpha: st.showGraph });
      }

      // 出会いの点
      (params.meets || []).forEach((m, i) => {
        const show = st[`showMeet${i + 1}`] || 0;
        if (show < 0.01 || t < m.t - 1e-9) return;
        g.dot(m.t * xs, m.d, { color: C2D.ink, rp: 6, alpha: show });
        g.line(m.t * xs, 0, m.t * xs, m.d, { color: C2D.ghost, dash: [4, 4], w: 1, alpha: show });
        g.line(0, m.d, m.t * xs, m.d, { color: C2D.ghost, dash: [4, 4], w: 1, alpha: show });
        g.text(m.t * xs, m.d, m.label, { dy: -14, size: 13, color: C2D.ink, alpha: show });
        g.dot(roadX, m.d, { color: C2D.ink, rp: 5, alpha: show * 0.7 });
      });
    },
  };
}
