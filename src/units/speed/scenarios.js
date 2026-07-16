// ==== 単元: 速さ(2D / Canvas) ====
// registry で unit:"speed", render:"canvas2d" を一括付与される。
function makeSpeedScenarios() {
  // 出会い算: P(0)から4km/h、Q(12)から-6km/h(左へ)。出会い t=12/10=1.2h
  const meet1 = 12 / (4 + 6);
  // 追いつき算: 兄A 6km/h が 弟B 4km/h(先に2km地点)を追う。相対2km/h、差2km → 1h
  const meet2 = 2 / (6 - 4);
  // 往復: PQ=12km、A(6km/h,Pから)とB(4km/h,Qから)が往復。
  // 1回目=12÷10=1.2h(7.2km地点)。2回目=2人合わせて12×3km進んだとき=36÷10=3.6h(2.4km地点)
  const r1t = 12 / (6 + 4), r1d = 6 * r1t;
  const r2t = (12 * 3) / (6 + 4), r2d = 2 * 12 - 6 * r2t;

  // 高さ325pxでも、時間軸の上端（y=9.8）まで収まる縮尺。
  const baseView = { ox: 70, oy: 40, scale: 28, yUp: false };

  return [
    {
      id: "meet", name: "① 出会い算", type: "travel",
      source: "速さ/旅人算(出会い)。例: 12km・4km/hと6km/h",
      params: {
        dist: 12, tMax: 2,
        a: { name: "A", x0: 0, v: 4 },
        b: { name: "B", x0: 12, v: -6 },
        meetT: meet1,
      },
      base: {
        view: baseView,
        t: 0, roadY: 1.0, graphBase: 3.0, tScale: 3.4,
        gridX: 2, gridT: 0.5, tick: 12,
        showGraph: 1, showMeet: 1, meetLabel: "出会い",
      },
      quiz: {
        question: "PQ間は12km。AさんはPから時速4kmで、BさんはQから時速6kmで、同時に向かい合って出発します。2人が出会うのは何時間後でしょう?",
        answer: 1.2, answerLabel: "時間（時間）",
        state: { t: 0, showGraph: 0, showMeet: 0 },
        regions: [
          { id: "road", label: "道",
            shape: { kind: "rect", x: 0, y: 0.2, w: 12, h: 1.6 } },
          { id: "graph", label: "グラフ",
            shape: { kind: "rect", x: 0, y: 3, w: 12, h: 7 } },
        ],
        hints: {
          road: [
            { kind: "ask", text: "1時間たつと、2人の間は何kmちぢまるかな。Aは4km、Bは6km進むよ。" },
            { kind: "anime", caption: "1時間動かすと、2人の間は合わせて10kmちぢまる。",
              steps: [{ dur: 2.4, state: { t: 0.5 } }] },
            { kind: "formula", text: "出会う時間 ＝ 12 ÷（4＋6）" },
            { kind: "scenario" },
          ],
          graph: [
            { kind: "ask", text: "グラフの2本の線が交わったところが「出会い」。線を出してみようか。" },
            { kind: "anime", caption: "2本の線がだんだん近づいて…交わった所が出会う瞬間!",
              steps: [{ dur: 2.6, state: { t: 0.6, showGraph: 1, showMeet: 1 } }] },
            { kind: "formula", text: "12 ÷（4＋6）＝ 1.2（時間後）" },
            { kind: "scenario" },
          ],
        },
      },
      steps: [
        { dur: 1.4, caption: "PQ間は12km。AさんはPから時速4kmで、BさんはQから時速6kmで、同時に向かい合って出発します。何時間後に出会う?", state: { t: 0, showGraph: 0, showMeet: 0 } },
        { dur: 4.0, caption: "2人が近づいていきます。下のグラフは、横が「PからのDistance(距離)」、縦が「時間」。2本の線が近づいて、交わったところが出会う瞬間です。", state: { t: meet1 / 2, showGraph: 1 } },
        { dur: 3.0, caption: "線が交わりました! 2人の間の12kmが、1時間に (4+6)=10km ずつちぢまるから、出会うのは 12÷10 時間後。", formula: "出会う時間 = 12 ÷ (4+6) = 1.2 時間後", state: { t: meet1, showMeet: 1 } },
        { dur: 2.2, caption: "そのまま進むと2人はすれちがい、線は交わったあと離れていきます。「近づく速さ=速さの和」がポイント。", state: { t: 2 } },
      ],
    },
    {
      id: "catchup", name: "② 追いつき算", type: "travel",
      source: "速さ/旅人算(追いつき)。例: 6km/hが4km/hを追う",
      params: {
        dist: 12, tMax: 3,
        a: { name: "兄", x0: 0, v: 6 },
        b: { name: "弟", x0: 2, v: 4 },
        meetT: meet2,
      },
      base: {
        view: baseView,
        t: 0, roadY: 1.0, graphBase: 3.0, tScale: 2.3,
        gridX: 2, gridT: 0.5, tick: 12,
        showGraph: 1, showMeet: 1, meetLabel: "追いつく",
      },
      steps: [
        { dur: 1.4, caption: "弟がP地点から2km進んだところに先にいます。そこへ兄が時速6kmで、弟は時速4kmで、同じ向きに進みます。兄が弟に追いつくのは何時間後?", state: { t: 0, showGraph: 0, showMeet: 0 } },
        { dur: 4.0, caption: "兄(赤)のほうが速いので、だんだん差がちぢまります。グラフでは、下から出た兄の線が、弟の線においつくのが「追いつく」瞬間。", state: { t: meet2 / 2, showGraph: 1 } },
        { dur: 3.0, caption: "追いつきました! 差の2kmが、1時間に (6−4)=2km ずつちぢまるから、追いつくのは 2÷2 時間後。", formula: "追いつく時間 = 2 ÷ (6−4) = 1 時間後", state: { t: meet2, showMeet: 1 } },
        { dur: 2.2, caption: "追いついたあとは兄が前に出ます。「追いつく速さ=速さの差」がポイント。出会いは「和」、追いつきは「差」。", state: { t: 2.4 } },
      ],
    },
    {
      id: "roundTrip", name: "③ 往復と2回目の出会い", type: "travelRound",
      source: "速さ/旅人算(往復)。例: 12km・6km/hと4km/hが往復",
      params: {
        dist: 12, tMax: 4.8,
        a: { name: "A", v: 6, from: "P" },
        b: { name: "B", v: 4, from: "Q" },
        meets: [
          { t: r1t, d: r1d, label: "1回目" },
          { t: r2t, d: r2d, label: "2回目" },
        ],
      },
      base: {
        view: { ox: 100, oy: 285, scale: 21, yUp: true },
        t: 0, xScale: 3,
        showGraph: 1, showMeet1: 0, showMeet2: 0,
      },
      steps: [
        { dur: 1.6, caption: "PQ間は12km。AはPから時速6km、BはQから時速4kmで同時に出発し、向こう岸に着いたらすぐ折り返します。2回目に出会うのは何時間後?", state: { t: 0, showGraph: 0 } },
        { dur: 3.0, caption: "まず1回目の出会い。2人合わせて12km進んだときだから、12÷(6+4)=1.2時間後です。ダイヤグラムでは2本の線の交点。", formula: "1回目 = 12 ÷ (6+4) = 1.2時間後", state: { t: r1t / 4.8, showGraph: 1, showMeet1: 1 } },
        { dur: 3.0, caption: "すれちがった2人は、そのまま進んで折り返します。Aは2時間でQに、Bは3時間でPに着いて引き返すので、グラフは山型の折れ線になります。", state: { t: 3.2 / 4.8 } },
        { dur: 3.4, caption: "2回目の出会い! ここまでに2人が進んだ道のりを合わせると、ちょうどPQ3つ分(12×3=36km)。だから1回目の3倍の時刻になります。", formula: "2回目 = (12×3) ÷ (6+4) = 3.6時間後 (1.2時間の3倍!)", state: { t: r2t / 4.8, showMeet2: 1 } },
        { dur: 2.4, caption: "「出会うたびに、2人の合計は 1本分 → 3本分 → 5本分…」。往復の出会いは、合わせた道のりがPQ何本分かで数えるのがコツです。", state: { t: 1 } },
      ],
    },
    {
      id: "stream", name: "④ 流水算", type: "stream",
      source: "速さ/流水算。例: 静水時速8km・流れ時速2km・30km",
      params: { dist: 30, still: 8, cur: 2, tDown: 30 / (8 + 2), tUp: 30 / (8 - 2) },
      base: {
        view: { ox: 90, oy: 312, scale: 22, yUp: true },
        t: 0, riverY: 10, rs: 0.45, xScale: 1.6, dScale: 0.2, graphY: 0,
        showArrows: 0, showGraph: 0,
      },
      steps: [
        { dur: 1.8, caption: "静水(流れのない水)なら時速8kmで進む船が、流れの速さ時速2kmの川を、A(上流)からB(下流)まで30km下り、またAまで上ります。それぞれ何時間かかる?" },
        { dur: 3.4, caption: "下りは、流れが船のせなかを押してくれるので速くなります。黒い矢印(静水の速さ)に青い矢印(流れ)がたし算されて、時速10km。", formula: "下りの速さ = 8 + 2 = 10km/h → 30 ÷ 10 = 3時間", state: { t: 3 / 8, showArrows: 1, showGraph: 1 } },
        { dur: 4.0, caption: "上りは、流れに逆らうので今度はひき算。時速6kmしか出せず、同じ30kmなのに5時間かかります。グラフの傾きがゆるくなるのに注目!", formula: "上りの速さ = 8 − 2 = 6km/h → 30 ÷ 6 = 5時間", state: { t: 1 } },
        { dur: 2.8, caption: "逆に、下りと上りの速さが分かれば「静水の速さ=(和)÷2」「流れの速さ=(差)÷2」と和差算でもどせます。流水算はたし算・ひき算の往復です。", formula: "静水 = (10+6)÷2 = 8km/h  /  流れ = (10−6)÷2 = 2km/h" },
      ],
    },
    {
      id: "passTrain", name: "⑤ 通過算", type: "passTrain",
      source: "速さ/通過算。例: 長さ200mの列車が600mの橋を秒速20mで",
      params: { trainLen: 200, bridgeLen: 600, v: 20, ans: (600 + 200) / 20 },
      base: {
        view: { ox: 150, oy: 185, scale: 30, yUp: true },
        front: -120, ms: 0.015,
        showGhost: 0, showDist: 0, showAns: 0,
      },
      quiz: {
        question: "長さ200mの列車が、秒速20mで長さ600mの橋をわたります。わたり始めてから、わたり終わるまで何秒かかるでしょう?",
        answer: 40, answerLabel: "時間（秒）",
        state: { front: 0, showGhost: 1 },   // 「わたり始め」の瞬間から考えさせる
        regions: [
          { id: "bridge", label: "橋",
            shape: { kind: "rect", x: 0, y: -1.4, w: 9, h: 1.6 } },
          { id: "train", label: "列車",
            shape: { kind: "rect", x: -3.2, y: 0, w: 3.4, h: 1.8 } },
        ],
        hints: {
          bridge: [
            { kind: "ask", text: "「わたり終わり」は、列車のどこが橋を出た瞬間かな。先頭? 最後尾?" },
            { kind: "anime", caption: "最後尾が橋を出るまで動かすと…先頭は橋のむこう200m先!",
              steps: [{ dur: 2.8, state: { front: 800, showDist: 1 } }] },
            { kind: "formula", text: "先頭が進む道のり ＝ 橋600m ＋ 列車200m" },
            { kind: "scenario" },
          ],
          train: [
            { kind: "ask", text: "列車には長さが200mあるよ。先頭が橋を出ても、わたり終わりじゃないのはなぜ?" },
            { kind: "formula", text: "時間 ＝（600＋200）÷ 20" },
            { kind: "scenario" },
          ],
        },
      },
      steps: [
        { dur: 1.8, caption: "長さ200mの列車が、秒速20mで長さ600mの橋をわたります。わたり始めてから、わたり終わるまで何秒かかるでしょう?" },
        { dur: 2.4, caption: "「わたり始め」は、先頭(赤い点)が橋に入った瞬間です。この位置を覚えておきましょう(点線)。", state: { front: 0, showGhost: 1 } },
        { dur: 4.2, caption: "「わたり終わり」は、最後尾が橋を出た瞬間。先頭はもう橋のむこう200m先まで進んでいます!", state: { front: 800, showDist: 1 } },
        { dur: 3.0, caption: "先頭が進んだ道のりは「橋の長さ+列車の長さ」。通過算は、列車自身の長さの分だけよけいに走るのがポイントです。", formula: "時間 = (600 + 200) ÷ 20 = 40秒", state: { showAns: 1 } },
      ],
    },
  ];
}
