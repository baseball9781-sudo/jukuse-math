// ==== ビルダー: unfold ====
function buildUnfold(scene, params) {
  const UF = params.uf;
  const T = UF.T;

  makeGrid(scene, 26, 13, UF.center[0], UF.center[2]);
  const edgeMat = new THREE.LineBasicMaterial({ color: COL.edge });

  const fixedTri = [T[params.fixed[0]], T[params.fixed[1]], T[params.fixed[2]]];
  scene.add(new THREE.Mesh(polysToGeometry([fixedTri]), solidMat(COL.solid2)));
  scene.add(new THREE.LineSegments(polysToEdges([fixedTri]), edgeMat));

  const movers = UF.moving.map((m) => {
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.Float32BufferAttribute(new Float32Array(9), 3));
    const mesh = new THREE.Mesh(geo, solidMat(COL.solid));
    const lineGeo = new THREE.BufferGeometry();
    lineGeo.setAttribute("position", new THREE.Float32BufferAttribute(new Float32Array(12), 3));
    const line = new THREE.Line(lineGeo, edgeMat);
    scene.add(mesh, line);
    const label = makeLabel(params.apexName, { color: "#b03a30", world: 1.15 });
    scene.add(label);
    return { m, mesh, line, label };
  });

  params.fixed.forEach((name) => {
    const lb = makeLabel(name, { color: "#24354d", world: 1.15 });
    const p = T[name];
    lb.position.set(p[0], p[1] + 0.55, p[2]);
    scene.add(lb);
  });

  const sc = UF.squareCorners;
  const ghostPts = [...sc, sc[0]].map((p) => new THREE.Vector3(p[0], 0.03, p[2]));
  const ghostMat = new THREE.LineDashedMaterial({ color: COL.red, dashSize: 0.42, gapSize: 0.26, transparent: true, opacity: 0 });
  const ghost = new THREE.Line(new THREE.BufferGeometry().setFromPoints(ghostPts), ghostMat);
  ghost.computeLineDistances();
  scene.add(ghost);

  const scratch = new THREE.Vector3();

  return {
    update(st) {
      for (const mv of movers) {
        const { a, b, p0, axis, alpha } = mv.m;
        const p = rotAxis(p0, a, axis, alpha * st.t);
        const pa = mv.mesh.geometry.attributes.position;
        pa.setXYZ(0, ...a); pa.setXYZ(1, ...b); pa.setXYZ(2, ...p);
        pa.needsUpdate = true;
        mv.mesh.geometry.computeVertexNormals();
        const la = mv.line.geometry.attributes.position;
        la.setXYZ(0, ...a); la.setXYZ(1, ...b); la.setXYZ(2, ...p); la.setXYZ(3, ...a);
        la.needsUpdate = true;
        scratch.set(p[0], p[1] + 0.55, p[2]);
        mv.label.position.copy(scratch);
        mv.label.material.opacity = st.pLabels;
      }
      ghostMat.opacity = st.ghost;
    },
  };
}

// ------------------------------------------------------------
// ビルダー④: 円すいの展開 (側面→扇形 / 底面は弧に接する)
// ------------------------------------------------------------
