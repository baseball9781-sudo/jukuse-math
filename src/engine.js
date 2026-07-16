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
  // ---- quizモード(v2: なぞる→段階ヒント。docs/CONCEPT.md) ----
  mode: "steps",        // "quiz" | "steps"
  quizState: null,      // quizモードの現在の到達状態(ヒントアニメで進む)
  hintLevels: {},       // regionId → 何段階目まで見たか
  animQueue: [],        // ヒントのマイクロアニメの残りステップ
  overlay: null,        // { shape, until } なぞった領域のハイライト
  stroke: null,         // なぞり中の点列(ワールド座標)
};

// ---- 進捗(localStorage。進捗記録のみに使用可・読み失敗は無視) ----
const PROGRESS_KEY = "jukuse:progress";
function loadProgress() {
  try { return JSON.parse(localStorage.getItem(PROGRESS_KEY)) || {}; } catch (e) { return {}; }
}
function saveProgress(p) {
  try { localStorage.setItem(PROGRESS_KEY, JSON.stringify(p)); } catch (e) { /* 保存できなくても本体は動く */ }
}
function markProgress(scnId, patch) {
  const p = loadProgress();
  p[scnId] = Object.assign(p[scnId] || { solved: false, tries: 0, hints: 0 }, patch);
  saveProgress(p);
  return p[scnId];
}

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
  App.hintLevels = {};
  App.animQueue = [];
  App.overlay = null;
  if (scn.quiz) enterQuizMode();       // quiz付きは「問題ファースト」
  else { App.mode = "steps"; gotoStep(0, 0.01); }
  syncModeUI();
  syncTabs();
  document.getElementById("src").textContent = scn.source || "";
}

// ---- quizモード ----
function quizBaseState(scn) {
  const s = deepClone(scn.base);
  if (scn.quiz.state) assignState(s, scn.quiz.state);
  return s;
}

function enterQuizMode() {
  const scn = App.scenarios[App.scnIdx];
  App.mode = "quiz";
  App.animQueue = [];
  App.overlay = null;
  App.quizState = quizBaseState(scn);
  App.to = deepClone(App.quizState);
  App.from = App.cur ? deepClone(App.cur) : deepClone(App.to);
  App.t = 0; App.dur = 0.6;
  document.getElementById("stepchip").textContent = "問題";
  document.getElementById("caption").textContent = scn.quiz.question;
  document.getElementById("quizhint").textContent = "わからないときは、図の気になるところを指でなぞってみよう。";
  const f = document.getElementById("formula");
  f.textContent = ""; f.style.display = "none";
  document.getElementById("dots").innerHTML = "";
  const ans = document.getElementById("answer");
  ans.value = "";
  document.getElementById("anslabel").textContent = scn.quiz.answerLabel || "答え";
  syncModeUI();
}

// UI表示のモード切替(quiz: なぞり+答え / steps: コマ送り)
function syncModeUI() {
  const scn = App.scenarios[App.scnIdx];
  const quiz = App.mode === "quiz";
  const hasQuiz = !!scn.quiz;
  document.getElementById("stepctl").style.display = quiz ? "none" : "flex";
  document.getElementById("quizctl").style.display = quiz ? "flex" : "none";
  document.getElementById("quizhint").style.display = quiz ? "block" : "none";
  document.getElementById("ansrow").style.display = quiz && scn.quiz && scn.quiz.answer != null ? "flex" : "none";
  document.getElementById("toQuiz").style.display = !quiz && hasQuiz ? "block" : "none";
}

// なぞり(またはタップ)で region がヒットしたとき: 次の段階のヒントを出す
function onRegionHit(region) {
  const scn = App.scenarios[App.scnIdx];
  const hints = (scn.quiz.hints || {})[region.id];
  if (!hints || !hints.length) return;
  const lv = Math.min((App.hintLevels[region.id] || 0) + 1, hints.length);
  App.hintLevels[region.id] = lv;
  const hint = hints[lv - 1];
  App.overlay = { shape: region.shape, until: performance.now() + 1800 };
  markProgress(scn.id, { hints: Math.max(lv, (loadProgress()[scn.id] || {}).hints || 0) });

  const bubble = document.getElementById("quizhint");
  const tag = `${region.label || "ここ"}(ヒント${lv}/${hints.length})`;
  if (hint.kind === "ask") {
    bubble.textContent = `💡 ${tag}: ${hint.text}`;
  } else if (hint.kind === "anime") {
    bubble.textContent = `💡 ${tag}: ${hint.caption || "動きをよく見て!"}`;
    App.animQueue = hint.steps.slice();
    nextQuizAnim();
  } else if (hint.kind === "formula") {
    bubble.textContent = `💡 ${tag}: 式で書くと…`;
    const f = document.getElementById("formula");
    f.textContent = hint.text; f.style.display = "block";
  } else if (hint.kind === "scenario") {
    switchToSteps();
  }
}

function nextQuizAnim() {
  if (!App.animQueue.length) return;
  const step = App.animQueue.shift();
  assignState(App.quizState, step.state || {});
  App.to = deepClone(App.quizState);
  App.from = App.cur ? deepClone(App.cur) : deepClone(App.to);
  App.t = 0;
  App.dur = step.dur || 1.4;
}

function resetQuizFigure() {
  const scn = App.scenarios[App.scnIdx];
  App.animQueue = [];
  App.quizState = quizBaseState(scn);
  App.to = deepClone(App.quizState);
  App.from = App.cur ? deepClone(App.cur) : deepClone(App.to);
  App.t = 0; App.dur = 0.8;
}

function switchToSteps() {
  App.mode = "steps";
  App.animQueue = [];
  App.overlay = null;
  App.stepIdx = 0;
  gotoStep(0, 0.8);
  syncModeUI();
}

// 答え合わせ(演習): 正解→記録、まちがい→なぞり導線へ
function checkAnswer() {
  const scn = App.scenarios[App.scnIdx];
  const raw = document.getElementById("answer").value.trim().replace("。", ".").replace("．", ".");
  const val = parseFloat(raw);
  const bubble = document.getElementById("quizhint");
  if (raw === "" || isNaN(val)) { bubble.textContent = "数字を入れてから「答え合わせ」を押してね。"; return; }
  const pr = markProgress(scn.id, {});
  if (Math.abs(val - scn.quiz.answer) < 1e-9) {
    markProgress(scn.id, { solved: true, tries: pr.tries + 1 });
    bubble.textContent = `🎉 正解! ${scn.quiz.answer}${scn.quiz.answerLabel ? "(" + scn.quiz.answerLabel + ")" : ""}。「解説を見る」で確かめよう。`;
    renderProblemTabs(); syncTabs();
  } else {
    markProgress(scn.id, { tries: pr.tries + 1 });
    bubble.textContent = "おしい! 図の「あやしいな」と思うところを指でなぞってみよう。ヒントが出るよ。";
  }
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

// ---- なぞり入力(2Dのみ)。画面座標→ワールド座標に直して蓄積 ----
function strokePoint(ev) {
  if (!App.bctx || !App.bctx.lastView) return null;
  const rect = stageEl.getBoundingClientRect();
  return screenToWorld(ev.clientX - rect.left, ev.clientY - rect.top, App.bctx.lastView);
}
function bindPointer() {
  stageEl.addEventListener("pointerdown", (ev) => {
    if (App.mode !== "quiz" || App.backend.kind !== "canvas2d") return;
    const p = strokePoint(ev);
    if (p) { App.stroke = [p]; stageEl.setPointerCapture(ev.pointerId); }
  });
  stageEl.addEventListener("pointermove", (ev) => {
    if (!App.stroke) return;
    const p = strokePoint(ev);
    if (!p) return;
    const last = App.stroke[App.stroke.length - 1];
    const minStep = 6 / (App.bctx.lastView.scale || 24); // 6pxごとにサンプリング
    if (Math.hypot(p[0] - last[0], p[1] - last[1]) >= minStep) App.stroke.push(p);
  });
  const finish = (ev) => {
    if (!App.stroke) return;
    const scn = App.scenarios[App.scnIdx];
    const stroke = App.stroke; App.stroke = null;
    if (!scn.quiz || !scn.quiz.regions) return;
    const region = pickRegion(stroke, scn.quiz.regions);
    if (region) onRegionHit(region);
  };
  stageEl.addEventListener("pointerup", finish);
  stageEl.addEventListener("pointercancel", () => { App.stroke = null; });
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
  const progress = loadProgress();
  unit.items.forEach((it) => {
    const b = document.createElement("button");
    b.className = "tab";
    const scn = App.scenarios[it.scnIndex];
    const solved = progress[scn.id] && progress[scn.id].solved;
    b.textContent = (solved ? "✓ " : "") + it.name;
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
  document.getElementById("toSteps").onclick = switchToSteps;
  document.getElementById("toQuiz").onclick = enterQuizMode;
  document.getElementById("qreset").onclick = resetQuizFigure;
  document.getElementById("check").onclick = checkAnswer;
  document.getElementById("answer").addEventListener("keydown", (e) => {
    if (e.key === "Enter") checkAnswer();
  });
  window.addEventListener("keydown", (e) => {
    if (e.target && e.target.tagName === "INPUT") return;
    if (App.mode !== "steps") return;
    if (e.key === "ArrowRight") document.getElementById("next").click();
    if (e.key === "ArrowLeft") document.getElementById("prev").click();
  });
  bindPointer();

  loadScenario(0);

  let last = performance.now();
  const loop = (now) => {
    requestAnimationFrame(loop);
    const dt = Math.min((now - last) / 1000, 0.05);
    last = now;
    if (App.t < 1) App.t = Math.min(1, App.t + dt / App.dur);
    else if (App.mode === "quiz" && App.animQueue.length) nextQuizAnim(); // ヒントアニメの次のコマへ
    App.cur = lerpStates(App.from, App.to, easeInOut(App.t));
    // なぞりハイライト(時間で消える)
    let overlay = null;
    if (App.overlay) {
      const remain = App.overlay.until - now;
      if (remain <= 0) App.overlay = null;
      else overlay = { shape: App.overlay.shape, alpha: Math.min(1, remain / 600) * 0.9 };
    }
    App.backend.frame(App.bctx, App.cur, overlay);
  };
  requestAnimationFrame(loop);
}

window.addEventListener("DOMContentLoaded", init);
