import { layoutScene } from './layout';
import { mulberry32 } from './rng';
import { canvasSize } from './recipe';
import type { Recipe, Scene } from './types';

/**
 * One mulberry32 stream per image.
 * Order: layout draws positions largest-band first, and each accepted shape
 * consumes the stream only after it has been placed.
 */
export function generateScene(recipe: Recipe): Scene {
  const { width, height } = canvasSize(recipe);
  const rng = mulberry32(recipe.seed >>> 0);
  const shapes = layoutScene(recipe, rng, width, height);
  return {
    width,
    height,
    background: recipe.palette.background,
    shapes,
  };
}
