import type { Primitive, Scene } from '../types';

export function drawScene(
  ctx: CanvasRenderingContext2D,
  scene: Scene,
  destW?: number,
  destH?: number,
): void {
  const dw = destW ?? scene.width;
  const dh = destH ?? scene.height;
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.clearRect(0, 0, dw, dh);
  ctx.fillStyle = scene.background;
  ctx.fillRect(0, 0, dw, dh);
  const sx = dw / scene.width;
  const sy = dh / scene.height;
  ctx.setTransform(sx, 0, 0, sy, 0, 0);
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
  for (let i = 0; i < scene.shapes.length; i++) {
    const prims = scene.shapes[i].primitives;
    for (let p = 0; p < prims.length; p++) drawPrimitive(ctx, prims[p]);
  }
  ctx.setTransform(1, 0, 0, 1, 0, 0);
}

function applyPaint(
  ctx: CanvasRenderingContext2D,
  fill: string | null,
  stroke: string | null,
  strokeWidth: number,
): void {
  if (fill) {
    ctx.fillStyle = fill;
    ctx.fill();
  }
  if (stroke && strokeWidth > 0) {
    ctx.strokeStyle = stroke;
    ctx.lineWidth = strokeWidth;
    ctx.stroke();
  }
}

function drawPrimitive(ctx: CanvasRenderingContext2D, prim: Primitive): void {
  ctx.beginPath();
  if (prim.kind === 'circle') {
    ctx.arc(prim.x, prim.y, Math.max(0, prim.r), 0, Math.PI * 2);
    applyPaint(ctx, prim.fill, prim.stroke, prim.strokeWidth);
    return;
  }
  const x = prim.x - prim.w / 2;
  const y = prim.y - prim.h / 2;
  const radius = Math.max(0, Math.min(prim.radius, prim.w / 2, prim.h / 2));
  if (typeof ctx.roundRect === 'function') {
    ctx.roundRect(x, y, prim.w, prim.h, radius);
  } else {
    ctx.rect(x, y, prim.w, prim.h);
  }
  applyPaint(ctx, prim.fill, prim.stroke, prim.strokeWidth);
}
