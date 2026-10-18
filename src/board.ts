export type Color = 'red' | 'blue' | 'yellow' | 'green';

const SVG_NS = 'http://www.w3.org/2000/svg';

// Geometry in a 200x200 viewBox, centered at (100, 100).
const CENTER = 100;
const OUTER_RADIUS = 90;
const INNER_RADIUS = 40;

// Clockwise from the top; angles in degrees, 0 = right, SVG y-axis points down.
const PADS: { color: Color; label: string; start: number }[] = [
  { color: 'red', label: 'אדום', start: -135 },
  { color: 'blue', label: 'כחול', start: -45 },
  { color: 'yellow', label: 'צהוב', start: 45 },
  { color: 'green', label: 'ירוק', start: 135 },
];

function point(radius: number, degrees: number): string {
  const rad = (degrees * Math.PI) / 180;
  const x = CENTER + radius * Math.cos(rad);
  const y = CENTER + radius * Math.sin(rad);
  return `${x.toFixed(2)} ${y.toFixed(2)}`;
}

// Quarter-ring path between two angles.
function ringSegment(start: number, end: number): string {
  return [
    `M ${point(OUTER_RADIUS, start)}`,
    `A ${OUTER_RADIUS} ${OUTER_RADIUS} 0 0 1 ${point(OUTER_RADIUS, end)}`,
    `L ${point(INNER_RADIUS, end)}`,
    `A ${INNER_RADIUS} ${INNER_RADIUS} 0 0 0 ${point(INNER_RADIUS, start)}`,
    'Z',
  ].join(' ');
}

function svg(): SVGSVGElement {
  const el = document.createElementNS(SVG_NS, 'svg');
  el.setAttribute('viewBox', '0 0 200 200');
  el.setAttribute('aria-hidden', 'true');
  el.setAttribute('focusable', 'false');
  return el;
}

// Shared base layer: dark shell, center disk and the glossy gradients used by the pads.
function createBase(): SVGSVGElement {
  const base = svg();
  base.classList.add('board__base');
  base.innerHTML = `
    <defs>
      ${PADS.map(
        ({ color }) => `
        <radialGradient id="pad-${color}" cx="50%" cy="50%" r="60%" fx="50%" fy="35%">
          <stop offset="0%" style="stop-color: var(--pad-${color}-light)" />
          <stop offset="70%" style="stop-color: var(--pad-${color})" />
          <stop offset="100%" style="stop-color: var(--pad-${color}-dark)" />
        </radialGradient>`,
      ).join('')}
      <radialGradient id="center-disk" cx="50%" cy="40%" r="60%">
        <stop offset="0%" stop-color="#2a2a2a" />
        <stop offset="100%" stop-color="#0a0a0a" />
      </radialGradient>
    </defs>
    <circle cx="100" cy="100" r="100" class="board__shell" />
    <circle cx="100" cy="100" r="33" fill="url(#center-disk)" class="board__center" />
  `;
  return base;
}

export interface Board {
  element: HTMLElement;
  pads: Record<Color, HTMLButtonElement>;
  setLit(color: Color | null): void;
  setEnabled(enabled: boolean): void;
}

export function createBoard(): Board {
  const element = document.createElement('div');
  element.className = 'board';
  element.setAttribute('role', 'group');
  element.setAttribute('aria-label', 'לוח המשחק');
  element.append(createBase());

  const pads = {} as Record<Color, HTMLButtonElement>;

  for (const { color, label, start } of PADS) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = `pad pad--${color}`;
    button.setAttribute('aria-label', label);
    button.dataset.color = color;
    // Pads stay inactive until it is the player's turn.
    button.disabled = true;

    const layer = svg();
    const path = document.createElementNS(SVG_NS, 'path');
    path.setAttribute('d', ringSegment(start, start + 90));
    path.setAttribute('fill', `url(#pad-${color})`);
    path.classList.add('pad__shape');
    layer.append(path);

    button.append(layer);
    element.append(button);
    pads[color] = button;
  }

  function setLit(color: Color | null): void {
    for (const key of Object.keys(pads) as Color[]) {
      pads[key].classList.toggle('is-lit', key === color);
    }
  }

  function setEnabled(enabled: boolean): void {
    for (const key of Object.keys(pads) as Color[]) pads[key].disabled = !enabled;
  }

  return { element, pads, setLit, setEnabled };
}
