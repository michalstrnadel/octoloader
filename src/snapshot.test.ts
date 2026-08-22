import { describe, expect, it } from 'vitest';

import {
  COLOR_PALETTE,
  FRAMES,
  FRAME_BLINK,
  FRAME_LIFT,
  FRAME_LOOK_LEFT,
  FRAME_LOOK_RIGHT,
  MONO_PALETTE,
  SPRITE_WIDTH,
  type Grid,
} from './sprite.js';
import { CSS, progressBar, stripPaths, toPaths } from './render.js';

/**
 * The drawing, pinned.
 *
 * Every other test asks a question about the sprite — is it sealed, do the arms
 * come back, do the tones hold apart. None of them notices a change that
 * happens to satisfy all of those and still ruins the animal's face.
 *
 * These do, and the point is the diff rather than the failure: the sprite is
 * snapshotted as the picture itself, so a pull request that moves an eye shows
 * the eye moving in the review, in characters, with no screenshot to fetch and
 * no browser to run. That is worth more here than a pixel comparison, which
 * would need a browser per platform and would still only tell you that
 * something changed.
 */

/** Two characters per pixel, so the sprite is roughly square in a diff. */
function picture(grid: Grid): string {
  const ink: Record<string, string> = {
    '.': '  ',
    o: '██',
    b: '▓▓',
    h: '▒▒',
    H: '░░',
    s: '▚▚',
    w: '⠿⠿',
    c: '◍◍',
    p: '●●',
    g: '··',
    k: '**',
  };
  return grid.map((row) => [...row].map((ch) => ink[ch] ?? '??').join('')).join('\n');
}

describe('the drawing, as drawn', () => {
  FRAMES.forEach((grid, i) => {
    it(`frame ${i + 1} of ${FRAMES.length}, lifted ${FRAME_LIFT[i]}px`, () => {
      expect(`\n${picture(grid)}\n`).toMatchSnapshot();
    });
  });

  it.each([
    ['blinking', FRAME_BLINK],
    ['looking left', FRAME_LOOK_LEFT],
    ['looking right', FRAME_LOOK_RIGHT],
  ])('%s', (_name, grid) => {
    expect(`\n${picture(grid)}\n`).toMatchSnapshot();
  });
});

describe('what ends up in the DOM', () => {
  it('emits the same path data for the colour strip', () => {
    expect(stripPaths(FRAMES, COLOR_PALETTE)).toMatchSnapshot();
  });

  it('emits the same path data for the monochrome strip', () => {
    expect(stripPaths(FRAMES, MONO_PALETTE)).toMatchSnapshot();
  });

  it('emits the same eye overlays', () => {
    expect(toPaths(FRAME_BLINK, COLOR_PALETTE)).toMatchSnapshot();
  });

  it('emits the same bar geometry', () => {
    expect([0, 0.5, 1].map((p) => progressBar(p, COLOR_PALETTE))).toMatchSnapshot();
  });

  /**
   * The timing is as much the product as the sprite. A stray edit to a keyframe
   * percentage is invisible in review and shows up as a limp on the page.
   */
  it('emits the same stylesheet', () => {
    expect(`\n${CSS}\n`).toMatchSnapshot();
  });

  it('draws every frame at the same width', () => {
    expect(FRAMES.every((g) => g.every((row) => row.length === SPRITE_WIDTH))).toBe(true);
  });
});
