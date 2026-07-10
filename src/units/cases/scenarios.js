// ==== 単元: 場合の数(2D / Canvas) ====
// registry で unit:"cases", render:"canvas2d" を一括付与される。
function makeCasesScenarios() {
  return [
    {
      id: "treeDiagram", name: "① 樹形図(カードのならべ方)", type: "treeDiagram",
      source: "場合の数/順列。例: 1,2,3のカードで3けたの数",
      params: { items: ["1", "2", "3"] },
      base: {
        view: { ox: 130, oy: 262, scale: 38, yUp: true },
        grow: 0, countN: 0, showAns: 0,
      },
      steps: [
        { dur: 1.6, caption: "1、2、3のカードが1枚ずつあります。3枚をならべて3けたの数をつくると、全部で何通りできるでしょう?" },
        { dur: 2.6, caption: "「樹形図」で数えもれなく調べます。まず百の位。使えるカードは1、2、3の3通りです。", formula: "百の位: 3通り", state: { grow: 1 } },
        { dur: 3.0, caption: "次に十の位。百の位で1枚使ったから、残りは2枚。どの枝からも2本ずつ枝分かれします。", formula: "十の位: 残り2枚 → 2通りずつ", state: { grow: 2 } },
        { dur: 3.0, caption: "最後に一の位。残ったカードは1枚だけなので、枝は1本ずつ。これで3けたの数が全部ならびました。", formula: "一の位: 残り1枚 → 1通りずつ", state: { grow: 3 } },
        { dur: 3.4, caption: "葉の数をかぞえると…全部で6通り! 枝分かれの数をかけ算しても同じです。樹形図の「×」のしくみが見えます。", formula: "3 × 2 × 1 = 6通り", state: { countN: 6, showAns: 1 } },
      ],
    },
  ];
}
