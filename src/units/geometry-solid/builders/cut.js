// ==== ビルダー: cut ====
function buildCut(scene, params) {
  const S = params.size;
  const verts = boxVerts(0, 0, 0, S, S, S);
  const plane = { n: [1,1,1], d: 1.5 * S };
  const nhat = V3(vNorm(plane.n));
  const { below, above, cap } = splitPolyhedron(verts, cubeFaceIdx, plane);

  const gBelow = new THREE.Group();
  const gAbove = new THREE.Group();
  scene.add(gBelow, gAbove);

  const edgeMat = new THREE.LineBasicMaterial({ color: COL.edge });
  gBelow.add(new THREE.Mesh(polysToGeometry(below), solidMat(COL.solid)));
  gAbove.add(new THREE.Mesh(polysToGeometry(above), solidMat(COL.solid2)));
  const capMeshB = new THREE.Mesh(polysToGeometry([cap]), solidMat(COL.cap));
  const capMeshA = new THREE.Mesh(polysToGeometry([[...cap].reverse()]), solidMat(COL.cap));
  gBelow.add(capMeshB); gAbove.add(capMeshA);
  gBelow.add(new THREE.LineSegments(polysToEdges([...below, cap]), edgeMat));
  gAbove.add(new THREE.LineSegments(polysToEdges([...above, cap]), edgeMat));

  const ringPts = cap.map((p) => V3(p).add(nhat.clone().multiplyScalar(0.04)));
  const ringMat = new THREE.LineBasicMaterial({ color: COL.red, transparent: true, opacity: 0 });
  gBelow.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints([...ringPts, ringPts[0]]), ringMat));

  const planeMesh = new THREE.Mesh(
    new THREE.CircleGeometry(S * 1.05, 48),
    new THREE.MeshBasicMaterial({ color: 0xe2574c, transparent: true, opacity: 0, side: THREE.DoubleSide, depthWrite: false })
  );
  planeMesh.position.set(S/2, S/2, S/2);
  planeMesh.quaternion.setFromUnitVectors(new THREE.Vector3(0,0,1), nhat);
  scene.add(planeMesh);

  const hex = params.hexPts;
  const segs = [];
  for (let i = 0; i < 6; i++) {
    const p1 = hex[i], p2 = hex[(i+1)%6];
    let off = [0,0,0];
    for (let k = 0; k < 3; k++) {
      if (Math.abs(p1[k]-p2[k]) < 1e-9 && (Math.abs(p1[k]) < 1e-9 || Math.abs(p1[k]-S) < 1e-9)) {
        off[k] = p1[k] < 1e-9 ? -0.04 : 0.04;
      }
    }
    const line = new THREE.Line(
      new THREE.BufferGeometry().setFromPoints([V3(vAdd(p1, off)), V3(vAdd(p2, off))]),
      new THREE.LineBasicMaterial({ color: COL.red, transparent: true, opacity: 0 })
    );
    scene.add(line);
    segs.push(line);
  }

  const dots = params.dotIdx.map((i) => {
    const d = new THREE.Mesh(
      new THREE.SphereGeometry(0.24, 20, 14),
      new THREE.MeshStandardMaterial({ color: COL.red, roughness: 0.5 })
    );
    d.position.copy(V3(hex[i]));
    d.scale.setScalar(0.001);
    scene.add(d);
    return d;
  });

  makeGrid(scene, 30, 15, S/2, S/2);
  const aside = V3(vNorm([1,-1,0]));

  return {
    update(st) {
      gBelow.position.copy(nhat.clone().multiplyScalar(-st.sep));
      gAbove.position.copy(nhat.clone().multiplyScalar(st.sep).add(aside.clone().multiplyScalar(st.aside)));
      const capsOn = st.sep > 0.03;
      capMeshB.visible = capsOn; capMeshA.visible = capsOn;
      planeMesh.material.opacity = st.planeOp;
      planeMesh.visible = st.planeOp > 0.01;
      dots.forEach((d) => d.scale.setScalar(Math.max(0.001, st.dots)));
      segs.forEach((s, i) => {
        const o = clamp01(st.cutDraw * 6 - i) * st.lineOp;
        s.material.opacity = o;
        s.visible = o > 0.01;
      });
      ringMat.opacity = st.ring;
    },
  };
}

// ------------------------------------------------------------
// ビルダー②: 積み木の切断 (3x3x3を3頂点で切る)
// ------------------------------------------------------------
