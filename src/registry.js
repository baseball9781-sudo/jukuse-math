// ==== レジストリ: 全単元のシナリオとビルダーを1つに集約 ====
// 新しい単元を足したら、ここに (1)ビルダーマップ (2)シナリオ登録 (3)単元名 を追記する。
"use strict";

// 単元の表示名(タブに出る)
const UNIT_NAMES = {
  solid: "立体図形",
  plane: "平面図形",
  speed: "速さ",
  ratio: "割合と比",
  word: "文章題",
  cases: "場合の数",
};

// 各単元の定義: id, render(バックエンド), scenarios()（その単元のシナリオ配列を返す）
const UNITS = [
  { id: "solid", render: "three",    scenarios: makeSolidScenarios },
  { id: "plane", render: "canvas2d", scenarios: makePlaneScenarios },
  { id: "speed", render: "canvas2d", scenarios: makeSpeedScenarios },
  { id: "ratio", render: "canvas2d", scenarios: makeRatioScenarios },
  { id: "word",  render: "canvas2d", scenarios: makeWordScenarios },
  { id: "cases", render: "canvas2d", scenarios: makeCasesScenarios },
];

// ビルダーマップ: type → build関数。全単元ぶんをここに集める。
const BUILDERS = {
  // solid (3D)
  cut: buildCut, cutBlocks: buildCutBlocks, unfold: buildUnfold, pyramid: buildPyramidNet,
  cone: buildCone, string: buildString, cylinder: buildCylinder, sectorPrism: buildSectorPrism,
  proj: buildProj, notch: buildNotch, lathe: buildLathe, water: buildWater, water2: buildWater2,
  cubeNet: buildCubeNet, pyramidVolume: buildPyramidVolume,
  // plane (2D)
  movePoint: buildMovePoint, rolling: buildRolling,
  // speed (2D)
  travel: buildTravel, travelRound: buildTravelRound, stream: buildStream, passTrain: buildPassTrain,
  // ratio (2D)
  saltBalance: buildSaltBalance,
  // word (2D)
  turtleCrane: buildTurtleCrane, turtleCrane2: buildTurtleCrane2,
  // cases (2D)
  treeDiagram: buildTreeDiagram,
};

// 全シナリオをフラット化(unit/render を一括付与)
function buildAllScenarios() {
  const all = [];
  for (const u of UNITS) {
    for (const scn of u.scenarios()) {
      scn.unit = u.id;
      scn.render = scn.render || u.render;
      all.push(scn);
    }
  }
  return all;
}

const ALL_SCENARIOS = buildAllScenarios();
