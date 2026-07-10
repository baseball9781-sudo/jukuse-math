// ==== 単元: 平面図形(2D / Canvas) ====
// registry で unit:"plane", render:"canvas2d" を一括付与される。
function makePlaneScenarios() {
  return [
    {
      id: "movePoint", name: "① 点の移動と面積", type: "movePoint",
      source: "平面図形/点の移動。例: 長方形6cm×4cm、Pが周を移動",
      params: { w: 6, h: 4 },
      base: {
        view: { ox: 45, oy: 200, scale: 28, yUp: true },
        d: 0, showTri: 1, showGraph: 1,
        gx0: 8.5, gy0: 0, gsx: 0.5, gsy: 0.42,
      },
      steps: [
        { dur: 1.4, caption: "長方形ABCD(横6cm・縦4cm)の周りを、点PがAを出発してB→C→Dの順に動きます。三角形ABPの面積は、どう変わっていく?", state: { d: 0, showTri: 1, showGraph: 0 } },
        { dur: 3.0, caption: "PがAからBへ動く間。三角形ABPはぺちゃんこ(高さ0)のまま。底辺ABの上をPがすべっても、面積は0のままです。", formula: "AB間: 面積 = 0", state: { d: 6 / 16, showGraph: 1 } },
        { dur: 3.4, caption: "PがBからCへ上がる間。高さがぐんぐん増えるので、面積はまっすぐ増えていきます。Cに着くと最大。", formula: "BC間: 面積 = 6 × 高さ ÷ 2 (増えていく)  /  最大 = 6×4÷2 = 12cm²", state: { d: (6 + 4) / 16 } },
        { dur: 3.4, caption: "PがCからDへ動く間。高さは4cmのまま変わらないので、面積は12cm²で一定。グラフは「0 → 直線で増加 → 水平」の形になります。", formula: "CD間: 面積 = 12cm² (一定)", state: { d: 1 } },
      ],
    },
    {
      id: "rolling", name: "② 正方形の転がり", type: "rolling",
      source: "平面図形/転がり。例: 1辺4cmの正方形が直線上を1回転",
      params: { a: 4 },
      base: {
        view: { ox: 45, oy: 230, scale: 27, yUp: true },
        rot: 0, showRadius: 0, showArea: 0,
      },
      steps: [
        { dur: 1.6, caption: "1辺4cmの正方形が、直線の上をすべらずに転がって1回転します。頂点Aはどんな線をえがくでしょう?" },
        { dur: 3.2, caption: "1回目。回転の中心は右下の頂点です。Aは中心から4cm(1辺の長さ)はなれているので、半径4cmの1/4円をえがきます。", formula: "弧① : 半径4cmの1/4円", state: { rot: 90, showRadius: 1 } },
        { dur: 3.4, caption: "2回目。こんどはAが対角線のはんたい側! 半径は対角線の長さになるので、いちばん大きな1/4円をえがきます。", formula: "弧② : 半径=対角線の1/4円 (半径×半径 = 4×4+4×4 = 32)", state: { rot: 180 } },
        { dur: 3.2, caption: "3回目。半径はまた4cmにもどって、Aは地面に着地します。90度ごとに「回転の中心」と「半径」が変わるのがポイント。", formula: "弧③ : 半径4cmの1/4円", state: { rot: 270 } },
        { dur: 3.4, caption: "軌跡と直線で囲まれた面積は、1/4円が3つと、三角形2つ(合わせて正方形1つ分)に分けて計算できます。", formula: "面積 = 3.14×16×1/4×2 + 3.14×32×1/4 + 16 = 66.24cm²", state: { showArea: 1, showRadius: 0 } },
      ],
    },
  ];
}
