// ==== ビルダー: cutBlocks ====
function buildCutBlocks(scene, params) {
  const s = params.unit, N = 3, D = N * s;
  const plane = { n: [1,1,1], d: D };
  const nhat = V3(vNorm(plane.n));
  const edgeMat = new THREE.LineBasicMaterial({ color: COL.edge });
  const cBase = new THREE.Color(COL.solid);
  const cBodyHi = new THREE.Color(0xf3d3cf);
  const cCapHi = new THREE.Color(0xe2574c);
  const sharedMat = solidMat(COL.solid);

  makeGrid(scene, 40, 20, D/2, D/2);

  const minis = [];
  for (let i = 0; i < N; i++) for (let j = 0; j < N; j++) for (let k = 0; k < N; k++) {
    const verts = boxVerts(i*s, j*s, k*s, (i+1)*s, (j+1)*s, (k+1)*s);
    const minSum = (i + j + k) * s;
    const cut = minSum < plane.d - 1e-9 && minSum + 3 * s > plane.d + 1e-9;
    const g = new THREE.Group();
    scene.add(g);
    const mini = { g, j, cut, grpBelow: null, bodyMats: [], capMats: [] };
    if (cut) {
      const { below, above, cap } = splitPolyhedron(verts, cubeFaceIdx, plane);
      const mBody1 = solidMat(COL.solid), mBody2 = solidMat(COL.solid);
      const mCap1 = solidMat(COL.solid), mCap2 = solidMat(COL.solid);
      const gb = new THREE.Group(), ga = new THREE.Group();
      const capB = new THREE.Mesh(polysToGeometry([cap]), mCap1);
      capB.position.copy(nhat.clone().multiplyScalar(-0.015));
      const capA = new THREE.Mesh(polysToGeometry([[...cap].reverse()]), mCap2);
      capA.position.copy(nhat.clone().multiplyScalar(0.015));
      gb.add(new THREE.Mesh(polysToGeometry(below), mBody1), capB);
      gb.add(new THREE.LineSegments(polysToEdges([...below, cap]), edgeMat));
      ga.add(new THREE.Mesh(polysToGeometry(above), mBody2), capA);
      ga.add(new THREE.LineSegments(polysToEdges([...above, cap]), edgeMat));
      g.add(gb, ga);
      mini.grpBelow = gb;
      mini.bodyMats = [mBody1, mBody2];
      mini.capMats = [mCap1, mCap2];
    } else {
      const facePolys = cubeFaceIdx.map((f) => f.map((vi) => verts[vi]));
      const sub = new THREE.Group();
      sub.add(new THREE.Mesh(polysToGeometry(facePolys), sharedMat));
      sub.add(new THREE.LineSegments(polysToEdges(facePolys), edgeMat));
      g.add(sub);
      if (minSum + 3 * s <= plane.d + 1e-9) mini.grpBelow = sub; // 完全に切り口の下側
    }
    minis.push(mini);
  }

  // 3頂点マーカー
  const dotPts = [[D,0,0],[0,D,0],[0,0,D]];
  const dots = dotPts.map((p) => {
    const d = new THREE.Mesh(
      new THREE.SphereGeometry(0.26, 20, 14),
      new THREE.MeshStandardMaterial({ color: COL.red, roughness: 0.5 })
    );
    d.position.copy(V3(p));
    d.scale.setScalar(0.001);
    scene.add(d);
    return d;
  });

  const planeMesh = new THREE.Mesh(
    new THREE.CircleGeometry(D * 0.95, 48),
    new THREE.MeshBasicMaterial({ color: 0xe2574c, transparent: true, opacity: 0, side: THREE.DoubleSide, depthWrite: false })
  );
  planeMesh.position.set(D/3, D/3, D/3);
  planeMesh.quaternion.setFromUnitVectors(new THREE.Vector3(0,0,1), nhat);
  scene.add(planeMesh);

  // 段ごとの個数ラベル
  const counts = params.layerCounts.map((c) => {
    const lb = makeLabel(`${c}個`, { color: "#b03a30", world: 1.5 });
    lb.material.opacity = 0;
    scene.add(lb);
    return lb;
  });

  return {
    update(st) {
      for (const m of minis) {
        m.g.position.set(m.j * params.spread * st.explode, m.j * params.liftGap * st.lift, 0);
        if (m.grpBelow) m.grpBelow.position.copy(nhat.clone().multiplyScalar(-st.sep));
        if (m.cut) {
          m.bodyMats.forEach((mat) => mat.color.copy(cBase).lerp(cBodyHi, st.highlight));
          m.capMats.forEach((mat) => mat.color.copy(cBase).lerp(cCapHi, st.highlight));
        }
      }
      dots.forEach((d) => d.scale.setScalar(Math.max(0.001, st.dots)));
      planeMesh.material.opacity = st.planeOp;
      planeMesh.visible = st.planeOp > 0.01;
      counts.forEach((lb, j) => {
        lb.material.opacity = st.countOp;
        lb.visible = st.countOp > 0.01;
        lb.position.set(D/2 + j * params.spread * st.explode, s * 1.2, -2.6);
      });
    },
  };
}

// ------------------------------------------------------------
// ビルダー③: 三角すいの展開 (→正方形)
// ------------------------------------------------------------
