import '@fontsource/heebo/hebrew-400.css';
import '@fontsource/heebo/hebrew-600.css';
import '@fontsource/heebo/hebrew-700.css';
import '@fontsource/heebo/hebrew-800.css';
import '@fontsource/inter/latin-400.css';
import '@fontsource/inter/latin-600.css';
import '@fontsource/inter/latin-700.css';
import './styles/tokens.css';
import './styles/base.css';
import './styles/components.css';

import { createNav } from './nav';
import { createGameView } from './views/game';
import { createAboutView } from './views/about';

const app = document.getElementById('app');
if (!app) throw new Error('Missing #app root');

const gameView = createGameView();

const views = {
  game: gameView.element,
  about: createAboutView(),
};

const main = document.createElement('main');
main.className = 'content';
main.append(views.game, views.about);

app.append(createNav(views, (name) => gameView.setActive(name === 'game')), main);
