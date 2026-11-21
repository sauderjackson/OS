export const SHAPE_IDS = ['driver', 'grille', 'tweeter', 'port', 'screws', 'dot'] as const;
export type ShapeId = (typeof SHAPE_IDS)[number];

/** Shapes that occupy their own circle. Screws only decorate a driver. */
export const PLACEMENT_SHAPES = ['driver', 'grille', 'tweeter', 'port', 'dot'] as const;
export type PlacementShape = (typeof PLACEMENT_SHAPES)[number];

export const LAYOUTS = ['packing', 'grid', 'hero'] as const;
export type LayoutId = (typeof LAYOUTS)[number];

export const ASPECTS = ['1:1', '4:5', '9:16', '16:9'] as const;
export type AspectId = (typeof ASPECTS)[number];

export const SCALE = [8, 16, 32, 64, 128, 256, 512] as const;

export const RECIPE_VERSION = 1;

export interface Palette {
  id: string;
  name: string;
  background: string;
  primary: string;
  secondary: string;
  accent: string;
  detail: string;
}

export interface Style {
  stroke: boolean;
  strokeWeight: number;
}

export interface CirclePrim {
  kind: 'circle';
  x: number;
  y: number;
  r: number;
  fill: string | null;
  stroke: string | null;
  strokeWidth: number;
}

export interface RectPrim {
  kind: 'rect';
  /** Center x. */
  x: number;
  /** Center y. */
  y: number;
  w: number;
  h: number;
  radius: number;
  fill: string | null;
  stroke: string | null;
  strokeWidth: number;
}

export type Primitive = CirclePrim | RectPrim;

export interface PlacedShape {
  id: ShapeId;
  x: number;
  y: number;
  r: number;
  primitives: Primitive[];
}

export interface Scene {
  width: number;
  height: number;
  background: string;
  shapes: PlacedShape[];
}

/** Fixed key order. Iteration of this shape must stay in SHAPE_IDS order. */
export type Counts = Record<ShapeId, number>;

export interface Recipe {
  version: typeof RECIPE_VERSION;
  seed: number;
  layout: LayoutId;
  paletteId: string;
  palette: Palette;
  weights: Counts;
  maxCounts: Counts;
  margin: number;
  sizeSteps: number[];
  stroke: boolean;
  strokeWeight: number;
  aspect: AspectId;
  longEdge: number;
  locks: { palette: boolean; layout: boolean };
  allowOverlap: boolean;
  packing: {
    minRadius: number;
    maxRadius: number;
    padding: number;
    maxAttempts: number;
  };
  grid: { cols: number; rows: number; skipChance: number };
  hero: { radiusFraction: number };
  /** 0 = let the seed pick 2–6 rings. */
  driverRings: 0 | 2 | 3 | 4 | 5 | 6;
}

export interface Occupied {
  x: number;
  y: number;
  r: number;
}
