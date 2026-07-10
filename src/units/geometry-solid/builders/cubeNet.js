// ==== ビルダー: cubeNet(立方体の展開図) ====
// 立方体の6面を「ヒンジの木」でつないで展開する。面によっては
// 親の面(例: 十字型のふた→前面)にぶら下がり、2段階で回転する。
// params.net: "cross"(十字型) / "stairs"(階段型)
function buildCubeNet(scene, params) {
  const h = params.size / 2;
  makeGrid(scene, 44, 22, 0, 0);

  // 面の頂点(閉じた状態)。bottomは固定。
  const F = {
    bottom: [[-h, 0, -h], [h, 0, -h], [h, 0, h], [-h, 0, h]],
    front:  [[-h, 0, h], [h, 0, h], [h, 2 * h, h], [-h, 2 * h, h]],
    back:   [[h, 0, -h], [-h, 0, -h], [-h, 2 * h, -h], [h, 2 * h, -h]],
    right:  [[h, 0, h], [h, 0, -h], [h, 2 * h, -h], [h, 2 * h, h]],
    left:   [[-h, 0, -h], [-h, 0, h], [-h, 2 * h, h], [-h, 2 * h, -h]],
    top:    [[-h, 2 * h, -h], [h, 2 * h, -h], [h, 2 * h, h], [-h, 2 * h, h]],
  };
  // ヒンジ木: face → { parent(nullなら底面に直結), anchor, axis, angle(度) }
  const NETS = {
    cross: {
      front: { parent: null,    anchor: [0, 0, h],      axis: [1, 0, 0], angle: 90 },
      back:  { parent: null,    anchor: [0, 0, -h],     axis: [1, 0, 0], angle: -90 },
      right: { parent: null,    anchor: [h, 0, 0],      axis: [0, 0, 1], angle: -90 },
      left:  { parent: null,    anchor: [-h, 0, 0],     axis: [0, 0, 1], angle: 90 },
      top:   { parent: "front", anchor: [0, 2 * h, h],  axis: [1, 0, 0], angle: 90 },
    },
    stairs: {
      front: { parent: null,    anchor: [0, 0, h],      axis: [1, 0, 0], angle: 90 },
      left:  { parent: "front", anchor: [-h, 0, h],     axis: [0, 1, 0], angle: 90 },
      right: { parent: null,    anchor: [h, 0, 0],      axis: [0, 0, 1], angle: -90 },
      back:  { parent: "right", anchor: [h, 0, -h],     axis: [0, 1, 0], angle: -90 },
      top:   { parent: "back",  anchor: [0, 2 * h, -h], axis: [1, 0, 0], angle: -90 },
    },
  };
  const net = NETS[params.net];

  // 底面(固定)。ふた(top)はピンクにして行き先を追えるように。
  scene.add(new THREE.Mesh(polysToGeometry([F.bottom.map((p) => [p[0], p[1] + 0.004, p[2]])]), solidMat(COL.solid2)));
  scene.add(new THREE.LineSegments(polysToEdges([F.bottom]), new THREE.LineBasicMaterial({ color: COL.edge })));

  const quads = {};
  for (const name of Object.keys(net)) {
    quads[name] = dynQuad(scene, solidMat(name === "top" ? COL.cap : COL.solid));
  }

  // 面nameの頂点を、展開の進み t(0..1) で計算(自分→親→…の順にヒンジ回転)
  function faceVertsAt(name, t) {
    const chain = [];
    for (let cur = name; cur && net[cur]; cur = net[cur].parent) chain.push(net[cur]);
    return F[name].map((v) => {
      let p = v;
      for (const hg of chain) p = rotAxis(p, hg.anchor, hg.axis, hg.angle * Math.PI / 180 * t);
      return p;
    });
  }

  return {
    update(st) {
      for (const name of Object.keys(net)) {
        const vs = faceVertsAt(name, st.t);
        quads[name].set(vs[0], vs[1], vs[2], vs[3]);
      }
    },
  };
}
