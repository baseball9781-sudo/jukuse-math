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
  // ---- quizモード(v2) / solveモード(v3: なぞって解く。docs/V3_DESIGN.md) ----
  mode: "steps",        // "quiz" | "steps" | "solve"
  solve: null,          // { idx, await:"trace"|"input"|"done", tries }
  quizState: null,      // quizモードの現在の到達状態(ヒントアニメで進む)
  hintLevels: {},       // regionId → 何段階目まで見たか
  animQueue: [],        // ヒントのマイクロアニメの残りステップ
  overlay: null,        // { shape, until } なぞった領域のハイライト
  stroke: null,         // なぞり中の点列(ワールド座標)
};

// ---- 進捗(localStorage。進捗記録のみに使用可・読み失敗は無視) ----
const PROGRESS_KEY = "jukuse:progress";
function loadProgress() {
  try {
    const p = JSON.parse(localStorage.getItem(PROGRESS_KEY));
    return p && typeof p === "object" && !Array.isArray(p) ? p : {};
  } catch (e) { return {}; }
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
  App.stroke = null;   // なぞり途中のシナリオ切替で古いストロークを持ち越さない
  if (scn.v3) enterSolveMode();        // v3: なぞって解く
  else if (scn.quiz) enterQuizMode();  // v2: 問題ファースト+ヒント
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

// 注: hintLevels は「問題にもどる」でも維持する(仕様)。
// 解説まで見た子が同じ場所をなぞったら、続きの深さから出すため。
function enterQuizMode() {
  const scn = App.scenarios[App.scnIdx];
  App.mode = "quiz";
  App.animQueue = [];
  App.overlay = null;
  App.stroke = null;
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

// UI表示のモード切替(quiz: なぞり+答え / solve: なぞって解く / steps: コマ送り)
function syncModeUI() {
  const scn = App.scenarios[App.scnIdx];
  const quiz = App.mode === "quiz";
  const solve = App.mode === "solve";
  const hasProblem = !!scn.quiz || !!scn.v3;
  document.getElementById("stepctl").style.display = quiz || solve ? "none" : "flex";
  document.getElementById("quizctl").style.display = quiz || solve ? "flex" : "none";
  document.getElementById("quizhint").style.display = quiz || solve ? "block" : "none";
  document.getElementById("ansrow").style.display =
    (quiz && scn.quiz && scn.quiz.answer != null) ||
    (solve && App.solve && App.solve.await === "input") ? "flex" : "none";
  document.getElementById("toQuiz").style.display = !quiz && !solve && hasProblem ? "block" : "none";
  document.getElementById("exprList").style.display = solve ? "block" : "none";
  document.getElementById("palette").style.display = solve ? "flex" : "none";
}

// ==== solveモード(v3: なぞって解く) ====
function enterSolveMode() {
  const scn = App.scenarios[App.scnIdx];
  App.mode = "solve";
  App.animQueue = [];
  App.overlay = null;
  App.stroke = null;
  App.solve = { idx: 0, await: "trace", tries: 0 };
  App.quizState = deepClone(scn.base);
  scn.v3.steps.forEach((s, i) => { App.quizState[s.stateKey] = i === 0 ? 0.35 : 0; });
  App.to = deepClone(App.quizState);
  App.from = App.cur ? deepClone(App.cur) : deepClone(App.to);
  App.t = 0; App.dur = 0.6;
  document.getElementById("stepchip").textContent = "問題";
  document.getElementById("caption").textContent = scn.v3.question;
  document.getElementById("quizhint").textContent = `✍️ ${scn.v3.steps[0].prompt}`;
  const f = document.getElementById("formula");
  f.textContent = ""; f.style.display = "none";
  document.getElementById("dots").innerHTML = "";
  document.getElementById("answer").value = "";
  renderSolvePanel();
  syncModeUI();
}

// 式リスト(ワイプ出現)とパレットの描き直し
function renderSolvePanel(wipeCurrent) {
  const scn = App.scenarios[App.scnIdx];
  const v3 = scn.v3, sv = App.solve;
  const list = document.getElementById("exprList");
  list.innerHTML = "";
  v3.steps.forEach((s, i) => {
    if (i > sv.idx) return;                                   // 未来の式はまだ存在しない
    if (i === sv.idx && sv.await === "trace") return;         // なぞり前は出さない
    const row = document.createElement("div");
    const solved = i < sv.idx || sv.await === "done";
    row.className = "exprRow" + (solved ? " solved" : " current") + (i === sv.idx && wipeCurrent ? " wipe" : "");
    const num = `<b>${s.expr.answer}</b>`;
    row.innerHTML = `<span class="eno">${"①②③④⑤"[i] || i + 1}</span> ` +
      (solved ? s.expr.text.replace("□", num) : s.expr.text) +
      (solved ? `<span class="eunit">${s.expr.unit || ""}</span>` : "");
    list.appendChild(row);
  });
  // パレット: 最初の数 + これまでに導出した数
  const pal = document.getElementById("palette");
  pal.innerHTML = "";
  const chips = (v3.palette0 || []).map((n) => ({ n, derived: false }));
  v3.steps.forEach((s, i) => {
    if (i < sv.idx || sv.await === "done") (s.palette || []).forEach((n) => chips.push({ n, derived: true }));
  });
  chips.forEach((c) => {
    const el = document.createElement("span");
    el.className = "chip" + (c.derived ? " derived" : "");
    el.textContent = c.n;
    pal.appendChild(el);
  });
}

// なぞり終わり(solve): 現在ステップのお手本に忠実か判定
function onSolveStroke(stroke) {
  const scn = App.scenarios[App.scnIdx];
  const sv = App.solve;
  if (!sv || sv.await !== "trace") return;
  const step = scn.v3.steps[sv.idx];
  const bubble = document.getElementById("quizhint");
  const tr = step.trace;
  if (tracePasses(stroke, tr.path, tr.r, tr)) {
    App.quizState[step.stateKey] = 1;                 // 本描きに確定
    App.to = deepClone(App.quizState);
    App.from = App.cur ? deepClone(App.cur) : deepClone(App.to);
    App.t = 0; App.dur = 0.5;
    sv.await = "input";
    bubble.textContent = `💭 ${step.ask}`;
    renderSolvePanel(true);                            // 式が薄字でワイプ出現
    syncModeUI();
    const ans = document.getElementById("answer");
    ans.value = ""; ans.focus();
    return;
  }
  // 順番ちがい? 未来のステップのお手本に合っていたら教える
  const future = scn.v3.steps.slice(sv.idx + 1).some((s) => tracePasses(stroke, s.trace.path, s.trace.r, s.trace));
  bubble.textContent = future
    ? "順番があるよ! いま光っている点線からなぞろう。"
    : "うすい点線を、はしからはしまでゆっくりなぞってみよう。";
}

// solveの答え合わせ(1ステップぶんの計算)
function checkSolveAnswer(val) {
  const scn = App.scenarios[App.scnIdx];
  const sv = App.solve;
  const bubble = document.getElementById("quizhint");
  // なぞりが済んでいない段階の入力は受けない(なぞる=解く、が本体のため)
  if (!sv || sv.await !== "input") {
    if (sv && sv.await === "trace") bubble.textContent = "まず、光っている点線をなぞってからだよ。";
    return;
  }
  const step = scn.v3.steps[sv.idx];
  const pr = markProgress(scn.id, {});
  if (Math.abs(val - step.expr.answer) < 1e-9) {
    sv.idx++;
    document.getElementById("answer").value = "";
    if (sv.idx >= scn.v3.steps.length) {
      sv.await = "done";
      App.quizState.done = 1;
      markProgress(scn.id, { solved: true, tries: pr.tries + 1 });
      bubble.textContent = scn.v3.closing || "🎉 とけた!";
      renderProblemTabs(); syncTabs();
    } else {
      sv.await = "trace";
      const next = scn.v3.steps[sv.idx];
      App.quizState[next.stateKey] = 0.35;             // 次のお手本を薄く出す
      bubble.textContent = `✍️ ${next.prompt}`;
    }
    App.to = deepClone(App.quizState);
    App.from = App.cur ? deepClone(App.cur) : deepClone(App.to);
    App.t = 0; App.dur = 0.5;
    renderSolvePanel();
    syncModeUI();
  } else {
    markProgress(scn.id, { tries: pr.tries + 1 });
    bubble.textContent = "おしい! もう一度、式を見ながら計算してみよう。";
  }
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
    // アニメは常に問題の初期状態(quiz.state)から再生する(スキーマの前提。
    // 別regionのアニメの続きから始まると逆向きに動いて混乱するため)
    App.quizState = quizBaseState(scn);
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
  App.stroke = null;
  App.stepIdx = 0;
  gotoStep(0, 0.8);
  syncModeUI();
}

// 答え合わせ(演習): 正解→記録、まちがい→なぞり導線へ
function checkAnswer() {
  const scn = App.scenarios[App.scnIdx];
  // 全角数字・全角小数点も受け付ける(子どものタブレット入力対策)
  const raw = document.getElementById("answer").value.trim()
    .replace(/[０-９]/g, (c) => String.fromCharCode(c.charCodeAt(0) - 0xfee0))
    .replace(/[。．]/g, ".").replace(/[−ー]/g, "-");
  const bubble = document.getElementById("quizhint");
  if (!/^-?\d+(\.\d+)?$/.test(raw)) { bubble.textContent = "数字を入れてから「答え合わせ」を押してね。"; return; }
  const val = parseFloat(raw);
  if (App.mode === "solve") { checkSolveAnswer(val); return; }
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
  let activeId = null; // 開始したポインターだけを追う(マルチタッチの混線防止)
  stageEl.addEventListener("pointerdown", (ev) => {
    if ((App.mode !== "quiz" && App.mode !== "solve") || App.backend.kind !== "canvas2d" || activeId != null) return;
    const p = strokePoint(ev);
    if (!p) return;
    App.stroke = [p];
    activeId = ev.pointerId;
    try { stageEl.setPointerCapture(ev.pointerId); } catch (e) { /* 合成イベント等では失敗してよい */ }
  });
  stageEl.addEventListener("pointermove", (ev) => {
    if (!App.stroke || ev.pointerId !== activeId) return;
    const p = strokePoint(ev);
    if (!p) return;
    const last = App.stroke[App.stroke.length - 1];
    const minStep = 6 / (App.bctx.lastView.scale || 24); // 6pxごとにサンプリング
    if (Math.hypot(p[0] - last[0], p[1] - last[1]) >= minStep) App.stroke.push(p);
  });
  const finish = (ev) => {
    if (ev.pointerId !== activeId) return;
    activeId = null;
    if (!App.stroke) return;
    const scn = App.scenarios[App.scnIdx];
    const stroke = App.stroke; App.stroke = null;
    if (App.mode === "solve" && scn.v3) { onSolveStroke(stroke); return; }
    if (App.mode !== "quiz" || !scn.quiz || !scn.quiz.regions) return;
    const region = pickRegion(stroke, scn.quiz.regions);
    if (region) onRegionHit(region);
  };
  stageEl.addEventListener("pointerup", finish);
  stageEl.addEventListener("pointercancel", (ev) => { if (ev.pointerId === activeId) { activeId = null; App.stroke = null; } });
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
  document.getElementById("toQuiz").onclick = () => {
    const scn = App.scenarios[App.scnIdx];
    if (scn.v3) enterSolveMode(); else enterQuizMode();
  };
  document.getElementById("qreset").onclick = () => {
    if (App.mode === "solve") enterSolveMode(); else resetQuizFigure();
  };
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
  let lastW = 0, lastH = 0;
  const loop = (now) => {
    requestAnimationFrame(loop);
    const dt = Math.min((now - last) / 1000, 0.05);
    last = now;
    // 下のパネル(式リスト等)の伸縮でステージの大きさが変わったら追従する
    if (stageEl.clientWidth !== lastW || stageEl.clientHeight !== lastH) {
      lastW = stageEl.clientWidth; lastH = stageEl.clientHeight;
      if (App.backend) App.backend.resize();
    }
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
    // solve: いまなぞるべきお手本の始点を脈動させる(入口が分かるように)
    if (App.mode === "solve" && App.solve && App.solve.await === "trace") {
      const scn = App.scenarios[App.scnIdx];
      const step = scn.v3.steps[App.solve.idx];
      if (step) overlay = { dot: step.trace.path[0], alpha: 0.45 + 0.4 * Math.sin(now / 260) };
    }
    App.backend.frame(App.bctx, App.cur, overlay);
  };
  requestAnimationFrame(loop);
}

window.addEventListener("DOMContentLoaded", init);
