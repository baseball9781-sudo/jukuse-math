// ==== ビルダー: cylinder ====
function buildCylinder(scene, params) {
  const { r, h } = params;
  const C = 2 * Math.PI * r;
  makeGrid(scene, 40, 20, h / 2, C / 2);
  const NU = 72; // 円周方向

  const nVert = (NU + 1) * 2;
  const posArr = new Float32Array(nVert * 3);
  const idx = [];
  for (let iu = 0; iu < NU; iu++) {
    const a = iu * 2, b = a + 2;
    idx.push(a, b, a + 1, b, b + 1, a + 1);
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.BufferAttribute(posArr, 3));
  geo.setIndex(idx);
  scene.add(new THREE.Mesh(geo, solidMat(COL.solid)));

  // ふち(2本: x=0側 / x=h側) と 切り込み(はじまり m=0: 赤)
  const rimGeos = [0, 1].map(() => {
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.Float32BufferAttribute(new Float32Array((NU + 1) * 3), 3));
    scene.add(new THREE.Line(g, new THREE.LineBasicMaterial({ color: COL.edge })));
    return g;
  });
  const seamGeos = [0, 1].map(() => {
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.Float32BufferAttribute(new Float32Array(6), 3));
    scene.add(new THREE.Line(g, new THREE.LineBasicMaterial({ color: COL.red })));
    return g;
  });

  // 転がる円柱の両フタ(円板)
  const capDisks = [0, 1].map((i) => {
    const disk = new THREE.Mesh(
      new THREE.CircleGeometry(r, 40),
      new THREE.MeshBasicMaterial({ color: 0xdde3ea, transparent: true, opacity: 0.55, side: THREE.DoubleSide, depthWrite: false })
    );
    disk.rotation.y = Math.PI / 2;
    scene.add(disk);
    return disk;
  });

  // 展開図の円2枚 (長方形の長い辺に接する)
  const netCircles = [0, 1].map((i) => {
    const cx = i === 0 ? -r : h + r;
    const pts = [];
    for (let k = 0; k <= 60; k++) {
      const a = (k / 60) * Math.PI * 2;
      pts.push(new THREE.Vector3(cx + r * Math.cos(a), 0.03, C / 2 + r * Math.sin(a)));
    }
    const mat = new THREE.LineBasicMaterial({ color: COL.edge, transparent: true, opacity: 0 });
    scene.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), mat));
    const disk = new THREE.Mesh(
      new THREE.CircleGeometry(r, 40),
      new THREE.MeshBasicMaterial({ color: 0xdde3ea, transparent: true, opacity: 0, side: THREE.DoubleSide, depthWrite: false })
    );
    disk.rotation.x = -Math.PI / 2;
    disk.position.set(cx, 0.012, C / 2);
    scene.add(disk);
    return { mat, disk };
  });

  return {
    update(st) {
      const theta = st.t * 2 * Math.PI;   // 転がった角度
      const zc = theta * r;               // 接地点
      for (let iu = 0; iu <= NU; iu++) {
        const m = (iu / NU) * 2 * Math.PI;
        let y, z;
        if (m <= theta) { y = 0.012; z = m * r; }
        else {
          const d = m - theta;
          z = zc + r * Math.sin(d);
          y = r * (1 - Math.cos(d)) + 0.012;
        }
        posArr[(iu*2)*3] = 0;   posArr[(iu*2)*3+1] = y; posArr[(iu*2)*3+2] = z;
        posArr[(iu*2+1)*3] = h; posArr[(iu*2+1)*3+1] = y; posArr[(iu*2+1)*3+2] = z;
      }
      geo.attributes.position.needsUpdate = true;
      geo.computeVertexNormals();
      rimGeos.forEach((g, side) => {
        const pa = g.attributes.position;
        for (let iu = 0; iu <= NU; iu++) {
          pa.setXYZ(iu, side * h, posArr[(iu*2)*3+1] + 0.012, posArr[(iu*2)*3+2]);
        }
        pa.needsUpdate = true;
      });
      // 切り込み線: m=0 と m=2π (同じ線が2本に分かれる)
      seamGeos.forEach((g, si) => {
        const iu = si === 0 ? 0 : NU;
        const pa = g.attributes.position;
        pa.setXYZ(0, 0, posArr[(iu*2)*3+1] + 0.015, posArr[(iu*2)*3+2]);
        pa.setXYZ(1, h, posArr[(iu*2)*3+1] + 0.015, posArr[(iu*2)*3+2]);
        pa.needsUpdate = true;
      });
      // フタ: 転がる円柱と一緒に移動 → 開き切ると消える
      const capOp = 0.55 * (1 - st.netOp);
      capDisks.forEach((disk, side) => {
        disk.position.set(side * h, r, zc);
        disk.material.opacity = capOp * (1 - st.t * 0.4);
        disk.visible = disk.material.opacity > 0.02;
      });
      netCircles.forEach((c) => {
        c.mat.opacity = st.netOp;
        c.disk.material.opacity = st.netOp * 0.4;
      });
    },
  };
}

// ------------------------------------------------------------
// ビルダー: 扇形柱 (底面が扇形の立体の展開)
// ------------------------------------------------------------
