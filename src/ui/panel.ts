import { cloneRecipe } from '../recipe';
import { mountPaletteEditor, type PaletteEditor } from './palette';
import type { AspectId, LayoutId, Recipe, ShapeId } from '../types';
import { ASPECTS, LAYOUTS, SCALE, SHAPE_IDS } from '../types';

const SHAPE_LABEL: Record<ShapeId, string> = {
  driver: 'Driver',
  grille: 'Grille',
  tweeter: 'Tweeter',
  port: 'Port',
  screws: 'Screws',
  dot: 'Dot',
};

export interface PanelHandlers {
  onChange(recipe: Recipe): void;
  onReroll(): void;
  onPrev(): void;
  onNext(): void;
  onExportSvg(): void;
  onExportPng(): void;
  onExportBatch(count: number): void;
  onSaveRecipe(): void;
  onLoadRecipe(file: File): void;
}

export interface PanelApi {
  sync(recipe: Recipe): void;
  setStatus(text: string): void;
}

export function mountPanel(host: HTMLElement, initial: Recipe, handlers: PanelHandlers): PanelApi {
  host.innerHTML = `
    <div class="panel-scroll">
      <section>
        <h2>Seed</h2>
        <div class="seed-row">
          <input data-seed type="number" min="0" max="4294967295" step="1" />
        </div>
        <div class="row">
          <button type="button" data-reroll>Reroll</button>
          <button type="button" data-prev>Prev</button>
          <button type="button" data-next>Next</button>
        </div>
      </section>
      <section>
        <h2>Format</h2>
        <div class="aspects" data-aspects></div>
        <label class="line"><span>Long edge</span><input data-long type="number" min="256" max="4096" step="1" /></label>
      </section>
      <section>
        <h2>Layout</h2>
        <select data-layout></select>
        <div data-packing></div>
        <div data-grid></div>
        <div data-hero></div>
        <label class="check"><input data-overlap type="checkbox" /> Allow overlap</label>
      </section>
      <div data-palette></div>
      <section>
        <h2>Locks</h2>
        <label class="check"><input data-lock-palette type="checkbox" /> Lock palette while rerolling</label>
        <label class="check"><input data-lock-layout type="checkbox" /> Lock layout while rerolling</label>
      </section>
      <section>
        <h2>Mix</h2>
        <div data-weights></div>
      </section>
      <section>
        <h2>Max count</h2>
        <div data-counts></div>
      </section>
      <section>
        <h2>Rules</h2>
        <label class="line"><span>Margin</span><input data-margin type="range" min="0" max="400" step="1" /><b data-margin-read></b></label>
        <div class="steps" data-steps></div>
        <label class="check"><input data-stroke type="checkbox" /> Stroke instead of fill</label>
        <label class="line"><span>Stroke</span><input data-stroke-weight type="range" min="1" max="48" step="1" /><b data-stroke-read></b></label>
        <label class="line"><span>Rings</span><select data-rings></select></label>
      </section>
      <section>
        <h2>Export</h2>
        <div class="row">
          <button type="button" data-svg>SVG</button>
          <button type="button" data-png>PNG</button>
        </div>
        <label class="line"><span>Batch N</span><input data-batch-count type="number" min="1" max="200" step="1" value="52" /></label>
        <div class="row">
          <button type="button" data-batch>Generate N</button>
        </div>
        <div class="row">
          <button type="button" data-save-recipe>Save recipe</button>
          <button type="button" data-load-recipe>Load recipe</button>
          <input data-recipe-file type="file" accept="application/json,.json" hidden />
        </div>
        <p class="hint">Batch is inclusive: seed … seed+N−1 as SVG zip. S = SVG, P = PNG.</p>
      </section>
      <p class="status" data-status></p>
      <p class="hint">R rerolls. Left and right arrows step the seed. Shortcuts pause while a field is focused.</p>
    </div>
  `;

  let draft = cloneRecipe(initial);
  let mute = false;
  const status = host.querySelector<HTMLElement>('[data-status]')!;

  const seedInput = host.querySelector<HTMLInputElement>('[data-seed]')!;
  const longInput = host.querySelector<HTMLInputElement>('[data-long]')!;
  const layoutSelect = host.querySelector<HTMLSelectElement>('[data-layout]')!;
  const packingBox = host.querySelector<HTMLElement>('[data-packing]')!;
  const gridBox = host.querySelector<HTMLElement>('[data-grid]')!;
  const heroBox = host.querySelector<HTMLElement>('[data-hero]')!;
  const overlapInput = host.querySelector<HTMLInputElement>('[data-overlap]')!;
  const lockPalette = host.querySelector<HTMLInputElement>('[data-lock-palette]')!;
  const lockLayout = host.querySelector<HTMLInputElement>('[data-lock-layout]')!;
  const marginInput = host.querySelector<HTMLInputElement>('[data-margin]')!;
  const marginRead = host.querySelector<HTMLElement>('[data-margin-read]')!;
  const strokeInput = host.querySelector<HTMLInputElement>('[data-stroke]')!;
  const strokeWeight = host.querySelector<HTMLInputElement>('[data-stroke-weight]')!;
  const strokeRead = host.querySelector<HTMLElement>('[data-stroke-read]')!;
  const ringsSelect = host.querySelector<HTMLSelectElement>('[data-rings]')!;
  const aspects = host.querySelector<HTMLElement>('[data-aspects]')!;
  const weights = host.querySelector<HTMLElement>('[data-weights]')!;
  const counts = host.querySelector<HTMLElement>('[data-counts]')!;
  const steps = host.querySelector<HTMLElement>('[data-steps]')!;

  const aspectButtons = new Map<AspectId, HTMLButtonElement>();
  for (const aspect of ASPECTS) {
    const button = document.createElement('button');
    button.type = 'button';
    button.textContent = aspect === '1:1' ? '1:1' : aspect;
    button.addEventListener('click', () => {
      draft.aspect = aspect;
      draft.longEdge = 3000;
      emit();
      write();
    });
    aspects.append(button);
    aspectButtons.set(aspect, button);
  }

  for (const layout of LAYOUTS) {
    const option = document.createElement('option');
    option.value = layout;
    option.textContent = layout === 'packing' ? 'Circle packing' : layout === 'grid' ? 'Grid' : 'Hero + fill';
    layoutSelect.append(option);
  }

  const minSelect = document.createElement('select');
  const maxSelect = document.createElement('select');
  for (const step of SCALE) {
    for (const select of [minSelect, maxSelect]) {
      const option = document.createElement('option');
      option.value = String(step);
      option.textContent = String(step);
      select.append(option);
    }
  }
  const padding = rangeInput(0, 80, 1);
  const attempts = rangeInput(40, 1200, 10);
  packingBox.append(
    labeled('Min radius', minSelect),
    labeled('Max radius', maxSelect),
    labeled('Padding', padding.input, padding.readout),
    labeled('Attempts', attempts.input, attempts.readout),
  );

  const cols = rangeInput(1, 16, 1);
  const rows = rangeInput(1, 16, 1);
  const skip = rangeInput(0, 0.8, 0.01);
  gridBox.append(
    labeled('Columns', cols.input, cols.readout),
    labeled('Rows', rows.input, rows.readout),
    labeled('Skip', skip.input, skip.readout),
  );

  const hero = rangeInput(0.08, 0.46, 0.01);
  heroBox.append(labeled('Hero size', hero.input, hero.readout));

  const weightInputs = new Map<ShapeId, HTMLInputElement>();
  const weightReads = new Map<ShapeId, HTMLElement>();
  for (const id of SHAPE_IDS) {
    const control = rangeInput(0, 100, 1);
    weightInputs.set(id, control.input);
    weightReads.set(id, control.readout);
    const label = id === 'screws' ? 'Screws %' : SHAPE_LABEL[id];
    weights.append(labeled(label, control.input, control.readout));
  }
  const screwNote = document.createElement('p');
  screwNote.className = 'hint';
  screwNote.textContent = 'Screws are not placed alone. The percent is the chance each driver grows a screw ring.';
  weights.append(screwNote);

  const countInputs = new Map<ShapeId, HTMLInputElement>();
  for (const id of SHAPE_IDS) {
    const input = document.createElement('input');
    input.type = 'number';
    input.min = '0';
    input.max = '400';
    input.step = '1';
    countInputs.set(id, input);
    counts.append(labeled(SHAPE_LABEL[id], input));
  }

  const stepBoxes = new Map<number, HTMLInputElement>();
  for (const step of SCALE) {
    const label = document.createElement('label');
    label.className = 'check step';
    const input = document.createElement('input');
    input.type = 'checkbox';
    input.addEventListener('change', () => {
      const next = SCALE.filter((value) => stepBoxes.get(value)?.checked);
      if (next.length === 0) {
        input.checked = true;
        return;
      }
      draft.sizeSteps = [...next];
      emit();
    });
    label.append(input, document.createTextNode(String(step)));
    steps.append(label);
    stepBoxes.set(step, input);
  }

  ringsSelect.append(new Option('Auto 2–6', '0'));
  for (const count of [2, 3, 4, 5, 6]) ringsSelect.append(new Option(String(count), String(count)));

  const palette: PaletteEditor = mountPaletteEditor(
    host.querySelector<HTMLElement>('[data-palette]')!,
    draft,
    (nextPalette, paletteId) => {
      draft.palette = nextPalette;
      draft.paletteId = paletteId;
      emit();
    },
  );

  const emit = () => {
    if (mute) return;
    handlers.onChange(cloneRecipe(draft));
  };

  const write = () => {
    mute = true;
    seedInput.value = String(draft.seed);
    longInput.value = String(draft.longEdge);
    layoutSelect.value = draft.layout;
    minSelect.value = nearestScale(draft.packing.minRadius);
    maxSelect.value = nearestScale(draft.packing.maxRadius);
    setRange(padding, draft.packing.padding);
    setRange(attempts, draft.packing.maxAttempts);
    setRange(cols, draft.grid.cols);
    setRange(rows, draft.grid.rows);
    setRange(skip, draft.grid.skipChance, 2);
    setRange(hero, draft.hero.radiusFraction, 2);
    overlapInput.checked = draft.allowOverlap;
    lockPalette.checked = draft.locks.palette;
    lockLayout.checked = draft.locks.layout;
    marginInput.value = String(draft.margin);
    marginRead.textContent = String(Math.round(draft.margin));
    strokeInput.checked = draft.stroke;
    strokeWeight.value = String(draft.strokeWeight);
    strokeRead.textContent = String(Math.round(draft.strokeWeight));
    ringsSelect.value = String(draft.driverRings);
    for (const id of SHAPE_IDS) {
      const weight = weightInputs.get(id)!;
      weight.value = String(draft.weights[id]);
      weightReads.get(id)!.textContent = String(Math.round(draft.weights[id]));
      countInputs.get(id)!.value = String(draft.maxCounts[id]);
    }
    const enabled = new Set(draft.sizeSteps);
    for (const step of SCALE) stepBoxes.get(step)!.checked = enabled.has(step);
    for (const [aspect, button] of aspectButtons) {
      button.classList.toggle('is-active', aspect === draft.aspect);
    }
    packingBox.hidden = draft.layout === 'grid';
    gridBox.hidden = draft.layout !== 'grid';
    heroBox.hidden = draft.layout !== 'hero';
    palette.sync(draft);
    mute = false;
  };

  seedInput.addEventListener('change', () => {
    draft.seed = clampInt(seedInput.value, 0, 0xffffffff, draft.seed);
    emit();
    write();
  });
  longInput.addEventListener('change', () => {
    draft.longEdge = clampInt(longInput.value, 256, 4096, draft.longEdge);
    emit();
    write();
  });
  layoutSelect.addEventListener('change', () => {
    draft.layout = layoutSelect.value as LayoutId;
    emit();
    write();
  });
  minSelect.addEventListener('change', () => {
    draft.packing.minRadius = Number(minSelect.value);
    if (draft.packing.minRadius > draft.packing.maxRadius) draft.packing.maxRadius = draft.packing.minRadius;
    emit();
    write();
  });
  maxSelect.addEventListener('change', () => {
    draft.packing.maxRadius = Number(maxSelect.value);
    if (draft.packing.maxRadius < draft.packing.minRadius) draft.packing.minRadius = draft.packing.maxRadius;
    emit();
    write();
  });
  padding.input.addEventListener('input', () => {
    draft.packing.padding = Number(padding.input.value);
    padding.readout.textContent = padding.input.value;
    emit();
  });
  attempts.input.addEventListener('input', () => {
    draft.packing.maxAttempts = Number(attempts.input.value);
    attempts.readout.textContent = attempts.input.value;
    emit();
  });
  cols.input.addEventListener('input', () => {
    draft.grid.cols = Number(cols.input.value);
    cols.readout.textContent = cols.input.value;
    emit();
  });
  rows.input.addEventListener('input', () => {
    draft.grid.rows = Number(rows.input.value);
    rows.readout.textContent = rows.input.value;
    emit();
  });
  skip.input.addEventListener('input', () => {
    draft.grid.skipChance = Number(skip.input.value);
    skip.readout.textContent = Number(skip.input.value).toFixed(2);
    emit();
  });
  hero.input.addEventListener('input', () => {
    draft.hero.radiusFraction = Number(hero.input.value);
    hero.readout.textContent = Number(hero.input.value).toFixed(2);
    emit();
  });
  overlapInput.addEventListener('change', () => {
    draft.allowOverlap = overlapInput.checked;
    emit();
  });
  lockPalette.addEventListener('change', () => {
    draft.locks.palette = lockPalette.checked;
    emit();
  });
  lockLayout.addEventListener('change', () => {
    draft.locks.layout = lockLayout.checked;
    emit();
  });
  marginInput.addEventListener('input', () => {
    draft.margin = Number(marginInput.value);
    marginRead.textContent = marginInput.value;
    emit();
  });
  strokeInput.addEventListener('change', () => {
    draft.stroke = strokeInput.checked;
    emit();
  });
  strokeWeight.addEventListener('input', () => {
    draft.strokeWeight = Number(strokeWeight.value);
    strokeRead.textContent = strokeWeight.value;
    emit();
  });
  ringsSelect.addEventListener('change', () => {
    const rings = Number(ringsSelect.value);
    draft.driverRings = rings === 2 || rings === 3 || rings === 4 || rings === 5 || rings === 6 ? rings : 0;
    emit();
  });
  for (const id of SHAPE_IDS) {
    weightInputs.get(id)!.addEventListener('input', () => {
      draft.weights[id] = Number(weightInputs.get(id)!.value);
      weightReads.get(id)!.textContent = weightInputs.get(id)!.value;
      emit();
    });
    countInputs.get(id)!.addEventListener('change', () => {
      draft.maxCounts[id] = clampInt(countInputs.get(id)!.value, 0, 400, draft.maxCounts[id]);
      emit();
      write();
    });
  }

  host.querySelector<HTMLButtonElement>('[data-reroll]')!.addEventListener('click', handlers.onReroll);
  host.querySelector<HTMLButtonElement>('[data-prev]')!.addEventListener('click', handlers.onPrev);
  host.querySelector<HTMLButtonElement>('[data-next]')!.addEventListener('click', handlers.onNext);
  host.querySelector<HTMLButtonElement>('[data-svg]')!.addEventListener('click', handlers.onExportSvg);
  host.querySelector<HTMLButtonElement>('[data-png]')!.addEventListener('click', handlers.onExportPng);
  host.querySelector<HTMLButtonElement>('[data-batch]')!.addEventListener('click', () => {
    const count = clampInt(host.querySelector<HTMLInputElement>('[data-batch-count]')!.value, 1, 200, 52);
    handlers.onExportBatch(count);
  });
  host.querySelector<HTMLButtonElement>('[data-save-recipe]')!.addEventListener('click', handlers.onSaveRecipe);
  const recipeFile = host.querySelector<HTMLInputElement>('[data-recipe-file]')!;
  host.querySelector<HTMLButtonElement>('[data-load-recipe]')!.addEventListener('click', () => recipeFile.click());
  recipeFile.addEventListener('change', () => {
    const file = recipeFile.files?.[0];
    if (file) handlers.onLoadRecipe(file);
    recipeFile.value = '';
  });

  write();

  return {
    sync(recipe: Recipe) {
      draft = cloneRecipe(recipe);
      write();
    },
    setStatus(text: string) {
      status.textContent = text;
    },
  };
}

function labeled(text: string, control: HTMLElement, readout?: HTMLElement): HTMLLabelElement {
  const label = document.createElement('label');
  label.className = 'line';
  const span = document.createElement('span');
  span.textContent = text;
  label.append(span, control);
  if (readout) label.append(readout);
  return label;
}

function rangeInput(min: number, max: number, step: number): { input: HTMLInputElement; readout: HTMLElement } {
  const input = document.createElement('input');
  input.type = 'range';
  input.min = String(min);
  input.max = String(max);
  input.step = String(step);
  const readout = document.createElement('b');
  return { input, readout };
}

function setRange(control: { input: HTMLInputElement; readout: HTMLElement }, value: number, digits = 0): void {
  control.input.value = String(value);
  control.readout.textContent = digits > 0 ? value.toFixed(digits) : String(Math.round(value));
}

function nearestScale(value: number): string {
  let best: number = SCALE[0];
  let score = Infinity;
  for (const step of SCALE) {
    const next = Math.abs(step - value);
    if (next < score) {
      score = next;
      best = step;
    }
  }
  return String(best);
}

function clampInt(value: string, min: number, max: number, fallback: number): number {
  const n = Math.round(Number(value));
  if (!Number.isFinite(n)) return fallback;
  return Math.min(max, Math.max(min, n));
}
