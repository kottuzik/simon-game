import type { Color } from './board';
import { GAP_MS, flashDuration } from './engine';

export interface Presenter {
  show(sequence: readonly Color[], level: number, onLit: (color: Color | null) => void, onDone: () => void): void;
  cancel(): void;
}

// Plays a sequence one color at a time. Every cancel invalidates pending callbacks.
export function createPresenter(
  schedule: (fn: () => void, ms: number) => unknown = (fn, ms) => setTimeout(fn, ms),
  clear: (id: unknown) => void = (id) => clearTimeout(id as ReturnType<typeof setTimeout>),
): Presenter {
  let generation = 0;
  let timers: unknown[] = [];
  let unlight: (() => void) | null = null;

  function cancel(): void {
    generation += 1;
    timers.forEach(clear);
    timers = [];
    unlight?.();
    unlight = null;
  }

  function show(sequence: readonly Color[], level: number, onLit: (color: Color | null) => void, onDone: () => void): void {
    cancel();
    const mine = generation;
    unlight = () => onLit(null);

    function later(fn: () => void, ms: number): void {
      timers.push(
        schedule(() => {
          if (mine === generation) fn();
        }, ms),
      );
    }

    function step(index: number): void {
      if (index >= sequence.length) {
        unlight = null;
        onDone();
        return;
      }
      onLit(sequence[index]);
      later(() => {
        onLit(null);
        later(() => step(index + 1), GAP_MS);
      }, flashDuration(level));
    }

    // Short pause before the first color so the player can get ready.
    later(() => step(0), GAP_MS);
  }

  return { show, cancel };
}
