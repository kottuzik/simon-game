import { createBoard } from '../board';

export const TOTAL_LEVELS = 10;

export interface GameView {
  element: HTMLElement;
  setLevel(level: number): void;
}

export function createGameView(): GameView {
  const section = document.createElement('section');
  section.className = 'view view--game';
  section.setAttribute('aria-labelledby', 'game-title');

  section.innerHTML = `
    <h1 id="game-title" class="title">משחק הזיכרון סיימון</h1>
    <p class="lead">זכור את רצף הצבעים וחזור עליו באותו סדר.</p>
  `;

  // Level subtitle; updated by the game engine as levels advance (Milestone 2).
  const levelLabel = document.createElement('p');
  levelLabel.className = 'level';
  levelLabel.setAttribute('aria-live', 'polite');
  section.append(levelLabel);

  function setLevel(level: number): void {
    levelLabel.textContent = `שלב ${level} מתוך ${TOTAL_LEVELS}`;
  }
  setLevel(1);

  const board = createBoard();

  const actions = document.createElement('div');
  actions.className = 'actions';

  // Game logic is wired up in Milestone 2; for now the button has no effect.
  const startButton = document.createElement('button');
  startButton.type = 'button';
  startButton.className = 'btn btn--primary';
  startButton.textContent = 'התחל';
  actions.append(startButton);

  section.append(board.element, actions);
  return { element: section, setLevel };
}
