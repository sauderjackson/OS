import type { Palette, Recipe } from '../types';
import { PALETTE_ROLES, PRESET_PALETTES, clonePalette, presetById } from '../palettes/presets';
import { isHex, loadCustomPalettes, saveCustomPalettes, slugPalette } from '../palettes/storage';

export interface PaletteEditor {
  sync(recipe: Recipe): void;
}

export function mountPaletteEditor(
  host: HTMLElement,
  recipe: Recipe,
  onChange: (palette: Palette, paletteId: string) => void,
): PaletteEditor {
  host.innerHTML = `
    <section class="palette-editor">
      <header class="section-head">
        <h2>Palette</h2>
      </header>
      <div class="swatches" data-swatches></div>
      <label class="field">
        <span>Name</span>
        <input data-name type="text" maxlength="48" />
      </label>
      <div class="roles" data-roles></div>
      <div class="row">
        <button type="button" data-save>Save palette</button>
        <button type="button" data-reset>Reset</button>
      </div>
      <p class="hint" data-hint></p>
    </section>
  `;

  const swatches = host.querySelector<HTMLElement>('[data-swatches]')!;
  const nameInput = host.querySelector<HTMLInputElement>('[data-name]')!;
  const roles = host.querySelector<HTMLElement>('[data-roles]')!;
  const hint = host.querySelector<HTMLElement>('[data-hint]')!;
  const hexInputs = new Map<string, HTMLInputElement>();
  const colorInputs = new Map<string, HTMLInputElement>();

  for (const role of PALETTE_ROLES) {
    const label = document.createElement('label');
    label.className = 'role';
    label.innerHTML = `
      <span>${role}</span>
      <input type="color" data-color="${role}" />
      <input type="text" data-hex="${role}" spellcheck="false" maxlength="7" />
    `;
    roles.append(label);
    hexInputs.set(role, label.querySelector(`[data-hex="${role}"]`)!);
    colorInputs.set(role, label.querySelector(`[data-color="${role}"]`)!);
  }

  let current = clonePalette(recipe.palette);
  let currentId = recipe.paletteId;

  const paint = () => {
    const custom = loadCustomPalettes();
    const all = [...PRESET_PALETTES, ...custom];
    swatches.replaceChildren();
    for (const palette of all) {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'swatch' + (palette.id === currentId ? ' is-active' : '');
      button.title = palette.name;
      button.setAttribute('aria-label', palette.name);
      for (const role of PALETTE_ROLES) {
        const chip = document.createElement('i');
        chip.style.background = palette[role];
        button.append(chip);
      }
      button.addEventListener('click', () => {
        current = clonePalette(palette);
        currentId = palette.id;
        fill();
        onChange(clonePalette(current), currentId);
        paint();
      });
      swatches.append(button);
    }
    nameInput.value = current.name;
    for (const role of PALETTE_ROLES) {
      hexInputs.get(role)!.value = current[role];
      colorInputs.get(role)!.value = current[role];
    }
  };

  const fill = () => {
    nameInput.value = current.name;
    for (const role of PALETTE_ROLES) {
      hexInputs.get(role)!.value = current[role];
      colorInputs.get(role)!.value = current[role];
    }
  };

  const emitCustom = (repaint: boolean) => {
    const matched = [...PRESET_PALETTES, ...loadCustomPalettes()].find(
      (palette) => sameColors(palette, current) && palette.name === current.name,
    );
    currentId = matched ? matched.id : `custom-${slugPalette(current.name)}`;
    current = { ...current, id: currentId };
    onChange(clonePalette(current), currentId);
    if (repaint) paint();
  };

  nameInput.addEventListener('change', () => {
    current = { ...current, name: nameInput.value.trim() || 'Custom' };
    emitCustom(true);
  });

  for (const role of PALETTE_ROLES) {
    colorInputs.get(role)!.addEventListener('input', () => {
      const next = colorInputs.get(role)!.value.toUpperCase();
      current = { ...current, [role]: next };
      hexInputs.get(role)!.value = next;
      emitCustom(false);
    });
    hexInputs.get(role)!.addEventListener('change', () => {
      const next = hexInputs.get(role)!.value.trim();
      if (!isHex(next)) {
        hexInputs.get(role)!.value = current[role];
        hint.textContent = 'Hex colors need six digits, like #C65D2E.';
        return;
      }
      hint.textContent = '';
      const normalized = next.toUpperCase();
      current = { ...current, [role]: normalized };
      colorInputs.get(role)!.value = normalized;
      emitCustom(true);
    });
  }

  host.querySelector<HTMLButtonElement>('[data-save]')!.addEventListener('click', () => {
    const name = nameInput.value.trim() || 'Custom';
    const id = `custom-${slugPalette(name)}`;
    const saved: Palette = { ...current, id, name };
    const existing = loadCustomPalettes().filter((palette) => palette.id !== id);
    saveCustomPalettes([...existing, saved]);
    current = saved;
    currentId = id;
    onChange(clonePalette(current), currentId);
    hint.textContent = `Saved “${name}” in this browser.`;
    paint();
  });

  host.querySelector<HTMLButtonElement>('[data-reset]')!.addEventListener('click', () => {
    const preset = presetById(currentId) ?? PRESET_PALETTES[0];
    current = clonePalette(preset);
    currentId = preset.id;
    hint.textContent = '';
    onChange(clonePalette(current), currentId);
    paint();
  });

  paint();

  return {
    sync(next: Recipe) {
      current = clonePalette(next.palette);
      currentId = next.paletteId;
      hint.textContent = '';
      paint();
    },
  };
}

function sameColors(a: Palette, b: Palette): boolean {
  return PALETTE_ROLES.every((role) => a[role].toLowerCase() === b[role].toLowerCase());
}
