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
        view: { ox: 80, oy: 258, scale: 36, yUp: true },
        k: 0, showBase: 0, showGoal: 0, showAns: 0,
      },
      // ---- v2: 問題ファースト+なぞりヒント(docs/CONCEPT.md) ----
      quiz: {
        question: "ツルとカメが合わせて10匹います。足の数は全部で26本。カメは何匹いるでしょう?",
        answer: 3, answerLabel: "カメの数（匹）",
        state: { showBase: 1 },   // 面積図の土台(全部ツルの長方形)だけ見せて考えさせる
        regions: [
          { id: "baseRect", label: "下の長方形",
            shape: { kind: "rect", x: 0, y: 0, w: 10, h: 2 } },
          { id: "upperBand", label: "上のすき間",
            shape: { kind: "rect", x: 0, y: 2, w: 10, h: 2.6 } },
        ],
        hints: {
          baseRect: [
            { kind: "ask", text: "全部がツルだと考えると、足は何本になるかな。" },
            { kind: "formula", text: "2 × 10 = 20（本）。実際の26本より6本少ない。" },
            { kind: "scenario" },
          ],
          upperBand: [
            { kind: "ask", text: "ツル1匹をカメ1匹にかえると、足は何本ふえるかな。" },
            { kind: "anime", caption: "1匹だけカメにかえると、足が2本ふえるね。",
              steps: [{ dur: 1.6, state: { k: 1 } }] },
            { kind: "formula", text: "（26 − 20）÷（4 − 2）= 3（匹）" },
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
    {
      id: "turtleCrane2", name: "② つるかめ算(なぞって解く)", type: "turtleCrane2",
      source: "文章題/つるかめ算。例: 合わせて20匹・足52本(全部カメ方式)",
      params: { total: 20, legsBig: 4, legsSmall: 2, legsSum: 52, ansTsuru: 14, ansKame: 6 },
      base: {
        view: { ox: 60, oy: 200, scale: 21, yUp: true },
        s1: 0, s2: 0, s3: 0, s4: 0, done: 0,
      },
      // ---- v3: なぞって解く(docs/V3_DESIGN.md)。なぞり順=依存順、図と式が1:1 ----
      v3: {
        question: "つるとカメが合わせて20います。足の数は全部で52本です。つるとカメは、それぞれいくついますか？",
        palette0: [20, 52, 4, 2],
        steps: [
          {
            id: "whole", stateKey: "s1",
            depends_on: [],
            prompt: "「もし20ぴき全部がカメだったら？」から始めよう。赤い点線の大きな長方形を、ぐるっとなぞって。",
            trace: { path: [[0, 0], [20, 0], [20, 4], [0, 4], [0, 0]], r: 1.1, minCover: 0.65, minOn: 0.45 },
            ask: "カメの足は4本。20ぴき全部がカメなら、足は何本になるかな？",
            expr: { text: "4 × 20 = □", answer: 80, unit: "本" },
            palette: [80],
          },
          {
            id: "over", stateKey: "s2",
            depends_on: ["whole"],
            prompt: "でも、本当は52本。多すぎる分が左上の「欠け」になるよ。かぎ形の点線を、左から順になぞろう。",
            trace: { path: [[0, 2], [14, 2], [14, 4]], r: 0.9, minCover: 0.7, minOn: 0.55, needForward: true, endpointTolerance: 1.4 },
            ask: "全部カメなら80本、本当は52本。何本多すぎたかな？",
            expr: { text: "80 − 52 = □", answer: 28, unit: "本" },
            palette: [28],
          },
          {
            id: "per", stateKey: "s3",
            depends_on: ["over"],
            prompt: "赤い欠けの高さは、カメとつるの足の数のちがいだよ。左のたての点線を、下から上へなぞろう。",
            trace: { path: [[0, 2], [0, 4]], r: 0.8, minCover: 0.7, minOn: 0.55, needForward: true, endpointTolerance: 1.2 },
            ask: "カメ1ぴきをつる1羽にすると、足は4−2＝2本へるね。28本へらすには、何羽をつるにするかな？",
            expr: { text: "28 ÷（4 − 2）= □", answer: 14, unit: "羽 …つる" },
            palette: [14],
          },
          {
            id: "rest", stateKey: "s4",
            depends_on: ["per"],
            prompt: "のこりがカメだよ。上の右がわの点線を、左から右へなぞろう。",
            trace: { path: [[14, 4], [20, 4]], r: 0.8, minCover: 0.7, minOn: 0.55, needForward: true, endpointTolerance: 1.2 },
            ask: "合わせて20、つるが14羽。カメはいくつかな？",
            expr: { text: "20 − 14 = □", answer: 6, unit: "匹 …カメ" },
            palette: [6],
          },
        ],
        closing: "🎉 とけた！ つる14羽・カメ6ぴき。たしかめると、14×2＋6×4＝52本になるね。",
      },
      steps: [
        { dur: 1.8, caption: "つるとカメが合わせて20匹、足は52本。今度は「ぜんぶカメだったら?」と考えます。カメ20匹なら足は 4×20=80本 の大きな長方形。", state: { s1: 1 } },
        { dur: 3.0, caption: "ほんとうは52本だから、80−52=28本 ぶんオーバー。オーバーした分が左上の欠け(赤)です。", formula: "オーバー: 4×20 − 52 = 28本", state: { s2: 1, s3: 1 } },
        { dur: 3.2, caption: "欠けの高さは 4−2=2本(カメとつるの足のちがい)。だから欠けの横はば 28÷2=14 が、つるの数。のこり6匹がカメです。", formula: "つる = 28 ÷ (4−2) = 14匹 / カメ = 20 − 14 = 6匹", state: { s4: 1, done: 1 } },
      ],
    },
  ];
}
