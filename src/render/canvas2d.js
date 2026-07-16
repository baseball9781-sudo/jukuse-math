// ==== 2D描画レイヤー(Canvas)。平面図形・速さのダイヤグラム・グラフ用 ====
"use strict";

/* 描画ヘルパー G:
   ワールド座標(問題の単位, 例: cm や 時間・距離)で図形を置くと、
   画面ピクセルへ変換して描く。3Dの「camPos/camTarget」に相当するのが view。

   view = { ox, oy, scale, yUp }
     ox, oy : ワールド原点(0,0)の画面ピクセル位置
     scale  : ワールド1単位 = 何ピクセル
     yUp    : true でy軸上向き(グラフ用)、false で下向き(画面と同じ)
   view はシナリオの状態(st.view)からも動かせる(ズーム・パン)。

   すべての座標はワールド単位。色は C2D(CSS文字列)を使う。 */
function makeG(ctx, screen, view) {
  const dpr = view.dpr || 1;
  const ox = view.ox, oy = view.oy, s = view.scale, yUp = !!view.yUp;
  const SX = (x) => ox + x * s;
  const SY = (y) => (yUp ? oy - y * s : oy + y * s);

  function stroke(color, w, dash, alpha) {
    ctx.strokeStyle = color || C2D.ink;
    ctx.lineWidth = (w || 1.5);
    ctx.globalAlpha = alpha == null ? 1 : alpha;
    ctx.setLineDash(dash || []);
  }
  function fillStyle(color, alpha) {
    ctx.fillStyle = color;
    ctx.globalAlpha = alpha == null ? 1 : alpha;
  }

  const G = {
    view,
    sx: SX, sy: SY,
    px: (x) => x * s, // ワールド長さ→ピクセル長さ

    clear() {
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.globalAlpha = 1;
      ctx.clearRect(0, 0, screen.w, screen.h);
    },

    // 方眼(ワールド範囲 [x0,x1]×[y0,y1] を step 刻み)
    grid(x0, y0, x1, y1, step, opts = {}) {
      const boldEvery = opts.boldEvery || 0;
      let n = 0;
      for (let x = x0; x <= x1 + 1e-9; x += step) {
        const bold = boldEvery && Math.round(x / step) % boldEvery === 0;
        stroke(bold ? C2D.gridBold : C2D.grid, bold ? 1.2 : 1, [], opts.alpha);
        ctx.beginPath(); ctx.moveTo(SX(x), SY(y0)); ctx.lineTo(SX(x), SY(y1)); ctx.stroke();
      }
      for (let y = y0; y <= y1 + 1e-9; y += step) {
        const bold = boldEvery && Math.round(y / step) % boldEvery === 0;
        stroke(bold ? C2D.gridBold : C2D.grid, bold ? 1.2 : 1, [], opts.alpha);
        ctx.beginPath(); ctx.moveTo(SX(x0), SY(y)); ctx.lineTo(SX(x1), SY(y)); ctx.stroke();
      }
      ctx.globalAlpha = 1;
    },

    line(x1, y1, x2, y2, opts = {}) {
      stroke(opts.color, opts.w, opts.dash, opts.alpha);
      ctx.beginPath(); ctx.moveTo(SX(x1), SY(y1)); ctx.lineTo(SX(x2), SY(y2)); ctx.stroke();
      ctx.globalAlpha = 1;
    },

    // 折れ線 / 経路。pts = [[x,y],...]
    path(pts, opts = {}) {
      if (pts.length < 2) return;
      stroke(opts.color, opts.w, opts.dash, opts.alpha);
      ctx.beginPath(); ctx.moveTo(SX(pts[0][0]), SY(pts[0][1]));
      for (let i = 1; i < pts.length; i++) ctx.lineTo(SX(pts[i][0]), SY(pts[i][1]));
      if (opts.close) ctx.closePath();
      ctx.stroke();
      ctx.globalAlpha = 1;
    },

    // 多角形。pts=[[x,y],...] fill/stroke両対応
    poly(pts, opts = {}) {
      if (pts.length < 2) return;
      ctx.beginPath(); ctx.moveTo(SX(pts[0][0]), SY(pts[0][1]));
      for (let i = 1; i < pts.length; i++) ctx.lineTo(SX(pts[i][0]), SY(pts[i][1]));
      ctx.closePath();
      if (opts.fill) { fillStyle(opts.fill, opts.fillAlpha); ctx.fill(); }
      if (opts.color !== null) { stroke(opts.color, opts.w, opts.dash, opts.alpha); ctx.stroke(); }
      ctx.globalAlpha = 1;
    },

    circle(x, y, r, opts = {}) {
      ctx.beginPath(); ctx.arc(SX(x), SY(y), r * s, 0, Math.PI * 2);
      if (opts.fill) { fillStyle(opts.fill, opts.fillAlpha); ctx.fill(); }
      if (opts.color !== null) { stroke(opts.color, opts.w, opts.dash, opts.alpha); ctx.stroke(); }
      ctx.globalAlpha = 1;
    },

    // 点(半径ピクセル固定の丸)。動点の表示に。
    dot(x, y, opts = {}) {
      const rp = opts.rp || 5;
      ctx.beginPath(); ctx.arc(SX(x), SY(y), rp, 0, Math.PI * 2);
      fillStyle(opts.color || C2D.red, opts.alpha);
      ctx.fill();
      if (opts.ring) { stroke("#fff", 2, [], opts.alpha); ctx.stroke(); }
      ctx.globalAlpha = 1;
    },

    // 円弧(角度は度、反時計まわり基準)。中心角・回転の表示に。
    arc(x, y, r, a0deg, a1deg, opts = {}) {
      const a0 = (-a0deg) * Math.PI / 180, a1 = (-a1deg) * Math.PI / 180;
      stroke(opts.color, opts.w, opts.dash, opts.alpha);
      ctx.beginPath(); ctx.arc(SX(x), SY(y), r * s, a0, a1, true); ctx.stroke();
      ctx.globalAlpha = 1;
    },

    // 矢印(始点→終点)
    arrow(x1, y1, x2, y2, opts = {}) {
      stroke(opts.color, opts.w, opts.dash, opts.alpha);
      const X1 = SX(x1), Y1 = SY(y1), X2 = SX(x2), Y2 = SY(y2);
      ctx.beginPath(); ctx.moveTo(X1, Y1); ctx.lineTo(X2, Y2); ctx.stroke();
      const ang = Math.atan2(Y2 - Y1, X2 - X1), hl = opts.head || 10;
      ctx.beginPath(); ctx.moveTo(X2, Y2);
      ctx.lineTo(X2 - hl * Math.cos(ang - 0.4), Y2 - hl * Math.sin(ang - 0.4));
      ctx.lineTo(X2 - hl * Math.cos(ang + 0.4), Y2 - hl * Math.sin(ang + 0.4));
      ctx.closePath(); fillStyle(opts.color || C2D.ink, opts.alpha); ctx.fill();
      ctx.globalAlpha = 1;
    },

    // 文字(ワールド位置に、ピクセルオフセット付き)
    text(x, y, str, opts = {}) {
      const size = opts.size || 15;
      ctx.font = `${opts.weight || "bold"} ${size}px "Hiragino Kaku Gothic ProN","Hiragino Sans","Yu Gothic",sans-serif`;
      ctx.textAlign = opts.align || "center";
      ctx.textBaseline = opts.baseline || "middle";
      fillStyle(opts.color || C2D.ink, opts.alpha);
      ctx.fillText(str, SX(x) + (opts.dx || 0), SY(y) + (opts.dy || 0));
      ctx.globalAlpha = 1;
    },

    // ラベル付きバッジ(動点の名前など。背景付きで見やすく)
    badge(x, y, str, opts = {}) {
      const size = opts.size || 13, padx = 6, pady = 3;
      ctx.font = `bold ${size}px "Hiragino Kaku Gothic ProN",sans-serif`;
      const w = ctx.measureText(str).width;
      const X = SX(x) + (opts.dx || 0), Y = SY(y) + (opts.dy || 0);
      fillStyle(opts.bg || C2D.red, opts.alpha);
      const bw = w + padx * 2, bh = size + pady * 2;
      ctx.beginPath();
      const rr = 5, bx = X - bw / 2, by = Y - bh / 2;
      ctx.moveTo(bx + rr, by);
      ctx.arcTo(bx + bw, by, bx + bw, by + bh, rr);
      ctx.arcTo(bx + bw, by + bh, bx, by + bh, rr);
      ctx.arcTo(bx, by + bh, bx, by, rr);
      ctx.arcTo(bx, by, bx + bw, by, rr);
      ctx.fill();
      ctx.textAlign = "center"; ctx.textBaseline = "middle";
      fillStyle(opts.fg || "#fff", opts.alpha);
      ctx.fillText(str, X, Y + 0.5);
      ctx.globalAlpha = 1;
    },
  };
  return G;
}

// region の shape(rect/poly/seg)を赤い点線で強調表示する(quizのなぞりフィードバック)
function drawRegionHighlight(g, shape, alpha) {
  const opts = { color: C2D.red, w: 3, dash: [7, 5], alpha };
  if (shape.kind === "rect") {
    g.poly([[shape.x, shape.y], [shape.x + shape.w, shape.y],
            [shape.x + shape.w, shape.y + shape.h], [shape.x, shape.y + shape.h]],
      { ...opts, fill: C2D.redFill, fillAlpha: alpha * 0.5 });
  } else if (shape.kind === "poly") {
    g.poly(shape.pts, { ...opts, fill: C2D.redFill, fillAlpha: alpha * 0.5 });
  } else if (shape.kind === "seg") {
    g.line(shape.a[0], shape.a[1], shape.b[0], shape.b[1], opts);
  }
}

/* 2Dバックエンド: <canvas> を用意し、毎フレーム clear→draw する */
function makeCanvas2DBackend(stageEl) {
  const canvas = document.createElement("canvas");
  canvas.style.display = "block";
  canvas.style.width = "100%";
  canvas.style.height = "100%";
  stageEl.appendChild(canvas);
  const ctx = canvas.getContext("2d");
  const screen = { w: 0, h: 0 };
  let dpr = 1;

  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    screen.w = stageEl.clientWidth;
    screen.h = stageEl.clientHeight;
    canvas.width = screen.w * dpr;
    canvas.height = screen.h * dpr;
  }

  return {
    kind: "canvas2d",
    canvas,
    show(v) { canvas.style.display = v ? "block" : "none"; },
    resize,
    load(scn, builders) {
      const handle = builders[scn.type](scn.params);
      return { handle };
    },
    frame(bctx, st, overlay) {
      // 既定ビュー: シナリオの base.view を状態として補間したもの(st.view)を使う。
      // なければ画面中央・スケール1。
      const v = st.view || { ox: screen.w / 2, oy: screen.h / 2, scale: 24, yUp: false };
      const view = {
        ox: v.ox != null ? v.ox : screen.w / 2,
        oy: v.oy != null ? v.oy : screen.h / 2,
        scale: v.scale != null ? v.scale : 24,
        yUp: !!v.yUp, dpr,
      };
      const g = makeG(ctx, screen, view);
      g.clear();
      bctx.handle.draw(g, st, screen);
      // quizモード: なぞられた region のハイライト(ビルダー非依存の上書き描画)
      if (overlay && overlay.shape && overlay.alpha > 0.01) {
        drawRegionHighlight(g, overlay.shape, overlay.alpha);
      }
      bctx.lastView = view; // 入力(画面→ワールド変換)用に公開
    },
    dispose() {},
  };
}
