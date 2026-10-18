import { describe, expect, it } from 'vitest';
import {
  COLORS,
  TOTAL_LEVELS,
  advanceLevel,
  createIdleState,
  finishShowing,
  flashDuration,
  isGameActive,
  pressColor,
  startGame,
  type GameState,
} from './engine';

const fixed = (...indexes: number[]) => {
  let i = 0;
  return () => indexes[i++ % indexes.length];
};

function playLevel(state: GameState): GameState {
  let s = finishShowing(state);
  for (const color of s.sequence) s = pressColor(s, color);
  return s;
}

describe('sequence generation', () => {
  it('starts at level 1 with one valid color', () => {
    const s = startGame();
    expect(s.phase).toBe('showing');
    expect(s.level).toBe(1);
    expect(s.sequence).toHaveLength(1);
    expect(COLORS).toContain(s.sequence[0]);
  });

  it('appends exactly one color and keeps the old sequence', () => {
    let s = playLevel(startGame(fixed(0, 1, 2)));
    const before = s.sequence;
    s = advanceLevel(s, fixed(3));
    expect(s.level).toBe(2);
    expect(s.sequence).toEqual([...before, COLORS[3]]);
    expect(s.phase).toBe('showing');
  });

  it('allows repeated colors', () => {
    let s = playLevel(startGame(fixed(2)));
    s = advanceLevel(s, fixed(2));
    expect(s.sequence).toEqual([COLORS[2], COLORS[2]]);
  });

  it('keeps level equal to sequence length up to 10', () => {
    let s = startGame();
    for (let n = 1; n <= TOTAL_LEVELS; n++) {
      expect(s.level).toBe(n);
      expect(s.sequence).toHaveLength(n);
      s = playLevel(s);
      if (n < TOTAL_LEVELS) s = advanceLevel(s);
    }
    expect(s.phase).toBe('won');
    expect(s.sequence).toHaveLength(10);
  });
});

describe('player input', () => {
  it('advances inputIndex on correct presses', () => {
    let s = advanceLevel(playLevel(startGame(fixed(0))), fixed(1));
    s = finishShowing(s);
    s = pressColor(s, s.sequence[0]);
    expect(s.inputIndex).toBe(1);
    expect(s.phase).toBe('playerTurn');
  });

  it('loses immediately on a wrong press and ignores later presses', () => {
    let s = finishShowing(startGame(fixed(0)));
    s = pressColor(s, COLORS[1]);
    expect(s.phase).toBe('lost');
    expect(pressColor(s, COLORS[0])).toBe(s);
  });

  it('completes levels 1-9 without auto-advancing', () => {
    const s = playLevel(startGame());
    expect(s.phase).toBe('levelComplete');
    expect(s.level).toBe(1);
  });

  it('ignores presses outside the player turn', () => {
    const showing = startGame(fixed(0));
    expect(pressColor(showing, COLORS[0])).toBe(showing);
    const idle = createIdleState();
    expect(pressColor(idle, COLORS[0])).toBe(idle);
    const done = playLevel(showing);
    expect(pressColor(done, COLORS[0])).toBe(done);
  });

  it('ignores advanceLevel unless the level is complete', () => {
    const s = startGame();
    expect(advanceLevel(s)).toBe(s);
  });
});

describe('reset and timing', () => {
  it('a new game after a loss starts again at level 1', () => {
    let s = finishShowing(startGame(fixed(0)));
    s = pressColor(s, COLORS[1]);
    const next = startGame();
    expect(next.level).toBe(1);
    expect(next.sequence).toHaveLength(1);
    expect(next.inputIndex).toBe(0);
  });

  it('flash duration goes from 800ms to 350ms in steps of 50', () => {
    expect(flashDuration(1)).toBe(800);
    expect(flashDuration(10)).toBe(350);
    expect(flashDuration(2)).toBe(750);
  });

  it('knows which phases are an active game', () => {
    expect(isGameActive(createIdleState())).toBe(false);
    expect(isGameActive(startGame())).toBe(true);
    expect(isGameActive({ ...startGame(), phase: 'lost' })).toBe(false);
  });
});
