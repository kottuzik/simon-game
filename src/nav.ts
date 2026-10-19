export type ViewName = 'game' | 'about';

const LABELS: Record<ViewName, string> = {
  game: 'משחק',
  about: 'אודות',
};

// Both views stay mounted; switching only toggles `hidden`, so in-memory state survives.
export function createNav(views: Record<ViewName, HTMLElement>, onChange?: (active: ViewName) => void): HTMLElement {
  const header = document.createElement('header');
  header.className = 'top-bar';

  const nav = document.createElement('nav');
  nav.className = 'nav';
  nav.setAttribute('aria-label', 'ניווט ראשי');

  const buttons = (Object.keys(LABELS) as ViewName[]).map((name) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'nav__item';
    button.textContent = LABELS[name];
    button.addEventListener('click', () => show(name));
    return { name, button };
  });

  function show(active: ViewName): void {
    for (const { name, button } of buttons) {
      const isActive = name === active;
      views[name].hidden = !isActive;
      if (isActive) button.setAttribute('aria-current', 'page');
      else button.removeAttribute('aria-current');
    }
    window.scrollTo(0, 0);
    onChange?.(active);
  }

  nav.append(...buttons.map((b) => b.button));
  header.append(nav);
  show('game');
  return header;
}
