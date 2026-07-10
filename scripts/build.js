#!/usr/bin/env node
/* ============================================================
   ビルド: src/ を依存順に結合して 1枚の自己完結HTMLを dist/ に出力
   連結順が実行時の健全性を保証する:
     math → core → render → units(builders→scenarios) → registry → engine
   使い方: node scripts/build.js
   ============================================================ */
const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const SRC = path.join(ROOT, "src");
const DIST = path.join(ROOT, "dist");

function read(rel) {
  const p = path.join(SRC, rel);
  if (!fs.existsSync(p)) throw new Error(`欠落: src/${rel}`);
  return `\n/* ===== src/${rel} ===== */\n` + fs.readFileSync(p, "utf8");
}

// 単元ディレクトリを列挙(builders/*.js → scenarios.js の順)
function unitFiles() {
  const unitsDir = path.join(SRC, "units");
  const files = [];
  for (const unit of fs.readdirSync(unitsDir).sort()) {
    const udir = path.join(unitsDir, unit);
    if (!fs.statSync(udir).isDirectory()) continue;
    const bdir = path.join(udir, "builders");
    if (fs.existsSync(bdir)) {
      for (const b of fs.readdirSync(bdir).filter((f) => f.endsWith(".js")).sort()) {
        files.push(path.join("units", unit, "builders", b));
      }
    }
    const scn = path.join(udir, "scenarios.js");
    if (fs.existsSync(scn)) files.push(path.join("units", unit, "scenarios.js"));
  }
  return files;
}

function orderedFiles() {
  return [
    "math.js",
    "core/util.js",
    "core/palette.js",
    "render/three-helpers.js",
    "render/canvas2d.js",
    "render/backend-three.js",
    ...unitFiles(),
    "registry.js",
    "engine.js",
  ];
}

function build() {
  const script = orderedFiles().map(read).join("\n");
  const head = fs.readFileSync(path.join(SRC, "shell-head.html"), "utf8");
  const foot = fs.readFileSync(path.join(SRC, "shell-foot.html"), "utf8");
  const html = head + script + "\n" + foot;
  if (!fs.existsSync(DIST)) fs.mkdirSync(DIST, { recursive: true });
  fs.writeFileSync(path.join(DIST, "index.html"), html);
  console.log(`ビルド完了: dist/index.html (${html.split("\n").length}行, ${(html.length / 1024).toFixed(0)}KB)`);
}

if (require.main === module) build();
module.exports = { orderedFiles, build };
