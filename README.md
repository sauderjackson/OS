# Pattern Engine

Seeded speaker-geometry covers. Same seed + same recipe always draw the same image.

```bash
npm install
npm run dev
```

Other scripts:

```bash
npm run build
npm run typecheck
npm run verify
```

## How it works

Every cover comes from one integer seed and a recipe JSON. A mulberry32 PRNG drives layout and shape details. `Math.random()` is never used for image generation. Screws decorate drivers from the same RNG stream so they stay stable under a seed.

Layouts:

- **Circle packing** — largest-first radius bands, overlap rejection, padding, max attempts
- **Grid** — N×M cells with optional seeded skips
- **Hero + fill** — one large centered driver, then packing around it

Export:

- SVG with separate editable groups (opens cleanly in Figma / Illustrator)
- PNG at the chosen pixel size
- Batch zip of N SVGs, filenames `pattern_{seed}_{palette}.svg`
- Save / load recipe JSON

## Defaults and assumptions

| Choice | Value |
| --- | --- |
| Recipe schema version | `1` |
| Preview scale | CSS-scaled into the stage; generation uses the real long edge |
| Default long edge | `3000` |
| Default aspect | `1:1` |
| Default seed | `1` |
| Default layout | circle packing |
| Default weights | driver 34, grille 18, tweeter 16, port 12, screws 55, dot 20 |
| Screws weight meaning | percent chance each driver gets a screw ring (not a free shape) |
| Default max counts | driver 10, grille 8, tweeter 12, port 6, screws 8, dot 48 |
| Margin | `72` |
| Size steps | `16 / 32 / 64 / 128 / 256` |
| Packing min / max radius | `16` / `256` |
| Packing padding | `12` |
| Packing max attempts | `480` |
| Grid density | `6×6`, skip chance `0.18` |
| Hero radius fraction | `0.22` of the short edge |
| Batch range | inclusive: `start … start + N − 1` |
| Default batch N | `52` |
| Allow overlap | off |
| Stroke mode | off, weight `8` |
| Driver rings | auto `2–6` from the seed |

Extra palettes invented for the set:

- **Atelier Olive** — `#E7E2D4` / `#2C3328` / `#8A9178` / `#C4552A` / `#5E6554`
- **Harbor Slate** — `#E4E8EC` / `#1B2833` / `#7E8C99` / `#C2412D` / `#4E5C68`
- **Nocturne Amber** — `#14110E` / `#F0E6D4` / `#6B5344` / `#E8A317` / `#A89078`

## Add a shape (5 steps)

1. Add the id to `SHAPE_IDS` / `PLACEMENT_SHAPES` in `src/types.ts` if it occupies its own circle.
2. Implement geometry in `src/shapes/index.ts` returning `Primitive[]` (and screws only for drivers).
3. Give it a default weight and max count in `defaultRecipe()` in `src/recipe.ts`.
4. Add a panel label in `src/ui/panel.ts`.
5. Keep drawing through the shared primitives so canvas and SVG stay in sync.

## Add a palette (5 steps)

1. Append a palette object to `PRESET_PALETTES` in `src/palettes/presets.ts`.
2. Use five hex roles: `background`, `primary`, `secondary`, `accent`, `detail`.
3. Pick a stable kebab-case `id`.
4. Reload the app — the swatch grid reads the presets array.
5. Or edit colors in the UI and click **Save palette** to store a custom one in `localStorage`.

## Recipe schema

A recipe includes `version`, `seed`, `layout`, `paletteId`, full `palette`, `weights`, `maxCounts`, `margin`, `sizeSteps`, `stroke`, `strokeWeight`, `aspect`, `longEdge`, `locks`, `allowOverlap`, `packing`, `grid`, `hero`, and `driverRings`. Loading a recipe through **Load recipe** rebuilds the same cover for that seed.
