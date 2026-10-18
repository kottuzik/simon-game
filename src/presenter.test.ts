import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { Color } from './board';
import { createPresenter } from './presenter';

const seq: Color[] = ['red', 'blue', 'red'];

beforeEach(() => vi.useFakeTimers());
afterEach(() => vi.useRealTimers());

describe('presenter', () => {
  it('lights colors in order with the level-based duration and a gap', () => {
    const lit: (Color | null)[] = [];
    const done = vi.fn();
    createPresenter().show(seq, 1, (c) => lit.push(c), done);

    vi.advanceTimersByTime(199);
    expect(lit).toEqual([]);
    vi.advanceTimersByTime(1); // 200: first color
    expect(lit).toEqual(['red']);
    vi.advanceTimersByTime(800); // lit for 800ms at level 1
    expect(lit).toEqual(['red', null]);
    vi.advanceTimersByTime(200); // gap, then second color
    expect(lit).toEqual(['red', null, 'blue']);

    vi.runAllTimers();
    expect(lit.filter(Boolean)).toEqual(seq);
    expect(done).toHaveBeenCalledTimes(1);
    expect(lit.at(-1)).toBeNull();
  });

  it('uses a shorter flash at higher levels', () => {
    const lit: (Color | null)[] = [];
    createPresenter().show(seq, 10, (c) => lit.push(c), () => {});
    vi.advanceTimersByTime(200 + 349);
    expect(lit).toEqual(['red']);
    vi.advanceTimersByTime(1);
    expect(lit).toEqual(['red', null]);
  });

  it('cancel stops callbacks and clears the lit color', () => {
    const lit: (Color | null)[] = [];
    const done = vi.fn();
    const p = createPresenter();
    p.show(seq, 1, (c) => lit.push(c), done);
    vi.advanceTimersByTime(300);
    p.cancel();
    const after = lit.length;
    vi.runAllTimers();
    expect(lit.length).toBe(after);
    expect(lit.at(-1)).toBeNull();
    expect(done).not.toHaveBeenCalled();
  });

  it('a restart replays the same sequence from the beginning, without old timers', () => {
    const lit: (Color | null)[] = [];
    const done = vi.fn();
    const p = createPresenter();
    p.show(seq, 1, (c) => lit.push(c), done);
    vi.advanceTimersByTime(1500);
    lit.length = 0;
    p.show(seq, 1, (c) => lit.push(c), done);
    vi.runAllTimers();
    expect(lit.filter(Boolean)).toEqual(seq);
    expect(done).toHaveBeenCalledTimes(1);
  });
});
