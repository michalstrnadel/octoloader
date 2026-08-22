import {
  BUBBLES,
  COLOR_PALETTE,
  FRAMES,
  FRAME_BLINK,
  FRAME_LOOK_LEFT,
  FRAME_LOOK_RIGHT,
  MONO_PALETTE,
  SPRITE_WIDTH,
} from './sprite.js';
import {
  BAR_ROOM,
  BUBBLE_HEADROOM,
  CSS,
  VIEW_HEIGHT,
  diff,
  progressBar,
  stripPaths,
  toPaths,
  type PathSpec,
} from './render.js';

const NS = 'http://www.w3.org/2000/svg';

function node(name: string, attrs: Record<string, string>): SVGElement {
  const el = document.createElementNS(NS, name);
  for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, v);
  return el;
}

function fill(parent: SVGElement, specs: PathSpec[]) {
  for (const p of specs) parent.append(node('path', { fill: p.fill, d: p.d }));
}

function spriteSvg(
  variant: string,
  size: number,
  bubbles: boolean,
  progress: number | null,
): SVGElement {
  const palette = variant === 'mono' ? MONO_PALETTE : COLOR_PALETTE;
  const headroom = bubbles ? BUBBLE_HEADROOM : 0;
  const viewHeight = VIEW_HEIGHT + headroom + (progress === null ? 0 : BAR_ROOM);

  const svg = node('svg', {
    width: String(size),
    height: String(Math.round((size * viewHeight) / SPRITE_WIDTH)),
    viewBox: `0 ${-headroom} ${SPRITE_WIDTH} ${viewHeight}`,
    'shape-rendering': 'crispEdges',
    'aria-hidden': 'true',
    focusable: 'false',
  });

  const body = node('g', { class: 'octo-body' });
  const bob = node('g', { class: 'octo-bob' });

  // Every frame side by side. The strip slides; the viewBox stays put.
  const strip = node('g', { class: 'octo-strip' });
  fill(strip, stripPaths(FRAMES, palette));
  bob.append(strip);

  // The eyes live outside the strip, so one overlay covers whichever frame is
  // showing. Order matters: the eyelids close over whichever way it is looking.
  for (const [cls, grid] of [
    ['octo-look octo-look-left', FRAME_LOOK_LEFT],
    ['octo-look octo-look-right', FRAME_LOOK_RIGHT],
    ['octo-lid', FRAME_BLINK],
  ] as const) {
    const overlay = node('g', { class: cls });
    fill(overlay, toPaths(diff(FRAMES[0], grid), palette));
    bob.append(overlay);
  }

  body.append(bob);

  if (bubbles) {
    BUBBLES.forEach((b, i) => {
      body.append(
        node('rect', {
          class: `octo-bubble octo-bubble-${i}`,
          x: String(b.x),
          y: String(b.y),
          width: String(b.size),
          height: String(b.size),
          fill: palette.B ?? 'currentColor',
        }),
      );
    });
  }

  svg.append(body);

  // Outside octo-body, so the reduced-motion pulse leaves it alone.
  if (progress !== null) {
    const bar = node('g', { class: 'octo-bar' });
    for (const r of progressBar(progress, palette)) {
      bar.append(
        node('rect', {
          x: String(r.x),
          y: String(r.y),
          width: String(r.width),
          height: String(r.height),
          fill: r.fill,
        }),
      );
    }
    svg.append(bar);
  }

  return svg;
}

/**
 * `<octo-loader>` — the same loader with no framework attached.
 *
 * ```html
 * <octo-loader variant="mono" label="One moment please…" size="60"></octo-loader>
 * <octo-loader delay="1000" progress="0.4"></octo-loader>
 * ```
 */
export class OctoLoaderElement extends HTMLElement {
  static observedAttributes = [
    'variant',
    'label',
    'size',
    'speed',
    'announce',
    'bubbles',
    'progress',
    'delay',
    'frame',
  ];

  #root = this.attachShadow({ mode: 'open' });
  #timer: ReturnType<typeof setTimeout> | undefined;
  #shown = false;

  connectedCallback() {
    // A wait under a second should show nothing at all, so `delay` holds the
    // loader back and it only appears once the wait turns out to be real.
    const delay = Number(this.getAttribute('delay')) || 0;
    if (delay > 0) {
      this.#root.replaceChildren();
      this.#timer = setTimeout(() => {
        this.#shown = true;
        this.#render();
      }, delay);
      return;
    }
    this.#shown = true;
    this.#render();
  }

  disconnectedCallback() {
    clearTimeout(this.#timer);
    this.#timer = undefined;
    this.#shown = false;
  }

  attributeChangedCallback() {
    if (this.isConnected && this.#shown) this.#render();
  }

  #render() {
    const variant = this.getAttribute('variant') ?? 'color';
    const size = Number(this.getAttribute('size')) || 60;
    const speed = Number(this.getAttribute('speed')) || 1;
    const label = this.getAttribute('label') ?? 'One moment please…';
    const bubbles = this.getAttribute('bubbles') !== 'false';
    // Off unless asked for, so presence turns it on and `frame="false"` does not.
    const frame = this.hasAttribute('frame') && this.getAttribute('frame') !== 'false';

    const raw = this.getAttribute('progress');
    const parsed = raw === null ? Number.NaN : Number(raw);
    const progress = Number.isFinite(parsed) ? Math.min(1, Math.max(0, parsed)) : null;

    // aria-labelledby cannot reach across the shadow boundary, so the name is
    // spelled out on the host instead of pointed at the text inside.
    this.setAttribute('role', progress === null ? 'status' : 'progressbar');
    this.setAttribute('aria-label', this.getAttribute('announce') ?? label ?? 'Loading');
    if (progress === null) {
      this.removeAttribute('aria-valuenow');
      this.removeAttribute('aria-valuemin');
      this.removeAttribute('aria-valuemax');
    } else {
      this.setAttribute('aria-valuenow', String(Math.round(progress * 100)));
      this.setAttribute('aria-valuemin', '0');
      this.setAttribute('aria-valuemax', '100');
    }

    // The empty-state panel spans its container rather than hugging the
    // octopus — a box drawn tight around the content reads as a badge, not as
    // the space something is about to appear in.
    const panel = frame
      ? 'display:flex;width:100%;box-sizing:border-box;justify-content:center;' +
        'padding:2em 2.5em;border:1px solid var(--octo-frame,rgba(128,128,128,.28));' +
        'border-radius:var(--octo-frame-radius,6px);'
      : '';

    const style = document.createElement('style');
    style.textContent =
      ':host{display:inline-flex;flex-direction:column;align-items:center;gap:.75em;' +
      panel +
      `--octo-swim:${0.9 / speed}s;--octo-blink:${4.6 / speed}s;` +
      `--octo-glance:${7.3 / speed}s;--octo-rate:${speed}}${CSS}`;

    this.#root.replaceChildren(style, spriteSvg(variant, size, bubbles, progress));

    if (label) {
      const text = document.createElement('span');
      text.setAttribute('aria-hidden', 'true');
      text.textContent = label;
      this.#root.append(text);
    }
  }
}

if (!customElements.get('octo-loader')) {
  customElements.define('octo-loader', OctoLoaderElement);
}
