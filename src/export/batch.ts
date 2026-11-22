import JSZip from 'jszip';
import { cloneRecipe } from '../recipe';
import { generateScene } from '../scene';
import type { Recipe } from '../types';
import { slug } from './download';
import { sceneToSvg } from './svg';

/**
 * Inclusive batch: seeds start … start + count - 1.
 * Filenames: pattern_{seed}_{palette}.svg
 */
export async function batchSvgZip(recipe: Recipe, start: number, count: number): Promise<Blob> {
  const zip = new JSZip();
  const total = Math.max(1, Math.round(count));
  const first = start >>> 0;
  for (let i = 0; i < total; i++) {
    const seed = (first + i) >>> 0;
    const next = cloneRecipe(recipe);
    next.seed = seed;
    const scene = generateScene(next);
    const name = `pattern_${seed}_${slug(next.palette.name || next.paletteId)}.svg`;
    zip.file(name, sceneToSvg(scene));
  }
  return zip.generateAsync({ type: 'blob' });
}
