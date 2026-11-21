import { mixHex } from '../color';
import type { Rng } from '../rng';
import type { Palette, Primitive, Recipe, ShapeId, Style } from '../types';

export interface ShapeArgs {
  id: ShapeId;
  x: number;
  y: number;
  r: number;
  palette: Palette;
  rng: Rng;
  style: Style;
  recipe: Recipe;
  /** Drivers that already received screws in this scene. */
  screwCount: { value: number };
}

export interface BuiltShape {
  primitives: Primitive[];
  screws: Primitive[];
}

export function shapeGeometry(args: ShapeArgs): BuiltShape {
  switch (args.id) {
    case 'driver':
      return driverGeometry(args);
    case 'grille':
      return { primitives: grilleGeometry(args), screws: [] };
    case 'tweeter':
      return { primitives: tweeterGeometry(args), screws: [] };
    case 'port':
      return { primitives: portGeometry(args), screws: [] };
    case 'dot':
      return { primitives: dotGeometry(args), screws: [] };
    case 'screws':
      return { primitives: [], screws: screwGeometry(args.x, args.y, args.r, args.palette, args.rng, args.style) };
    default:
      return { primitives: dotGeometry(args), screws: [] };
  }
}

export function disc(x: number, y: number, r: number, color: string, style: Style): Primitive {
  if (style.stroke) {
    return { kind: 'circle', x, y, r, fill: null, stroke: color, strokeWidth: style.strokeWeight };
  }
  return { kind: 'circle', x, y, r, fill: color, stroke: null, strokeWidth: 0 };
}

export function ring(x: number, y: number, r: number, color: string, width: number): Primitive {
  return { kind: 'circle', x, y, r: Math.max(0, r), fill: null, stroke: color, strokeWidth: Math.max(0.5, width) };
}

function rounded(x: number, y: number, w: number, h: number, radius: number, color: string, style: Style): Primitive {
  if (style.stroke) {
    return {
      kind: 'rect',
      x,
      y,
      w,
      h,
      radius,
      fill: null,
      stroke: color,
      strokeWidth: style.strokeWeight,
    };
  }
  return { kind: 'rect', x, y, w, h, radius, fill: color, stroke: null, strokeWidth: 0 };
}

function driverGeometry(args: ShapeArgs): BuiltShape {
  const { x, y, r, palette, rng, style, recipe } = args;
  const rings = recipe.driverRings === 0 ? rng.int(2, 6) : recipe.driverRings;
  const primitives: Primitive[] = [disc(x, y, r, palette.primary, style)];
  if (!style.stroke) {
    primitives.push(ring(x, y, r * 0.955, palette.secondary, Math.max(style.strokeWeight, r * 0.085)));
  }
  const dustR = r * 0.18;
  const outer = r * 0.7;
  for (let i = 1; i <= rings; i++) {
    const rr = dustR + (outer - dustR) * (i / (rings + 1));
    primitives.push(ring(x, y, rr, palette.detail, Math.max(1, style.strokeWeight * 0.65)));
  }
  primitives.push(disc(x, y, dustR, palette.accent, style));
  primitives.push(disc(x, y, dustR * 0.28, palette.background, style));
  return { primitives, screws: maybeScrews(args) };
}

function grilleGeometry(args: ShapeArgs): Primitive[] {
  const { x, y, r, palette, rng, style } = args;
  const hex = rng.next() < 0.5;
  const primitives: Primitive[] = [disc(x, y, r, palette.primary, style)];
  const spacing = r / 4.8;
  const hole = Math.max(1.25, spacing * 0.28);
  const rowStep = hex ? spacing * 0.86 : spacing;
  const rows = Math.ceil((r - hole) / rowStep);
  const cols = Math.ceil((r - hole) / spacing);
  const holeColor = style.stroke ? palette.detail : palette.background;
  const limit = (r - hole) * (r - hole);
  for (let iy = -rows; iy <= rows; iy++) {
    const py = iy * rowStep;
    const shift = hex && Math.abs(iy) % 2 === 1 ? spacing * 0.5 : 0;
    for (let ix = -cols; ix <= cols; ix++) {
      const px = ix * spacing + shift;
      if (px * px + py * py > limit) continue;
      primitives.push(disc(x + px, y + py, hole, holeColor, style));
    }
  }
  primitives.push(ring(x, y, r * 0.98, palette.detail, Math.max(1, style.strokeWeight * 0.7)));
  return primitives;
}

function tweeterGeometry(args: ShapeArgs): Primitive[] {
  const { x, y, r, palette, style } = args;
  const highlight = mixHex(palette.accent, palette.background, 0.42);
  return [
    ring(x, y, r * 0.96, palette.primary, Math.max(1.5, r * 0.035)),
    disc(x, y, r * 0.72, palette.accent, style),
    disc(x, y, r * 0.26, highlight, style),
  ];
}

function portGeometry(args: ShapeArgs): Primitive[] {
  const { x, y, r, palette, rng, style } = args;
  const slot = rng.next() < 0.45;
  if (!slot) {
    return [
      disc(x, y, r, palette.secondary, style),
      ring(x, y, r * 0.66, palette.detail, Math.max(style.strokeWeight, r * 0.05)),
    ];
  }
  const w = r * 1.7;
  const h = r * 0.7;
  const inset = Math.max(style.strokeWeight, r * 0.08);
  const innerW = Math.max(1, w - inset * 2);
  const innerH = Math.max(1, h - inset * 2);
  return [
    rounded(x, y, w, h, h / 2, palette.secondary, style),
    {
      kind: 'rect',
      x,
      y,
      w: innerW,
      h: innerH,
      radius: innerH / 2,
      fill: null,
      stroke: palette.detail,
      strokeWidth: Math.max(1, style.strokeWeight * 0.85),
    },
  ];
}

function dotGeometry(args: ShapeArgs): Primitive[] {
  const color = args.rng.next() < 0.35 ? args.palette.accent : args.palette.primary;
  return [disc(args.x, args.y, args.r, color, args.style)];
}

function maybeScrews(args: ShapeArgs): Primitive[] {
  const { recipe, screwCount, rng } = args;
  if (recipe.weights.screws <= 0 || screwCount.value >= recipe.maxCounts.screws) return [];
  if (rng.next() >= recipe.weights.screws / 100) return [];
  screwCount.value += 1;
  return screwGeometry(args.x, args.y, args.r, args.palette, rng, args.style);
}

function screwGeometry(
  x: number,
  y: number,
  r: number,
  palette: Palette,
  rng: Rng,
  style: Style,
): Primitive[] {
  const count = rng.int(3, 6);
  const rotation = rng.next() * Math.PI * 2;
  const orbit = r * 0.62;
  const screwR = Math.max(1.5, r * 0.055);
  const primitives: Primitive[] = [];
  for (let i = 0; i < count; i++) {
    const angle = rotation + (Math.PI * 2 * i) / count;
    const sx = x + Math.cos(angle) * orbit;
    const sy = y + Math.sin(angle) * orbit;
    primitives.push(disc(sx, sy, screwR, palette.detail, style));
    primitives.push(disc(sx, sy, screwR * 0.36, palette.primary, style));
  }
  return primitives;
}
