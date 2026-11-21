import type { Palette } from '../types';
import { PALETTE_ROLES } from './presets';

const KEY = 'pattern-engine:custom-palettes';

export function isHex(value: string): boolean {
  return /^#[0-9a-fA-F]{6}$/.test(value);
}

export function isPalette(value: unknown): value is Palette {
  if (!value || typeof value !== 'object') return false;
  const palette = value as Palette;
  if (typeof palette.id !== 'string' || typeof palette.name !== 'string') return false;
  return PALETTE_ROLES.every((role) => typeof palette[role] === 'string' && isHex(palette[role]));
}

export function loadCustomPalettes(): Palette[] {
  if (typeof localStorage === 'undefined') return [];
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(isPalette).map((palette) => ({ ...palette }));
  } catch {
    return [];
  }
}

export function saveCustomPalettes(palettes: Palette[]): void {
  if (typeof localStorage === 'undefined') return;
  localStorage.setItem(KEY, JSON.stringify(palettes));
}

export function slugPalette(name: string): string {
  const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  return slug || 'custom';
}
