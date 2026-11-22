import { cloneRecipe, normalizeRecipe } from '../recipe';
import type { Recipe } from '../types';
import { downloadText } from './download';

export function exportRecipe(recipe: Recipe): void {
  const payload = cloneRecipe(recipe);
  downloadText(JSON.stringify(payload, null, 2), `pattern-recipe-${payload.seed}.json`, 'application/json');
}

export async function importRecipeFile(file: File): Promise<Recipe> {
  const text = await file.text();
  return normalizeRecipe(JSON.parse(text));
}
