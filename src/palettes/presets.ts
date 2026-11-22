import type { Palette } from '../types';

export const PRESET_PALETTES: readonly Palette[] = [
  {
    id: 'braun-cream',
    name: 'Braun Cream',
    background: '#F3EDE3',
    primary: '#2B2B2B',
    secondary: '#D7CBBA',
    accent: '#C65D2E',
    detail: '#8E8478',
  },
  {
    id: 'midnight-car-audio',
    name: 'Midnight Car Audio',
    background: '#0E1116',
    primary: '#E8E6E3',
    secondary: '#3D4654',
    accent: '#4CC3FF',
    detail: '#8B939E',
  },
  {
    id: 'dominican-chrome',
    name: 'Dominican Chrome',
    background: '#1C1F24',
    primary: '#E4E7EC',
    secondary: '#8E96A3',
    accent: '#F2C14E',
    detail: '#5C6570',
  },
  {
    id: 'rams-orange',
    name: 'Rams Orange',
    background: '#EFEFEF',
    primary: '#1F1F1F',
    secondary: '#B7B7B7',
    accent: '#FF4F00',
    detail: '#6E6E6E',
  },
  {
    id: 'mono-ink',
    name: 'Mono Ink',
    background: '#F7F7F5',
    primary: '#111111',
    secondary: '#4A4A4A',
    accent: '#111111',
    detail: '#9A9A9A',
  },
  {
    id: 'atelier-olive',
    name: 'Atelier Olive',
    background: '#E7E2D4',
    primary: '#2C3328',
    secondary: '#8A9178',
    accent: '#C4552A',
    detail: '#5E6554',
  },
  {
    id: 'harbor-slate',
    name: 'Harbor Slate',
    background: '#E4E8EC',
    primary: '#1B2833',
    secondary: '#7E8C99',
    accent: '#C2412D',
    detail: '#4E5C68',
  },
  {
    id: 'nocturne-amber',
    name: 'Nocturne Amber',
    background: '#14110E',
    primary: '#F0E6D4',
    secondary: '#6B5344',
    accent: '#E8A317',
    detail: '#A89078',
  },
];

export const PALETTE_ROLES = ['background', 'primary', 'secondary', 'accent', 'detail'] as const;
export type PaletteRole = (typeof PALETTE_ROLES)[number];

export function presetById(id: string): Palette | undefined {
  return PRESET_PALETTES.find((palette) => palette.id === id);
}

export function clonePalette(palette: Palette): Palette {
  return { ...palette };
}
