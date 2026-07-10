// ==== ビルダー(2D): つるかめ算の面積図 ====
// 横=匹数、縦=1匹の足の本数 の長方形で「足の合計=面積」と見る。
// 全部ツルと仮定した面積に、カメへの交換で足りない分を積み増す。
//
// params:
//   total   : 合計の匹数
//   legsA   : ツルの足(少ないほう)
//   legsB   : カメの足(多いほう)
//   legsSum : 足の合計
//   ansB    : カメの数(事前計算して渡す)
function buildTurtleCrane(params) {
  const { total, legsA, legsB, legsSum, ansB } = params;

  return {
    draw(g, st, screen) {
      const k = st.k; // カメに交換した数(0..ansB, 連続)

      // --- 軸 ---
      g.arrow(0, 0, total + 1.2, 0, { color: C2D.axis, w: 1.5, head: 9 });
      g.arrow(0, 0, 0, legsB + 1.4, { color: C2D.axis, w: 1.5, head: 9 });
      g.text(total + 1.2, 0, "匹数", { dx: 6, dy: 14, align: "left", size: 11, color: C2D.axis });
      g.text(0, legsB + 1.4, "1匹の足", { dy: -10, size: 11, color: C2D.axis });
      // 目盛り(2本・4本・10匹)
      [[legsA, `${legsA}本`], [legsB, `${legsB}本`]].forEach(([y, s]) => {
        g.line(0, y, -0.15, y, { color: C2D.axis, w: 1 });
        g.text(-0.3, y, s, { align: "right", size: 12, weight: "normal", color: C2D.axis });
      });
      g.line(total, 0, total, 0.15, { color: C2D.axis, w: 1 });
      g.text(total, -0.5, `${total}匹`, { size: 12, weight: "normal", color: C2D.axis });

      // --- 仮定の長方形(全部ツル: total × legsA) ---
      if (st.showBase > 0.01) {
        const al = st.showBase;
        g.poly([[0, 0], [total, 0], [total, legsA], [0, legsA]],
          { color: C2D.edge, w: 2.5, fill: C2D.solid2, fillAlpha: al, alpha: al });
        g.text((total - k) / 2, legsA / 2, "ツル", { size: 14, color: C2D.ink, alpha: al });
      }

      // --- カメに交換した部分(右から k 匹、上に legsB-legsA 積み増し) ---
      if (k > 0.02) {
        const x0 = total - k;
        g.poly([[x0, legsA], [total, legsA], [total, legsB], [x0, legsB]],
          { color: C2D.red, w: 2.5, fill: C2D.redFill, fillAlpha: 1 });
        g.line(x0, 0, x0, legsA, { color: C2D.red, w: 2, dash: [4, 4] });
        g.text(total - k / 2, (legsA + legsB) / 2, "カメ", { size: 14, color: C2D.red });
      }

      // --- 足の合計(面積)カウンタ ---
      const legsNow = legsA * total + k * (legsB - legsA);
      g.text(0, legsB + 2.3, `足の合計 = ${Math.round(legsNow)}本`, {
        align: "left", dx: -10, size: 16, color: legsNow >= legsSum - 0.01 ? C2D.red : C2D.ink,
      });

      // --- 目標(実際の合計)の不足分ガイド ---
      if (st.showGoal > 0.01) {
        const al = st.showGoal;
        // 不足分を点線の空箱で見せる(右上)
        const x0 = total - ansB;
        g.poly([[x0, legsA], [total, legsA], [total, legsB], [x0, legsB]],
          { color: C2D.ghost, w: 1.5, dash: [5, 4], alpha: al, fill: null });
        g.text(total + 0.25, (legsA + legsB) / 2, `あと${legsSum - legsA * total}本`, {
          align: "left", size: 12, color: C2D.ghost, alpha: al,
        });
      }

      // --- 答え ---
      if (st.showAns > 0.01) {
        const al = st.showAns;
        g.badge(total - ansB / 2, -0.55, `カメ ${ansB}匹`, { bg: C2D.red, alpha: al });
        g.badge((total - ansB) / 2, -0.55, `ツル ${total - ansB}匹`, { bg: C2D.blue, alpha: al });
      }
    },
  };
}
