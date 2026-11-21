import { generateScene } from '../src/scene';
import { defaultRecipe } from '../src/recipe';

function fingerprint(scene: ReturnType<typeof generateScene>): string {
  return JSON.stringify({
    width: scene.width,
    height: scene.height,
    background: scene.background,
    shapes: scene.shapes.map((shape) => ({
      id: shape.id,
      x: shape.x,
      y: shape.y,
      r: shape.r,
      primitives: shape.primitives,
    })),
  });
}

function assertNoOverlap(scene: ReturnType<typeof generateScene>, padding: number): void {
  const shapes = scene.shapes;
  if (shapes.length < 2) throw new Error('expected a packed field of dots');
  for (let i = 0; i < shapes.length; i++) {
    const a = shapes[i];
    if (a.x - a.r < 72 - 1e-6 || a.y - a.r < 72 - 1e-6) {
      throw new Error(`shape ${i} crosses the margin`);
    }
    if (a.x + a.r > scene.width - 72 + 1e-6 || a.y + a.r > scene.height - 72 + 1e-6) {
      throw new Error(`shape ${i} crosses the margin`);
    }
    for (let j = i + 1; j < shapes.length; j++) {
      const b = shapes[j];
      const dx = a.x - b.x;
      const dy = a.y - b.y;
      const dist = Math.hypot(dx, dy);
      const need = a.r + b.r + padding;
      if (dist + 1e-4 < need) {
        throw new Error(`overlap ${i}/${j}: ${dist} < ${need}`);
      }
    }
  }
}

const recipe = defaultRecipe();
const a = generateScene(recipe);
const b = generateScene(recipe);
const fa = fingerprint(a);
const fb = fingerprint(b);
if (fa !== fb) throw new Error('same seed produced different scenes');
assertNoOverlap(a, recipe.packing.padding);
if (a.shapes.some((shape) => shape.id !== 'dot')) throw new Error('step 1 should only place dots');

const started = performance.now();
generateScene(recipe);
const elapsed = performance.now() - started;
if (elapsed > 1000) throw new Error(`generation took ${elapsed.toFixed(1)}ms`);

let hash = 2166136261;
for (let i = 0; i < fa.length; i++) {
  hash ^= fa.charCodeAt(i);
  hash = Math.imul(hash, 16777619);
}
console.log(`shapes ${a.shapes.length}`);
console.log(`primitives ${a.shapes.reduce((n, shape) => n + shape.primitives.length, 0)}`);
console.log(`ms ${elapsed.toFixed(2)}`);
console.log(`fingerprint ${(hash >>> 0).toString(16)}`);
console.log('verify ok');
