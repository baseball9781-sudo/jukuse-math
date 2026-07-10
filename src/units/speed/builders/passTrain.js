// ==== ビルダー(2D): 通過算(列車が橋をわたる) ====
// 「わたり始め=先頭が橋に入る」「わたり終わり=最後尾が橋を出る」の間に、
// 列車(の先頭)は 橋の長さ+列車の長さ だけ進むことを見せる。
//
// params:
//   trainLen  : 列車の長さ(m)
//   bridgeLen : 橋の長さ(m)
//   v         : 秒速(m)
//   ans       : 通過にかかる時間(秒) (事前計算)
function buildPassTrain(params) {
  const { trainLen, bridgeLen, v, ans } = params;

  return {
    draw(g, st, screen) {
      const front = st.front;         // 先頭の位置(m)。橋の入り口=0
      const sc = st.ms;               // 1m = ワールド何単位
      const y = 0;                    // 線路の高さ
      const trainH = 1.35;            // 列車の見た目の高さ(ワールド)

      // --- 線路と橋 ---
      g.line(-320 * sc, y, (bridgeLen + 420) * sc, y, { color: C2D.ghost, w: 2 });
      g.line(0, y, bridgeLen * sc, y, { color: C2D.edge, w: 5 });
      // 橋脚
      for (let i = 0; i <= 4; i++) {
        const px = (bridgeLen * i / 4) * sc;
        g.line(px, y, px, y - 0.55, { color: C2D.edge, w: 2 });
      }
      g.text(bridgeLen * sc / 2, y - 1.05, `橋 ${bridgeLen}m`, { size: 13, color: C2D.ink });
      g.line(0, y - 0.7, 0, y + trainH + 0.9, { color: C2D.ghost, w: 1, dash: [4, 4] });
      g.line(bridgeLen * sc, y - 0.7, bridgeLen * sc, y + trainH + 0.9, { color: C2D.ghost, w: 1, dash: [4, 4] });

      // --- 列車(先頭front、後方にtrainLen) ---
      const x1 = front * sc, x0 = (front - trainLen) * sc;
      g.poly([[x0, y + 0.12], [x1, y + 0.12], [x1, y + 0.12 + trainH], [x0, y + 0.12 + trainH]],
        { color: C2D.edge, w: 2, fill: C2D.solid2, fillAlpha: 1 });
      // 先頭・最後尾のマーク
      g.dot(x1, y + 0.12 + trainH / 2, { color: C2D.red, rp: 5 });
      g.text((x0 + x1) / 2, y + 0.12 + trainH / 2, `列車 ${trainLen}m`, { size: 12, color: C2D.ink });

      // わたり始めの列車の残像
      if (st.showGhost > 0.01) {
        const al = st.showGhost * 0.45;
        g.poly([[-trainLen * sc, y + 0.12], [0, y + 0.12], [0, y + 0.12 + trainH], [-trainLen * sc, y + 0.12 + trainH]],
          { color: C2D.ghost, w: 1.5, dash: [5, 4], alpha: al, fill: null });
      }

      // --- 先頭が進んだ道のり(赤い矢印) ---
      if (st.showDist > 0.01 && front > 1) {
        const al = st.showDist, ay = y + trainH + 1.6;
        g.arrow(0, ay, front * sc, ay, { color: C2D.red, w: 2.5, head: 10, alpha: al });
        g.line(0, ay - 0.25, 0, ay + 0.25, { color: C2D.red, w: 2, alpha: al });
        g.text(front * sc / 2, ay + 0.55, st.showAns > 0.5 ? `${bridgeLen}m + ${trainLen}m = ${bridgeLen + trainLen}m` : "先頭が進んだ道のり", { size: 13, color: C2D.red, alpha: al });
      }
    },
  };
}
