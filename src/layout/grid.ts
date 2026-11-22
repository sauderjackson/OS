import type { Rng } from '../rng';
import { snapDown, activeSteps } from '../recipe';
import type { PlacedShape, Recipe } from '../types';
import { emptyTally, placeShape, pickShape } from './common';

export function layoutGrid(recipe: Recipe, rng: Rng, width: number, height: number): PlacedShape[] {
  const cols = Math.max(1, Math.round(recipe.grid.cols));
  const rows = Math.max(1, Math.round(recipe.grid.rows));
  const cellW = (width - recipe.margin * 2) / cols;
  const cellH = (height - recipe.margin * 2) / rows;
  const maxR = Math.max(4, Math.min(cellW, cellH) * 0.42);
  const steps = activeSteps(recipe);
  const radius = snapDown(maxR, steps);
  const tally = emptyTally();
  const screwCount = { value: 0 };
  const placed: PlacedShape[] = [];

  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      if (rng.next() < recipe.grid.skipChance) continue;
      const shape = pickShape(rng, recipe, tally);
      if (!shape) return placed;
      const x = recipe.margin + cellW * (col + 0.5);
      const y = recipe.margin + cellH * (row + 0.5);
      placed.push(placeShape(shape, x, y, radius, recipe, rng, tally, screwCount));
    }
  }
  return placed;
}
