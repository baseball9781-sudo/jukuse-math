// ==== ビルダー(2D): 流水算(川の上り下り) ====
// 上に川と船、下にダイヤグラム。下りは「静水速+流速」、上りは「静水速−流速」で
// グラフの傾きが変わることを見せる。
//
// params:
//   dist  : 川の区間の長さ(km)
//   still : 静水での速さ(km/h)
//   cur   : 流れの速さ(km/h)
//   tDown : 下りにかかる時間(h)   tUp: 上りにかかる時間(h) (事前計算)
function buildStream(params) {
  const { dist, still, cur, tDown, tUp } = params;
  const vDown = still + cur, vUp = still - cur;
  const tAll = tDown + tUp;
  // 船の位置(0..dist)。t: 0..tAll。下り→上り。
  const pos = (t) => (t <= tDown ? vDown * t : Math.max(0, dist - vUp * (t - tDown)));

  return {
    draw(g, st, screen) {
      const t = st.t * tAll;
      const riverY = st.riverY;           // 川の帯の下端
      const xs = st.xScale;               // グラフ: 1h = ワールド何単位
      const ds = st.dScale;               // グラフ: 1km = ワールド何単位

      // --- 川(上・横帯)。A(上流,左)→B(下流,右) ---
      g.poly([[0, riverY], [dist * st.rs, riverY], [dist * st.rs, riverY + 1.2], [0, riverY + 1.2]],
        { color: null, fill: C2D.waterFill, fillAlpha: 0.55 });
      g.text(0, riverY + 1.8, "A(上流)", { align: "left", dx: -10, size: 12, color: C2D.ink });
      g.text(dist * st.rs, riverY + 1.8, "B(下流)", { align: "right", dx: 10, size: 12, color: C2D.ink });
      // 流れの矢印(左→右)
      for (let i = 0; i < 3; i++) {
        const ax = dist * st.rs * (0.18 + 0.3 * i);
        g.arrow(ax, riverY + 0.6, ax + 1.2, riverY + 0.6, { color: C2D.water, w: 2, head: 7 });
      }
      g.text(dist * st.rs * 0.5, riverY - 0.45, `流れ 時速${cur}km`, { size: 11, color: C2D.water });

      // 船(丸)と向き
      const bx = pos(t) * st.rs;
      const goingDown = t <= tDown;
      g.dot(bx, riverY + 0.6, { color: C2D.red, rp: 8, ring: true });
      g.badge(bx, riverY + 0.6, "船", { dy: -24, bg: C2D.red });

      // 速さの合成(矢印の足し算/引き算)
      if (st.showArrows > 0.01) {
        const al = st.showArrows, ay = riverY + 2.4;
        const u = 0.28; // 1km/h = 0.28ワールド
        g.text(0, ay + 0.85, goingDown ? "下り = 静水の速さ + 流れ" : "上り = 静水の速さ − 流れ", { align: "left", dx: -10, size: 13, color: C2D.ink, alpha: al });
        // 静水の速さ(黒)
        g.arrow(0, ay, still * u * (goingDown ? 1 : -1) + 0, ay, { color: C2D.ink, w: 3, head: 9, alpha: al });
        // 流れ(青): 下りは同じ向き、上りは逆向き
        const fx0 = still * u * (goingDown ? 1 : -1);
        g.arrow(fx0, ay, fx0 + cur * u, ay, { color: C2D.water, w: 3, head: 9, alpha: al });
        g.text((goingDown ? (still + cur) : -(still - cur)) * u / 2, ay - 0.55,
          goingDown ? `${still}+${cur}=${vDown}km/h` : `${still}−${cur}=${vUp}km/h`,
          { size: 12, color: C2D.red, alpha: al });
      }

      // --- ダイヤグラム(下): 横=時間 / 縦=距離(Aから) ---
      if (st.showGraph > 0.01) {
        const al = st.showGraph, gy = st.graphY;
        g.arrow(0, gy, tAll * xs + 0.7, gy, { color: C2D.axis, w: 1.5, head: 9, alpha: al });
        g.arrow(0, gy, 0, gy + dist * ds + 0.8, { color: C2D.axis, w: 1.5, head: 9, alpha: al });
        g.text(tAll * xs + 0.7, gy, "時間", { dx: 6, dy: 12, align: "left", size: 11, color: C2D.axis, alpha: al });
        g.text(0, gy + dist * ds + 0.8, "距離", { dy: -10, size: 11, color: C2D.axis, alpha: al });
        for (let hh = 1; hh <= tAll + 1e-9; hh++) {
          g.line(hh * xs, gy, hh * xs, gy + 0.12, { color: C2D.axis, w: 1, alpha: al });
          g.text(hh * xs, gy - 0.5, `${hh}`, { size: 10, weight: "normal", color: C2D.axis, alpha: al });
        }
        g.line(0, gy + dist * ds, tAll * xs, gy + dist * ds, { color: C2D.grid, w: 1, dash: [4, 4], alpha: al });
        g.text(-0.25, gy + dist * ds, "B", { align: "right", size: 11, weight: "normal", color: C2D.axis, alpha: al });
        // 折れ線(0..t)
        const NS = 80, pts = [];
        for (let i = 0; i <= NS; i++) {
          const tt = (i / NS) * t;
          pts.push([tt * xs, gy + pos(tt) * ds]);
        }
        g.path(pts, { color: C2D.red, w: 2.5, alpha: al });
        g.dot(t * xs, gy + pos(t) * ds, { color: C2D.red, rp: 5, alpha: al });
      }
    },
  };
}
