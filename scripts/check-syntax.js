#!/usr/bin/env node
/* 全 src/*.js の構文チェック(node --check 相当)。使い方: node scripts/check-syntax.js */
const fs = require("fs");
const path = require("path");
const vm = require("vm");

const SRC = path.resolve(__dirname, "..", "src");
let fails = 0;

function walk(dir) {
  for (const name of fs.readdirSync(dir)) {
    const p = path.join(dir, name);
    if (fs.statSync(p).isDirectory()) walk(p);
    else if (name.endsWith(".js")) check(p);
  }
}
function check(p) {
  const code = fs.readFileSync(p, "utf8");
  try {
    new vm.Script(code, { filename: p }); // パースのみ(実行しない)
    console.log("OK  " + path.relative(SRC, p));
  } catch (e) {
    console.log("ERR " + path.relative(SRC, p) + ": " + e.message);
    fails++;
  }
}
walk(SRC);
console.log(fails === 0 ? "\n構文チェック: 全ファイルOK" : `\n${fails}件のエラー`);
process.exit(fails === 0 ? 0 : 1);
