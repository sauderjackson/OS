import { isPalette } from './palettes/storage';
import { PRESET_PALETTES, presetById } from './palettes/presets';
import type { AspectId, Counts, LayoutId, Recipe } from './types';
import { ASPECTS, LAYOUTS, RECIPE_VERSION, SCALE, SHAPE_IDS } from './types';

const ASPECT_RATIO: Record<AspectId, [number, number]> = {
  '1:1': [1, 1],
  '4:5': [4, 5],
  '9:16': [9, 16],
  '16:9': [16, 9],
};

export function emptyCounts(): Counts {
  return { driver: 0, grille: 0, tweeter: 0, port: 0, screws: 0, dot: 0 };
}

export function defaultRecipe(): Recipe {
  return {
    version: RECIPE_VERSION,
    seed: 1,
    layout: 'packing',
    paletteId: PRESET_PALETTES[0].id,
    palette: { ...PRESET_PALETTES[0] },
    weights: { driver: 34, grille: 18, tweeter: 16, port: 12, screws: 55, dot: 20 },
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

function clamp(value: unknown, fallback: number, min: number, max: number): number {
  const n = typeof value === 'number' ? value : typeof value === 'string' ? Number(value) : Number.NaN;
  if (!Number.isFinite(n)) return fallback;
  return Math.min(max, Math.max(min, n));
}

function bool(value: unknown, fallback: boolean): boolean {
  return typeof value === 'boolean' ? value : fallback;
}

function counts(value: unknown, fallback: Counts, max: number): Counts {
  const raw = value && typeof value === 'object' ? (value as Record<string, unknown>) : {};
  const next = emptyCounts();
  for (const id of SHAPE_IDS) {
    next[id] = clamp(raw[id], fallback[id], 0, max);
  }
  return next;
}

export function normalizeRecipe(input: unknown): Recipe {
  if (!input || typeof input !== 'object') throw new Error('Recipe must be a JSON object.');
  const raw = input as Record<string, unknown>;
  const base = defaultRecipe();
  const layout = LAYOUTS.includes(raw.layout as LayoutId) ? (raw.layout as LayoutId) : base.layout;
  const aspect = ASPECTS.includes(raw.aspect as AspectId) ? (raw.aspect as AspectId) : base.aspect;
  const paletteId = typeof raw.paletteId === 'string' ? raw.paletteId : base.paletteId;
  const palette = isPalette(raw.palette) ? { ...raw.palette } : { ...(presetById(paletteId) ?? base.palette) };
  const stepsRaw = Array.isArray(raw.sizeSteps) ? raw.sizeSteps : base.sizeSteps;
  const wanted = new Set(stepsRaw.map((step) => Number(step)));
  const sizeSteps = SCALE.filter((step) => wanted.has(step));
  const rings = clamp(raw.driverRings, 0, 0, 6);
  const driverRings = rings === 2 || rings === 3 || rings === 4 || rings === 5 || rings === 6 ? rings : 0;
  const packingRaw = raw.packing && typeof raw.packing === 'object' ? (raw.packing as Record<string, unknown>) : {};
  const gridRaw = raw.grid && typeof raw.grid === 'object' ? (raw.grid as Record<string, unknown>) : {};
  const heroRaw = raw.hero && typeof raw.hero === 'object' ? (raw.hero as Record<string, unknown>) : {};
  const locksRaw = raw.locks && typeof raw.locks === 'object' ? (raw.locks as Record<string, unknown>) : {};
  const packing = {
    minRadius: clamp(packingRaw.minRadius, base.packing.minRadius, 4, 1024),
    maxRadius: clamp(packingRaw.maxRadius, base.packing.maxRadius, 4, 1024),
    padding: clamp(packingRaw.padding, base.packing.padding, 0, 200),
    maxAttempts: Math.round(clamp(packingRaw.maxAttempts, base.packing.maxAttempts, 1, 5000)),
  };
  if (packing.minRadius > packing.maxRadius) {
    const swap = packing.minRadius;
    packing.minRadius = packing.maxRadius;
    packing.maxRadius = swap;
  }
  return {
    version: RECIPE_VERSION,
    seed: Math.round(clamp(raw.seed, base.seed, 0, 0xffffffff)) >>> 0,
    layout,
    paletteId: palette.id || paletteId,
    palette,
    weights: counts(raw.weights, base.weights, 100),
    maxCounts: counts(raw.maxCounts, base.maxCounts, 400),
    margin: clamp(raw.margin, base.margin, 0, 800),
    sizeSteps: sizeSteps.length > 0 ? [...sizeSteps] : [...base.sizeSteps],
    stroke: bool(raw.stroke, base.stroke),
    strokeWeight: clamp(raw.strokeWeight, base.strokeWeight, 0.5, 80),
    aspect,
    longEdge: Math.round(clamp(raw.longEdge, base.longEdge, 256, 4096)),
    locks: { palette: bool(locksRaw.palette, false), layout: bool(locksRaw.layout, false) },
    allowOverlap: bool(raw.allowOverlap, false),
    packing,
    grid: {
      cols: Math.round(clamp(gridRaw.cols, base.grid.cols, 1, 24)),
      rows: Math.round(clamp(gridRaw.rows, base.grid.rows, 1, 24)),
      skipChance: clamp(gridRaw.skipChance, base.grid.skipChance, 0, 0.9),
    },
    hero: { radiusFraction: clamp(heroRaw.radiusFraction, base.hero.radiusFraction, 0.05, 0.48) },
    driverRings,
  };
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
