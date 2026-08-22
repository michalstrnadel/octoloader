import { describe, expect, it, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';

import {
  BUBBLES,
  COLOR_PALETTE,
  FRAMES,
  FRAME_BLINK,
  FRAME_LIFT,
  FRAME_LOOK_LEFT,
  FRAME_POSE,
  FRAME_LOOK_RIGHT,
  MONO_PALETTE,
  SPRITE_HEIGHT,
  SPRITE_WIDTH,
  type Grid,
} from './sprite.js';
import {
  BAR_ROOM,
  BAR_STEPS,
  BAR_TOP,
  BUBBLE_HEADROOM,
  VIEW_HEIGHT,
  animationCss,
  diff,
  progressBar,
  stripPaths,
  toPaths,
} from './render.js';
import { OctoLoader } from './index.js';
import './element.js';

const ALL: [string, Grid][] = [
  ...FRAMES.map((g, i): [string, Grid] => [`frame ${i}`, g]),
  ['blink', FRAME_BLINK],
  ['look left', FRAME_LOOK_LEFT],
  ['look right', FRAME_LOOK_RIGHT],
];

/** How far the outer arm reaches, as the leftmost painted column. */
const REACH = FRAMES.map((grid) =>
  Math.min(
    ...grid.map((row) => {
      const i = row.search(/[^.]/);
      return i === -1 ? Number.POSITIVE_INFINITY : i;
    }),
  ),
);

describe('sprite', () => {
  it.each(ALL)('%s is a full rectangle of the declared size', (_name, grid) => {
    expect(grid).toHaveLength(SPRITE_HEIGHT);
    for (const row of grid) expect(row).toHaveLength(SPRITE_WIDTH);
  });

  it.each(ALL)('%s only uses characters both palettes know', (_name, grid) => {
    const unknown = new Set<string>();
    for (const row of grid) {
      for (const ch of row) {
        if (!Object.hasOwn(COLOR_PALETTE, ch) || !Object.hasOwn(MONO_PALETTE, ch)) {
          unknown.add(ch);
        }
      }
    }
    expect([...unknown]).toEqual([]);
  });

  /**
   * A background pixel the outside cannot reach is a hole punched through the
   * octopus. One stray pixel is invisible at 12× and reads as dirt at 1×, which
   * is exactly the size this thing is used at.
   */
  it.each(ALL)('%s has no background sealed inside the silhouette', (_name, grid) => {
    const seen = grid.map((row) => [...row].map(() => false));
    const queue: [number, number][] = [];

    const push = (y: number, x: number) => {
      if (y < 0 || y >= SPRITE_HEIGHT || x < 0 || x >= SPRITE_WIDTH) return;
      if (seen[y][x] || grid[y][x] !== '.') return;
      seen[y][x] = true;
      queue.push([y, x]);
    };

    for (let y = 0; y < SPRITE_HEIGHT; y++) { push(y, 0); push(y, SPRITE_WIDTH - 1); }
    for (let x = 0; x < SPRITE_WIDTH; x++) { push(0, x); push(SPRITE_HEIGHT - 1, x); }
    while (queue.length) {
      const [y, x] = queue.pop()!;
      push(y + 1, x); push(y - 1, x); push(y, x + 1); push(y, x - 1);
    }

    const sealed: string[] = [];
    for (let y = 0; y < SPRITE_HEIGHT; y++) {
      for (let x = 0; x < SPRITE_WIDTH; x++) {
        if (grid[y][x] === '.' && !seen[y][x]) sealed.push(`${x},${y}`);
      }
    }
    expect(sealed).toEqual([]);
  });

  it('gives every frame a lift value', () => {
    expect(FRAME_LIFT).toHaveLength(FRAMES.length);
    expect(Math.min(...FRAME_LIFT)).toBe(0);
    expect(Math.max(...FRAME_LIFT)).toBeGreaterThan(0);
  });

  /**
   * Interpolating between two poses a pixel apart collapses on rounding: five
   * steps became three drawings, so two pairs of frames were identical and the
   * swim held still while the body kept moving. That reads as a twitch.
   */
  it('never draws the same frame twice in a cycle', () => {
    const keys = FRAMES.map((grid) => grid.join('|'));
    expect(new Set(keys).size).toBe(FRAMES.length);
  });

  it('sweeps the arms out and back rather than looping one way', () => {
    const peak = REACH.indexOf(Math.min(...REACH));
    expect(peak).toBeGreaterThan(0);
    expect(peak).toBeLessThan(FRAMES.length - 1);
    for (let i = 1; i <= peak; i++) expect(REACH[i]).toBeLessThanOrEqual(REACH[i - 1]);
    for (let i = peak + 1; i < FRAMES.length; i++) {
      expect(REACH[i]).toBeGreaterThanOrEqual(REACH[i - 1]);
    }
  });

  it('moves the whole animal, not just the arms', () => {
    expect(new Set(FRAME_LIFT).size).toBeGreaterThan(1);
  });

  /**
   * Height belongs to the pose, not to the frame index. Get this wrong and the
   * same drawing sits at two different heights on the way out and the way back
   * — every frame is correct and the loop still stutters.
   */
  it('puts a pose at the same height every time it comes round', () => {
    expect(FRAME_POSE).toHaveLength(FRAMES.length);
    const heights = new Map<number, Set<number>>();
    FRAME_POSE.forEach((pose, i) => {
      const seen = heights.get(pose) ?? new Set<number>();
      seen.add(FRAME_LIFT[i]);
      heights.set(pose, seen);
    });
    for (const [, seen] of heights) expect([...seen]).toHaveLength(1);
  });

  it('plays the poses out and back', () => {
    const peak = FRAME_POSE.indexOf(Math.max(...FRAME_POSE));
    expect(FRAME_POSE.slice(0, peak + 1)).toEqual([...FRAME_POSE.slice(0, peak + 1)].sort((a, b) => a - b));
    expect(FRAME_POSE.slice(peak)).toEqual([...FRAME_POSE.slice(peak)].sort((a, b) => b - a));
  });

  it('glances by moving the pupils and nothing else', () => {
    for (const look of [FRAME_LOOK_LEFT, FRAME_LOOK_RIGHT]) {
      const changed = diff(FRAMES[0], look).join('').replace(/\./g, '');
      expect(changed.length).toBeGreaterThan(0);
      // Only pupil, iris and the catchlight that rides with it.
      expect(new Set(changed)).toEqual(new Set(['p', 'c', 'H']));
    }
  });

  it('looks left and right, not the same way twice', () => {
    expect(FRAME_LOOK_LEFT.join('|')).not.toBe(FRAME_LOOK_RIGHT.join('|'));
  });

  it('blinks by changing the eyes and nothing else', () => {
    const changed = diff(FRAMES[0], FRAME_BLINK);
    const rows = changed
      .map((row, y) => (row.trim().replace(/\./g, '') ? y : -1))
      .filter((y) => y >= 0);
    expect(Math.min(...rows)).toBeGreaterThan(2);
    expect(Math.max(...rows)).toBeLessThan(SPRITE_HEIGHT - 8);
  });

  it('keeps the arms, and only the arms, moving between frames', () => {
    const moved = diff(FRAMES[0], FRAMES[2])
      .map((row, y) => (row.replace(/\./g, '') ? y : -1))
      .filter((y) => y >= 0);
    expect(moved.length).toBeGreaterThan(0);
    expect(Math.min(...moved)).toBeGreaterThan(SPRITE_HEIGHT / 2);
  });
});

describe('stripPaths', () => {
  it('offsets each frame by one sprite width', () => {
    const [{ d }] = stripPaths([['b'], ['b']], { b: '#f00' }, 4);
    expect(d).toBe('M0 0h1v1h-1zM4 0h1v1h-1z');
  });

  it('still emits one path per colour across the whole strip', () => {
    const strip = stripPaths(FRAMES, COLOR_PALETTE);
    const fills = strip.map((p) => p.fill);
    expect(new Set(fills).size).toBe(fills.length);
    expect(strip.length).toBeLessThan(12);
  });
});

describe('toPaths', () => {
  it('merges a run of one character into a single rectangle', () => {
    const paths = toPaths(['.bbb.'], { '.': null, b: '#f00' });
    expect(paths).toEqual([{ fill: '#f00', d: 'M1 0h3v1h-3z' }]);
  });

  it('gives each colour exactly one path', () => {
    const paths = toPaths(FRAMES[0], COLOR_PALETTE);
    const fills = paths.map((p) => p.fill);
    expect(new Set(fills).size).toBe(fills.length);
    expect(paths.length).toBeLessThan(12);
  });

  it('drops characters the palette maps to null', () => {
    expect(toPaths(['..'], MONO_PALETTE)).toEqual([]);
  });

  /**
   * The failure this guards against: one ink with punched eyes looks correct on
   * white and turns into a skull on black, because the body goes light and the
   * eyes go dark with it.
   */
  it('keeps the eye lighter than the body and the pupil darker than the eye', () => {
    const fills = new Set(toPaths(FRAMES[0], MONO_PALETTE).map((p) => p.fill));
    expect(fills.size).toBe(3);
    expect(fills).toContain('currentColor');
    expect([...fills].some((f) => f.includes('--octo-paper'))).toBe(true);
    expect([...fills].some((f) => f.includes('--octo-pupil'))).toBe(true);
  });
});

describe('animationCss', () => {
  it('slides one strip in whole-frame steps', () => {
    const css = animationCss(8, [0, 0, 0, 0, 0, 0, 0, 0], 28);
    expect(css).toContain('steps(8)');
    expect(css).toContain('transform:translateX(-224px)');
  });

  /**
   * Stacking the frames and cross-fading opacity needs one animation per frame
   * per expression. On a page with several loaders that runs into the hundreds
   * and shows up as dropped frames, so the strip has to stay a single slide.
   */
  it('costs the same number of animations however many frames there are', () => {
    const count = (css: string) => (css.match(/animation(-name)?:/g) ?? []).length;
    expect(count(animationCss(4, [0, 0, 0, 0]))).toBe(count(animationCss(16, Array(16).fill(0))));
  });

  it('holds each height for its own slice of the cycle', () => {
    const css = animationCss(4, [2, 2, 0, 1], 28);
    expect(css).toContain('0%,49.99%{transform:translateY(2px)}');
    expect(css).toContain('50%,74.99%{transform:translateY(0px)}');
    expect(css).toContain('75%,100%{transform:translateY(1px)}');
  });

  it('parks the sprite where frame one sits when motion is turned down', () => {
    const css = animationCss();
    expect(css).toContain('prefers-reduced-motion');
    expect(css).toContain('.octo-strip,.octo-bob,.octo-lid,.octo-look,.octo-bubble{animation:none}');
    expect(css).toContain(`transform:translateY(${FRAME_LIFT[0]}px)`);
  });

  it('steps every bubble a whole pixel at a time', () => {
    const css = animationCss();
    for (const [i, b] of BUBBLES.entries()) {
      expect(css).toContain(`steps(${b.rise})`);
      expect(css).toContain(`@keyframes octo-bubble-${i}`);
      expect(css).toContain(`translateY(-${b.rise}px)`);
    }
  });

  it('runs the blink and the glance on clocks of their own', () => {
    const css = animationCss();
    expect(css).toContain('var(--octo-swim,.9s)');
    expect(css).toContain('var(--octo-blink,4.6s)');
    expect(css).toContain('var(--octo-glance,7.3s)');
  });
});

describe('<octo-loader>', () => {
  it('renders the strip, the expressions and the label into a shadow root', () => {
    document.body.innerHTML = '<octo-loader label="Hold on"></octo-loader>';
    const el = document.querySelector('octo-loader')!;
    const root = el.shadowRoot!;

    expect(root).toBeTruthy();
    expect(root.querySelectorAll('svg')).toHaveLength(1);
    expect(root.querySelectorAll('.octo-strip')).toHaveLength(1);
    expect(root.querySelectorAll('.octo-lid')).toHaveLength(1);
    expect(root.querySelectorAll('.octo-look-left')).toHaveLength(1);
    expect(root.querySelectorAll('.octo-look-right')).toHaveLength(1);
    expect(root.querySelectorAll('path').length).toBeGreaterThan(10);
    expect(root.textContent).toContain('Hold on');
    expect(el.getAttribute('role')).toBe('status');
  });

  it('re-renders when the variant changes', () => {
    document.body.innerHTML = '<octo-loader></octo-loader>';
    const el = document.querySelector('octo-loader')!;
    const fills = () =>
      [...el.shadowRoot!.querySelectorAll('path')].map((p) => p.getAttribute('fill'));

    expect(fills()).toContain('#b27ed6');
    el.setAttribute('variant', 'mono');
    expect(fills()).not.toContain('#b27ed6');
    expect(fills()).toContain('currentColor');
  });

  it('drifts three bubbles, and drops them on request', () => {
    document.body.innerHTML = '<octo-loader></octo-loader>';
    const el = document.querySelector('octo-loader')!;
    expect(el.shadowRoot!.querySelectorAll('.octo-bubble')).toHaveLength(BUBBLES.length);

    el.setAttribute('bubbles', 'false');
    expect(el.shadowRoot!.querySelectorAll('.octo-bubble')).toHaveLength(0);
  });

  it('drops the label when it is empty', () => {
    document.body.innerHTML = '<octo-loader label=""></octo-loader>';
    expect(document.querySelector('octo-loader')!.shadowRoot!.querySelector('span')).toBeNull();
  });

  it('stays empty until the delay is up', () => {
    vi.useFakeTimers();
    try {
      document.body.innerHTML = '<octo-loader delay="1000"></octo-loader>';
      const el = document.querySelector('octo-loader')!;
      expect(el.shadowRoot!.querySelector('svg')).toBeNull();

      vi.advanceTimersByTime(999);
      expect(el.shadowRoot!.querySelector('svg')).toBeNull();

      vi.advanceTimersByTime(1);
      expect(el.shadowRoot!.querySelector('svg')).not.toBeNull();
    } finally {
      vi.useRealTimers();
    }
  });

  it('switches between announcing and measuring', () => {
    document.body.innerHTML = '<octo-loader></octo-loader>';
    const el = document.querySelector('octo-loader')!;
    expect(el.getAttribute('role')).toBe('status');
    expect(el.hasAttribute('aria-valuenow')).toBe(false);

    el.setAttribute('progress', '0.25');
    expect(el.getAttribute('role')).toBe('progressbar');
    expect(el.getAttribute('aria-valuenow')).toBe('25');
    expect(el.shadowRoot!.querySelector('.octo-bar')).not.toBeNull();

    el.removeAttribute('progress');
    expect(el.getAttribute('role')).toBe('status');
    expect(el.hasAttribute('aria-valuenow')).toBe(false);
    expect(el.shadowRoot!.querySelector('.octo-bar')).toBeNull();
  });

  it('takes the panel from the attribute, presence being enough', () => {
    document.body.innerHTML = '<octo-loader></octo-loader>';
    const el = document.querySelector('octo-loader')!;
    const css = () => el.shadowRoot!.querySelector('style')!.textContent ?? '';
    expect(css()).not.toContain('--octo-frame');

    el.setAttribute('frame', '');
    expect(css()).toContain('--octo-frame');
    expect(css()).toContain('border-radius');

    // Spelling it out as false has to win over merely being present.
    el.setAttribute('frame', 'false');
    expect(css()).not.toContain('--octo-frame');
  });

  it('speaks the visible text unless it is told otherwise', () => {
    document.body.innerHTML = '<octo-loader></octo-loader>';
    const el = document.querySelector('octo-loader')!;
    expect(el.getAttribute('aria-label')).toBe('One moment please…');

    el.setAttribute('announce', 'Loading status checks');
    expect(el.getAttribute('aria-label')).toBe('Loading status checks');
  });
});

describe('<OctoLoader>', () => {
  it('renders on the server without touching the DOM', () => {
    const html = renderToStaticMarkup(<OctoLoader />);
    expect(html).toContain('<svg');
    expect(html).toContain('One moment please');
    expect(html).toContain('role="status"');
    expect(html).toContain('#b27ed6');
  });

  it('honours variant, size and label', () => {
    const html = renderToStaticMarkup(<OctoLoader variant="mono" size={112} label={null} />);
    expect(html).toContain('width="112"');
    expect(html).toContain('currentColor');
    expect(html).toContain('--octo-paper');
    expect(html).not.toContain('#b27ed6');
    expect(html).not.toContain('One moment please');
  });

  it('makes room above itself only when the bubbles need it', () => {
    expect(BUBBLE_HEADROOM).toBeGreaterThan(0);
    const withBubbles = renderToStaticMarkup(<OctoLoader />);
    const without = renderToStaticMarkup(<OctoLoader bubbles={false} />);
    expect(withBubbles).toContain(`viewBox="0 ${-BUBBLE_HEADROOM}`);
    expect(withBubbles).toContain('class="octo-bubble octo-bubble-0"');
    expect(without).toContain('viewBox="0 0');
    expect(without).not.toContain('<rect');
  });

  it('scales the animation clock with speed', () => {
    const html = renderToStaticMarkup(<OctoLoader speed={2} />);
    expect(html).toContain('--octo-swim:0.45s');
    expect(html).toContain('--octo-glance:3.65s');
  });

  it('shows nothing at all while the delay runs', () => {
    expect(renderToStaticMarkup(<OctoLoader delay={1000} />)).toBe('');
    expect(renderToStaticMarkup(<OctoLoader delay={0} />)).toContain('<svg');
  });

  it('names itself from the text people can see', () => {
    const html = renderToStaticMarkup(<OctoLoader />);
    const id = /aria-labelledby="([^"]+)"/.exec(html)?.[1];
    expect(id).toBeTruthy();
    expect(html).toContain(`id="${id}"`);
    expect(html).not.toContain('aria-label="');
  });

  it('falls back to a spoken name only when there is no visible text', () => {
    const bare = renderToStaticMarkup(<OctoLoader label={null} />);
    expect(bare).toContain('aria-label="Loading"');
    expect(bare).not.toContain('aria-labelledby');

    const told = renderToStaticMarkup(<OctoLoader announce="Loading pull requests" />);
    expect(told).toContain('aria-label="Loading pull requests"');
    expect(told).not.toContain('aria-labelledby');
  });

  it('turns determinate when it is handed a number', () => {
    const spinning = renderToStaticMarkup(<OctoLoader />);
    expect(spinning).toContain('role="status"');
    expect(spinning).not.toContain('octo-bar');

    const measured = renderToStaticMarkup(<OctoLoader progress={0.5} />);
    expect(measured).toContain('role="progressbar"');
    expect(measured).toContain('aria-valuenow="50"');
    expect(measured).toContain('aria-valuemax="100"');
    expect(measured).toContain('octo-bar');
  });

  it('draws the empty-state panel only when it is asked for', () => {
    const bare = renderToStaticMarkup(<OctoLoader />);
    expect(bare).not.toContain('border');
    expect(bare).toContain('display:inline-flex');

    const framed = renderToStaticMarkup(<OctoLoader frame />);
    expect(framed).toContain('--octo-frame');
    expect(framed).toContain('border-radius');
    // Spans its container, so it reads as a place rather than a badge.
    expect(framed).toContain('width:100%');
    expect(framed).toContain('box-sizing:border-box');
    expect(framed).toContain('display:flex');
    expect(framed).not.toContain('display:inline-flex');
  });

  it('lets the caller override the panel', () => {
    const html = renderToStaticMarkup(
      <OctoLoader frame style={{ maxWidth: 320, borderRadius: 20 }} />,
    );
    expect(html).toContain('max-width:320px');
    expect(html).toContain('border-radius:20px');
  });

  it('makes room under itself only for a bar that is there', () => {
    const tall = VIEW_HEIGHT + BUBBLE_HEADROOM + BAR_ROOM;
    expect(renderToStaticMarkup(<OctoLoader progress={0.5} />)).toContain(
      `${SPRITE_WIDTH} ${tall}"`,
    );
    expect(renderToStaticMarkup(<OctoLoader />)).toContain(
      `${SPRITE_WIDTH} ${VIEW_HEIGHT + BUBBLE_HEADROOM}"`,
    );
  });
});

describe('progressBar', () => {
  const fillWidth = (p: number) => {
    const rects = progressBar(p, COLOR_PALETTE);
    return rects.length === 3 ? rects[2].width : 0;
  };

  it('draws a frame and a track before it draws any fill', () => {
    const empty = progressBar(0, COLOR_PALETTE);
    expect(empty).toHaveLength(2);
    expect(empty[0]).toMatchObject({ x: 0, y: BAR_TOP, width: SPRITE_WIDTH });
    expect(empty[1]).toMatchObject({ x: 1, width: BAR_STEPS, height: 1 });
  });

  it('fills the track end to end at one', () => {
    expect(fillWidth(1)).toBe(BAR_STEPS);
  });

  it('clamps anything outside nought to one', () => {
    expect(fillWidth(-3)).toBe(0);
    expect(fillWidth(42)).toBe(BAR_STEPS);
    expect(fillWidth(Number.NaN)).toBe(0);
  });

  it('never lands between two pixels, and never goes backwards', () => {
    let last = 0;
    for (let i = 0; i <= 100; i++) {
      const w = fillWidth(i / 100);
      expect(Number.isInteger(w)).toBe(true);
      expect(w).toBeGreaterThanOrEqual(last);
      last = w;
    }
  });

  it('keeps the bar inside the three mono tones', () => {
    for (const tone of progressBar(0.5, MONO_PALETTE).map((r) => r.fill)) {
      expect([
        'currentColor',
        'var(--octo-paper, #f6f8fa)',
        'var(--octo-pupil, #1b1f24)',
      ]).toContain(tone);
    }
  });

  it('keeps the frame, the track and the fill three different inks', () => {
    // Collapse any two and the bar stops carrying the number — the same
    // failure as the two-tone face, in a place that is meant to be read.
    for (const palette of [COLOR_PALETTE, MONO_PALETTE]) {
      const [frame, track, fill] = progressBar(0.5, palette);
      expect(new Set([frame.fill, track.fill, fill.fill]).size).toBe(3);
    }
  });
});
