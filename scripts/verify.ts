import { generateScene } from '../src/scene';
import { defaultRecipe } from '../src/recipe';
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

const prims = a.shapes.reduce((n, shape) => n + shape.primitives.length + shape.screws.length, 0);
console.log(`shapes ${a.shapes.length}`);
console.log(`primitives ${prims}`);
console.log(`ids ${[...seen].join(',')}`);
console.log(`ms ${elapsed.toFixed(2)}`);
console.log('verify ok');
