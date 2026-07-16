// ==== 単元: 割合と比(2D / Canvas) ====
// registry で unit:"ratio", render:"canvas2d" を一括付与される。
function makeRatioScenarios() {
  // 食塩水: 4%300g + 9%200g → (4×300+9×200)÷500 = 6%
  const mix = (4 * 300 + 9 * 200) / (300 + 200);

  return [
    {
      id: "saltBalance", name: "① 食塩水(てんびん図)", type: "saltBalance",
      source: "割合と比/食塩水。例: 4%300gと9%200gを混ぜる",
      params: { a: { c: 4, w: 300 }, b: { c: 9, w: 200 }, mix },
      base: {
        view: { ox: -50, oy: 268, scale: 55, yUp: true },
        beamY: 2.3, fx: 6.5, tilt: 0,
        showBeam: 0, showFx: 0, showAns: 0, showRatio: 0,
      },
      quiz: {
        question: "4%の食塩水300gと、9%の食塩水200gを混ぜます。何%の食塩水になるでしょう?",
        answer: 6, answerLabel: "濃さ（%）",
        state: { showBeam: 1, tilt: 7 },   // おもりを下げて、真ん中支点でかたむいた状態から考えさせる
        regions: [
          { id: "shiten", label: "支点のあたり",
            shape: { kind: "rect", x: 5.3, y: 1.2, w: 2.4, h: 1.3 } },
          { id: "omoriL", label: "300gのおもり",
            shape: { kind: "rect", x: 2.9, y: 0.5, w: 2.2, h: 1.9 } },
          { id: "omoriR", label: "200gのおもり",
            shape: { kind: "rect", x: 7.9, y: 0.5, w: 2.2, h: 1.9 } },
        ],
        hints: {
          shiten: [
            { kind: "ask", text: "てんびんがつり合う場所が、混ぜた濃さ。重い300gの側と軽い200gの側、どちらに近いかな。" },
            { kind: "anime", caption: "支点を300gの側へ少しずらすと…つり合った! ここが答えの濃さ。",
              steps: [{ dur: 2.0, state: { fx: 6, tilt: 0, showFx: 1 } }] },
            { kind: "formula", text: "支点までの距離の比 2:3 は、重さの比 300:200＝3:2 の逆比" },
            { kind: "scenario" },
          ],
          omoriL: [
            { kind: "ask", text: "300gは重いおもり。つり合う場所は、重いおもりの近く? 遠く?" },
            { kind: "formula", text: "重いほうの近くでつり合う → 答えは4%寄り" },
            { kind: "scenario" },
          ],
          omoriR: [
            { kind: "ask", text: "200gは軽いおもり。支点が近づくのは300gと200g、どっち?" },
            { kind: "formula", text: "軽いほうからは遠くなる → 9%から離れて4%寄り" },
            { kind: "scenario" },
          ],
        },
      },
      steps: [
        { dur: 1.6, caption: "4%の食塩水300gと、9%の食塩水200gを混ぜます。何%の食塩水になるでしょう?" },
        { dur: 2.8, caption: "「てんびん図」で考えます。濃さの数直線の4と9に、食塩水を重さのおもりとしてぶら下げます。ためしに真ん中を支えてみると…300gの側にかたむいてしまいます。", state: { showBeam: 1, tilt: 7 } },
        { dur: 3.2, caption: "支点を重い300gの側へ少しずらすと、ちょうどつり合いました。このつり合う場所が、混ぜてできる濃さです。", formula: "つり合い: 300 × (6−4) = 200 × (9−6) = 600", state: { fx: mix, tilt: 0, showFx: 1, showAns: 1 } },
        { dur: 3.2, caption: "支点から4%までの距離は2、9%までの距離は3。距離の比 2:3 は、重さの比 300:200 = 3:2 のちょうど逆(逆比)! 「重いほうの近くでつり合う」のがてんびん図のコツです。", formula: "距離の比 = 重さの逆比 3:2 → 2:3  /  4% + 5 × 2/5 = 6%", state: { showRatio: 1 } },
      ],
    },
  ];
}
