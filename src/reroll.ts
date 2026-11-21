import { cloneRecipe } from './recipe';
import { PRESET_PALETTES } from './palettes/presets';
import type { Recipe } from './types';
import { LAYOUTS } from './types';

/** Used only to choose a new seed, palette, or layout. Image generation never calls this. */
export function cryptoUnit(): number {
  const buf = new Uint32Array(1);
  crypto.getRandomValues(buf);
  return buf[0] / 4294967296;
}

export function rerollRecipe(recipe: Recipe, random: () => number = cryptoUnit): Recipe {
  const next = cloneRecipe(recipe);
  next.seed = Math.floor(random() * 4294967296) >>> 0;
  if (!recipe.locks.palette) {
    const index = Math.min(PRESET_PALETTES.length - 1, Math.floor(random() * PRESET_PALETTES.length));
    const pick = PRESET_PALETTES[index];
    next.palette = { ...pick };
    next.paletteId = pick.id;
  }
  if (!recipe.locks.layout) {
    const index = Math.min(LAYOUTS.length - 1, Math.floor(random() * LAYOUTS.length));
    next.layout = LAYOUTS[index];
  }
  return next;
}
