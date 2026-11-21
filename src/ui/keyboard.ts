export function typingTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  const tag = target.tagName;
  return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || target.isContentEditable;
}

export interface KeyHandlers {
  reroll(): void;
  prev(): void;
  next(): void;
  svg?(): void;
  png?(): void;
}

export function bindKeys(handlers: KeyHandlers): () => void {
  const onKey = (event: KeyboardEvent) => {
    if (event.repeat || event.metaKey || event.ctrlKey || event.altKey) return;
    if (typingTarget(event.target)) return;
    const key = event.key;
    if (key === 'r' || key === 'R') {
      event.preventDefault();
      handlers.reroll();
      return;
    }
    if (key === 'ArrowLeft') {
      event.preventDefault();
      handlers.prev();
      return;
    }
    if (key === 'ArrowRight') {
      event.preventDefault();
      handlers.next();
      return;
    }
    if ((key === 's' || key === 'S') && handlers.svg) {
      event.preventDefault();
      handlers.svg();
      return;
    }
    if ((key === 'p' || key === 'P') && handlers.png) {
      event.preventDefault();
      handlers.png();
    }
  };
  window.addEventListener('keydown', onKey);
  return () => window.removeEventListener('keydown', onKey);
}
