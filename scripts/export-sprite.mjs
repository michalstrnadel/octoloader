/**
 * Hand the sprite and the bar geometry to the Python renderer.
 *
 * It reads from `dist`, not from `src`, so the pictures in the README are
 * generated from the same build the package ships. Run `npm run build` first;
 * `npm run docs` does.
 */
import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

import {
  BUBBLES,
  COLOR_PALETTE,
  FRAMES,
  FRAME_BLINK,
  FRAME_LIFT,
  FRAME_LOOK_LEFT,
  FRAME_LOOK_RIGHT,
  MONO_PALETTE,
  SPRITE_HEIGHT,
  SPRITE_WIDTH,
} from '../dist/sprite.js';
import { BAR_ROOM, BAR_STEPS, BUBBLE_HEADROOM, VIEW_HEIGHT, progressBar } from '../dist/index.js';

// Ask the renderer where the bar sits rather than restating it here — one
// definition, so a change to the geometry reaches the pictures too.
const [frame, track] = progressBar(0, {});

const out = join(dirname(fileURLToPath(import.meta.url)), 'sprite.json');
writeFileSync(
  out,
  JSON.stringify(
    {
      FRAMES,
      FRAME_BLINK,
      FRAME_LOOK_LEFT,
      FRAME_LOOK_RIGHT,
      FRAME_LIFT,
      BUBBLES,
      COLOR_PALETTE,
      MONO_PALETTE,
      SPRITE_WIDTH,
      SPRITE_HEIGHT,
      VIEW_HEIGHT,
      BUBBLE_HEADROOM,
      BAR_ROOM,
      BAR_STEPS,
      BAR_TOP: frame.y,
      BAR_HEIGHT: frame.height,
      BAR_TRACK_Y: track.y,
    },
    null,
    1,
  ),
);
console.log(`wrote ${out}`);
