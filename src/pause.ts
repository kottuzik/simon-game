export type PauseReason = 'about' | 'hidden' | 'confirm' | 'install';

export interface PauseController {
  pause(reason: PauseReason): void;
  resume(reason: PauseReason): void;
  isPaused(): boolean;
}

// Tracks why the game is paused. onPause fires on the first active reason, and
// onResume only once every reason has ended, so overlapping pauses resume safely.
export function createPauseController(onPause: () => void, onResume: () => void): PauseController {
  const reasons = new Set<PauseReason>();

  return {
    pause(reason) {
      const wasPaused = reasons.size > 0;
      reasons.add(reason);
      if (!wasPaused) onPause();
    },
    resume(reason) {
      if (!reasons.delete(reason)) return;
      if (reasons.size === 0) onResume();
    },
    isPaused: () => reasons.size > 0,
  };
}
