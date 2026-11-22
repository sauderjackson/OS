import type { Rng } from '../rng';
import { activeSteps, snapDown } from '../recipe';
import type { Occupied, PlacedShape, Recipe } from '../types';
import { emptyTally, placeShape } from './common';
import { packCircles } from './packing';

export function layoutHero(recipe: Recipe, rng: Rng, width: number, height: number): PlacedShape[] {
  const short = Math.min(width, height);
  const target = short * recipe.hero.radiusFraction;
  const radius = snapDown(target, activeSteps(recipe));
  const x = width * 0.5;
  const y = height * 0.5;
  const tally = emptyTally();
  const screwCount = { value: 0 };
  const hero = placeShape('driver', x, y, radius, recipe, rng, tally, screwCount);
  const occupied: Occupied[] = [{ x, y, r: radius }];
  const fill = packCircles(recipe, rng, width, height, occupied, tally);
  const shapes: PlacedShape[] = [hero, ...fill];
  return shapes;
}
