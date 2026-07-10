// ==== 3D描画ヘルパー(Three.js依存。3Dビルダーが使う) ====
"use strict";


function polysToGeometry(faces) {
  const pos = [];
  for (const f of faces) for (let i = 1; i < f.length - 1; i++) pos.push(...f[0], ...f[i], ...f[i + 1]);
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  g.computeVertexNormals();
  return g;
}

function polysToEdges(faces) {
  const pos = [];
  for (const f of faces) for (let i = 0; i < f.length; i++) pos.push(...f[i], ...f[(i + 1) % f.length]);
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  return g;
}

function solidMat(color) {
  return new THREE.MeshStandardMaterial({ color, flatShading: true, side: THREE.DoubleSide, roughness: 0.9, metalness: 0 });
}

function makeLabel(text, opts = {}) {
  const { color = "#24354d", fontPx = 46, world = 1.3, weight = "bold" } = opts;
  const sp = new THREE.Sprite(new THREE.SpriteMaterial({ transparent: true, depthTest: false }));
  sp.userData = { color, fontPx, world, weight, text: null };
  setLabelText(sp, text);
  return sp;
}

function setLabelText(sp, text) {
  const u = sp.userData;
  if (u.text === text) return;
  u.text = text;
  const pad = 14;
  const cv = document.createElement("canvas");
  let ctx = cv.getContext("2d");
  const font = `${u.weight} ${u.fontPx}px "Hiragino Kaku Gothic ProN","Hiragino Sans","Yu Gothic",sans-serif`;
  ctx.font = font;
  const w = Math.ceil(ctx.measureText(text).width) + pad * 2;
  const h = u.fontPx + pad * 2;
  cv.width = w; cv.height = h;
  ctx = cv.getContext("2d");
  ctx.font = font;
  ctx.fillStyle = u.color;
  ctx.textBaseline = "middle";
  ctx.fillText(text, pad, h / 2 + 2);
  if (sp.material.map) sp.material.map.dispose();
  const tex = new THREE.CanvasTexture(cv);
  tex.minFilter = THREE.LinearFilter;
  sp.material.map = tex;
  sp.material.needsUpdate = true;
  sp.scale.set((u.world * w) / h, u.world, 1);
}

/* 寸法線: 辺(a-b)から dir 方向に dist だけ離した位置に
   引き出し線2本 + 平行線 + ラベル を描く */
function makeDim(scene, a, b, opts) {
  const dir = vNorm(opts.dir);
  const off = vScale(dir, opts.dist ?? 1.0);
  const a2 = vAdd(a, off), b2 = vAdd(b, off);
  const mat = new THREE.LineBasicMaterial({ color: opts.color ?? COL.edge, transparent: true, opacity: 1 });
  const pts = [V3(a), V3(a2), V3(b), V3(b2), V3(a2), V3(b2)];
  const lines = new THREE.LineSegments(new THREE.BufferGeometry().setFromPoints(pts), mat);
  const label = makeLabel(opts.text, { color: opts.labelColor ?? "#24354d", world: opts.world ?? 0.95 });
  const mid = vScale(vAdd(a2, b2), 0.5);
  const lp = vAdd(mid, vScale(dir, 0.6));
  label.position.set(lp[0], lp[1], lp[2]);
  scene.add(lines, label);
  return {
    setOpacity(o) {
      mat.opacity = o; lines.visible = o > 0.01;
      label.material.opacity = o; label.visible = o > 0.01;
    },
  };
}

function addLights(scene) {
  scene.add(new THREE.AmbientLight(0xffffff, 0.66));
  const d1 = new THREE.DirectionalLight(0xffffff, 0.62);
  d1.position.set(6, 12, 8);
  scene.add(d1);
  const d2 = new THREE.DirectionalLight(0xffffff, 0.22);
  d2.position.set(-8, 5, -9);
  scene.add(d2);
}

function makeGrid(scene, size, div, cx, cz) {
  const grid = new THREE.GridHelper(size, div, COL.gridA, COL.gridB);
  grid.position.set(cx, -0.02, cz);
  scene.add(grid);
}

function disposeScene(scene) {
  scene.traverse((o) => {
    if (o.geometry) o.geometry.dispose();
    if (o.material) {
      const ms = Array.isArray(o.material) ? o.material : [o.material];
      ms.forEach((m) => { if (m.map) m.map.dispose(); m.dispose(); });
    }
  });
}

const cubeFaceIdx = [
  [0,3,2,1],[4,5,6,7],[0,4,7,3],[1,2,6,5],[0,1,5,4],[3,7,6,2],
];
function boxVerts(x0, y0, z0, x1, y1, z1) {
  return [
    [x0,y0,z0],[x1,y0,z0],[x1,y1,z0],[x0,y1,z0],
    [x0,y0,z1],[x1,y0,z1],[x1,y1,z1],[x0,y1,z1],
  ];
}

// ------------------------------------------------------------
// ビルダー①: 立方体の切断 (正六角形)
// ------------------------------------------------------------

// ==== 追加ヘルパー(面倒し・素材) ====
function dynQuad(scene, mat) {
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.Float32BufferAttribute(new Float32Array(12), 3));
  geo.setIndex([0,1,2,0,2,3]);
  const mesh = new THREE.Mesh(geo, mat);
  const lineGeo = new THREE.BufferGeometry();
  lineGeo.setAttribute("position", new THREE.Float32BufferAttribute(new Float32Array(15), 3));
  const line = new THREE.Line(lineGeo, new THREE.LineBasicMaterial({ color: COL.edge }));
  scene.add(mesh, line);
  return {
    set(p0, p1, p2, p3) {
      const pa = mesh.geometry.attributes.position;
      pa.setXYZ(0, ...p0); pa.setXYZ(1, ...p1); pa.setXYZ(2, ...p2); pa.setXYZ(3, ...p3);
      pa.needsUpdate = true;
      mesh.geometry.computeVertexNormals();
      const la = line.geometry.attributes.position;
      la.setXYZ(0, ...p0); la.setXYZ(1, ...p1); la.setXYZ(2, ...p2); la.setXYZ(3, ...p3); la.setXYZ(4, ...p0);
      la.needsUpdate = true;
    },
  };
}

function collectMats(group) {
  const mats = [];
  group.traverse((o) => {
    if (o.material) {
      const ms = Array.isArray(o.material) ? o.material : [o.material];
      ms.forEach((m) => { m.transparent = true; mats.push(m); });
    }
  });
  return mats;
}

function sectorPoly(r, a0, a1, n, y) {
  const pts = [[0, y, 0]];
  for (let i = 0; i <= n; i++) {
    const a = a0 + (i / n) * (a1 - a0);
    pts.push([r * Math.cos(a), y, r * Math.sin(a)]);
  }
  return pts;
}

function redOverlayMat(op = 0) {
  return new THREE.MeshBasicMaterial({ color: 0xe2574c, transparent: true, opacity: op, side: THREE.DoubleSide, depthWrite: false });
}

// ------------------------------------------------------------
// ビルダー: ひも(円すい 90°/60°)
// ------------------------------------------------------------
