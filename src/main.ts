import { defaultRecipe } from './recipe';
import { mountPreview } from './render/preview';
import { generateScene } from './scene';
import './styles.css';

const recipe = defaultRecipe();
const scene = generateScene(recipe);
const app = document.querySelector<HTMLElement>('#app');
if (!app) throw new Error('Missing #app');

app.innerHTML = `
  <header class="top">
    <div>
      <p class="mark">Pattern Engine</p>
      <p class="sub">seed ${recipe.seed} · circle packing · weighted shapes</p>
    </div>
  </header>
  <main class="stage">
    <div class="frame" id="frame"><div id="sketch"></div></div>
  </main>
`;

const frame = document.querySelector<HTMLElement>('#frame');
if (frame) frame.style.setProperty('--ar', `${scene.width} / ${scene.height}`);
const host = document.querySelector<HTMLElement>('#sketch');
if (!host) throw new Error('Missing sketch host');
mountPreview(host, () => scene);
