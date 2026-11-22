import { drawScene } from '../render/canvas2d';
import type { Scene } from '../types';

export function sceneToPngBlob(scene: Scene): Promise<Blob> {
  const canvas = document.createElement('canvas');
  canvas.width = scene.width;
  canvas.height = scene.height;
  const ctx = canvas.getContext('2d');
  if (!ctx) return Promise.reject(new Error('Could not open a 2D canvas context.'));
  drawScene(ctx, scene);
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (!blob) reject(new Error('PNG export failed.'));
      else resolve(blob);
    }, 'image/png');
  });
}

export function sceneToDataUrl(scene: Scene): string {
  const canvas = document.createElement('canvas');
  canvas.width = scene.width;
  canvas.height = scene.height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Could not open a 2D canvas context.');
  drawScene(ctx, scene);
  return canvas.toDataURL('image/png');
}
