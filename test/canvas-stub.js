// ==== Canvas 2D の簡易スタブ(2Dビルダーをブラウザ無しでテストする用) ====
// 実際には描かない。呼ばれたメソッドが存在し例外を投げないことだけ確かめる。
function makeCtx2DStub() {
  return {
    strokeStyle: "", fillStyle: "", lineWidth: 1, globalAlpha: 1,
    font: "", textAlign: "", textBaseline: "",
    setTransform() {}, setLineDash() {},
    clearRect() {}, beginPath() {}, closePath() {},
    moveTo() {}, lineTo() {}, arc() {}, arcTo() {}, rect() {},
    stroke() {}, fill() {},
    fillText() {}, measureText: (t) => ({ width: (t ? String(t).length : 0) * 8 }),
    save() {}, restore() {}, translate() {}, scale() {}, rotate() {},
  };
}

module.exports = { makeCtx2DStub };
