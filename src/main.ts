import { exportBatch, exportPng, exportRecipe, exportSvg, importRecipeFile } from './export';
import { cloneRecipe } from './recipe';
import { loadStoredRecipe, storeRecipe } from './persist';
import { mountPreview } from './render/preview';
import { rerollRecipe } from './reroll';
import { generateScene } from './scene';
import type { Recipe, Scene } from './types';
import { mountGallery, type GalleryApi } from './ui/gallery';
import { bindKeys } from './ui/keyboard';
import { mountPanel, type PanelApi } from './ui/panel';
import './styles.css';

let recipe: Recipe = loadStoredRecipe();
let scene: Scene = generateScene(recipe);

const app = document.querySelector<HTMLElement>('#app');
if (!app) throw new Error('Missing #app');

app.innerHTML = `
  <header class="top">
    <div>
      <p class="mark">Pattern Engine</p>
      <p class="sub" data-sub></p>
    </div>
  </header>
  <div class="workspace">
    <div class="stage-col">
      <main class="stage">
        <div class="frame" id="frame"><div id="sketch"></div></div>
      </main>
      <section id="gallery" class="gallery"></section>
    </div>
    <aside id="panel" class="panel"></aside>
  </div>
  <footer class="keys">R reroll · ← → seed · S SVG · P PNG</footer>
`;

const frame = document.querySelector<HTMLElement>('#frame')!;
const sub = document.querySelector<HTMLElement>('[data-sub]')!;
const preview = mountPreview(document.querySelector<HTMLElement>('#sketch')!, () => scene);

let panel: PanelApi;
let gallery: GalleryApi;

function paintChrome(ms: number): void {
  sub.textContent = `${recipe.palette.name} · ${recipe.layout} · seed ${recipe.seed}`;
  frame.style.setProperty('--ar', `${scene.width} / ${scene.height}`);
  frame.style.setProperty('--ar-n', String(scene.width / scene.height));
  panel.setStatus(`${scene.width} × ${scene.height} · ${scene.shapes.length} shapes · ${ms.toFixed(0)} ms`);
}

function apply(next: Recipe, syncPanel: boolean): void {
  recipe = cloneRecipe(next);
  storeRecipe(recipe);
  const started = performance.now();
  scene = generateScene(recipe);
  preview.redraw();
  const ms = performance.now() - started;
  if (syncPanel) panel.sync(recipe);
  gallery.sync(recipe);
  paintChrome(ms);
}

async function withStatus(label: string, work: () => Promise<void>): Promise<void> {
  panel.setStatus(label);
  try {
    await work();
    panel.setStatus(`${label} done`);
  } catch (error) {
    panel.setStatus(error instanceof Error ? error.message : String(error));
  }
}

panel = mountPanel(document.querySelector<HTMLElement>('#panel')!, recipe, {
  onChange(next) {
    apply(next, false);
  },
  onReroll() {
    apply(rerollRecipe(recipe), true);
  },
  onPrev() {
    apply({ ...cloneRecipe(recipe), seed: recipe.seed === 0 ? 0 : (recipe.seed - 1) >>> 0 }, true);
  },
  onNext() {
    apply({ ...cloneRecipe(recipe), seed: recipe.seed >= 0xffffffff ? recipe.seed : recipe.seed + 1 }, true);
  },
  onExportSvg() {
    void withStatus('Exporting SVG…', () => exportSvg(recipe));
  },
  onExportPng() {
    void withStatus('Exporting PNG…', () => exportPng(recipe));
  },
  onExportBatch(count) {
    void withStatus(`Batch ${count}…`, () => exportBatch(recipe, count));
  },
  onSaveRecipe() {
    exportRecipe(recipe);
    panel.setStatus('Recipe saved');
  },
  onLoadRecipe(file) {
    void withStatus('Loading recipe…', async () => {
      const next = await importRecipeFile(file);
      apply(next, true);
    });
  },
});

gallery = mountGallery(document.querySelector<HTMLElement>('#gallery')!, recipe, (seed) => {
  apply({ ...cloneRecipe(recipe), seed }, true);
});

apply(recipe, false);

bindKeys({
  reroll() {
    apply(rerollRecipe(recipe), true);
  },
  prev() {
    apply({ ...cloneRecipe(recipe), seed: recipe.seed === 0 ? 0 : (recipe.seed - 1) >>> 0 }, true);
  },
  next() {
    apply({ ...cloneRecipe(recipe), seed: recipe.seed >= 0xffffffff ? recipe.seed : recipe.seed + 1 }, true);
  },
  svg() {
    void withStatus('Exporting SVG…', () => exportSvg(recipe));
  },
  png() {
    void withStatus('Exporting PNG…', () => exportPng(recipe));
  },
});
