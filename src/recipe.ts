import type { AspectId, Counts, Palette, Recipe } from './types';
import { RECIPE_VERSION, SCALE } from './types';

const ASPECT_RATIO: Record<AspectId, [number, number]> = {
  '1:1': [1, 1],
  '4:5': [4, 5],
  '9:16': [9, 16],
  '16:9': [16, 9],
};

/** Step 1 palette. Preset library replaces this constant in a later step. */
export const STEP_PALETTE: Palette = {
  id: 'braun-cream',
  name: 'Braun Cream',
  background: '#F3EDE3',
  primary: '#2B2B2B',
  secondary: '#D7CBBA',
  accent: '#C65D2E',
  detail: '#8E8478',
};

export function emptyCounts(): Counts {
  return { driver: 0, grille: 0, tweeter: 0, port: 0, screws: 0, dot: 0 };
}

export function defaultRecipe(): Recipe {
  return {
    version: RECIPE_VERSION,
    seed: 1,
    layout: 'packing',
    paletteId: STEP_PALETTE.id,
    palette: { ...STEP_PALETTE },
    weights: { driver: 0, grille: 0, tweeter: 0, port: 0, screws: 0, dot: 100 },
    maxCounts: { driver: 10, grille: 8, tweeter: 12, port: 6, screws: 8, dot: 48 },
    margin: 72,
    sizeSteps: [16, 32, 64, 128, 256],
    stroke: false,
    strokeWeight: 8,
    aspect: '1:1',
    longEdge: 3000,
    locks: { palette: false, layout: false },
    allowOverlap: false,
    packing: { minRadius: 16, maxRadius: 256, padding: 12, maxAttempts: 480 },
    grid: { cols: 6, rows: 6, skipChance: 0.18 },
    hero: { radiusFraction: 0.22 },
    driverRings: 0,
  };
}

export function canvasSize(recipe: Pick<Recipe, 'aspect' | 'longEdge'>): { width: number; height: number } {
  const [aw, ah] = ASPECT_RATIO[recipe.aspect];
  const longEdge = Math.max(1, Math.round(recipe.longEdge));
  if (aw >= ah) {
    return { width: longEdge, height: Math.max(1, Math.round((longEdge * ah) / aw)) };
  }
  return { width: Math.max(1, Math.round((longEdge * aw) / ah)), height: longEdge };
}

export function activeSteps(recipe: Recipe): number[] {
  const wanted = new Set(recipe.sizeSteps);
  const steps = SCALE.filter((step) => wanted.has(step));
  const min = recipe.packing.minRadius;
  const max = recipe.packing.maxRadius;
  const inRange = steps.filter((step) => step >= min && step <= max);
  if (inRange.length > 0) return inRange;
  if (steps.length > 0) return steps;
  return [Math.max(8, Math.round(min))];
}

/** Largest scale step that does not exceed `target`. Falls back to target. */
export function snapDown(target: number, steps: readonly number[]): number {
  let best = 0;
  for (const step of steps) {
    if (step <= target + 1e-6 && step > best) best = step;
  }
  return best > 0 ? best : target;
}

export function cloneRecipe(recipe: Recipe): Recipe {
  return {
    ...recipe,
    palette: { ...recipe.palette },
    weights: { ...recipe.weights },
    maxCounts: { ...recipe.maxCounts },
    sizeSteps: [...recipe.sizeSteps],
    locks: { ...recipe.locks },
    packing: { ...recipe.packing },
    grid: { ...recipe.grid },
    hero: { ...recipe.hero },
  };
}
