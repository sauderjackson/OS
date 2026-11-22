import { generateScene } from '../scene';
import type { Recipe } from '../types';
import { batchSvgZip } from './batch';
import { downloadBlob, downloadText, slug } from './download';
import { sceneToPngBlob } from './png';
import { exportRecipe, importRecipeFile } from './recipe-io';
import { sceneToSvg } from './svg';

export { sceneToSvg, sceneToPngBlob, batchSvgZip, exportRecipe, importRecipeFile, slug };

export async function exportSvg(recipe: Recipe): Promise<void> {
  const scene = generateScene(recipe);
  const name = `pattern_${recipe.seed}_${slug(recipe.palette.name || recipe.paletteId)}.svg`;
  downloadText(sceneToSvg(scene), name, 'image/svg+xml');
}

export async function exportPng(recipe: Recipe): Promise<void> {
  const scene = generateScene(recipe);
  const blob = await sceneToPngBlob(scene);
  downloadBlob(blob, `pattern_${recipe.seed}_${slug(recipe.palette.name || recipe.paletteId)}.png`);
}

export async function exportBatch(recipe: Recipe, count: number): Promise<void> {
  const blob = await batchSvgZip(recipe, recipe.seed, count);
  downloadBlob(blob, `pattern-batch_${recipe.seed}_${count}.zip`);
}
