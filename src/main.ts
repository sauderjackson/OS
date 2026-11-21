import { cloneRecipe } from './recipe';
import { loadStoredRecipe, storeRecipe } from './persist';
import { mountPreview } from './render/preview';
import { rerollRecipe } from './reroll';
import { generateScene } from './scene';
import type { Recipe, Scene } from './types';
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
    <main class="stage">
      <div class="frame" id="frame"><div id="sketch"></div></div>
    </main>
    <aside id="panel" class="panel"></aside>
  </div>
  <footer class="keys">R reroll · ← → seed</footer>
`;

const frame = document.querySelector<HTMLElement>('#frame')!;
const sub = document.querySelector<HTMLElement>('[data-sub]')!;
const preview = mountPreview(document.querySelector<HTMLElement>('#sketch')!, () => scene);

let panel: PanelApi;

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
  paintChrome(ms);
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
});
