import type { Rng } from '../rng';
import { activeSteps } from '../recipe';
import { shapeGeometry } from '../shapes';
import { PLACEMENT_SHAPES, type Occupied, type PlacedShape, type Recipe, type ShapeId } from '../types';

function styleOf(recipe: Recipe) {
  return { stroke: recipe.stroke, strokeWeight: Math.max(0.5, recipe.strokeWeight) };
}

function hits(x: number, y: number, r: number, occupied: readonly Occupied[], padding: number): boolean {
  for (let i = 0; i < occupied.length; i++) {
    const other = occupied[i];
    const dx = x - other.x;
    const dy = y - other.y;
    const need = r + other.r + padding;
    if (dx * dx + dy * dy < need * need) return true;
  }
  return false;
}

function pickShape(rng: Rng, recipe: Recipe, counts: Record<ShapeId, number>): ShapeId | null {
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

export function packCircles(
  recipe: Recipe,
  rng: Rng,
  width: number,
  height: number,
  occupied: Occupied[] = [],
  counts?: Record<ShapeId, number>,
): PlacedShape[] {
  const tally: Record<ShapeId, number> = counts ?? {
    driver: 0,
    grille: 0,
    tweeter: 0,
    port: 0,
    screws: 0,
    dot: 0,
  };
  const screwCount = { value: tally.screws };
  const bands = [...activeSteps(recipe)].sort((a, b) => b - a);
  const perBand = Math.max(1, Math.floor(recipe.packing.maxAttempts / bands.length));
  const placed: PlacedShape[] = [];
  let attempts = 0;

  for (let b = 0; b < bands.length; b++) {
    const radius = bands[b];
    let bandTries = 0;
    while (bandTries < perBand && attempts < recipe.packing.maxAttempts) {
      bandTries += 1;
      attempts += 1;
      const shape = pickShape(rng, recipe, tally);
      if (!shape) return placed;
      const minX = recipe.margin + radius;
      const maxX = width - recipe.margin - radius;
      const minY = recipe.margin + radius;
      const maxY = height - recipe.margin - radius;
      const spanX = Math.max(0, maxX - minX);
      const spanY = Math.max(0, maxY - minY);
      const x = minX + rng.next() * spanX;
      const y = minY + rng.next() * spanY;
      if (maxX < minX || maxY < minY) continue;
      if (!recipe.allowOverlap && hits(x, y, radius, occupied, recipe.packing.padding)) continue;
      const primitives = shapeGeometry({
        x,
        y,
        r: radius,
        palette: recipe.palette,
        rng,
        style: styleOf(recipe),
        recipe,
        screwCount,
      });
      tally[shape] += 1;
      tally.screws = screwCount.value;
      occupied.push({ x, y, r: radius });
      placed.push({ id: shape, x, y, r: radius, primitives });
    }
  }
  return placed;
}
