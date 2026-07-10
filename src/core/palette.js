// ==== 配色パレット(3D=hex / 2D=CSS文字列。同じ色を両方で共有) ====
// 配色ルール: モノトーン基調 / 赤=注目 / 青=水。新しい色を足さない。
"use strict";

// 3D(Three.js)用の16進
const COL = {
  solid: 0xeef1f5, solid2: 0xdfe4ea, cap: 0xf3d9d5,
  edge: 0x2c3a55, red: 0xd9463e, redSoft: 0xe4867d,
  water: 0x4e9ed9, glass: 0xd8dee6,
  gridA: 0xd6dce2, gridB: 0xe8ebef,
};

// 2D(Canvas)用のCSS文字列。COLと対応。
const C2D = {
  ink: "#24354d",       // 基本の線・文字(濃紺)
  edge: "#2c3a55",      // 図形の輪郭
  solid: "#eef1f5",     // 面の塗り(薄)
  solid2: "#dfe4ea",    // 面の塗り(やや濃)/ 区別用
  red: "#d9463e",       // 注目(点・強調線・答え)
  redSoft: "#e4867d",   // 注目(淡)
  redFill: "rgba(217,70,62,0.14)",   // 注目領域の塗り
  blue: "#356ba8",      // 補助の線・軸ラベル
  water: "#4e9ed9",     // 水
  waterFill: "rgba(78,158,217,0.42)",
  green: "#4a8f6d",     // 2本目の動点など(赤・青と区別)
  grid: "#e2e8ef",      // 方眼(細)
  gridBold: "#cdd7e2",  // 方眼(基準線)
  axis: "#8494a8",      // グラフの軸
  ghost: "#9aa7b8",     // 補助・軌跡
  paper: "#fbfcfd",     // 背景
};
