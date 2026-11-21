import type { Rng } from '../rng';
import type { PlacedShape, Recipe } from '../types';
import { packCircles } from './packing';

export function layoutScene(recipe: Recipe, rng: Rng, width: number, height: number): PlacedShape[] {
  return packCircles(recipe, rng, width, height);
}
