// ==== ビルダー: string ====
function buildString(scene, params) {
  makeGrid(scene, 36, 18, 5, 0);
  const NU = 64, NV = 8, NS = 60;

  function makeConeSys(r, l, angText) {
    const group = new THREE.Group();
    scene.add(group);
    const Theta = 2 * Math.PI * r / l;
    // 側面メッシュ
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
    group.add(new THREE.Mesh(geo, solidMat(COL.solid)));
    // 母線(切り込み)2本
    const seamGeos = [0, NU].map(() => {
      const g = new THREE.BufferGeometry();
      g.setAttribute("position", new THREE.Float32BufferAttribute(new Float32Array((NV + 1) * 3), 3));
      group.add(new THREE.Line(g, new THREE.LineBasicMaterial({ color: COL.edge })));
      return g;
    });
    // ひも(展開図の弦を折り目パラメータで巻き付ける)
    const chordX = l * Math.cos(Theta / 2);
    const chordZ = l * Math.sin(Theta / 2);
    const flat = [];
    for (let i = 0; i <= NS; i++) {
      const z = -chordZ + (i / NS) * 2 * chordZ;
      const rho = Math.hypot(chordX, z);
      const phi = Math.atan2(z, chordX);
      flat.push({ rho, u: (phi + Theta / 2) / Theta });
    }
    const strGeo = new THREE.BufferGeometry();
    strGeo.setAttribute("position", new THREE.Float32BufferAttribute(new Float32Array((NS + 1) * 3), 3));
    group.add(new THREE.Line(strGeo, new THREE.LineBasicMaterial({ color: COL.red })));
    // Aラベル×2
    const labs = [0, 1].map(() => {
      const lb = makeLabel("A", { color: "#b03a30", world: 1.05 });
      group.add(lb);
      return lb;
    });
    // 中心角ラベル
    const angLb = makeLabel(angText, { color: "#b03a30", world: 1.4 });
    angLb.position.set(1.4, 0.4, 0);
    group.add(angLb);
    // 底面の輪郭
    const circ = [];
    for (let i = 0; i <= 60; i++) {
      const a = (i / 60) * Math.PI * 2;
      circ.push(new THREE.Vector3(r * Math.cos(a), 0.03, r * Math.sin(a)));
    }
    const baseLine = new THREE.Line(new THREE.BufferGeometry().setFromPoints(circ), new THREE.LineBasicMaterial({ color: COL.edge }));
    group.add(baseLine);

    const mats = collectMats(group);
    return {
      group,
      update(t, op, angOp) {
        const R = r + (l - r) * t;
        const psi = 2 * Math.PI * r / R;
        const h = Math.sqrt(Math.max(l * l - R * R, 0));
        for (let iu = 0; iu <= NU; iu++) {
          const ang = -psi / 2 + (iu / NU) * psi;
          const cx = Math.cos(ang), sz = Math.sin(ang);
          for (let iv = 0; iv <= NV; iv++) {
            const f = iv / NV;
            const n = iu * (NV + 1) + iv;
            posArr[n*3] = R * cx * f;
            posArr[n*3+1] = h * (1 - f);
            posArr[n*3+2] = R * sz * f;
          }
        }
        geo.attributes.position.needsUpdate = true;
        geo.computeVertexNormals();
        [0, NU].forEach((iu, si) => {
          const pa = seamGeos[si].attributes.position;
          for (let iv = 0; iv <= NV; iv++) {
            const n = iu * (NV + 1) + iv;
            pa.setXYZ(iv, posArr[n*3], posArr[n*3+1] + 0.015, posArr[n*3+2]);
          }
          pa.needsUpdate = true;
        });
        const sa = strGeo.attributes.position;
        for (let i = 0; i <= NS; i++) {
          const { rho, u } = flat[i];
          const ang = -psi / 2 + u * psi;
          const f = rho / l;
          sa.setXYZ(i, R * Math.cos(ang) * f * 1.004, h * (1 - f) + 0.04, R * Math.sin(ang) * f * 1.004);
        }
        sa.needsUpdate = true;
        [0, NS].forEach((i, li) => {
          labs[li].position.set(sa.getX(i), sa.getY(i) + 0.55, sa.getZ(i));
        });
        mats.forEach((m) => (m.opacity = op));
        baseLine.material.opacity = op * (1 - 0.85 * t);
        angLb.material.opacity = op * angOp;
        group.visible = op > 0.02;
      },
    };
  }

  const c1 = makeConeSys(params.r1, params.l1, params.ang1);
  const c2 = makeConeSys(params.r2, params.l2, params.ang2);

  return {
    update(st) {
      c1.update(st.t1, st.op1, st.a1);
      c2.update(st.t2, st.op2, st.a2);
    },
  };
}

// ------------------------------------------------------------
// ビルダー: 円柱の展開 (転がして開く)
// ------------------------------------------------------------
