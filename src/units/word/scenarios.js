// ==== 単元: 文章題(2D / Canvas) ====
// registry で unit:"word", render:"canvas2d" を一括付与される。
function makeWordScenarios() {
  // つるかめ算: ツルとカメ合わせて10匹、足26本 → カメ = (26−2×10)÷(4−2) = 3匹
  const ansB = (26 - 2 * 10) / (4 - 2);

  return [
    {
      id: "turtleCrane", name: "① つるかめ算(面積図)", type: "turtleCrane",
      source: "文章題/つるかめ算。例: 合わせて10匹・足26本",
      params: { total: 10, legsA: 2, legsB: 4, legsSum: 26, ansB },
      base: {
        view: { ox: 80, oy: 258, scale: 38, yUp: true },
        k: 0, showBase: 0, showGoal: 0, showAns: 0,
      },
      // ---- v2: 問題ファースト+なぞりヒント(docs/CONCEPT.md) ----
      quiz: {
        question: "ツルとカメが合わせて10匹います。足の数は全部で26本。カメは何匹いるでしょう?",
        answer: 3, answerLabel: "カメ(匹)",
        state: { showBase: 1 },   // 面積図の土台(全部ツルの長方形)だけ見せて考えさせる
        regions: [
          { id: "baseRect", label: "下の長方形",
            shape: { kind: "rect", x: 0, y: 0, w: 10, h: 2 } },
          { id: "upperBand", label: "上のすき間",
            shape: { kind: "rect", x: 0, y: 2, w: 10, h: 2.6 } },
        ],
        hints: {
          baseRect: [
            { kind: "ask", text: "この長方形は「全部ツルだったら」の足の数。2本×10匹で何本?" },
            { kind: "formula", text: "全部ツルなら 2 × 10 = 20本。でも実際は26本…6本たりない!" },
            { kind: "scenario" },
          ],
          upperBand: [
            { kind: "ask", text: "たりない6本は、この「すき間」にかくれているよ。ツル1匹をカメに交換すると、足は何本ふえる?" },
            { kind: "anime", caption: "ためしに1匹だけカメに交換してみると…足が2本ふえた!",
              steps: [{ dur: 1.6, state: { k: 1 } }] },
            { kind: "formula", text: "カメの数 = (26 − 20) ÷ (4 − 2) = 3匹" },
            { kind: "scenario" },
          ],
        },
      },
      steps: [
        { dur: 1.6, caption: "ツルとカメが合わせて10匹います。足の数は全部で26本。カメは何匹いるでしょう?" },
        { dur: 2.6, caption: "「面積図」で考えます。横を匹数、縦を1匹の足の数にすると、長方形の面積が足の合計。まず全部ツルだと仮定すると、足は 2本×10匹=20本 にしかなりません。", formula: "全部ツルなら: 2 × 10 = 20本", state: { showBase: 1 } },
        { dur: 2.6, caption: "実際は26本だから、6本たりない。この不足分(点線の箱)を、ツルをカメに交換して埋めていきます。1匹交換するごとに足は 4−2=2本 ずつ増えます。", formula: "たりない分: 26 − 20 = 6本  /  1匹交換で +2本", state: { showGoal: 1 } },
        { dur: 3.4, caption: "右はしから1匹ずつカメに交換…。赤い面積が増えて、ちょうど26本になったところでストップ!", state: { k: ansB, showGoal: 0 } },
        { dur: 2.8, caption: "交換したのは3匹。つまりカメが3匹、ツルが7匹です。面積図なら「たりない分 ÷ 1匹の差」が目に見えます。", formula: "カメ = (26 − 2×10) ÷ (4 − 2) = 3匹 / ツル = 10 − 3 = 7匹", state: { showAns: 1 } },
      ],
    },
  ];
}
