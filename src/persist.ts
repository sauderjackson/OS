import { defaultRecipe, normalizeRecipe } from './recipe';
import type { Recipe } from './types';

const KEY = 'pattern-engine:last-recipe';

export function loadStoredRecipe(): Recipe {
  if (typeof localStorage === 'undefined') return defaultRecipe();
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return defaultRecipe();
    return normalizeRecipe(JSON.parse(raw));
  } catch {
    return defaultRecipe();
  }
}

export function storeRecipe(recipe: Recipe): void {
  if (typeof localStorage === 'undefined') return;
  localStorage.setItem(KEY, JSON.stringify(recipe));
}
