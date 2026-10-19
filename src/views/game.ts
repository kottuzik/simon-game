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
import { createAudio } from '../audio';
import { createPauseController } from '../pause';
import { createInstaller, isIosSafari, readEnv } from '../install';

export { TOTAL_LEVELS };

export interface GameView {
  element: HTMLElement;
  // False while another screen is shown; the game pauses until it is active again.
  setActive(active: boolean): void;
}

const ICON_SOUND_ON =
  '<svg viewBox="0 0 24 24" width="24" height="24" aria-hidden="true" focusable="false"><path fill="currentColor" d="M3 9v6h4l5 5V4L7 9H3zm13.5 3A4.5 4.5 0 0 0 14 7.97v8.05A4.5 4.5 0 0 0 16.5 12zM14 3.23v2.06a7 7 0 0 1 0 13.42v2.06a9 9 0 0 0 0-17.54z"/></svg>';
const ICON_SOUND_OFF =
  '<svg viewBox="0 0 24 24" width="24" height="24" aria-hidden="true" focusable="false"><path fill="currentColor" d="M16.5 12A4.5 4.5 0 0 0 14 7.97v2.21l2.45 2.45c.03-.2.05-.41.05-.63zM19 12c0 .94-.2 1.82-.54 2.64l1.51 1.51A8.8 8.8 0 0 0 21 12a9 9 0 0 0-7-8.77v2.06A7 7 0 0 1 19 12zM4.27 3 3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06a9 9 0 0 0 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4 9.91 6.09 12 8.18V4z"/></svg>';

const ICON_INSTALL =
  '<svg viewBox="0 0 24 24" width="24" height="24" aria-hidden="true" focusable="false"><path fill="currentColor" d="M5 20h14v-2H5v2zM19 9h-4V3H9v6H5l7 7 7-7z"/></svg>';

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
  const audio = createAudio();
  const muteButton = button('btn btn--secondary btn--sound', '', toggleMute);
  const newGame = button('btn btn--secondary', 'משחק חדש', openConfirm);
  const installButton = button('btn btn--secondary btn--install', '', onInstall);
  installButton.hidden = true;
  actions.append(primary, muteButton, installButton, newGame);

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

  // iPhone cannot install from a website, so this dialog explains the manual steps.
  const installDialog = document.createElement('dialog');
  installDialog.className = 'dialog';
  installDialog.setAttribute('aria-labelledby', 'install-title');
  const iosSafari = isIosSafari(readEnv());
  installDialog.innerHTML = `
    <h2 id="install-title" class="h2">התקנת האפליקציה באייפון</h2>
    ${iosSafari ? '' : '<p class="body">פתחי את האתר בדפדפן Safari כדי להתקין.</p>'}
    <ol class="body dialog__steps">
      <li>לחצי על כפתור השיתוף בסרגל של Safari.</li>
      <li>בחרי ״הוסף למסך הבית״.</li>
      <li>לחצי ״הוסף״.</li>
    </ol>
  `;
  const installDialogActions = document.createElement('div');
  installDialogActions.className = 'dialog__actions';
  const installCloseButton = button('btn btn--primary btn--small', 'סגירה', () => installDialog.close());
  installDialogActions.append(installCloseButton);
  installDialog.append(installDialogActions);
  installDialog.addEventListener('close', () => pauseCtl.resume('install'));

  section.append(board.element, status, actions, dialog, installDialog);

  let state: GameState = createIdleState();
  const presenter = createPresenter();
  const pressTimers = new Map<Color, ReturnType<typeof setTimeout>>();

  // The game pauses when another screen is shown, the page is hidden, or the confirm dialog is open.
  const pauseCtl = createPauseController(onPause, onResume);

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

    board.setEnabled(phase === 'playerTurn' && !pauseCtl.isPaused());
  }

  const installer = createInstaller(renderInstall);

  function renderInstall(): void {
    const mode = installer.mode();
    installButton.hidden = mode === 'none';
    installButton.innerHTML = `${ICON_INSTALL}<span>התקן אפליקציה</span>`;
  }

  function onInstall(): void {
    const mode = installer.mode();
    if (mode === 'native') {
      void installer.promptInstall();
    } else if (mode === 'ios-help' && !installDialog.open) {
      // Freeze the game while the help dialog is open.
      pauseCtl.pause('install');
      installDialog.showModal();
      installCloseButton.focus();
    }
  }

  function renderMute(): void {
    const muted = audio.isMuted();
    muteButton.innerHTML = `${muted ? ICON_SOUND_OFF : ICON_SOUND_ON}<span>${muted ? 'הפעלת צלילים' : 'השתקת צלילים'}</span>`;
  }

  function toggleMute(): void {
    audio.setMuted(!audio.isMuted());
    audio.unlock();
    renderMute();
  }

  function play(): void {
    render();
    if (pauseCtl.isPaused()) return;
    presenter.show(
      state.sequence,
      state.level,
      (color) => {
        board.setLit(color);
        if (color) audio.play(color);
      },
      () => {
        state = finishShowing(state);
        render();
      },
    );
  }

  function onPause(): void {
    // Stop all timers; an interrupted sequence replays from its first color on resume.
    presenter.cancel();
    for (const [color, timer] of pressTimers) {
      clearTimeout(timer);
      board.pads[color].classList.remove('is-pressed');
    }
    pressTimers.clear();
    render();
  }

  function onResume(): void {
    if (state.phase === 'showing') play();
    else render();
  }

  function onPrimary(): void {
    audio.unlock();
    if (state.phase === 'levelComplete') {
      state = advanceLevel(state);
    } else {
      state = startGame();
    }
    play();
  }

  function openConfirm(): void {
    if (!isGameActive(state) || dialog.open) return;
    // Freeze the game while the dialog is open.
    pauseCtl.pause('confirm');
    dialog.showModal();
    cancelButton.focus();
  }

  function closeConfirm(): void {
    dialog.close();
  }

  // Runs on every close (cancel button, Esc, or after confirming).
  function resumeAfterConfirm(): void {
    pauseCtl.resume('confirm');
  }

  function confirmNewGame(): void {
    audio.unlock();
    presenter.cancel();
    state = startGame();
    render();
    // Closing the dialog ends the pause, which starts the new sequence exactly once.
    dialog.close();
  }

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) pauseCtl.pause('hidden');
    else pauseCtl.resume('hidden');
  });
  if (document.hidden) pauseCtl.pause('hidden');

  for (const [color, pad] of Object.entries(board.pads) as [Color, HTMLButtonElement][]) {
    pad.addEventListener('click', () => {
      if (state.phase !== 'playerTurn' || pauseCtl.isPaused()) return;
      audio.unlock();
      audio.play(color);
      // Brief visual feedback; the pad may become disabled right after this press.
      pad.classList.add('is-pressed');
      clearTimeout(pressTimers.get(color));
      pressTimers.set(
        color,
        setTimeout(() => {
          pad.classList.remove('is-pressed');
          pressTimers.delete(color);
        }, 150),
      );
      state = pressColor(state, color);
      render();
    });
  }

  renderMute();
  renderInstall();
  render();
  return {
    element: section,
    setActive(active) {
      if (active) pauseCtl.resume('about');
      else pauseCtl.pause('about');
    },
  };
}
