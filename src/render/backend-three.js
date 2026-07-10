// ==== 3Dバックエンド(Three.js)。2Dと同じインターフェースに包む ====
"use strict";

function makeThreeBackend(stageEl) {
  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setClearColor(0xfbfcfd);
  renderer.domElement.style.display = "block";
  stageEl.appendChild(renderer.domElement);
  const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 300);

  function resize() {
    const w = stageEl.clientWidth, h = stageEl.clientHeight;
    renderer.setSize(w, h);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }

  return {
    kind: "three",
    show(v) { renderer.domElement.style.display = v ? "block" : "none"; },
    resize,
    load(scn, builders) {
      const scene = new THREE.Scene();
      addLights(scene);
      const handle = builders[scn.type](scene, scn.params);
      return { scene, handle };
    },
    frame(bctx, st) {
      camera.position.set(...st.camPos);
      camera.lookAt(...st.camTarget);
      bctx.handle.update(st);
      renderer.render(bctx.scene, camera);
    },
    dispose(bctx) {
      if (bctx && bctx.scene) disposeScene(bctx.scene);
    },
  };
}
