// ==== ビルダー: pyramidNet ====
function buildPyramidNet(scene, params) {
  const { half, hgt } = params; // 半辺3, 高さ4
  makeGrid(scene, 32, 16, 0, 0);
  const edgeMat = new THREE.LineBasicMaterial({ color: COL.edge });
  const apex = [0, hgt, 0];

  // 底面(固定)
  const basePts = [[-half,0.005,-half],[half,0.005,-half],[half,0.005,half],[-half,0.005,half]];
  scene.add(new THREE.Mesh(polysToGeometry([basePts]), solidMat(COL.solid2)));
  scene.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints([...basePts.map(V3), V3(basePts[0])]), edgeMat));

  // 4つの側面 (ヒンジ)
  const edges = [
    [[half,0,-half],[half,0,half]],
    [[half,0,half],[-half,0,half]],
    [[-half,0,half],[-half,0,-half]],
    [[-half,0,-half],[half,0,-half]],
  ];
  const movers = edges.map(([a, b]) => {
    const { axis, alpha } = hingeAlpha(a, b, apex, [0,0,0]);
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.Float32BufferAttribute(new Float32Array(9), 3));
    const mesh = new THREE.Mesh(geo, solidMat(COL.solid));
    const lineGeo = new THREE.BufferGeometry();
    lineGeo.setAttribute("position", new THREE.Float32BufferAttribute(new Float32Array(12), 3));
    const line = new THREE.Line(lineGeo, edgeMat);
    scene.add(mesh, line);
    return { a, b, axis, alpha, mesh, line };
  });

  // 3・4・5の直角三角形 (中心→辺の中点→頂点)
  const triPts = [[0,0.05,0],[half,0.05,0],apex,[0,0.05,0]].map(V3);
  const triMat = new THREE.LineBasicMaterial({ color: COL.red, transparent: true, opacity: 0 });
  scene.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(triPts), triMat));

  return {
    update(st) {
      for (const mv of movers) {
        const p = rotAxis(apex, mv.a, mv.axis, mv.alpha * st.t);
        const pa = mv.mesh.geometry.attributes.position;
        pa.setXYZ(0, ...mv.a); pa.setXYZ(1, ...mv.b); pa.setXYZ(2, ...p);
        pa.needsUpdate = true;
        mv.mesh.geometry.computeVertexNormals();
        const la = mv.line.geometry.attributes.position;
        la.setXYZ(0, ...mv.a); la.setXYZ(1, ...mv.b); la.setXYZ(2, ...p); la.setXYZ(3, ...mv.a);
        la.needsUpdate = true;
      }
      triMat.opacity = st.tri;
    },
  };
}

// ------------------------------------------------------------
// ビルダー: 表面積・投影 (上下・前後・左右)
// ------------------------------------------------------------
