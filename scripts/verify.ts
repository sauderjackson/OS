import { batchSvgZip } from '../src/export/batch';
import { sceneToSvg } from '../src/export/svg';
import { PRESET_PALETTES } from '../src/palettes/presets';
import { generateScene } from '../src/scene';
import { defaultRecipe, normalizeRecipe } from '../src/recipe';
import { rerollRecipe } from '../src/reroll';
import type { PlacedShape } from '../src/types';

function fingerprint(scene: ReturnType<typeof generateScene>): string {
  return JSON.stringify(scene);
}

function assertNoOverlap(scene: ReturnType<typeof generateScene>, padding: number, margin: number): void {
  const shapes = scene.shapes;
  if (shapes.length < 2) throw new Error('expected a packed field');
  for (let i = 0; i < shapes.length; i++) {
    const a = shapes[i];
    if (a.x - a.r < margin - 1e-4 || a.y - a.r < margin - 1e-4) throw new Error(`shape ${i} crosses the margin`);
    if (a.x + a.r > scene.width - margin + 1e-4 || a.y + a.r > scene.height - margin + 1e-4) {
      throw new Error(`shape ${i} crosses the far margin`);
    }
    assertScrewsInside(a);
    for (let j = i + 1; j < shapes.length; j++) {
      const b = shapes[j];
      const dx = a.x - b.x;
      const dy = a.y - b.y;
      const dist = Math.hypot(dx, dy);
      const need = a.r + b.r + padding;
      if (dist + 1e-4 < need) throw new Error(`overlap ${i}/${j}: ${dist} < ${need}`);
    }
  }
}

function assertScrewsInside(shape: PlacedShape): void {
  if (shape.id !== 'driver' && shape.screws.length > 0) throw new Error('screws attached to a non-driver');
  for (const prim of shape.screws) {
    if (prim.kind !== 'circle') throw new Error('screw primitive should be a circle');
    const dx = prim.x - shape.x;
    const dy = prim.y - shape.y;
    if (dx * dx + dy * dy > shape.r * shape.r) throw new Error('screw escaped its driver');
  }
}

const recipe = defaultRecipe();
const a = generateScene(recipe);
const b = generateScene(recipe);
if (fingerprint(a) !== fingerprint(b)) throw new Error('same seed produced different scenes');
assertNoOverlap(a, recipe.packing.padding, recipe.margin);

const seen = new Set(a.shapes.map((shape) => shape.id));
for (const id of ['driver', 'grille', 'tweeter', 'port', 'dot'] as const) {
  if (!seen.has(id)) throw new Error(`seed 1 packing is missing ${id}`);
}
if (!a.shapes.some((shape) => shape.screws.length >= 6)) throw new Error('expected screws on a driver');

const started = performance.now();
generateScene(recipe);
const elapsed = performance.now() - started;
if (elapsed > 1000) throw new Error(`generation took ${elapsed.toFixed(1)}ms`);

if (PRESET_PALETTES.length !== 8) throw new Error('expected 8 palettes');
if (a.background !== '#F3EDE3') throw new Error('default palette should be Braun Cream');
const midnight = PRESET_PALETTES.find((palette) => palette.id === 'midnight-car-audio');
if (!midnight) throw new Error('missing midnight palette');
const dyed = generateScene({ ...recipe, paletteId: midnight.id, palette: { ...midnight } });
if (dyed.background !== midnight.background) throw new Error('palette did not reach the scene');
if (fingerprint(dyed) === fingerprint(a)) throw new Error('palette change should change the image');

const roundTrip = normalizeRecipe(JSON.parse(JSON.stringify(recipe)));
if (fingerprint(generateScene(roundTrip)) !== fingerprint(a)) throw new Error('recipe normalize changed the image');

let cursor = 0;
const locked = defaultRecipe();
locked.locks = { palette: true, layout: true };
locked.layout = 'grid';
locked.palette = { ...locked.palette, background: '#123456' };
const lockedRoll = rerollRecipe(locked, () => {
  cursor += 1;
  return 0.2;
});
if (cursor !== 1) throw new Error('locks should only draw a new seed');
if (lockedRoll.layout !== 'grid' || lockedRoll.palette.background !== '#123456') {
  throw new Error('locks did not hold');
}

cursor = 0;
const openRoll = rerollRecipe(defaultRecipe(), () => {
  const values = [0.25, 0.5, 0.99];
  const value = values[cursor] ?? 0;
  cursor += 1;
  return value;
});
if (openRoll.paletteId !== 'mono-ink') throw new Error(`expected mono-ink, got ${openRoll.paletteId}`);
if (openRoll.layout !== 'hero') throw new Error(`expected hero, got ${openRoll.layout}`);
if (openRoll.seed === 1) throw new Error('reroll should change the seed');

const gridRecipe = { ...defaultRecipe(), layout: 'grid' as const, seed: 7 };
const gridA = generateScene(gridRecipe);
if (fingerprint(gridA) !== fingerprint(generateScene(gridRecipe))) throw new Error('grid layout is not deterministic');
if (gridA.shapes.length < 4) throw new Error('grid produced too few shapes');

const heroRecipe = { ...defaultRecipe(), layout: 'hero' as const, seed: 11 };
const hero = generateScene(heroRecipe);
if (fingerprint(hero) !== fingerprint(generateScene(heroRecipe))) throw new Error('hero layout is not deterministic');
if (hero.shapes[0]?.id !== 'driver') throw new Error('hero layout should start with a driver');

const svg = sceneToSvg(a);
if (!svg.includes('<circle') || !svg.includes('data-shape="driver"')) {
  throw new Error('SVG should keep editable shape groups');
}
if (svg.split('<g ').length < 10) throw new Error('SVG should contain many separate groups');

const batchStart = performance.now();
const zip = await batchSvgZip(recipe, recipe.seed, 52);
const batchMs = performance.now() - batchStart;
if (batchMs > 30000) throw new Error(`batch of 52 took ${batchMs.toFixed(0)}ms`);
if (zip.size < 1000) throw new Error('batch zip looks empty');

const prims = a.shapes.reduce((n, shape) => n + shape.primitives.length + shape.screws.length, 0);
console.log(`shapes ${a.shapes.length}`);
console.log(`primitives ${prims}`);
console.log(`ids ${[...seen].join(',')}`);
console.log(`grid ${gridA.shapes.length}`);
console.log(`hero ${hero.shapes.length}`);
console.log(`svg ${svg.length}`);
console.log(`batch zip ${zip.size} bytes in ${batchMs.toFixed(0)}ms`);
console.log(`ms ${elapsed.toFixed(2)}`);
console.log('verify ok');
