import type { Color } from './board';

export const TOTAL_LEVELS = 10;
export const GAP_MS = 200;

export const COLORS: readonly Color[] = ['red', 'blue', 'yellow', 'green'];

export type Phase = 'idle' | 'showing' | 'playerTurn' | 'levelComplete' | 'won' | 'lost';

export interface GameState {
  phase: Phase;
  level: number; // Always equals sequence.length during a game.
  sequence: Color[];
  inputIndex: number;
}

export type RandomIndex = () => number; // Returns an integer 0-3.

export function cryptoRandomIndex(): number {
  const buffer = new Uint32Array(1);
  crypto.getRandomValues(buffer);
  return buffer[0] % COLORS.length;
}

// Lit time per color: 800ms at level 1, shrinking 50ms per level (350ms at level 10).
export function flashDuration(level: number): number {
  return 800 - (level - 1) * 50;
}

export function createIdleState(): GameState {
  return { phase: 'idle', level: 0, sequence: [], inputIndex: 0 };
}

// Starts a fresh game at level 1 with a single random color.
export function startGame(random: RandomIndex = cryptoRandomIndex): GameState {
  return { phase: 'showing', level: 1, sequence: [COLORS[random()]], inputIndex: 0 };
}

// Called when the sequence has finished playing.
export function finishShowing(state: GameState): GameState {
  if (state.phase !== 'showing') return state;
  return { ...state, phase: 'playerTurn', inputIndex: 0 };
}

// Moves from a completed level to the next one, appending one color.
export function advanceLevel(state: GameState, random: RandomIndex = cryptoRandomIndex): GameState {
  if (state.phase !== 'levelComplete') return state;
  return {
    phase: 'showing',
    level: state.level + 1,
    sequence: [...state.sequence, COLORS[random()]],
    inputIndex: 0,
  };
}

// Handles a player press; presses outside the player's turn are ignored.
export function pressColor(state: GameState, color: Color): GameState {
  if (state.phase !== 'playerTurn') return state;
  if (state.sequence[state.inputIndex] !== color) return { ...state, phase: 'lost' };

  const inputIndex = state.inputIndex + 1;
  if (inputIndex < state.sequence.length) return { ...state, inputIndex };
  return { ...state, inputIndex, phase: state.level >= TOTAL_LEVELS ? 'won' : 'levelComplete' };
}

export function isGameActive(state: GameState): boolean {
  return state.phase === 'showing' || state.phase === 'playerTurn' || state.phase === 'levelComplete';
}
