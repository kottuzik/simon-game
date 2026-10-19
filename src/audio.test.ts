import { describe, expect, it, vi } from 'vitest';
import type { Color } from './board';
import { FREQUENCIES, createAudio } from './audio';

function fakeContext() {
  const oscillators: { frequency: { value: number }; start: ReturnType<typeof vi.fn> }[] = [];
  const ctx = {
    state: 'suspended',
    currentTime: 0,
    destination: {},
    resume: vi.fn(() => Promise.resolve()),
    createOscillator: vi.fn(() => {
      const osc = { type: '', frequency: { value: 0 }, connect: vi.fn(), start: vi.fn(), stop: vi.fn() };
      oscillators.push(osc);
      return osc;
    }),
    createGain: vi.fn(() => ({
      gain: { setValueAtTime: vi.fn(), linearRampToValueAtTime: vi.fn() },
      connect: vi.fn(),
    })),
  };
  return { ctx: ctx as unknown as AudioContext, oscillators, raw: ctx };
}

const COLORS: Color[] = ['red', 'blue', 'yellow', 'green'];

describe('audio', () => {
  it('uses four distinct frequencies', () => {
    expect(new Set(Object.values(FREQUENCIES)).size).toBe(4);
  });

  it('plays the matching frequency for each color', () => {
    const { ctx, oscillators } = fakeContext();
    const audio = createAudio(() => ctx);
    for (const color of COLORS) audio.play(color);
    expect(oscillators.map((o) => o.frequency.value)).toEqual(COLORS.map((c) => FREQUENCIES[c]));
    expect(oscillators.every((o) => o.start.mock.calls.length === 1)).toBe(true);
  });

  it('plays nothing while muted and works again after unmuting', () => {
    const { ctx, oscillators } = fakeContext();
    const audio = createAudio(() => ctx);
    audio.setMuted(true);
    expect(audio.isMuted()).toBe(true);
    audio.play('red');
    expect(oscillators).toHaveLength(0);
    audio.setMuted(false);
    audio.play('red');
    expect(oscillators).toHaveLength(1);
  });

  it('resumes a suspended context on unlock', () => {
    const { ctx, raw } = fakeContext();
    createAudio(() => ctx).unlock();
    expect(raw.resume).toHaveBeenCalled();
  });

  it('does not throw when the context cannot be created', () => {
    const audio = createAudio(() => {
      throw new Error('no audio');
    });
    expect(() => audio.unlock()).not.toThrow();
    expect(() => audio.play('red')).not.toThrow();
  });

  it('does not throw when resume rejects or playing fails', async () => {
    const { ctx, raw, oscillators } = fakeContext();
    raw.resume.mockImplementation(() => Promise.reject(new Error('blocked')));
    const audio = createAudio(() => ctx);
    expect(() => audio.play('blue')).not.toThrow();
    raw.createOscillator.mockImplementation(() => {
      throw new Error('boom');
    });
    expect(() => audio.play('blue')).not.toThrow();
    await Promise.resolve();
    expect(oscillators.length).toBe(1);
  });

  it('retries creating the context after a failure', () => {
    const { ctx, oscillators } = fakeContext();
    let fail = true;
    const audio = createAudio(() => {
      if (fail) throw new Error('first try fails');
      return ctx;
    });
    audio.play('red');
    fail = false;
    audio.play('red');
    expect(oscillators).toHaveLength(1);
  });
});
