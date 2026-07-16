#!/usr/bin/env node
/* ============================================================
   実行時テスト: 全単元の全シナリオを全ステップ 1フレームずつ走らせ、
   ランタイムエラーを検出する。3Dは Three.js スタブ、2Dは Canvas スタブ。
   使い方: node test/runtime.test.js
   ============================================================ */
const fs = require("fs");
const path = require("path");
const vm = require("vm");
const { THREE } = require("./three-stub.js");
const { makeCtx2DStub } = require("./canvas-stub.js");
const { orderedFiles } = require("../scripts/build.js");

const SRC = path.resolve(__dirname, "..", "src");

// --- DOM / canvas スタブ ---
const canvasStub = () => ({
  width: 0, height: 0, style: {},
  getContext: (kind) => (kind === "2d" ? makeCtx2DStub() : {
    font: "", fillStyle: "", textBaseline: "",
    measureText: (t) => ({ width: (t ? t.length : 0) * 10 }), fillText: () => {},
  }),
  appendChild() {},
});
const sandbox = {
  THREE,
  window: { devicePixelRatio: 1, addEventListener: () => {} },
  document: {
    createElement: (t) => (t === "canvas" ? canvasStub() : { style: {}, appendChild() {} }),
    getElementById: () => ({ textContent: "", style: {}, innerHTML: "", disabled: false, appendChild() {}, onclick: null, clientWidth: 800, clientHeight: 600 }),
    querySelectorAll: () => [],
    addEventListener: () => {},
  },
  performance: { now: () => 0 },
  requestAnimationFrame: () => {},
  console,
};
sandbox.global = sandbox;
vm.createContext(sandbox);

// build.js と同じ順で結合。engine の DOMContentLoaded は発火しないので init は走らない。
let code = orderedFiles()
  .filter((f) => f !== "engine.js")            // engine は DOM 依存が多いので除外(ALL_SCENARIOS/BUILDERS は registry で作られる)
  .map((rel) => fs.readFileSync(path.join(SRC, rel), "utf8"))
  .join("\n");
// registry の const を testから参照できるよう globalThis へ退避
code = code.replace(/^const ALL_SCENARIOS =/m, "globalThis.__ALL = ");
code += "\nglobalThis.__BUILDERS = BUILDERS;";

vm.runInContext(code, sandbox, { filename: "bundle.js" });

const scenarios = sandbox.__ALL || sandbox.global.__ALL;
const builders = sandbox.__BUILDERS || sandbox.global.__BUILDERS;

// エンジンと同じ state マージ/補間(2Dの view など nested 対応)
function assignState(dst, src) {
  for (const k in src) {
    if (src[k] && typeof src[k] === "object" && !Array.isArray(src[k]))
      dst[k] = Object.assign(dst[k] && typeof dst[k] === "object" ? { ...dst[k] } : {}, src[k]);
    else dst[k] = src[k];
  }
  return dst;
}
function merged(scn, idx) {
  const s = JSON.parse(JSON.stringify(scn.base));
  for (let i = 0; i <= idx; i++) assignState(s, scn.steps[i].state || {});
  return s;
}

const g2d = makeG2D();
function makeG2D() {
  // 本物の makeG は sandbox 内にある。テストでは直接 draw に stub G を渡すため、
  // sandbox の makeG を使って本物の描画経路を通す(Canvasスタブ上で)。
  return null;
}

let fails = 0;
for (const scn of scenarios) {
  try {
    let handle, frame;
    if ((scn.render || "three") === "three") {
      const scene = new THREE.Scene();
      handle = builders[scn.type](scene, scn.params);
      frame = (st) => handle.update(st);
    } else {
      handle = builders[scn.type](scn.params);
      // 本物の makeG を通して Canvasスタブに描く
      const ctx = makeCtx2DStub();
      const screen = { w: 800, h: 600 };
      frame = (st) => {
        const v = st.view || {};
        const view = { ox: v.ox ?? 400, oy: v.oy ?? 300, scale: v.scale ?? 24, yUp: !!v.yUp, dpr: 1 };
        const G = sandbox.makeG(ctx, screen, view);
        G.clear();
        handle.draw(G, st, screen);
      };
    }
    for (let i = 0; i < scn.steps.length; i++) {
      const to = merged(scn, i);
      const from = i === 0 ? JSON.parse(JSON.stringify(scn.base)) : merged(scn, i - 1);
      // 中間フレーム(数値のみ0.5補間。view等nestも軽く)
      const mid = JSON.parse(JSON.stringify(to));
      for (const k in to) if (typeof to[k] === "number" && typeof from[k] === "number") mid[k] = (from[k] + to[k]) / 2;
      frame(mid);
      frame(to);
    }
    // ---- quiz(v2)の検証: スキーマ+ヒントアニメの実行時チェック ----
    if (scn.quiz) {
      const q = scn.quiz;
      if (!q.question) throw new Error("quiz.question がない");
      if (!Array.isArray(q.regions) || !q.regions.length) throw new Error("quiz.regions が空");
      const KINDS = new Set(["ask", "anime", "formula", "scenario"]);
      // 問題表示状態を描く
      const qs = JSON.parse(JSON.stringify(scn.base));
      assignState(qs, q.state || {});
      frame(qs);
      for (const r of q.regions) {
        if (!r.id || !r.shape || !["rect", "poly", "seg"].includes(r.shape.kind))
          throw new Error(`region ${r.id || "?"} の shape が不正`);
        const hints = (q.hints || {})[r.id];
        if (!hints || !hints.length) throw new Error(`region ${r.id} に hints がない`);
        for (const h of hints) {
          if (!KINDS.has(h.kind)) throw new Error(`region ${r.id} に不明な hint kind: ${h.kind}`);
          if (h.kind === "anime") {
            // ヒントアニメを quiz状態起点で1コマずつ実行
            const hs = JSON.parse(JSON.stringify(qs));
            for (const step of h.steps || []) {
              assignState(hs, step.state || {});
              frame(hs);
            }
          }
        }
      }
      // hints に対応しない region 参照がないか(逆方向)
      for (const key of Object.keys(q.hints || {})) {
        if (!q.regions.find((r) => r.id === key)) throw new Error(`hints.${key} に対応する region がない`);
      }
      console.log(`PASS  [${scn.unit}] ${scn.id} quiz(${q.regions.length} regions) OK`);
    }
    console.log(`PASS  [${scn.unit}] ${scn.id} (${scn.render}) 全${scn.steps.length}ステップ`);
  } catch (e) {
    console.log(`FAIL  [${scn.unit}] ${scn.id} (${scn.render}): ${e.message}`);
    console.log("      " + (e.stack.split("\n")[1] || "").trim());
    fails++;
  }
}
console.log(fails === 0 ? "\nALL SCENARIOS OK" : `\n${fails} SCENARIO(S) FAILED`);
process.exit(fails === 0 ? 0 : 1);
