import { createBoard, type Color } from '../board';
import {
  TOTAL_LEVELS,
  advanceLevel,
  createIdleState,
  finishShowing,
  isGameActive,
  pressColor,
  startGame,
  type GameState,
} from '../engine';
import { createPresenter } from '../presenter';

export { TOTAL_LEVELS };

export interface GameView {
  element: HTMLElement;
}

function button(className: string, label: string, onClick: () => void): HTMLButtonElement {
  const el = document.createElement('button');
  el.type = 'button';
  el.className = className;
  el.textContent = label;
  el.addEventListener('click', onClick);
  return el;
}

export function createGameView(): GameView {
  const section = document.createElement('section');
  section.className = 'view view--game';
  section.setAttribute('aria-labelledby', 'game-title');

  section.innerHTML = `
    <h1 id="game-title" class="title">משחק הזיכרון סיימון</h1>
    <p class="lead">זכור את רצף הצבעים וחזור עליו באותו סדר.</p>
  `;

  // Fixed level label, shown only during a game.
  const levelLabel = document.createElement('p');
  levelLabel.className = 'level';
  section.append(levelLabel);

  const board = createBoard();

  // Status area: one polite live region, updated only when its text changes.
  const status = document.createElement('div');
  status.className = 'status';
  status.setAttribute('aria-live', 'polite');
  const message = document.createElement('p');
  message.className = 'status__message';
  const progress = document.createElement('p');
  progress.className = 'status__progress';
  status.append(message, progress);

  const actions = document.createElement('div');
  actions.className = 'actions';

  const primary = button('btn btn--primary', 'התחל', onPrimary);
  const newGame = button('btn btn--secondary', 'משחק חדש', openConfirm);
  actions.append(primary, newGame);

  const dialog = document.createElement('dialog');
  dialog.className = 'dialog';
  dialog.setAttribute('aria-labelledby', 'confirm-title');
  dialog.innerHTML = `
    <h2 id="confirm-title" class="h2">להתחיל משחק חדש?</h2>
    <p class="body">ההתקדמות הנוכחית תימחק.</p>
  `;
  const dialogActions = document.createElement('div');
  dialogActions.className = 'dialog__actions';
  const cancelButton = button('btn btn--secondary', 'ביטול', closeConfirm);
  const confirmButton = button('btn btn--primary btn--small', 'משחק חדש', confirmNewGame);
  dialogActions.append(cancelButton, confirmButton);
  dialog.append(dialogActions);
  // Esc closes the dialog natively; treat it like "cancel".
  dialog.addEventListener('close', resumeAfterConfirm);

  section.append(board.element, status, actions, dialog);

  let state: GameState = createIdleState();
  let confirmOpen = false;
  const presenter = createPresenter();

  function render(): void {
    const { phase, level, sequence, inputIndex } = state;
    const inGame = phase !== 'idle';

    levelLabel.hidden = !inGame;
    levelLabel.textContent = inGame ? `שלב ${level} מתוך ${TOTAL_LEVELS}` : '';

    let text = '';
    let isError = false;
    if (phase === 'playerTurn') text = 'תורך!';
    else if (phase === 'levelComplete') text = 'כל הכבוד! השלמת את השלב.';
    else if (phase === 'won') text = `ניצחון! השלמת את כל ${TOTAL_LEVELS} השלבים.`;
    else if (phase === 'lost') {
      text = 'המשחק נגמר';
      isError = true;
    }
    message.textContent = text;
    status.classList.toggle('status--error', isError);
    status.hidden = text === '' && phase !== 'showing';

    if (phase === 'playerTurn') progress.textContent = `${inputIndex} מתוך ${sequence.length}`;
    else if (phase === 'lost') progress.textContent = `הגעת לשלב ${level}`;
    else progress.textContent = '';
    progress.hidden = progress.textContent === '';

    // Primary action depends on the phase.
    primary.hidden = !(phase === 'idle' || phase === 'levelComplete' || phase === 'won' || phase === 'lost');
    primary.textContent =
      phase === 'levelComplete' ? 'לשלב הבא' : phase === 'idle' ? 'התחל' : 'שחק שוב';
    newGame.hidden = !isGameActive(state);

    board.setEnabled(phase === 'playerTurn' && !confirmOpen);
  }

  function play(): void {
    render();
    presenter.show(state.sequence, state.level, (color) => board.setLit(color), () => {
      state = finishShowing(state);
      render();
    });
  }

  function onPrimary(): void {
    if (state.phase === 'levelComplete') {
      state = advanceLevel(state);
    } else {
      state = startGame();
    }
    play();
  }

  function openConfirm(): void {
    if (!isGameActive(state) || confirmOpen) return;
    confirmOpen = true;
    // Freeze the game while the dialog is open.
    presenter.cancel();
    render();
    dialog.showModal();
    cancelButton.focus();
  }

  function closeConfirm(): void {
    dialog.close();
  }

  // Runs on every close (cancel button, Esc, or after confirming).
  function resumeAfterConfirm(): void {
    if (!confirmOpen) return;
    confirmOpen = false;
    // An interrupted sequence replays from its first color.
    if (state.phase === 'showing') play();
    else render();
  }

  function confirmNewGame(): void {
    presenter.cancel();
    state = startGame();
    confirmOpen = false;
    dialog.close();
    play();
  }

  for (const [color, pad] of Object.entries(board.pads) as [Color, HTMLButtonElement][]) {
    let pressTimer: ReturnType<typeof setTimeout> | undefined;
    pad.addEventListener('click', () => {
      // Brief visual feedback; the pad may become disabled right after this press.
      pad.classList.add('is-pressed');
      clearTimeout(pressTimer);
      pressTimer = setTimeout(() => pad.classList.remove('is-pressed'), 150);
      state = pressColor(state, color);
      render();
    });
  }

  render();
  return { element: section };
}
