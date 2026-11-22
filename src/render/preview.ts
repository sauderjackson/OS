import p5 from 'p5';
import type { Scene } from '../types';
import { drawScene } from './canvas2d';

export interface Preview {
  redraw(): void;
  destroy(): void;
}

export function mountPreview(host: HTMLElement, getScene: () => Scene): Preview {
  const sketch = (p: p5) => {
    p.setup = () => {
      const scene = getScene();
      p.pixelDensity(1);
      p.createCanvas(scene.width, scene.height);
      p.noLoop();
    };
    p.draw = () => {
      const scene = getScene();
      if (p.width !== scene.width || p.height !== scene.height) {
        p.resizeCanvas(scene.width, scene.height);
      }
      drawScene(p.drawingContext as CanvasRenderingContext2D, scene);
    };
  };
  const instance = new p5(sketch, host);
  return {
    redraw() {
      instance.redraw();
    },
    destroy() {
      instance.remove();
    },
  };
}
