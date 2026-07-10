// ==== ビルダー(2D): 食塩水のてんびん図 ====
// 濃さの数直線に、食塩水を「重さのおもり」としてぶら下げ、
// つり合う支点の位置 = 混ぜてできる濃さ、を見せる。
//
// params:
//   a: { c, w }  食塩水A(濃さ%, 重さg)
//   b: { c, w }  食塩水B
//   mix        : 混ぜた濃さ(事前計算して渡す)
function buildSaltBalance(params) {
  const A = params.a, B = params.b, mix = params.mix;
  const cMin = Math.floor(Math.min(A.c, B.c)) - 2;
  const cMax = Math.ceil(Math.max(A.c, B.c)) + 2;

  return {
    draw(g, st, screen) {
      const beamY = st.beamY;
      const fx = st.fx;
      const tilt = (st.tilt || 0) * Math.PI / 180;

      // --- 濃さの数直線 ---
      g.arrow(cMin, 0, cMax + 0.6, 0, { color: C2D.axis, w: 1.5, head: 9 });
      g.text(cMax + 0.6, 0, "濃さ(%)", { dx: 8, dy: 14, align: "left", size: 11, color: C2D.axis });
      for (let c = cMin; c <= cMax; c++) {
        g.line(c, 0, c, 0.12, { color: C2D.axis, w: 1 });
        g.text(c, -0.38, `${c}`, { size: 11, weight: "normal", color: C2D.axis });
      }
      // A,Bの濃さの位置
      [A, B].forEach((s) => {
        g.dot(s.c, 0, { color: C2D.ink, rp: 4 });
        g.text(s.c, -0.95, `${s.c}%`, { size: 13, color: C2D.ink });
      });

      // --- てんびん(支点を中心に tilt 回転) ---
      if (st.showBeam > 0.01) {
        const al = st.showBeam;
        // 支点(三角形)と、支点位置を数直線へ落とす点線
        g.poly([[fx, beamY], [fx - 0.28, beamY - 0.55], [fx + 0.28, beamY - 0.55]],
          { color: C2D.edge, w: 2, fill: C2D.solid2, fillAlpha: al, alpha: al });
        g.line(fx, beamY - 0.55, fx, 0, { color: C2D.ghost, dash: [4, 4], w: 1, alpha: al });

        // 棒
        const end = (c) => {
          const dx = c - fx;
          return [fx + dx * Math.cos(tilt), beamY + dx * Math.sin(tilt)];
        };
        const eA = end(A.c), eB = end(B.c);
        g.line(eA[0], eA[1], eB[0], eB[1], { color: C2D.edge, w: 4, alpha: al });

        // おもり(重さに比例した水色の箱)をぶら下げる
        const box = (e, wgt) => {
          const bw = 0.55 + wgt / 400;
          const bh = 0.45 + wgt / 700;
          const topY = e[1] - 0.18;
          g.line(e[0], e[1], e[0], topY, { color: C2D.edge, w: 1.5, alpha: al });
          g.poly([[e[0] - bw / 2, topY], [e[0] + bw / 2, topY],
                  [e[0] + bw / 2, topY - bh], [e[0] - bw / 2, topY - bh]],
            { color: C2D.edge, w: 2, fill: C2D.waterFill, fillAlpha: al, alpha: al });
          g.text(e[0], topY - bh / 2, `${wgt}g`, { size: 12, color: C2D.ink, alpha: al });
        };
        box(eA, A.w);
        box(eB, B.w);
      }

      // 支点の位置 = 答えの濃さ
      if (st.showFx > 0.01) {
        g.dot(fx, 0, { color: C2D.red, rp: 5, alpha: st.showFx });
        g.text(fx, -0.95, st.showAns > 0.5 ? `${mix}%` : "?", { size: 15, color: C2D.red, alpha: st.showFx });
      }

      // 距離の比(重さの逆比)
      if (st.showRatio > 0.01) {
        const ry = beamY + 0.55;
        const seg = (x0, x1, label) => {
          g.arrow(x0, ry, x1, ry, { color: C2D.red, w: 2, head: 8, alpha: st.showRatio });
          g.arrow(x1, ry, x0, ry, { color: C2D.red, w: 2, head: 8, alpha: st.showRatio });
          g.text((x0 + x1) / 2, ry + 0.42, label, { size: 14, color: C2D.red, alpha: st.showRatio });
        };
        seg(A.c, mix, `${mix - A.c}`);
        seg(mix, B.c, `${B.c - mix}`);
      }
    },
  };
}
