// ==== 再生エンジン(バックエンド非依存の状態補間プレイヤー) ====
// 3D(Three.js)と2D(Canvas)を同じ仕組みで扱う。
// シナリオは registry.js が全単元ぶん集めて ALL_SCENARIOS / BUILDERS に入れる。
"use strict";

const App = {
  scenarios: [],   // フラット化した全シナリオ
  units: [],       // [{id, name, items:[{scnIndex, name}]}]
  scnIdx: 0, stepIdx: 0,
  bctx: null, backend: null,
  from: null, to: null, cur: null, t: 1, dur: 1.4,
};

let stageEl, backends;

function mergedState(scn, idx) {
  const s = deepClone(scn.base);
  for (let i = 0; i <= idx; i++) assignState(s, scn.steps[i].state || {});
  return s;
}
// view のようなネストオブジェクトも上書きマージ
function assignState(dst, src) {
  for (const k in src) {
    if (src[k] && typeof src[k] === "object" && !Array.isArray(src[k])) {
      dst[k] = Object.assign(dst[k] && typeof dst[k] === "object" ? { ...dst[k] } : {}, src[k]);
    } else dst[k] = src[k];
  }
  return dst;
}
function deepClone(o) {
  const r = {};
  for (const k in o) {
    if (Array.isArray(o[k])) r[k] = o[k].slice();
    else if (o[k] && typeof o[k] === "object") r[k] = { ...o[k] };
    else r[k] = o[k];
  }
  return r;
}

function lerpStates(a, b, t) {
  const out = {};
  for (const k in b) {
    const vb = b[k], va = k in a ? a[k] : vb;
    if (Array.isArray(vb)) out[k] = vb.map((x, i) => (va[i] != null ? va[i] : x) + (x - (va[i] != null ? va[i] : x)) * t);
    else if (typeof vb === "number") out[k] = (typeof va === "number" ? va : vb) + (vb - (typeof va === "number" ? va : vb)) * t;
    else if (vb && typeof vb === "object") out[k] = lerpStates(va && typeof va === "object" ? va : vb, vb, t); // view等
    else out[k] = vb;
  }
  return out;
}

function loadScenario(i) {
  const scn = App.scenarios[i];
  const nextBackend = backends[scn.render || "three"];
  // 別バックエンドに切り替わるなら前のを隠す
  if (App.backend && App.backend !== nextBackend) App.backend.show(false);
  if (App.backend) App.backend.dispose(App.bctx);
  App.backend = nextBackend;
  App.backend.show(true);
  App.backend.resize();

  App.scnIdx = i;
  App.bctx = App.backend.load(scn, BUILDERS);
  App.cur = null;
  App.stepIdx = 0;
  gotoStep(0, 0.01);
  syncTabs();
  document.getElementById("src").textContent = scn.source || "";
}

function gotoStep(idx, dur) {
  const scn = App.scenarios[App.scnIdx];
  App.stepIdx = idx;
  App.to = mergedState(scn, idx);
  App.from = App.cur ? deepClone(App.cur) : deepClone(App.to);
  App.t = 0;
  App.dur = dur ?? scn.steps[idx].dur ?? 1.4;
  const st = scn.steps[idx];
  document.getElementById("stepchip").textContent = `手順 ${idx + 1} / ${scn.steps.length}`;
  document.getElementById("caption").textContent = st.caption;
  const f = document.getElementById("formula");
  f.textContent = st.formula || "";
  f.style.display = st.formula ? "block" : "none";
  document.getElementById("prev").disabled = idx === 0;
  document.getElementById("next").disabled = idx === scn.steps.length - 1;
  document.getElementById("dots").innerHTML =
    scn.steps.map((_, j) => `<span class="dot${j <= idx ? " on" : ""}"></span>`).join("");
}

function replayStep() {
  const scn = App.scenarios[App.scnIdx];
  const idx = App.stepIdx;
  App.cur = idx === 0 ? deepClone(scn.base) : mergedState(scn, idx - 1);
  gotoStep(idx);
}

// ---- 単元(unit) → 問題(problem) の2階層タブ ----
function buildUnitIndex() {
  const map = new Map();
  App.scenarios.forEach((s, idx) => {
    const uid = s.unit || "misc";
    if (!map.has(uid)) map.set(uid, { id: uid, name: UNIT_NAMES[uid] || uid, items: [] });
    map.get(uid).items.push({ scnIndex: idx, name: s.name });
  });
  App.units = [...map.values()];
}

function currentUnitId() { return App.scenarios[App.scnIdx].unit || "misc"; }

function renderUnitTabs() {
  const row = document.getElementById("units");
  row.innerHTML = "";
  App.units.forEach((u) => {
    const b = document.createElement("button");
    b.className = "unit";
    b.textContent = u.name;
    b.onclick = () => loadScenario(u.items[0].scnIndex);
    row.appendChild(b);
  });
}

function renderProblemTabs() {
  const uid = currentUnitId();
  const unit = App.units.find((u) => u.id === uid);
  const row = document.getElementById("tabs");
  row.innerHTML = "";
  unit.items.forEach((it) => {
    const b = document.createElement("button");
    b.className = "tab";
    b.textContent = it.name;
    b.onclick = () => loadScenario(it.scnIndex);
    row.appendChild(b);
  });
}

function syncTabs() {
  const uid = currentUnitId();
  renderProblemTabs();
  document.querySelectorAll("#units .unit").forEach((el, i) =>
    el.classList.toggle("active", App.units[i].id === uid));
  const unit = App.units.find((u) => u.id === uid);
  document.querySelectorAll("#tabs .tab").forEach((el, i) =>
    el.classList.toggle("active", unit.items[i].scnIndex === App.scnIdx));
}

function init() {
  stageEl = document.getElementById("stage");
  backends = {
    three: makeThreeBackend(stageEl),
    canvas2d: makeCanvas2DBackend(stageEl),
  };
  // 初期は両方非表示(loadScenarioで必要な方をshow)
  backends.three.show(false);
  backends.canvas2d.show(false);

  App.scenarios = ALL_SCENARIOS;
  buildUnitIndex();
  renderUnitTabs();

  window.addEventListener("resize", () => App.backend && App.backend.resize());
  document.getElementById("next").onclick = () => {
    if (App.stepIdx < App.scenarios[App.scnIdx].steps.length - 1) gotoStep(App.stepIdx + 1);
  };
  document.getElementById("prev").onclick = () => {
    if (App.stepIdx > 0) gotoStep(App.stepIdx - 1, 1.0);
  };
  document.getElementById("replay").onclick = replayStep;
  window.addEventListener("keydown", (e) => {
    if (e.key === "ArrowRight") document.getElementById("next").click();
    if (e.key === "ArrowLeft") document.getElementById("prev").click();
  });

  loadScenario(0);

  let last = performance.now();
  const loop = (now) => {
    requestAnimationFrame(loop);
    const dt = Math.min((now - last) / 1000, 0.05);
    last = now;
    if (App.t < 1) App.t = Math.min(1, App.t + dt / App.dur);
    App.cur = lerpStates(App.from, App.to, easeInOut(App.t));
    App.backend.frame(App.bctx, App.cur);
  };
  requestAnimationFrame(loop);
}

window.addEventListener("DOMContentLoaded", init);
