// ==== ビルダー: water ====
function buildWater(scene, params) {
  const { W, D, H, waterVol, baseArea, wSide, wCount, wAreaSum } = params;

  makeGrid(scene, 46, 14, 0, 0);

  const boxGeo = new THREE.BoxGeometry(W, H, D);
  const glass = new THREE.Mesh(
    boxGeo,
    new THREE.MeshLambertMaterial({ color: COL.glass, transparent: true, opacity: 0.14, side: THREE.BackSide, depthWrite: false })
  );
  glass.position.y = H / 2;
  scene.add(glass);
  const boxEdges = new THREE.LineSegments(new THREE.EdgesGeometry(boxGeo), new THREE.LineBasicMaterial({ color: 0x40506a }));
  boxEdges.position.y = H / 2;
  scene.add(boxEdges);

  const water = new THREE.Mesh(
    new THREE.BoxGeometry(W - 0.3, 1, D - 0.3),
    new THREE.MeshLambertMaterial({ color: COL.water, transparent: true, opacity: 0.5, depthWrite: false })
  );
  scene.add(water);

  const weights = [];
  for (let i = 0; i < wCount; i++) {
    const g = new THREE.Group();
    const body = new THREE.Mesh(
      new THREE.BoxGeometry(wSide - 0.4, wSide, wSide - 0.4),
      new THREE.MeshStandardMaterial({ color: 0x8a93a6, roughness: 0.6, metalness: 0.15, transparent: true, opacity: 0 })
    );
    const edge = new THREE.LineSegments(
      new THREE.EdgesGeometry(body.geometry),
      new THREE.LineBasicMaterial({ color: 0x3a4356, transparent: true, opacity: 0 })
    );
    g.add(body, edge);
    g.position.x = (i - (wCount - 1) / 2) * wSide;
    scene.add(g);
    weights.push({ g, body, edge });
  }

  const tl = wSide;
  const ringPts = [
    new THREE.Vector3(-W/2-0.3, tl, -D/2-0.3), new THREE.Vector3(W/2+0.3, tl, -D/2-0.3),
    new THREE.Vector3(W/2+0.3, tl, D/2+0.3), new THREE.Vector3(-W/2-0.3, tl, D/2+0.3),
    new THREE.Vector3(-W/2-0.3, tl, -D/2-0.3),
  ];
  const tenMat = new THREE.LineDashedMaterial({ color: COL.red, dashSize: 0.55, gapSize: 0.35, transparent: true, opacity: 0 });
  const tenLine = new THREE.Line(new THREE.BufferGeometry().setFromPoints(ringPts), tenMat);
  tenLine.computeLineDistances();
  scene.add(tenLine);
  const tenLabel = makeLabel("おもりの高さ 10cm", { color: "#b03a30", world: 1.15 });
  tenLabel.position.set(W/2 + 4.6, tl, D/2);
  tenLabel.material.opacity = 0;
  scene.add(tenLabel);

  const wl = makeLabel("水面 0.0cm", { color: "#1d5c94", world: 1.25 });
  wl.position.set(W/2 + 3.6, 1, D/2 + 0.5);
  scene.add(wl);

  return {
    update(st) {
      const L = solveWaterLevel(baseArea, waterVol, st.weightY, wAreaSum * st.wVis, wSide);
      water.scale.y = Math.max(L, 0.02);
      water.position.y = L / 2;
      for (const w of weights) {
        w.g.position.y = st.weightY + wSide / 2;
        w.body.material.opacity = st.wVis;
        w.edge.material.opacity = st.wVis;
        w.g.visible = st.wVis > 0.02;
      }
      setLabelText(wl, `水面 ${L.toFixed(1)}cm`);
      wl.position.y = L + 0.55;
      tenMat.opacity = st.tenLine;
      tenLabel.material.opacity = st.tenLine;
    },
  };
}

// ------------------------------------------------------------
// ビルダー⑥: 仕切りのある容器
// ------------------------------------------------------------
