import type { Rng } from '../rng';
import { activeSteps } from '../recipe';
import type { Occupied, PlacedShape, Recipe, ShapeId } from '../types';
import { emptyTally, hits, placeShape, pickShape } from './common';

export function packCircles(
  recipe: Recipe,
  rng: Rng,
  width: number,
  height: number,
  occupied: Occupied[] = [],
  counts?: Record<ShapeId, number>,
): PlacedShape[] {
  const tally = counts ?? emptyTally();
  const screwCount = { value: tally.screws };
  const bands = [...activeSteps(recipe)].sort((a, b) => b - a);
  const perBand = Math.max(1, Math.floor(recipe.packing.maxAttempts / Math.max(1, bands.length)));
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
      if (maxX < minX || maxY < minY) continue;
      const x = minX + rng.next() * (maxX - minX);
      const y = minY + rng.next() * (maxY - minY);
      if (!recipe.allowOverlap && hits(x, y, radius, occupied, recipe.packing.padding)) continue;
      placed.push(placeShape(shape, x, y, radius, recipe, rng, tally, screwCount));
      occupied.push({ x, y, r: radius });
    }
  }
  return placed;
}
