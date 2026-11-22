import type { Primitive, Scene } from '../types';

function esc(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('"', '&quot;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;');
}

function attrs(fill: string | null, stroke: string | null, strokeWidth: number): string {
  const parts = [`fill="${esc(fill ?? 'none')}"`];
  if (stroke && strokeWidth > 0) {
    parts.push(`stroke="${esc(stroke)}"`, `stroke-width="${strokeWidth}"`, 'stroke-linejoin="round"', 'stroke-linecap="round"');
  } else {
    parts.push('stroke="none"');
  }
  return parts.join(' ');
}

function primitiveSvg(prim: Primitive): string {
  if (prim.kind === 'circle') {
    return `<circle cx="${prim.x}" cy="${prim.y}" r="${prim.r}" ${attrs(prim.fill, prim.stroke, prim.strokeWidth)} />`;
  }
  const x = prim.x - prim.w / 2;
  const y = prim.y - prim.h / 2;
  const radius = Math.max(0, Math.min(prim.radius, prim.w / 2, prim.h / 2));
  return `<rect x="${x}" y="${y}" width="${prim.w}" height="${prim.h}" rx="${radius}" ry="${radius}" ${attrs(prim.fill, prim.stroke, prim.strokeWidth)} />`;
}

/** Build a real vector SVG from the same primitives the canvas draws. */
export function sceneToSvg(scene: Scene): string {
  const parts: string[] = [
    `<?xml version="1.0" encoding="UTF-8"?>`,
    `<svg xmlns="http://www.w3.org/2000/svg" width="${scene.width}" height="${scene.height}" viewBox="0 0 ${scene.width} ${scene.height}">`,
    `<title>Pattern Engine</title>`,
    `<rect width="100%" height="100%" fill="${esc(scene.background)}" />`,
  ];
  for (let i = 0; i < scene.shapes.length; i++) {
    const shape = scene.shapes[i];
    parts.push(`<g id="shape-${i}-${shape.id}" data-shape="${shape.id}">`);
    for (let p = 0; p < shape.primitives.length; p++) parts.push(primitiveSvg(shape.primitives[p]));
    if (shape.screws.length > 0) {
      parts.push(`<g id="screws-${i}" data-shape="screws">`);
      for (let p = 0; p < shape.screws.length; p++) parts.push(primitiveSvg(shape.screws[p]));
      parts.push(`</g>`);
    }
    parts.push(`</g>`);
  }
  parts.push(`</svg>`);
  return parts.join('\n');
}
