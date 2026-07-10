// ==== ビルダー: water2 ====
function buildWater2(scene, params) {
  const { wA, wB, D, H } = params; // 幅6+9, 奥行10, 高さ15
  const Wt = wA + wB;
  const x0 = -Wt / 2;              // 左端
  const xd = x0 + wA;              // 仕切り位置

  makeGrid(scene, 46, 14, 0, 0);

  const boxGeo = new THREE.BoxGeometry(Wt, H, D);
  const glass = new THREE.Mesh(
    boxGeo,
    new THREE.MeshLambertMaterial({ color: COL.glass, transparent: true, opacity: 0.14, side: THREE.BackSide, depthWrite: false })
  );
  glass.position.y = H / 2;
  scene.add(glass);
  const boxEdges = new THREE.LineSegments(new THREE.EdgesGeometry(boxGeo), new THREE.LineBasicMaterial({ color: 0x40506a }));
  boxEdges.position.y = H / 2;
  scene.add(boxEdges);

  // 仕切り板
  const divider = new THREE.Group();
  const divBody = new THREE.Mesh(
    new THREE.BoxGeometry(0.24, H, D - 0.2),
    new THREE.MeshStandardMaterial({ color: 0x9aa5b5, roughness: 0.7, transparent: true, opacity: 0.9 })
  );
  divider.add(divBody);
  divider.add(new THREE.LineSegments(new THREE.EdgesGeometry(divBody.geometry), new THREE.LineBasicMaterial({ color: 0x3a4356 })));
  divider.position.set(xd, H / 2, 0);
  scene.add(divider);

  // 水 (左右)
  const waterMatL = new THREE.MeshLambertMaterial({ color: COL.water, transparent: true, opacity: 0.5, depthWrite: false });
  const waterL = new THREE.Mesh(new THREE.BoxGeometry(wA - 0.35, 1, D - 0.3), waterMatL);
  const waterR = new THREE.Mesh(new THREE.BoxGeometry(wB - 0.35, 1, D - 0.3), waterMatL.clone());
  scene.add(waterL, waterR);

  const wlab = makeLabel("水面 0.0cm", { color: "#1d5c94", world: 1.25 });
  wlab.position.set(Wt/2 + 3.4, 1, D/2 + 0.5);
  scene.add(wlab);

  return {
    update(st) {
      waterL.scale.y = Math.max(st.levelA, 0.02);
      waterL.position.set(x0 + wA / 2 - 0.06, st.levelA / 2, 0);
      waterR.scale.y = Math.max(st.levelB, 0.02);
      waterR.position.set(xd + wB / 2 + 0.06, st.levelB / 2, 0);
      divider.position.y = H / 2 + st.dividerY;
      setLabelText(wlab, `水面 ${st.levelB.toFixed(1)}cm`);
      wlab.position.y = st.levelB + 0.55;
    },
  };
}

// ------------------------------------------------------------
// 共通小物: 面倒し用クアッド / グループ透明度
// ------------------------------------------------------------
