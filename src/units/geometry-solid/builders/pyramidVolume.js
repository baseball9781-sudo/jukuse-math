// ==== ビルダー: pyramidVolume(すいの体積はなぜ×1/3か) ====
// 立方体を、1つの頂点を共有する3つの合同な四角すいに切り分ける。
// 3つがぴったり集まって立方体になる → すい1つ = 立方体の1/3。
//
// params: { size }  立方体の1辺
function buildPyramidVolume(scene, params) {
  const s = params.size, h = s / 2;
  makeGrid(scene, 32, 16, 0, 0);

  // 立方体の8頂点(床の上、x/z中心が原点)
  const b1 = [-h, 0, -h], b2 = [h, 0, -h], b3 = [h, 0, h], b4 = [-h, 0, h];
  const t1 = [-h, s, -h], t2 = [h, s, -h], t3 = [h, s, h], t4 = [-h, s, h];
  const apex = t1; // 3つのすいが共有する頂点

  // 3つの四角すい: 底面 = apexをふくまない3つの面
  const pyramids = [
    { base: [b1, b2, b3, b4], color: COL.solid,  dir: [0, 0, 0] },     // 底面 → 動かさない
    { base: [b4, b3, t3, t4], color: COL.solid2, dir: [0, 0, 1] },     // 前面 → +z へ
    { base: [b2, b3, t3, t2], color: COL.cap,    dir: [1, 0, 0] },     // 右面 → +x へ
  ];

  const groups = pyramids.map((p) => {
    const faces = [p.base];
    for (let i = 0; i < 4; i++) faces.push([p.base[i], p.base[(i + 1) % 4], apex]);
    const group = new THREE.Group();
    group.add(new THREE.Mesh(polysToGeometry(faces), solidMat(p.color)));
    group.add(new THREE.LineSegments(polysToEdges(faces), new THREE.LineBasicMaterial({ color: COL.edge })));
    scene.add(group);
    return { group, dir: p.dir };
  });

  return {
    update(st) {
      const d = st.sep * s * 0.9;
      for (const g of groups) {
        g.group.position.set(g.dir[0] * d, g.dir[1] * d, g.dir[2] * d);
      }
    },
  };
}
