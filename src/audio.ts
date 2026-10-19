import type { Color } from './board';

// One distinct pitch per color.
export const FREQUENCIES: Record<Color, number> = {
  red: 330,
  blue: 262,
  yellow: 392,
  green: 523,
};

const ATTACK_S = 0.01;
const DURATION_S = 0.25;
const PEAK_GAIN = 0.3;

export interface Audio {
  // Creates/resumes the audio context; call it from a user gesture.
  unlock(): void;
  play(color: Color): void;
  setMuted(muted: boolean): void;
  isMuted(): boolean;
}

function defaultFactory(): AudioContext {
  const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
  return new Ctor();
}

// Web Audio failures never throw: the game simply continues without sound.
export function createAudio(factory: () => AudioContext = defaultFactory): Audio {
  let context: AudioContext | null = null;
  let muted = false;

  function getContext(): AudioContext | null {
    try {
      context ??= factory();
      if (context.state !== 'running') {
        // resume() may reject (e.g. blocked autoplay); ignore it.
        void Promise.resolve(context.resume()).catch(() => {});
      }
      return context;
    } catch {
      context = null;
      return null;
    }
  }

  return {
    unlock() {
      getContext();
    },
    play(color) {
      if (muted) return;
      try {
        const ctx = getContext();
        if (!ctx) return;
        const now = ctx.currentTime;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.value = FREQUENCIES[color];
        // Short attack and decay avoid audible clicks.
        gain.gain.setValueAtTime(0, now);
        gain.gain.linearRampToValueAtTime(PEAK_GAIN, now + ATTACK_S);
        gain.gain.linearRampToValueAtTime(0, now + DURATION_S);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + DURATION_S);
      } catch {
        // Ignore: sound is optional.
      }
    },
    setMuted(value) {
      muted = value;
    },
    isMuted: () => muted,
  };
}
