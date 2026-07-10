// ==== 単元: 立体図形(3D / Three.js) ====
// 各シナリオは registry で unit:"solid", render:"three" を一括付与される。
function makeSolidScenarios() {
  const tetVerts = { P: [0,0,0], Q: [3,0,0], R: [0,3,0], O: [0,0,6] };
  const uf = computeUnfold(tetVerts, ["O","Q","R"], [
    { hinge: ["O","Q"], apex: "P" },
    { hinge: ["Q","R"], apex: "P" },
    { hinge: ["R","O"], apex: "P" },
  ]);
  {
    const corners = [uf.T["O"], ...uf.flat];
    const c = corners.reduce((s,p)=>vAdd(s,p),[0,0,0]).map((x)=>x/4);
    uf.squareCorners = corners
      .map((p) => ({ p, a: Math.atan2(p[2]-c[2], p[0]-c[0]) }))
      .sort((x,y)=>x.a-y.a).map((o)=>o.p);
    uf.center = c;
  }
  const uc = uf.center;
  const hexPts = [[6,3,0],[3,6,0],[0,6,3],[0,3,6],[3,0,6],[6,0,3]];

  return [
    {
      id: "cut", name: "① 切り口", type: "cut",
      source: "単元41・42/切り口の形(p.76)",
      params: { size: 6, hexPts, dotIdx: [0, 2, 4] },
      base: {
        camPos: [16, 8.5, 19], camTarget: [3, 2.8, 3],
        dots: 0, cutDraw: 0, planeOp: 0, sep: 0, aside: 0, lineOp: 1, ring: 0,
      },
      steps: [
        { dur: 1.4, caption: "1辺6cmの立方体を、3つの辺の真ん中の点(中点・赤い点)を通る平面で切断します。切り口はどんな形になるでしょう?", state: { dots: 1 } },
        { dur: 3.4, caption: "切り口の線を順に引いていきます。線がひとまわりつながったら、それが切り口です。", formula: "ルール① 同じ面にある2点は、まっすぐ結ぶ  /  ルール② 平行な面にできる切り口は、平行になる", state: { cutDraw: 1 } },
        { dur: 1.6, caption: "3つの中点を通る切断面はこの通り。中点を通って、ななめにまっすぐ切ります。", state: { planeOp: 0.4 } },
        { dur: 2.2, caption: "平面にそって、2つに切り分けます。", state: { sep: 1.7, planeOp: 0, lineOp: 0, dots: 0 } },
        { dur: 2.4, caption: "切り口を正面から見ると……正六角形! 6つの辺の中点を通るように切ると、正六角形が現れます。", formula: "覚えておこう:立方体の切り口は 七角形以上はできない/正五角形もできない", state: { aside: 18, ring: 1, camPos: [13.5, 10, 14], camTarget: [3, 3, 3] } },
      ],
    },
    {
      id: "cutBlocks", name: "② 積み木の切断", type: "cutBlocks",
      source: "単元41-⑥(p.75)/積み木の切断",
      params: { unit: 2, spread: 8.5, liftGap: 4.6, layerCounts: [5, 3, 1] },
      base: {
        camPos: [16, 8.5, 19], camTarget: [3, 2.8, 3],
        dots: 0, planeOp: 0, sep: 0, lift: 0, explode: 0, highlight: 0, countOp: 0,
      },
      steps: [
        { dur: 1.4, caption: "小さい立方体を27個積んで作った大きな立方体。赤い3つの頂点を通る平面で切断します。", state: { dots: 1 } },
        { dur: 1.8, caption: "3つの頂点を通る切断面はこの通り。切り口は正三角形になります。", state: { planeOp: 0.4 } },
        { dur: 2.4, caption: "切り分けると、角の部分が三角すいの形で切り取られます。さて、切られた小さい立方体は何個あるでしょう?", state: { sep: 2.4, planeOp: 0, dots: 0 } },
        { dur: 3.2, caption: "段ごとに上下に分けて、真横から見ます。切り口(赤)は 上の段の下側 → まん中の段を上から下までななめに通りぬけ → 下の段の上側 とつながっています。まん中の段は、上の面にも下の面にも切りこみの線が入るのがポイント。", state: { sep: 0.7, lift: 1, highlight: 1, camPos: [28, 9, 16], camTarget: [3, 7.8, 3] } },
        { dur: 3.0, caption: "今度は段ごとに真上から見て数えます。切られた立方体(赤)は、下の段5個・真ん中の段3個・上の段1個。", formula: "切られた小さい立方体 = 5+3+1 = 9個", state: { sep: 0, lift: 0, explode: 1, countOp: 1, camPos: [11.5, 26, 4.5], camTarget: [11.5, 0, 2.8] } },
      ],
    },
    {
      id: "unfold", name: "③ 三角すいの展開", type: "unfold",
      source: "単元40-⑥(p.73)/三角すいの展開図",
      params: { uf, fixed: ["O","Q","R"], apexName: "P" },
      base: {
        camPos: [uc[0] + 9, 7, uc[2] + 11.5], camTarget: [uc[0], 2, uc[2]],
        t: 0, ghost: 0, pLabels: 1,
      },
      steps: [
        { dur: 1.4, caption: "底面が直角二等辺三角形(3cm・3cm)で、高さが6cmの三角すいO-PQRです。この立体の表面積を求めます。", formula: "体積 = 3×3÷2×6×1/3 = 9cm³" },
        { dur: 3.6, caption: "ななめの面OQRを床に固定して、残りの3つの面をパタン、パタンと開きます。3つに分かれた頂点Pの行き先に注目!", state: { t: 1, ghost: 0.65 } },
        { dur: 2.2, caption: "展開図は……1辺6cmの正方形! だから表面積は、面積の公式1回で求められます。", formula: "表面積 = 6×6 = 36cm²", state: { ghost: 0, camPos: [uc[0] + 0.6, 15.5, uc[2] + 0.6], camTarget: [uc[0], 0, uc[2]] } },
        { dur: 3.2, caption: "逆再生。正方形を折りたたむと、3つのPが1点に集まって、もとの三角すいに戻ります。展開図⇄立体を行き来できるようにしよう。", state: { t: 0, camPos: [uc[0] + 9, 7, uc[2] + 11.5], camTarget: [uc[0], 2, uc[2]] } },
      ],
    },
    {
      id: "pyramid", name: "④ 四角すいの展開", type: "pyramid",
      source: "四角すいの展開図と表面積(例: 底面6cm角・高さ4cm)",
      params: { half: 3, hgt: 4 },
      base: {
        camPos: [12, 8, 15], camTarget: [0, 2, 0],
        t: 0, tri: 0,
      },
      steps: [
        { dur: 1.4, caption: "底面が1辺6cmの正方形、高さが4cmの四角すい。表面積を求めます。" },
        { dur: 1.8, caption: "側面の三角形の高さは、この赤い直角三角形のななめの辺。「真ん中から辺までの3cm」と「高さ4cm」だから、3・4・5の直角三角形で5cm!", formula: "側面の三角形の高さ = 5cm", state: { tri: 1 } },
        { dur: 3.6, caption: "底面を残して、4つの三角形をパタパタと開きます。", state: { t: 1, tri: 0, camPos: [10, 14, 13], camTarget: [0, 0, 0] } },
        { dur: 2.2, caption: "正方形のまわりに三角形が4つ。表面積は底面+三角形×4で計算できます。", formula: "表面積 = 6×6 + (6×5÷2)×4 = 36+60 = 96cm²", state: { camPos: [0.5, 22, 4], camTarget: [0, 0, 0.4] } },
      ],
    },
    {
      id: "cone", name: "⑤ 円すいの展開", type: "cone",
      source: "単元42-①(p.77)/円すいの展開図(例: 半径4cm・母線10cm)",
      params: { r: 4, l: 10 },
      base: {
        camPos: [12, 8, 15], camTarget: [0, 3, 0],
        t: 0, baseOp: 1, netOp: 0, rimHi: 0, netHi: 0, angleOp: 0,
      },
      steps: [
        { dur: 1.4, caption: "底面の半径が4cm、母線(側面のななめの長さ)が10cmの円すい。側面を開いた展開図はどんな形になるでしょう?" },
        { dur: 3.8, caption: "側面にまっすぐ切り込み(赤い線)を入れて、ペタンと開いていくと……扇形になりました!", state: { t: 1, baseOp: 0, camPos: [14, 14, 18], camTarget: [4, 1, 0] } },
        { dur: 2.2, caption: "展開図では、底面の円を扇形の弧にくっつけてかきます。弧(赤)の長さは、底面の円周(赤い円)とぴったり同じ長さです。", formula: "扇形の弧の長さ = 半径4cmの円の円周", state: { netOp: 1, rimHi: 1, netHi: 1, camPos: [9, 25, 16], camTarget: [9, 0, 0.5] } },
        { dur: 2.2, caption: "半径10cmの円の円周のうち、半径4cmの円周の分だけを使うから、中心角は円周の比で決まります。", formula: "中心角 = 360×4/10 = 144度", state: { angleOp: 1, camPos: [9, 29, 5.5], camTarget: [9, 0, 0.5] } },
      ],
    },
    {
      id: "string", name: "⑥ ひもの最短", type: "string",
      source: "円すいにかけたひもの最短距離(中心角90度/60度)",
      params: { r1: 2, l1: 8, ang1: "90°", r2: 2, l2: 12, ang2: "60°" },
      base: {
        camPos: [10, 7, 13], camTarget: [0, 2.5, 0],
        t1: 0, t2: 0, op1: 1, op2: 0, a1: 0, a2: 0,
      },
      steps: [
        { dur: 1.4, caption: "母線8cm・半径2cmの円すい。点Aから側面をぐるっと1周して、また点Aまで、いちばん短くなるようにひも(赤)をかけます。立体のままだと、ひもの形が分かりにくい…" },
        { dur: 4.0, caption: "側面を開くと……ひもはピンとまっすぐ! 最短の道すじは、展開図の上では直線になります。中心角は90度だから、2本の母線とひもで直角二等辺三角形の形。", formula: "中心角 = 360×2/8 = 90度 → 直角二等辺三角形", state: { t1: 1, a1: 1, camPos: [4.5, 19, 10], camTarget: [4.5, 0, 0] } },
        { dur: 1.8, caption: "今度は母線12cm・半径2cmの円すい。同じように、点Aから1周して点Aまで最短でひもをかけます。", state: { op1: 0, op2: 1, camPos: [12, 8, 15], camTarget: [0, 3.5, 0] } },
        { dur: 4.0, caption: "開くと中心角は60度。2本の母線(12cm)とひもで正三角形ができます。正三角形は3辺ぜんぶ同じ長さだから……ひもの長さは母線と同じ!", formula: "中心角 = 360×2/12 = 60度 → ひもの長さ = 12cm", state: { t2: 1, a2: 1, camPos: [6.5, 24, 11], camTarget: [6.5, 0, 0] } },
      ],
    },
    {
      id: "cylinder", name: "⑦ 円柱の展開", type: "cylinder",
      source: "円柱の展開図と表面積(例: 半径3cm・高さ8cm)",
      params: { r: 3, h: 8 },
      base: {
        camPos: [22, 11, 14], camTarget: [4, 2, 6],
        t: 0, netOp: 0,
      },
      steps: [
        { dur: 1.4, caption: "半径3cm・高さ8cmの円柱を、横にたおして置きました。赤い線のところで側面に切り込みを入れて、コロコロ転がして開きます。" },
        { dur: 4.2, caption: "ちょうど1回転コロコロ……側面がぺったり開いて、長方形になりました!", state: { t: 1, camPos: [24, 13, 10], camTarget: [4, 1, 9.4] } },
        { dur: 2.2, caption: "長方形のたては円柱の高さ8cm。よこは「1回転分」だから、底面の円周とぴったり同じ長さです。円2枚は長方形の長い辺にくっつきます。", formula: "よこの長さ = 3×2×3.14 = 18.84cm", state: { netOp: 1, camPos: [4, 26, 9.4], camTarget: [4, 0, 9.4] } },
        { dur: 2.0, caption: "展開図がそろえば表面積が計算できます。", formula: "表面積 = 18.84×8 + 3×3×3.14×2 = 150.72+56.52 = 207.24cm²", state: { camPos: [4, 28, 10.5], camTarget: [4, 0, 9.4] } },
      ],
    },
    {
      id: "sectorPrism", name: "⑧ 扇形の柱", type: "sectorPrism",
      source: "底面が扇形の立体の表面積(例: 半径6cm・中心角90度・高さ5cm)",
      params: { r: 6, h: 5 },
      base: {
        camPos: [15, 11, 18], camTarget: [1, 2, -3],
        topT: 0, bandT: 0, foldOp: 0,
      },
      steps: [
        { dur: 1.4, caption: "底面が「半径6cm・中心角90度の扇形」で、高さが5cmの立体(ケーキのひと切れの形)。表面積を求めます。展開図は「長方形1枚+扇形2枚」になります。" },
        { dur: 2.8, caption: "上のフタ(扇形)を外して下におろします。これで底面と同じ扇形が2枚そろいました。", formula: "扇形1枚 = 6×6×3.14÷4 = 28.26cm²", state: { topT: 1, camPos: [13, 13, 15], camTarget: [0, 1, -6] } },
        { dur: 3.8, caption: "まわりを囲む側面は、「直辺6cm → 弧9.42cm → 直辺6cm」がひとつながり。ぺたんと開くと、1本の長い長方形になります(赤い線が折り目)。", formula: "弧の長さ = 6×2×3.14÷4 = 9.42cm", state: { bandT: 1, foldOp: 1, camPos: [2, 20, -3], camTarget: [1, 0, -7] } },
        { dur: 2.2, caption: "側面の長方形は、よこ=まわりの長さ(6+9.42+6)、たて=高さ5cm。あとは長方形と扇形2枚を合計するだけ。", formula: "表面積 = 28.26×2 + (6+9.42+6)×5 = 56.52+107.1 = 163.62cm²", state: { camPos: [1, 22, -5], camTarget: [1, 0, -7] } },
      ],
    },
    {
      id: "proj", name: "⑨ 表面積・投影", type: "proj",
      source: "複合立体の表面積(上下・前後・左右で求める)",
      params: {},
      base: {
        camPos: [14, 8, 16], camTarget: [3, 2, 2],
        oT: 0, oF: 0, oS: 0,
      },
      steps: [
        { dur: 1.4, caption: "この階段の形をした立体の表面積を、面を1枚ずつ数えずに求めます。コツは「上下・前後・左右」の3方向から見ること。" },
        { dur: 2.2, caption: "上を向いた面(赤)をぜんぶ集めると、真上から見た形(6×4の長方形)にピッタリはまります。下から見ても同じ形。", formula: "上下 = 6×4 × 2 = 48cm²", state: { oT: 1, camPos: [8, 15, 11], camTarget: [3, 2, 2] } },
        { dur: 2.2, caption: "前を向いた面(赤)も、前から見た形(6×4)にピッタリ。後ろも同じです。", formula: "前後 = 6×4 × 2 = 48cm²", state: { oT: 0, oF: 1, camPos: [4, 7, 17], camTarget: [3, 2, 2] } },
        { dur: 2.2, caption: "横から見ると階段の形。左右2つ分です。", formula: "左右 = (4×2+2×2) × 2 = 24cm²", state: { oF: 0, oS: 1, camPos: [17, 7, 7], camTarget: [3, 2, 2] } },
        { dur: 2.0, caption: "でこぼこがあっても、へこみ(くぼんで向かい合う面)がなければ、3方向の見た目の面積×2で表面積になります。", formula: "表面積 = (24+24+12)×2 = 120cm²", state: { oS: 0, camPos: [14, 8, 16], camTarget: [3, 2, 2] } },
      ],
    },
    {
      id: "notch", name: "⑩ 表面積・へこみ", type: "notch",
      source: "へこみのある立体の表面積(向かい合う面のたし忘れ注意)",
      params: {},
      base: {
        camPos: [17, 9, 19], camTarget: [4, 3, 2],
        inner: 0,
      },
      steps: [
        { dur: 1.4, caption: "両はしにタワーが立った、へこみのある立体。さっきと同じ「3方向×2」で求めてみましょう。" },
        { dur: 2.2, caption: "真上から8×4、前から28cm²、横から20cm²。3方向×2で160cm²。……でも、これで終わりではありません!", formula: "(32+28+20)×2 = 160cm²", state: { camPos: [12, 13, 17], camTarget: [4, 2.5, 2] } },
        { dur: 2.6, caption: "へこみの内側で向かい合っている2つの面(赤)は、上下・前後・左右のどこから見てもかくれてしまいます。この2枚を忘れずに足すこと!", formula: "内側の面 = 4×3 × 2枚 = 24cm²", state: { inner: 1, camPos: [4, 11, 10], camTarget: [4, 3, 2] } },
        { dur: 2.0, caption: "3方向×2に、かくれた内側の面を足して完成。", formula: "表面積 = 160+24 = 184cm²", state: { camPos: [17, 9, 19], camTarget: [4, 3, 2] } },
      ],
    },
    {
      id: "lathe", name: "⑪ 回転体", type: "lathe",
      source: "単元40-④(p.72)/回転体の体積",
      params: {},
      base: {
        camPos: [16, 12, 20], camTarget: [0, 8, 0],
        t: 0,
      },
      steps: [
        { dur: 1.4, caption: "赤い図形(たて9cm・よこ3cmの長方形と、底辺3cm・高さ9cmの直角三角形)を、点線の軸のまわりにぐるっと1回転させます。どんな立体ができる?" },
        { dur: 4.2, caption: "くるり! 下には円柱、上には円すいができました。回転体は、回した図形を軸のまわりでひとまわしした立体です。", state: { t: 1, camPos: [17, 13, 21], camTarget: [0, 8, 0] } },
        { dur: 2.2, caption: "体積は、円柱と円すいに分けて計算します。半径はどちらも3cm。", formula: "体積 = 3×3×3.14×9 + 3×3×3.14×9×1/3 = 254.34+84.78 = 339.12cm³", state: { camPos: [14, 10, 18], camTarget: [0, 8, 0] } },
      ],
    },
    {
      id: "water", name: "⑫ 水位・おもり", type: "water",
      source: "単元43-③(p.79)/水の深さ",
      params: { W: 20, D: 12, H: 14, waterVol: 840, baseArea: 240, wSide: 10, wCount: 2, wAreaSum: 200 },
      base: {
        camPos: [24, 14.5, 30], camTarget: [0, 7, 0],
        weightY: 17.5, wVis: 0, tenLine: 0,
      },
      steps: [
        { dur: 1.4, caption: "底面積240cm²の容器に、深さ3.5cmまで水が入っています。", formula: "水の体積 = 240×3.5 = 840cm³" },
        { dur: 3.4, caption: "1辺10cmの立方体のおもりを2個、静かに沈めます。おもりが水に入った分だけ、水面が押し上げられて上がります。", state: { wVis: 1, weightY: 0, camPos: [23, 14, 29] } },
        { dur: 1.8, caption: "もし水面がおもりより低いままだとすると、水が入れる底面積は 240−200=40cm²。すると水の深さは840÷40=21cmになって、おもりの高さ10cmを超えてしまいます。", formula: "840÷(240−200) = 21cm > 10cm → おもりは完全に沈む!", state: { tenLine: 1, camPos: [19, 11.5, 27], camTarget: [0, 7, 0] } },
        { dur: 2.0, caption: "完全に沈むので、おもり2個の体積(2000cm³)がまるごと水を押し上げます。水面はおもりの上まで上がりました。", formula: "水の深さ = 3.5+2000÷240 = 11 5/6 cm", state: { tenLine: 0, camPos: [24, 14, 29], camTarget: [0, 6.8, 0] } },
      ],
    },
    {
      id: "water2", name: "⑬ 水位・仕切り", type: "water2",
      source: "単元44-①/仕切りのある容器(例: 60cm²と90cm²)",
      params: { wA: 6, wB: 9, D: 10, H: 15, hA: 12, hB: 6 },
      base: {
        camPos: [20, 13, 27], camTarget: [0, 6.5, 0],
        levelA: 12, levelB: 6, dividerY: 0,
      },
      steps: [
        { dur: 1.4, caption: "仕切りで2つに分かれた容器。左は底面積60cm²で深さ12cm、右は底面積90cm²で深さ6cm。仕切りを抜くと水面はどうなる?", formula: "水の量の合計 = 60×12+90×6 = 720+540 = 1260cm³" },
        { dur: 3.4, caption: "仕切りをスッと引き抜くと、水は左右を行き来できるようになって、水面の高さが1つにそろいます。", state: { dividerY: 17, levelA: 8.4, levelB: 8.4 } },
        { dur: 2.0, caption: "そろった水面の高さは、「水全部の量」÷「底面積の合計」で求められます。", formula: "水の深さ = 1260÷(60+90) = 8.4cm", state: { camPos: [17, 11, 25], camTarget: [0, 6, 0] } },
      ],
    },
    {
      id: "cubeNetCross", name: "⑭ 立方体の展開図(十字)", type: "cubeNet",
      source: "立体図形/展開図。例: 1辺6cmの立方体を十字型に開く",
      params: { size: 6, net: "cross" },
      base: { camPos: [17, 11, 21], camTarget: [0, 2.5, 2], t: 0 },
      steps: [
        { dur: 1.6, caption: "立方体の展開図は、切り開き方によって全部で11種類あります。まずはいちばん有名な形に開いてみましょう。ピンクの面が「ふた」です。" },
        { dur: 3.6, caption: "底面を残して、4つの横の面をパタン。ふたは前の面にくっついたまま、2段階でたおれていきます。", state: { t: 1, camPos: [14, 16, 20], camTarget: [0, 0, 3] } },
        { dur: 2.6, caption: "真上から見ると「十字型」。ふた(ピンク)と底(こい色)のように、向かい合っていた面は、展開図では1つ飛ばしの位置に並びます。", formula: "向かい合う面 = 展開図でとなり合わない(1マス飛ばし)", state: { camPos: [0.5, 34, 3.2], camTarget: [0, 0, 3] } },
        { dur: 3.0, caption: "たたむとちゃんと立方体にもどります。展開図を見たら「どの面とどの面が向かい合うか」を考えるのがコツ。", state: { t: 0, camPos: [17, 11, 21], camTarget: [0, 2.5, 2] } },
      ],
    },
    {
      id: "cubeNetStairs", name: "⑮ 立方体の展開図(階段)", type: "cubeNet",
      source: "立体図形/展開図。例: 同じ立方体を階段型に開く",
      params: { size: 6, net: "stairs" },
      base: { camPos: [17, 11, 21], camTarget: [0, 2.5, 0], t: 0 },
      steps: [
        { dur: 1.6, caption: "同じ立方体でも、切り開く辺を変えると別の展開図になります。今度は面を「数珠つなぎ」にして開いてみます。ピンクの面が「ふた」。" },
        { dur: 3.6, caption: "面が面を引き連れて、ジグザグにたおれていきます。ふたは3段階の回転で、いちばん遠くまで運ばれます。", state: { t: 1, camPos: [16, 16, 18], camTarget: [3, 0, 0] } },
        { dur: 2.6, caption: "真上から見ると「階段型」。これも11種類の展開図のうちの1つです。形はちがっても、たためば同じ立方体。", formula: "立方体の展開図は 全部で11種類", state: { camPos: [3.2, 34, 0.5], camTarget: [3, 0, 0] } },
        { dur: 3.0, caption: "たたんで確認。十字・T字・階段…展開図のパターンに慣れると、「面の位置関係」がすぐに読めるようになります。", state: { t: 0, camPos: [17, 11, 21], camTarget: [0, 2.5, 0] } },
      ],
    },
    {
      id: "pyramidVolume", name: "⑯ すいの体積はなぜ×1/3", type: "pyramidVolume",
      source: "立体図形/体積。例: 1辺6cmの立方体を3つのすいに分ける",
      params: { size: 6 },
      base: { camPos: [15, 10, 19], camTarget: [0, 2.5, 0], sep: 0 },
      steps: [
        { dur: 1.8, caption: "すい(とがった立体)の体積の公式には「×1/3」がつきます。なぜ1/3なのか、1辺6cmの立方体で確かめましょう。", formula: "すいの体積 = 底面積 × 高さ × 1/3 …なぜ?" },
        { dur: 3.6, caption: "立方体を、1つのかど(左おくの上の頂点)から3方向に切り分けると…まったく同じ形の四角すいが3つ現れます!", state: { sep: 1, camPos: [18, 13, 22], camTarget: [3, 2, 3] } },
        { dur: 2.8, caption: "3つとも「底面6×6の正方形、高さ6cm、頂点がかどの真上」の合同な四角すい。立方体を3人で山分けした形です。", formula: "すい1つ = 216 ÷ 3 = 72cm³", state: { camPos: [21, 8, 14], camTarget: [3, 2, 3] } },
        { dur: 3.2, caption: "もとにもどすと、ぴったり立方体。だから四角すいの体積は「立方体(底面積×高さ)の1/3」。これが公式の正体です。", formula: "底面積×高さ×1/3 = 6×6×6×1/3 = 72cm³", state: { sep: 0, camPos: [15, 10, 19], camTarget: [0, 2.5, 0] } },
      ],
    },
  ];
}

// ------------------------------------------------------------
// エンジン (状態補間プレイヤー)
// ------------------------------------------------------------
