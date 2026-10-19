import { describe, expect, it, vi } from 'vitest';
import { createPauseController } from './pause';

function setup() {
  const onPause = vi.fn();
  const onResume = vi.fn();
  return { onPause, onResume, ctl: createPauseController(onPause, onResume) };
}

describe('pause controller', () => {
  it('pauses once and resumes when the reason ends', () => {
    const { ctl, onPause, onResume } = setup();
    ctl.pause('about');
    expect(ctl.isPaused()).toBe(true);
    ctl.resume('about');
    expect(ctl.isPaused()).toBe(false);
    expect(onPause).toHaveBeenCalledTimes(1);
    expect(onResume).toHaveBeenCalledTimes(1);
  });

  it('resumes only after all overlapping reasons ended', () => {
    const { ctl, onPause, onResume } = setup();
    ctl.pause('about');
    ctl.pause('hidden');
    ctl.pause('confirm');
    expect(onPause).toHaveBeenCalledTimes(1);
    ctl.resume('hidden');
    ctl.resume('about');
    expect(onResume).not.toHaveBeenCalled();
    expect(ctl.isPaused()).toBe(true);
    ctl.resume('confirm');
    expect(onResume).toHaveBeenCalledTimes(1);
  });

  it('ignores a repeated pause for the same reason', () => {
    const { ctl, onPause, onResume } = setup();
    ctl.pause('hidden');
    ctl.pause('hidden');
    ctl.resume('hidden');
    expect(onPause).toHaveBeenCalledTimes(1);
    expect(onResume).toHaveBeenCalledTimes(1);
  });

  it('ignores resume without a matching pause', () => {
    const { ctl, onResume } = setup();
    ctl.resume('about');
    expect(onResume).not.toHaveBeenCalled();
    ctl.pause('hidden');
    ctl.resume('about');
    expect(ctl.isPaused()).toBe(true);
    expect(onResume).not.toHaveBeenCalled();
  });

  it('can pause and resume again later', () => {
    const { ctl, onPause, onResume } = setup();
    ctl.pause('about');
    ctl.resume('about');
    ctl.pause('hidden');
    ctl.resume('hidden');
    expect(onPause).toHaveBeenCalledTimes(2);
    expect(onResume).toHaveBeenCalledTimes(2);
  });
});
