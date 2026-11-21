import type { Palette, Primitive, Recipe, Style } from '../types';
import type { Rng } from '../rng';

export interface ShapeArgs {
  x: number;
  y: number;
  r: number;
  palette: Palette;
  rng: Rng;
  style: Style;
  recipe: Recipe;
  /** Screws already attached to drivers during this scene. */
  screwCount: { value: number };
}

export function shapeGeometry(args: ShapeArgs): Primitive[] {
  const { x, y, r, palette, style } = args;
  return [disc(x, y, r, palette.primary, style)];
}

export function disc(x: number, y: number, r: number, color: string, style: Style): Primitive {
  if (style.stroke) {
    return {
      kind: 'circle',
      x,
      y,
      r,
      fill: null,
      stroke: color,
      strokeWidth: style.strokeWeight,
    };
  }
  return { kind: 'circle', x, y, r, fill: color, stroke: null, strokeWidth: 0 };
}
