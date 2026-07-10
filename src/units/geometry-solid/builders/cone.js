// ==== ビルダー: cone ====
function buildCone(scene, params) {
  const { r, l } = params;
  const NU = 64, NV = 8;
  const Theta = 2 * Math.PI * r / l;

  makeGrid(scene, 34, 17, 4, 0);

  // 側面 (パラメトリックメッシュ: 円すい→扇形へ連続変形)
  const nVert = (NU + 1) * (NV + 1);
  const posArr = new Float32Array(nVert * 3);
  const idx = [];
  for (let iu = 0; iu < NU; iu++) for (let iv = 0; iv < NV; iv++) {
    const a = iu * (NV + 1) + iv, b = a + (NV + 1);
    idx.push(a, b, a + 1, b, b + 1, a + 1);
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.BufferAttribute(posArr, 3));
  geo.setIndex(idx);
  const lateral = new THREE.Mesh(geo, solidMat(COL.solid));
  scene.add(lateral);

  // 切り込み線(赤・2本) と 弧(ふち)
  const seams = [0, NU].map(() => {
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.Float32BufferAttribute(new Float32Array((NV + 1) * 3), 3));
    const line = new THREE.Line(g, new THREE.LineBasicMaterial({ color: COL.red }));
    scene.add(line);
    return line;
  });
  const rimGeo = new THREE.BufferGeometry();
  rimGeo.setAttribute("position", new THREE.Float32BufferAttribute(new Float32Array((NU + 1) * 3), 3));
  const rimMat = new THREE.LineBasicMaterial({ color: COL.edge });
  scene.add(new THREE.Line(rimGeo, rimMat));
  const rim = { geo: rimGeo };

  // 円板+輪郭を作る小ヘルパー
  function makeDisk(cx, cz) {
    const disk = new THREE.Mesh(
      new THREE.CircleGeometry(r, 48),
      new THREE.MeshBasicMaterial({ color: 0xcfd8e0, transparent: true, opacity: 0, side: THREE.DoubleSide, depthWrite: false })
    );
    disk.rotation.x = -Math.PI / 2;
    disk.position.set(cx, 0.012, cz);
    scene.add(disk);
    const pts = [];
    for (let i = 0; i <= 60; i++) {
      const a = (i / 60) * Math.PI * 2;
      pts.push(new THREE.Vector3(cx + r * Math.cos(a), 0.03, cz + r * Math.sin(a)));
    }
    const ringMat = new THREE.LineBasicMaterial({ color: COL.edge, transparent: true, opacity: 0 });
    scene.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), ringMat));
    return { disk, ringMat };
  }
  // 円すいの底面(中央) / 展開図の底面(弧に接する位置: 中心 = (l+r, 0, 0))
  const baseC = makeDisk(0, 0);
  const baseN = makeDisk(l + r, 0);
  const touchDot = new THREE.Mesh(
    new THREE.SphereGeometry(0.18, 16, 12),
    new THREE.MeshBasicMaterial({ color: COL.red, transparent: true, opacity: 0 })
  );
  touchDot.position.set(l, 0.1, 0);
  scene.add(touchDot);

  // 中心角の弧 + ラベル
  const arcPts = [];
  for (let i = 0; i <= 40; i++) {
    const a = -Theta / 2 + (i / 40) * Theta;
    arcPts.push(new THREE.Vector3(2.6 * Math.cos(a), 0.05, 2.6 * Math.sin(a)));
  }
  const arcMat = new THREE.LineBasicMaterial({ color: COL.red, transparent: true, opacity: 0 });
  scene.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(arcPts), arcMat));
  const angleLb = makeLabel("144°", { color: "#b03a30", world: 1.5 });
  angleLb.position.set(1.1, 0.5, 0);
  angleLb.material.opacity = 0;
  scene.add(angleLb);

  const cEdge = new THREE.Color(COL.edge), cRed = new THREE.Color(COL.red);

  return {
    update(st) {
      const R = r + (l - r) * st.t;
      const psi = 2 * Math.PI * r / R;
      const h = Math.sqrt(Math.max(l * l - R * R, 0));
      for (let iu = 0; iu <= NU; iu++) {
        const ang = -psi / 2 + (iu / NU) * psi;
        const rx = R * Math.cos(ang), rz = R * Math.sin(ang);
        for (let iv = 0; iv <= NV; iv++) {
          const f = iv / NV;
          const n = iu * (NV + 1) + iv;
          posArr[n*3] = rx * f;
          posArr[n*3+1] = h * (1 - f);
          posArr[n*3+2] = rz * f;
        }
      }
      geo.attributes.position.needsUpdate = true;
      geo.computeVertexNormals();
      [0, NU].forEach((iu, si) => {
        const pa = seams[si].geometry.attributes.position;
        for (let iv = 0; iv <= NV; iv++) {
          const n = iu * (NV + 1) + iv;
          pa.setXYZ(iv, posArr[n*3], posArr[n*3+1] + 0.015, posArr[n*3+2]);
        }
        pa.needsUpdate = true;
      });
      const ra = rim.geo.attributes.position;
      for (let iu = 0; iu <= NU; iu++) {
        const n = iu * (NV + 1) + NV;
        ra.setXYZ(iu, posArr[n*3], posArr[n*3+1] + 0.015, posArr[n*3+2]);
      }
      ra.needsUpdate = true;
      rimMat.color.copy(cEdge).lerp(cRed, st.rimHi);
      // 円すいの底面(中央)はフェードアウト、展開図の底面は弧に接して現れる
      baseC.disk.material.opacity = st.baseOp * 0.4;
      baseC.ringMat.opacity = st.baseOp;
      baseN.disk.material.opacity = st.netOp * 0.4;
      baseN.ringMat.opacity = st.netOp;
      baseN.ringMat.color.copy(cEdge).lerp(cRed, st.netHi);
      touchDot.material.opacity = st.netHi;
      arcMat.opacity = st.angleOp;
      angleLb.material.opacity = st.angleOp;
      angleLb.visible = st.angleOp > 0.01;
    },
  };
}

// ------------------------------------------------------------
// ビルダー⑤: おもりと水面
// ------------------------------------------------------------
