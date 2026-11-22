import { cloneRecipe } from '../recipe';
import { sceneToDataUrl } from '../export/png';
import { generateScene } from '../scene';
import type { Recipe } from '../types';

const THUMB = 120;
const COUNT = 12;

export interface GalleryApi {
  sync(recipe: Recipe): void;
}

export function mountGallery(
  host: HTMLElement,
  initial: Recipe,
  onPick: (seed: number) => void,
): GalleryApi {
  host.innerHTML = `
    <div class="gallery-head">
      <h2>Next 12 seeds</h2>
    </div>
    <div class="gallery-grid" data-grid></div>
  `;
  const grid = host.querySelector<HTMLElement>('[data-grid]')!;
  let token = 0;

  const paint = (recipe: Recipe) => {
    const run = ++token;
    grid.replaceChildren();
    for (let i = 1; i <= COUNT; i++) {
      const seed = (recipe.seed + i) >>> 0;
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'thumb';
      button.title = `Seed ${seed}`;
      button.innerHTML = `<span>${seed}</span><canvas width="${THUMB}" height="${THUMB}"></canvas>`;
      button.addEventListener('click', () => onPick(seed));
      grid.append(button);
      queueMicrotask(() => {
        if (run !== token) return;
        const thumbRecipe = cloneRecipe(recipe);
        thumbRecipe.seed = seed;
        thumbRecipe.longEdge = THUMB;
        const scene = generateScene(thumbRecipe);
        const canvas = button.querySelector('canvas')!;
        const ratio = scene.width / scene.height;
        if (ratio >= 1) {
          canvas.width = THUMB;
          canvas.height = Math.max(1, Math.round(THUMB / ratio));
        } else {
          canvas.height = THUMB;
          canvas.width = Math.max(1, Math.round(THUMB * ratio));
        }
        const img = new Image();
        img.onload = () => {
          if (run !== token) return;
          const ctx = canvas.getContext('2d');
          if (!ctx) return;
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        };
        img.src = sceneToDataUrl(scene);
      });
    }
  };

  paint(initial);
  return { sync: paint };
}
