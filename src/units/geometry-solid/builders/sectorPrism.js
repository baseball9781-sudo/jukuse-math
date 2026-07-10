// ==== ビルダー: sectorPrism ====
function buildSectorPrism(scene, params) {
  const { r, h } = params;
  const Q = Math.PI / 2;
  const L = r * Q;              // 弧の長さ 9.42
  const NC = 40;
  makeGrid(scene, 44, 22, 3, 0);
  const edgeMat = new THREE.LineBasicMaterial({ color: COL.edge });

  // ---- 立体パーツ (組み立て時) ----
  // 底面(下・固定)
  const botPts = sectorPoly(r, 0, Q, NC, 0.005);
  scene.add(new THREE.Mesh(polysToGeometry([botPts]), solidMat(COL.solid2)));
  scene.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints([...botPts.map(V3), V3(botPts[0])]), edgeMat));

  // 上のフタ(扇形・動く)→ 展開図では長方形の下に置く
  const topGroup = new THREE.Group();
  const topPts = sectorPoly(r, 0, Q, NC, 0);
  topGroup.add(new THREE.Mesh(polysToGeometry([topPts]), solidMat(COL.solid2)));
  topGroup.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints([...topPts.map(V3), V3(topPts[0])]), edgeMat));
  scene.add(topGroup);

  // 展開図の帯(側面3枚まとめて1つの長方形)。横位置 x0..x0+(6+L+6), 高さ0..h
  // 立体では: [0..6=直辺A(x軸)] → [弧9.42] → [6..12=直辺B(z軸)]
  // 帯メッシュ: パラメータ p を 0..(6+L+6) で動かし、立体位置↔展開位置を補間
  const straight = r; // 6
  const total = straight + L + straight;
  const NP = 96;
  const nVert = (NP + 1) * 2;
  const pos = new Float32Array(nVert * 3);
  const idx = [];
  for (let i = 0; i < NP; i++) { const a = i*2, b = a+2; idx.push(a,b,a+1, b,b+1,a+1); }
  const bandGeo = new THREE.BufferGeometry();
  bandGeo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
  bandGeo.setIndex(idx);
  scene.add(new THREE.Mesh(bandGeo, solidMat(COL.solid)));
  const bandLines = [0,1].map(() => {
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.Float32BufferAttribute(new Float32Array((NP+1)*3), 3));
    scene.add(new THREE.Line(g, edgeMat));
    return g;
  });
  // 折り目(直辺と弧の境目)を示す赤い縦線2本
  const foldLines = [straight, straight + L].map(() => {
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.Float32BufferAttribute(new Float32Array(6), 3));
    const line = new THREE.Line(g, new THREE.LineBasicMaterial({ color: COL.red, transparent: true, opacity: 0 }));
    scene.add(line);
    return line;
  });

  // 立体上の底辺の座標(p→3D)
  function solidPoint(p) {
    if (p <= straight) {
      // 直辺A: 原点→(r,0,0) に沿う。ただし展開の見栄えで弧が中央に来るよう、
      // A は原点から +x、境界で弧の始点(r,0,0)へ
      return [p, 0, 0];
    } else if (p <= straight + L) {
      const a = (p - straight) / r; // 0..Q
      return [r * Math.cos(a), 0, r * Math.sin(a)];
    } else {
      const q = p - straight - L;    // 0..r 直辺B: (0,0,r)→原点方向? 実際は弧終点(0,0,r)から原点へ
      return [0, 0, r - q];
    }
  }
  // 展開図上の底辺の座標(p→2D 平面 x-z, 帯は -z 側に倒す)
  const bandX0 = -total / 2 + 3;
  function flatPoint(p) {
    return [bandX0 + p, 0, -r - 1.5]; // 帯全体を手前(-z)に一直線
  }

  return {
    update(st) {
      const tt = st.topT;      // フタを上へ持ち上げ→展開位置
      const bt = st.bandT;     // 側面帯を立体→展開へ
      // フタ: 持ち上げてから展開図の帯の下(z=-r-1.5-r-...)へ
      const lift = Math.sin(Math.min(tt,0.6)/0.6 * Math.PI/2) * (h + 2);
      const netTop = [bandX0 + straight + L/2 - r*0.7, 0, -r - 1.5 - r - 2.6];
      topGroup.position.set(netTop[0]*tt, h*(1-tt)+lift*(1-tt)+ (h+2)*0 +0.02 + lift*0, netTop[2]*tt);
      // ↑ 単純化: 高さは (1-tt)*h から 0 へ、途中 lift 分持ち上げ
      topGroup.position.y = h*(1-tt) + lift + 0.02;
      topGroup.position.x = netTop[0]*tt;
      topGroup.position.z = netTop[2]*tt;

      // 側面帯: 各pで 立体底辺→展開底辺、上辺は+h を維持したまま倒れる
      for (let i = 0; i <= NP; i++) {
        const p = (i/NP)*total;
        const sp = solidPoint(p);
        const fp = flatPoint(p);
        const bx = sp[0] + (fp[0]-sp[0])*bt;
        const bz = sp[2] + (fp[2]-sp[2])*bt;
        // 上辺: 立体では真上(+h)、展開では帯に沿って平ら(z がさらに -h ぶん外へ)
        const topSolid = [sp[0], h, sp[2]];
        const topFlat  = [fp[0], 0.01, fp[2] - h];
        const tx = topSolid[0] + (topFlat[0]-topSolid[0])*bt;
        const ty = topSolid[1] + (topFlat[1]-topSolid[1])*bt;
        const tz = topSolid[2] + (topFlat[2]-topSolid[2])*bt;
        pos[(i*2)*3]=bx; pos[(i*2)*3+1]=0.012; pos[(i*2)*3+2]=bz;
        pos[(i*2+1)*3]=tx; pos[(i*2+1)*3+1]=ty+0.012; pos[(i*2+1)*3+2]=tz;
      }
      bandGeo.attributes.position.needsUpdate = true;
      bandGeo.computeVertexNormals();
      bandLines.forEach((g,row)=>{
        const pa=g.attributes.position;
        for(let i=0;i<=NP;i++){ pa.setXYZ(i, pos[(i*2+row)*3], pos[(i*2+row)*3+1]+0.01, pos[(i*2+row)*3+2]); }
        pa.needsUpdate=true;
      });
      [straight, straight+L].forEach((p,fi)=>{
        const i = Math.round(p/total*NP);
        const g=foldLines[fi].geometry.attributes.position;
        g.setXYZ(0, pos[(i*2)*3], pos[(i*2)*3+1]+0.02, pos[(i*2)*3+2]);
        g.setXYZ(1, pos[(i*2+1)*3], pos[(i*2+1)*3+1]+0.02, pos[(i*2+1)*3+2]);
        g.needsUpdate=true;
        foldLines[fi].material.opacity = st.foldOp ?? 1;
      });
    },
  };
}

// ------------------------------------------------------------
// ビルダー: 四角すいの展開
// ------------------------------------------------------------
