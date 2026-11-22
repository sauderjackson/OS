import type { Rng } from '../rng';
import type { PlacedShape, Recipe } from '../types';
import { layoutGrid } from './grid';
import { layoutHero } from './hero';
import { packCircles } from './packing';

export function layoutScene(recipe: Recipe, rng: Rng, width: number, height: number): PlacedShape[] {
  if (recipe.layout === 'grid') return layoutGrid(recipe, rng, width, height);
  if (recipe.layout === 'hero') return layoutHero(recipe, rng, width, height);
  return packCircles(recipe, rng, width, height);
}
