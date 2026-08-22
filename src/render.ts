import {
  BUBBLES,
  FRAMES,
  FRAME_LIFT,
  SPRITE_HEIGHT,
  SPRITE_WIDTH,
  type Bubble,
  type Grid,
  type Palette,
} from './sprite.js';

export interface PathSpec {
  fill: string;
  d: string;
}

/**
 * Collapse a grid into one path per colour.
 *
 * Horizontal runs of the same character become a single `M h v h z` rectangle,
 * and every rectangle of a given colour joins one path element. A frame that
 * would be ~200 `<rect>` nodes comes out as nine `<path>` nodes.
 */
export function toPaths(grid: Grid, palette: Palette, dx = 0): PathSpec[] {
  const byFill = new Map<string, string[]>();

  for (let y = 0; y < grid.length; y++) {
    const row = grid[y];
    let x = 0;
    while (x < row.length) {
      const ch = row[x];
      let w = 1;
      while (x + w < row.length && row[x + w] === ch) w++;
      const fill = palette[ch];
      if (fill) {
        const runs = byFill.get(fill);
        const rect = `M${x + dx} ${y}h${w}v1h-${w}z`;
        if (runs) runs.push(rect);
        else byFill.set(fill, [rect]);
      }
      x += w;
    }
  }

  return Array.from(byFill, ([fill, runs]) => ({ fill, d: runs.join('') }));
}

/**
 * Every frame laid out side by side in one strip, still one path per colour.
 *
 * Merging across frames matters: eight frames rendered separately would be
 * eight times the path elements for no benefit, since they are all on screen
 * at once either way.
 */
export function stripPaths(
  grids: readonly Grid[],
  palette: Palette,
  width = SPRITE_WIDTH,
): PathSpec[] {
  const byFill = new Map<string, string[]>();
  grids.forEach((grid, i) => {
    for (const { fill, d } of toPaths(grid, palette, i * width)) {
      const runs = byFill.get(fill);
      if (runs) runs.push(d);
      else byFill.set(fill, [d]);
    }
  });
  return Array.from(byFill, ([fill, ds]) => ({ fill, d: ds.join('') }));
}

/**
 * The cells of `other` that differ from `base`, everything else transparent.
 *
 * Every expression is stored as a whole frame and reduced to a patch here, so
 * the drawings stay editable as complete pictures while the DOM only carries
 * the eye band.
 */
export function diff(base: Grid, other: Grid): Grid {
  return other.map((row, y) => {
    let out = '';
    for (let x = 0; x < row.length; x++) {
      out += row[x] === base[y][x] ? '.' : row[x];
    }
    return out;
  });
}

/** Tall enough that the frame sitting lowest in the cycle is not clipped. */
export const VIEW_HEIGHT = SPRITE_HEIGHT + Math.max(...FRAME_LIFT);

/** Room above the sprite for the bubbles to rise into before they are gone. */
export const BUBBLE_HEADROOM = Math.max(0, ...BUBBLES.map((b) => b.rise - b.y + b.size));

/** Outline, one row of track, outline. */
export const BAR_HEIGHT = 3;
/** Blank rows between the lowest the animal ever sits and the bar. */
export const BAR_GAP = 2;
/** First row of the bar, measured in the same units as the sprite. */
export const BAR_TOP = VIEW_HEIGHT + BAR_GAP;
/** Inner width of the bar, and therefore how many positions it can show. */
export const BAR_STEPS = SPRITE_WIDTH - 2;
/** Total the bar adds under the sprite when it is on. */
export const BAR_ROOM = BAR_GAP + BAR_HEIGHT;

export interface RectSpec {
  x: number;
  y: number;
  width: number;
  height: number;
  fill: string;
}

/**
 * The determinate bar: a pixel frame with one row of track inside it.
 *
 * Primer asks for a determinate indicator once a wait passes three seconds.
 * The fill lands on whole pixels like everything else here — 28 positions, so
 * it advances in visible steps instead of creeping a subpixel at a time.
 *
 * It is three tones for the same reason the face is. Draw the track in the
 * ink and the whole bar is one block; draw the fill in the ink too and the
 * only thing that carries the number disappears. So the frame is
 * `currentColor`, the track is paper and the fill is pupil — the fill stays
 * darker than the track whichever way round the page is.
 */
export function progressBar(progress: number, palette: Palette): RectSpec[] {
  const clamped = Math.min(1, Math.max(0, Number.isFinite(progress) ? progress : 0));
  const filled = Math.round(clamped * BAR_STEPS);

  const rects: RectSpec[] = [
    { x: 0, y: BAR_TOP, width: SPRITE_WIDTH, height: BAR_HEIGHT, fill: palette.o ?? 'currentColor' },
    { x: 1, y: BAR_TOP + 1, width: BAR_STEPS, height: 1, fill: palette.T ?? 'transparent' },
  ];
  if (filled > 0) {
    rects.push({
      x: 1,
      y: BAR_TOP + 1,
      width: filled,
      height: 1,
      fill: palette.F ?? palette.o ?? 'currentColor',
    });
  }
  return rects;
}

/** Consecutive equal values, as `[value, firstIndex, lastIndex]`. */
function runs(values: readonly number[]): [number, number, number][] {
  const out: [number, number, number][] = [];
  for (let i = 0; i < values.length; i++) {
    const last = out[out.length - 1];
    if (last && last[0] === values[i]) last[2] = i;
    else out.push([values[i], i, i]);
  }
  return out;
}

/**
 * The stylesheet, and the reason the animation is built the way it is.
 *
 * The frames sit side by side in one long strip and the strip slides under the
 * viewBox, one frame width at a time. The obvious alternative — stacking the
 * frames and cross-fading their opacity — needs one animation per frame per
 * expression, which on a page with several loaders runs into the hundreds and
 * shows up as dropped frames. This is five animations regardless of how many
 * drawings there are, and `steps()` means a frame is never half-swapped.
 *
 * The blink and the glance each run on a period sharing no factor with the
 * swim, so the loop never resolves into a pattern you can watch repeat.
 */
export function animationCss(
  frameCount = FRAMES.length,
  lift: readonly number[] = FRAME_LIFT,
  width = SPRITE_WIDTH,
): string {
  const e = 0.01;
  const pct = (i: number) => (i * 100) / frameCount;

  const bob = runs(lift)
    .map(([value, first, last]) => {
      const a = pct(first);
      const b = pct(last + 1);
      const to = b >= 100 ? '100%' : `${(b - e).toFixed(2)}%`;
      return `${a}%,${to}{transform:translateY(${value}px)}`;
    })
    .join('');

  return [
    // Slide the strip. One animation, and steps() guarantees whole frames.
    `.octo-strip{animation:octo-strip var(--octo-swim,.9s) steps(${frameCount}) infinite}`,
    `@keyframes octo-strip{from{transform:translateX(0)}to{transform:translateX(-${frameCount * width}px)}}`,

    // Ride the body up and down over the same clock. Paired stops on both sides
    // of every boundary mean the height never interpolates between two frames.
    `.octo-bob{transform:translateY(${lift[0]}px);animation:octo-bob var(--octo-swim,.9s) linear infinite}`,
    `@keyframes octo-bob{${bob}}`,

    // The eyes sit outside the strip: the viewBox never moves, so one overlay
    // covers whichever frame is showing.
    `.octo-lid{opacity:0;animation:octo-lid var(--octo-blink,4.6s) linear infinite}`,
    `@keyframes octo-lid{0%,95.49%{opacity:0}95.5%,97.99%{opacity:1}98%,100%{opacity:0}}`,

    `.octo-look{opacity:0;animation-duration:var(--octo-glance,7.3s);animation-timing-function:linear;animation-iteration-count:infinite}`,
    `.octo-look-left{animation-name:octo-look-left}`,
    `.octo-look-right{animation-name:octo-look-right}`,
    `@keyframes octo-look-left{0%,20.99%{opacity:0}21%,33.99%{opacity:1}34%,100%{opacity:0}}`,
    `@keyframes octo-look-right{0%,57.99%{opacity:0}58%,70.99%{opacity:1}71%,100%{opacity:0}}`,

    // One rule per bubble, because steps() needs a literal count and each one
    // rises a different distance. from/to only, so every step is exactly one
    // pixel and nothing ever lands between two of them.
    `.octo-bubble{opacity:0}`,
    bubbleCss(),

    `@keyframes octo-rest{0%,100%{opacity:1}50%{opacity:.45}}`,
    `@media (prefers-reduced-motion:reduce){`,
    `.octo-strip,.octo-bob,.octo-lid,.octo-look,.octo-bubble{animation:none}`,
    `.octo-bubble{opacity:0}`,
    `.octo-body{animation:octo-rest 1.8s ease-in-out infinite}`,
    `}`,
  ].join('\n');
}

function bubbleCss(bubbles: readonly Bubble[] = BUBBLES): string {
  return bubbles
    .map(
      (b, i) =>
        `.octo-bubble-${i}{animation:octo-bubble-${i} calc(${b.period}s / var(--octo-rate,1))`
        + ` steps(${b.rise}) calc(${b.delay}s / var(--octo-rate,1)) infinite}`
        + `@keyframes octo-bubble-${i}{from{opacity:.85;transform:translateY(0)}`
        + `to{opacity:0;transform:translateY(-${b.rise}px)}}`,
    )
    .join('');
}

/** Ready-made stylesheet for the default cycle. */
export const CSS = animationCss();
