// ==== ビルダー: notch ====
function buildNotch(scene, params) {
  makeGrid(scene, 40, 20, 4, 2);
  const edgeMat = new THREE.LineBasicMaterial({ color: 0x40506a });
  const boxes = [
    { g: new THREE.BoxGeometry(8, 2, 4), p: [4, 1, 2] },
    { g: new THREE.BoxGeometry(2, 3, 4), p: [1, 3.5, 2] },
    { g: new THREE.BoxGeometry(2, 3, 4), p: [7, 3.5, 2] },
  ];
  boxes.forEach((b) => {
    const mesh = new THREE.Mesh(b.g, solidMat(COL.solid));
    mesh.position.set(...b.p);
    scene.add(mesh);
    const e = new THREE.LineSegments(new THREE.EdgesGeometry(b.g), edgeMat);
    e.position.set(...b.p);
    scene.add(e);
  });
  const inner = redOverlayMat();
  [[2.02],[5.98]].forEach(([x]) => {
    const m = new THREE.Mesh(polysToGeometry([[[x,2,0],[x,2,4],[x,5,4],[x,5,0]]]), inner);
    scene.add(m);
  });
  return {
    update(st) {
      inner.opacity = st.inner * 0.6;
    },
  };
}

// ------------------------------------------------------------
// ビルダー: 回転体
// ------------------------------------------------------------
