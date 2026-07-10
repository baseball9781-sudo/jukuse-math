// ==== 共通ユーティリティ(バックエンド非依存) ====
"use strict";

const clamp01 = (x) => Math.max(0, Math.min(1, x));
const easeInOut = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const lerp = (a, b, t) => a + (b - a) * t;

// 3Dビルダー用: [x,y,z] → THREE.Vector3(three-helpers 側で THREE を使う)
const V3 = (a) => new THREE.Vector3(a[0], a[1], a[2]);
