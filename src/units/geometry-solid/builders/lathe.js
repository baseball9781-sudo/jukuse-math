// ==== ビルダー: lathe ====
function buildLathe(scene, params) {
  makeGrid(scene, 36, 18, 0, 0);
  // 回した形 (長方形3x9 + 直角三角形 底3高さ9)
  const profPts = [[0,0,0],[3,0,0],[3,9,0],[0,18,0]];
  const profMat = new THREE.MeshBasicMaterial({ color: 0xe2574c, transparent: true, opacity: 0.5, side: THREE.DoubleSide, depthWrite: false });
  scene.add(new THREE.Mesh(polysToGeometry([profPts]), profMat));
  const profLineMat = new THREE.LineBasicMaterial({ color: COL.red });
  scene.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints([...profPts.map(V3), V3(profPts[0])]), profLineMat));
  // 回転の軸 (点線)
  const axisMat = new THREE.LineDashedMaterial({ color: 0x40506a, dashSize: 0.5, gapSize: 0.32 });
  const axisLine = new THREE.Line(
    new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0,-1.2,0), new THREE.Vector3(0,19.5,0)]),
    axisMat
  );
  axisLine.computeLineDistances();
  scene.add(axisLine);

  const lathePts = [new THREE.Vector2(0.02,0), new THREE.Vector2(3,0), new THREE.Vector2(3,9), new THREE.Vector2(0.02,18)];
  const mat = solidMat(COL.solid);
  mat.transparent = true; mat.opacity = 0.92;
  const mesh = new THREE.Mesh(new THREE.LatheGeometry(lathePts, 48, 0, 0.01), mat);
  mesh.rotation.y = Math.PI / 2; // φ=0 を +x(断面図形の位置)に合わせる
  scene.add(mesh);
  // 回転の先端(動く輪郭)
  const sweepGeo = new THREE.BufferGeometry();
  sweepGeo.setAttribute("position", new THREE.Float32BufferAttribute(new Float32Array(12), 3));
  scene.add(new THREE.Line(sweepGeo, new THREE.LineBasicMaterial({ color: COL.edge })));

  let lastPhi = -1;
  return {
    update(st) {
      const phi = Math.max(st.t * Math.PI * 2, 0.01);
      if (Math.abs(phi - lastPhi) > 0.002) {
        mesh.geometry.dispose();
        mesh.geometry = new THREE.LatheGeometry(lathePts, 48, 0, phi);
        lastPhi = phi;
        const pa = sweepGeo.attributes.position;
        profPts.forEach((p, i) => {
          pa.setXYZ(i, p[0]*Math.cos(phi)*1.002, p[1], -p[0]*Math.sin(phi)*1.002);
        });
        pa.needsUpdate = true;
      }
    },
  };
}

// ------------------------------------------------------------
// シナリオ定義
// ------------------------------------------------------------
