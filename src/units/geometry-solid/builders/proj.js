// ==== ビルダー: proj ====
function buildProj(scene, params) {
  makeGrid(scene, 36, 18, 3, 2);
  const edgeMat = new THREE.LineBasicMaterial({ color: 0x40506a });
  // 階段型: 下段 6x4x2 (y0..2) + 上段 6x2x2 (z0..2, y2..4)
  const boxes = [
    { g: new THREE.BoxGeometry(6, 2, 4), p: [3, 1, 2] },
    { g: new THREE.BoxGeometry(6, 2, 2), p: [3, 3, 1] },
  ];
  boxes.forEach((b) => {
    const mesh = new THREE.Mesh(b.g, solidMat(COL.solid));
    mesh.position.set(...b.p);
    scene.add(mesh);
    const e = new THREE.LineSegments(new THREE.EdgesGeometry(b.g), edgeMat);
    e.position.set(...b.p);
    scene.add(e);
  });

  function quadMesh(pts, mat) {
    const m = new THREE.Mesh(polysToGeometry([pts]), mat);
    scene.add(m);
    return m;
  }
  // 面ハイライト (方向ごと)
  const oT = redOverlayMat(), oF = redOverlayMat(), oS = redOverlayMat();
  quadMesh([[0,4.02,0],[6,4.02,0],[6,4.02,2],[0,4.02,2]], oT);
  quadMesh([[0,2.02,2],[6,2.02,2],[6,2.02,4],[0,2.02,4]], oT);
  quadMesh([[0,-0.02,0],[6,-0.02,0],[6,-0.02,4],[0,-0.02,4]], oT);
  quadMesh([[0,0,4.02],[6,0,4.02],[6,2,4.02],[0,2,4.02]], oF);
  quadMesh([[0,2,2.02],[6,2,2.02],[6,4,2.02],[0,4,2.02]], oF);
  quadMesh([[0,0,-0.02],[6,0,-0.02],[6,4,-0.02],[0,4,-0.02]], oF);
  const sPoly = (x) => [[x,0,0],[x,0,4],[x,2,4],[x,2,2],[x,4,2],[x,4,0]];
  quadMesh(sPoly(6.02), oS);
  quadMesh(sPoly(-0.02), oS);

  // シルエット板 (見た目の形)
  function silhouette(pts, mat) {
    const m = new THREE.Mesh(polysToGeometry([pts]), mat);
    const outline = new THREE.Line(
      new THREE.BufferGeometry().setFromPoints([...pts.map(V3), V3(pts[0])]),
      new THREE.LineBasicMaterial({ color: COL.red, transparent: true, opacity: 0 })
    );
    scene.add(m, outline);
    return { m, outline };
  }
  const pT = redOverlayMat(), pF = redOverlayMat(), pS = redOverlayMat();
  const silT = silhouette([[0,7.5,0],[6,7.5,0],[6,7.5,4],[0,7.5,4]], pT);
  const silF = silhouette([[0,0,7.5],[6,0,7.5],[6,4,7.5],[0,4,7.5]], pF);
  const silS = silhouette([[10,0,0],[10,0,4],[10,2,4],[10,2,2],[10,4,2],[10,4,0]], pS);

  return {
    update(st) {
      oT.opacity = st.oT * 0.55; oF.opacity = st.oF * 0.55; oS.opacity = st.oS * 0.55;
      pT.opacity = st.oT * 0.4; pF.opacity = st.oF * 0.4; pS.opacity = st.oS * 0.4;
      silT.outline.material.opacity = st.oT;
      silF.outline.material.opacity = st.oF;
      silS.outline.material.opacity = st.oS;
    },
  };
}

// ------------------------------------------------------------
// ビルダー: 表面積・へこみ (向かい合う内側の面)
// ------------------------------------------------------------
