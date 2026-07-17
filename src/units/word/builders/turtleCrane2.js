// ==== ビルダー(2D): つるかめ算・全部カメの面積図(v3なぞって解く用) ====
// 雅也の手書き図(IMG_1857)の清書。大枠20×4=80の長方形から、
// 実際の52本(L字)を残して左上の欠け(28)が見える図。
//
// 部品はなぞりステップに対応する4つ:
//   s1: 大枠(全部カメ 20×4)      s2: L字の境界線(実際52とのズレ)
//   s3: 欠けの高さ(4−2=2)        s4: 上辺の右側(カメのはば6)
// 各状態は 0=非表示 / 0.35前後=お手本(薄い) / 1=なぞり済み(濃い)
//
// params: { total, legsBig, legsSmall, legsSum, ansTsuru, ansKame }
function buildTurtleCrane2(params) {
  const { total, legsBig, legsSmall, legsSum, ansTsuru, ansKame } = params;
  const W = total, H = legsBig, bandH = legsSmall, nW = ansTsuru; // 欠けの幅=つる

  return {
    draw(g, st, screen) {
      // 部品の線: 進捗sに応じて お手本(赤点線・薄) → 本描き(濃) を切り替え
      const stroke = (pts, s, closed) => {
        if (s < 0.02) return;
        if (s < 0.99) g.path(pts, { color: C2D.red, w: 2, dash: [7, 6], alpha: 0.25 + s * 0.5, close: closed });
        else g.path(pts, { color: C2D.edge, w: 3, close: closed });
      };

      // --- L字の塗り(実際の52本)と欠け(28本) : s2完了後 ---
      if (st.s2 > 0.99) {
        g.poly([[0, 0], [W, 0], [W, H], [nW, H], [nW, bandH], [0, bandH]],
          { color: null, fill: C2D.waterFill, fillAlpha: 0.4 });
        g.poly([[0, bandH], [nW, bandH], [nW, H], [0, H]],
          { color: null, fill: C2D.redFill, fillAlpha: 0.8 });
        g.text(W / 2, bandH / 2, `${legsSum}`, { size: 17, color: C2D.ink });
        g.text(nW / 2, (bandH + H) / 2, `${legsBig * total - legsSum}`, { size: 15, color: C2D.red });
      }

      // --- s1: 大枠(20×4) ---
      stroke([[0, 0], [W, 0], [W, H], [0, H], [0, 0]], st.s1, false);
      // 寸法(下:匹数 / 右:カメの足)。
      // 注: CLAUDE.mdの「寸法は字幕へ」はコマ送りアニメ用の規則。v3の図は
      // 手書き仕様(IMG_1857)の清書=「子どもが解いた記録」なので、原本にある
      // 寸法・答えは図に残す(docs/V3_DESIGN.md §5 手書きは仕様書)。
      if (st.s1 > 0.99) {
        g.arrow(0, -0.75, W, -0.75, { color: C2D.axis, w: 1.2, head: 7 });
        g.arrow(W, -0.75, 0, -0.75, { color: C2D.axis, w: 1.2, head: 7 });
        g.text(W / 2, -1.25, `${total}ひき`, { size: 13, color: C2D.ink });
        g.text(W + 0.6, H / 2, `${legsBig}本`, { align: "left", size: 13, color: C2D.ink });
      }

      // --- s2: L字の境界(欠けのりんかく) ---
      stroke([[0, bandH], [nW, bandH], [nW, H]], st.s2, false);

      // --- s3: 欠けの高さ(左の縦、4−2) ---
      stroke([[0, bandH], [0, H]], st.s3, false);
      if (st.s3 > 0.99) {
        g.text(-0.6, (bandH + H) / 2, `${legsBig - legsSmall}`, { align: "right", size: 14, color: C2D.red });
        g.text(-0.6, bandH / 2, `${legsSmall}`, { align: "right", size: 13, weight: "normal", color: C2D.axis });
        // つるのはば(欠けの横)= 28÷2 = 14
        g.text(nW / 2, H + 0.6, `${ansTsuru}`, { size: 15, color: C2D.red });
        g.line(0, H + 0.25, nW, H + 0.25, { color: C2D.ghost, w: 1, dash: [3, 3] });
      }

      // --- s4: 上辺の右側(カメのはば) ---
      stroke([[nW, H], [W, H]], st.s4, false);
      if (st.s4 > 0.99) {
        g.text((nW + W) / 2, H + 0.6, `${ansKame}`, { size: 15, color: C2D.blue });
        g.line(nW, H + 0.25, W, H + 0.25, { color: C2D.ghost, w: 1, dash: [3, 3] });
      }

      // --- 完成: 答え ---
      if (st.done > 0.5) {
        g.badge(nW / 2, H + 1.5, `つる ${ansTsuru}羽`, { bg: C2D.red });
        g.badge((nW + W) / 2, H + 1.5, `カメ ${ansKame}ひき`, { bg: C2D.blue });
      }
    },
  };
}
