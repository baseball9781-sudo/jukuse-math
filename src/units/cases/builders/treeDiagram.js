// ==== ビルダー(2D): 樹形図(カードのならべ方) ====
// n枚のカードを1列にならべる順列を、枝が1段ずつ育つ樹形図で数える。
// 状態 st.grow(0..n)で「何段目まで枝がのびたか」、st.countN で葉を数える。
//
// params: { items: ["1","2","3"] }  カードの文字
function buildTreeDiagram(params) {
  const items = params.items;
  const n = items.length;

  // 順列を列挙(枝の順=辞書順)。各ノードは「これまでに選んだ列」
  const perms = [];
  (function rec(prefix, rest) {
    if (rest.length === 0) { perms.push(prefix); return; }
    for (let i = 0; i < rest.length; i++) {
      rec(prefix.concat(rest[i]), rest.slice(0, i).concat(rest.slice(i + 1)));
    }
  })([], items);
  const leavesN = perms.length;

  // ノード位置: 深さℓ(1..n) → x=(ℓ-1)*colW。yは「自分の下の葉たち」の平均。
  const colW = 2.4, rowH = 1.0;
  const leafY = (j) => (leavesN - 1 - j) * rowH;
  function nodeInfo(depth) {
    // 深さdepthの全ノード: prefix(長さdepth)ごとに、対応する葉の範囲
    const map = new Map();
    perms.forEach((p, j) => {
      const key = p.slice(0, depth).join(",");
      if (!map.has(key)) map.set(key, { label: p[depth - 1], ys: [] });
      map.get(key).ys.push(leafY(j));
    });
    return [...map.values()].map((v) => ({
      label: v.label,
      x: (depth - 1) * colW,
      y: v.ys.reduce((a, b) => a + b, 0) / v.ys.length,
      childYs: v.ys,
    }));
  }
  const levels = [];
  for (let d = 1; d <= n; d++) levels.push(nodeInfo(d));

  return {
    draw(g, st, screen) {
      const grow = st.grow;
      const digits = ["百の位", "十の位", "一の位", "千の位"]; // n<=3想定(4枚なら要調整)
      const topY = leavesN * rowH + 0.6;

      // 列見出し
      for (let d = 1; d <= n; d++) {
        const f = clamp01(grow - (d - 1));
        if (f < 0.01) continue;
        g.text((d - 1) * colW, topY, digits[d - 1], { size: 12, color: C2D.axis, alpha: f });
      }

      // 枝と数字(深さdの枝は grow が d-1..d の間にのびる)
      for (let d = 1; d <= n; d++) {
        const f = clamp01(grow - (d - 1));
        if (f < 0.01) continue;
        const parents = d >= 2 ? levels[d - 2] : null;
        levels[d - 1].forEach((node) => {
          if (d >= 2) {
            // 親ノードから自分へ枝をのばす(fで途中まで)
            const pa = parents.find((p) => p.childYs.includes(node.childYs[0]));
            const x0 = pa.x + 0.42, y0 = pa.y;
            const x1 = node.x - 0.42, y1 = node.y;
            g.line(x0, y0, x0 + (x1 - x0) * f, y0 + (y1 - y0) * f, { color: C2D.edge, w: 1.5, alpha: 0.9 });
          }
          if (f > 0.6) {
            g.text(node.x, node.y, node.label, { size: 17, color: C2D.ink, alpha: (f - 0.6) / 0.4 });
          }
        });
      }

      // 葉のよこに完成した数と番号バッジ
      perms.forEach((p, j) => {
        const showNum = clamp01(grow - (n - 1));
        if (showNum > 0.6) {
          g.text((n - 1) * colW + 1.5, leafY(j), `→ ${p.join("")}`, {
            size: 14, color: C2D.ink, alpha: (showNum - 0.6) / 0.4, align: "left",
          });
        }
        const cf = clamp01((st.countN || 0) - j);
        if (cf > 0.5) {
          g.badge((n - 1) * colW + 3.4, leafY(j), `${j + 1}`, { bg: C2D.red, size: 12 });
        }
      });

      // 合計
      if ((st.countN || 0) >= leavesN - 0.01 && st.showAns > 0.01) {
        g.text((n - 1) * colW + 1.4, -1.2, `全部で ${leavesN} 通り`, {
          size: 18, color: C2D.red, alpha: st.showAns,
        });
      }
    },
  };
}
