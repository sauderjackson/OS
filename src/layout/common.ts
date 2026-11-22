import type { Rng } from '../rng';
import { shapeGeometry } from '../shapes';
import { PLACEMENT_SHAPES, type PlacedShape, type Recipe, type ShapeId, type Style } from '../types';

export function styleOf(recipe: Recipe): Style {
  return { stroke: recipe.stroke, strokeWeight: Math.max(0.5, recipe.strokeWeight) };
}

export function emptyTally(): Record<ShapeId, number> {
  return { driver: 0, grille: 0, tweeter: 0, port: 0, screws: 0, dot: 0 };
}

export function pickShape(rng: Rng, recipe: Recipe, counts: Record<ShapeId, number>): ShapeId | null {
  const available: ShapeId[] = [];
  let total = 0;
  for (let i = 0; i < PLACEMENT_SHAPES.length; i++) {
    const id = PLACEMENT_SHAPES[i];
    const weight = recipe.weights[id];
    if (weight > 0 && counts[id] < recipe.maxCounts[id]) {
      available.push(id);
      total += weight;
    }
  }
  if (available.length === 0 || total <= 0) return null;
  let t = rng.next() * total;
  for (let i = 0; i < available.length; i++) {
    t -= recipe.weights[available[i]];
    if (t <= 0) return available[i];
  }
  return available[available.length - 1];
}

export function placeShape(
  id: ShapeId,
  x: number,
  y: number,
  r: number,
  recipe: Recipe,
  rng: Rng,
  tally: Record<ShapeId, number>,
  screwCount: { value: number },
): PlacedShape {
  const built = shapeGeometry({
    id,
    x,
    y,
    r,
    palette: recipe.palette,
    rng,
    style: styleOf(recipe),
    recipe,
    screwCount,
  });
  tally[id] += 1;
  tally.screws = screwCount.value;
  return { id, x, y, r, primitives: built.primitives, screws: built.screws };
}

export function hits(
  x: number,
  y: number,
  r: number,
  occupied: ReadonlyArray<{ x: number; y: number; r: number }>,
  padding: number,
): boolean {
  for (let i = 0; i < occupied.length; i++) {
    const other = occupied[i];
    const dx = x - other.x;
    const dy = y - other.y;
    const need = r + other.r + padding;
    if (dx * dx + dy * dy < need * need) return true;
  }
  return false;
}
