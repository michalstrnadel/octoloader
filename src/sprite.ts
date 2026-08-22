/**
 * The octopus, one character per pixel.
 *
 * Edit these strings by hand — that is the point. The renderer turns runs of
 * the same character into SVG path segments at import time, so there is no
 * build step between a change here and the pixels on screen.
 *
 *   '.' transparent   'o' outline    'b' body        'h' highlight
 *   'H' shine         's' shadow     'w' eye white   'c' iris
 *   'p' pupil         'g' sucker     'k' sparkle
 */

export type Grid = readonly string[];

/**
 * One swim cycle: five arm poses played out and back, with the inner arm a
 * step behind the outer one, so the two limbs read as a single travelling
 * wave rather than as two things waving.
 *
 * These are drawn, not interpolated. Interpolating between two poses a pixel
 * apart collapses on rounding — five steps become three drawings, two frames
 * hold still while the body keeps rising, and the loop twitches.
 */
export const FRAMES: readonly Grid[] = [
  [
    '...........oooooooo...........',
    '.........oobbbbbbbboo.........',
    '........obhHHhbbkbbbbo........',
    '.......obhHHhhbbbbbbbbo.......',
    '......obhhhhbbbbbbbbkbbo......',
    '.....obbbbbbbbbbbbbbbbbbo.....',
    '....obbbbwwwbbbbbbwwwbbbbo....',
    '....obbbwcccwbbbbwcccwbbbo....',
    '....obbwcHppcwbbwcHppcwbbo....',
    '....obbwcpppcwbbwcpppcwbbo....',
    '....obbwcpppcwbbwcpppcwbbo....',
    '....obbbwcccwbbbbwcccwbbbo....',
    '....obkbbwwwbbbbbbwwwbbbbo....',
    '.....obbbbbbbbbbbbbbbbbbo.....',
    '.....obbbbbbbbbbbbbbbbbbo.....',
    '.....obbbobbbboobbbbobbbo.....',
    '....obbbbobbbboobbbbobbbbo....',
    '....obbbbobbbboobbbbobbbbo....',
    '...obbbbobbbbo..obbbbobbbbo...',
    '...obbbbobbbbo..obbbbobbbbo...',
    '...obgbbobbgbo..obgbbobbgbo...',
    '....obbbobbbo....obbbobbbo....',
    '....obbo.ooo......ooo.obbo....',
    '.....oo................oo.....',
  ],
  [
    '...........oooooooo...........',
    '.........oobbbbbbbboo.........',
    '........obhHHhbbkbbbbo........',
    '.......obhHHhhbbbbbbbbo.......',
    '......obhhhhbbbbbbbbkbbo......',
    '.....obbbbbbbbbbbbbbbbbbo.....',
    '....obbbbwwwbbbbbbwwwbbbbo....',
    '....obbbwcccwbbbbwcccwbbbo....',
    '....obbwcHppcwbbwcHppcwbbo....',
    '....obbwcpppcwbbwcpppcwbbo....',
    '....obbwcpppcwbbwcpppcwbbo....',
    '....obbbwcccwbbbbwcccwbbbo....',
    '....obkbbwwwbbbbbbwwwbbbbo....',
    '.....obbbbbbbbbbbbbbbbbbo.....',
    '.....obbbbbbbbbbbbbbbbbbo.....',
    '.....obbbobbbboobbbbobbbo.....',
    '....obbbbobbbboobbbbobbbbo....',
    '...obbbboobbbboobbbboobbbbo...',
    '..ogbbbo.obbbboobbbbo.obbbgo..',
    '..obbbbo.obbbboobbbbo.obbbbo..',
    '..obbgbo.obgbo..obgbo.obgbbo..',
    '...obbbo.obbbo..obbbo.obbbo...',
    '...obbo...ooo....ooo...obbo...',
    '....oo..................oo....',
  ],
  [
    '...........oooooooo...........',
    '.........oobbbbbbbboo.........',
    '........obhHHhbbkbbbbo........',
    '.......obhHHhhbbbbbbbbo.......',
    '......obhhhhbbbbbbbbkbbo......',
    '.....obbbbbbbbbbbbbbbbbbo.....',
    '....obbbbwwwbbbbbbwwwbbbbo....',
    '....obbbwcccwbbbbwcccwbbbo....',
    '....obbwcHppcwbbwcHppcwbbo....',
    '....obbwcpppcwbbwcpppcwbbo....',
    '....obbwcpppcwbbwcpppcwbbo....',
    '....obbbwcccwbbbbwcccwbbbo....',
    '....obkbbwwwbbbbbbwwwbbbbo....',
    '.....obbbbbbbbbbbbbbbbbbo.....',
    '.....obbbbbbbbbbbbbbbbbbo.....',
    '.....obbbobbbboobbbbobbbo.....',
    '....obbboobbbboobbbboobbbo....',
    '...obbbboobbbboobbbboobbbbo...',
    '..ogbbboobbbbo..obbbboobbbgo..',
    '.obbbbo.obbbbo..obbbbo.obbbbo.',
    '.obbbgo.obbgbo..obgbbo.ogbbbo.',
    '..obbbo.obbbo....obbbo.obbbo..',
    '..obbo...ooo......ooo...obbo..',
    '...oo....................oo...',
  ],
  [
    '...........oooooooo...........',
    '.........oobbbbbbbboo.........',
    '........obhHHhbbkbbbbo........',
    '.......obhHHhhbbbbbbbbo.......',
    '......obhhhhbbbbbbbbkbbo......',
    '.....obbbbbbbbbbbbbbbbbbo.....',
    '....obbbbwwwbbbbbbwwwbbbbo....',
    '....obbbwcccwbbbbwcccwbbbo....',
    '....obbwcHppcwbbwcHppcwbbo....',
    '....obbwcpppcwbbwcpppcwbbo....',
    '....obbwcpppcwbbwcpppcwbbo....',
    '....obbbwcccwbbbbwcccwbbbo....',
    '....obkbbwwwbbbbbbwwwbbbbo....',
    '.....obbbbbbbbbbbbbbbbbbo.....',
    '.....obbbbbbbbbbbbbbbbbbo.....',
    '.....obbbobbbboobbbbobbbo.....',
    '...oobbboobbbboobbbboobbboo...',
    '..obbbboogbbbo..obbbgoobbbbo..',
    '.obgbbo.obbbbo..obbbbo.obbgbo.',
    '.obbbbo.obbbbo..obbbbo.obbbbo.',
    'obbbbo..obbgo....ogbbo..obbbbo',
    '.obbbo..obbbo....obbbo..obbbo.',
    '.obbo....ooo......ooo....obbo.',
    '..oo......................oo..',
  ],
  [
    '...........oooooooo...........',
    '.........oobbbbbbbboo.........',
    '........obhHHhbbkbbbbo........',
    '.......obhHHhhbbbbbbbbo.......',
    '......obhhhhbbbbbbbbkbbo......',
    '.....obbbbbbbbbbbbbbbbbbo.....',
    '....obbbbwwwbbbbbbwwwbbbbo....',
    '....obbbwcccwbbbbwcccwbbbo....',
    '....obbwcHppcwbbwcHppcwbbo....',
    '....obbwcpppcwbbwcpppcwbbo....',
    '....obbwcpppcwbbwcpppcwbbo....',
    '....obbbwcccwbbbbwcccwbbbo....',
    '....obkbbwwwbbbbbbwwwbbbbo....',
    '.....obbbbbbbbbbbbbbbbbbo.....',
    '.....obbbbbbbbbbbbbbbbbbo.....',
    '....oobbbobbbboobbbbobbboo....',
    '...obbbbobbbbo..obbbbobbbbo...',
    '..obbbboogbbbo..obbbgoobbbbo..',
    '.obgbboobbbbo....obbbboobbgbo.',
    'obbbbo.obbbbo....obbbbo.obbbbo',
    'obbbbo.obbbgo....ogbbbo.obbbbo',
    'obbbo..obbbo......obbbo..obbbo',
    'obbo....ooo........ooo....obbo',
    '.oo........................oo.',
  ],
  [
    '...........oooooooo...........',
    '.........oobbbbbbbboo.........',
    '........obhHHhbbkbbbbo........',
    '.......obhHHhhbbbbbbbbo.......',
    '......obhhhhbbbbbbbbkbbo......',
    '.....obbbbbbbbbbbbbbbbbbo.....',
    '....obbbbwwwbbbbbbwwwbbbbo....',
    '....obbbwcccwbbbbwcccwbbbo....',
    '....obbwcHppcwbbwcHppcwbbo....',
    '....obbwcpppcwbbwcpppcwbbo....',
    '....obbwcpppcwbbwcpppcwbbo....',
    '....obbbwcccwbbbbwcccwbbbo....',
    '....obkbbwwwbbbbbbwwwbbbbo....',
    '.....obbbbbbbbbbbbbbbbbbo.....',
    '.....obbbbbbbbbbbbbbbbbbo.....',
    '.....obbbobbbboobbbbobbbo.....',
    '...oobbbobbbbo..obbbbobbboo...',
    '..obbbbobgbbo....obbgbobbbbo..',
    '.obgbboobbbbo....obbbboobbgbo.',
    '.obbbboobbbbo....obbbboobbbbo.',
    'obbbbo.obbbo......obbbo.obbbbo',
    '.obbbo.obbbo......obbbo.obbbo.',
    '.obbo...ooo........ooo...obbo.',
    '..oo......................oo..',
  ],
  [
    '...........oooooooo...........',
    '.........oobbbbbbbboo.........',
    '........obhHHhbbkbbbbo........',
    '.......obhHHhhbbbbbbbbo.......',
    '......obhhhhbbbbbbbbkbbo......',
    '.....obbbbbbbbbbbbbbbbbbo.....',
    '....obbbbwwwbbbbbbwwwbbbbo....',
    '....obbbwcccwbbbbwcccwbbbo....',
    '....obbwcHppcwbbwcHppcwbbo....',
    '....obbwcpppcwbbwcpppcwbbo....',
    '....obbwcpppcwbbwcpppcwbbo....',
    '....obbbwcccwbbbbwcccwbbbo....',
    '....obkbbwwwbbbbbbwwwbbbbo....',
    '.....obbbbbbbbbbbbbbbbbbo.....',
    '.....obbbbbbbbbbbbbbbbbbo.....',
    '.....obbbobbbboobbbbobbbo.....',
    '....obbbobbbbo..obbbbobbbo....',
    '...obbbbogbbbo..obbbgobbbbo...',
    '..ogbbbobbbbo....obbbbobbbgo..',
    '.obbbboobbbbo....obbbboobbbbo.',
    '.obbbgoobbbgo....ogbbboogbbbo.',
    '..obbboobbbo......obbboobbbo..',
    '..obbo..ooo........ooo..obbo..',
    '...oo....................oo...',
  ],
  [
    '...........oooooooo...........',
    '.........oobbbbbbbboo.........',
    '........obhHHhbbkbbbbo........',
    '.......obhHHhhbbbbbbbbo.......',
    '......obhhhhbbbbbbbbkbbo......',
    '.....obbbbbbbbbbbbbbbbbbo.....',
    '....obbbbwwwbbbbbbwwwbbbbo....',
    '....obbbwcccwbbbbwcccwbbbo....',
    '....obbwcHppcwbbwcHppcwbbo....',
    '....obbwcpppcwbbwcpppcwbbo....',
    '....obbwcpppcwbbwcpppcwbbo....',
    '....obbbwcccwbbbbwcccwbbbo....',
    '....obkbbwwwbbbbbbwwwbbbbo....',
    '.....obbbbbbbbbbbbbbbbbbo.....',
    '.....obbbbbbbbbbbbbbbbbbo.....',
    '.....obbbobbbboobbbbobbbo.....',
    '....obbbbobbbboobbbbobbbbo....',
    '...obbbbogbbbo..obbbgobbbbo...',
    '..ogbbboobbbbo..obbbboobbbgo..',
    '..obbbboobbbbo..obbbboobbbbo..',
    '..obbgboobbgo....ogbboobgbbo..',
    '...obbboobbbo....obbboobbbo...',
    '...obbo..ooo......ooo..obbo...',
    '....oo..................oo....',
  ],
];

/**
 * Which arm pose each frame draws. Five poses played out and back — the inner
 * arm runs a step behind, so no two frames are the same picture even where the
 * outer arm repeats.
 */
export const FRAME_POSE: readonly number[] = [0, 1, 2, 3, 4, 3, 2, 1];

/**
 * How far each frame sits below the top of the box, in sprite pixels.
 *
 * Height belongs to the pose, not to the frame index: a pose has to sit at the
 * same height on the way out and the way back, or the loop stutters while every
 * frame is individually correct. Tucked is high — the animal jets on the
 * contraction and sinks again as its arms spread.
 */
export const FRAME_LIFT: readonly number[] = [0, 0, 1, 1, 2, 1, 1, 0];

/** Eyes shut. Only the eye band differs from a swim frame. */
export const FRAME_BLINK: Grid = [
  '...........oooooooo...........',
  '.........oobbbbbbbboo.........',
  '........obhHHhbbkbbbbo........',
  '.......obhHHhhbbbbbbbbo.......',
  '......obhhhhbbbbbbbbkbbo......',
  '.....obbbbbbbbbbbbbbbbbbo.....',
  '....obbbbwwwbbbbbbwwwbbbbo....',
  '....obbbwwwwwbbbbwwwwwbbbo....',
  '....obbwwwwwwwbbwwwwwwwbbo....',
  '....obbwooooowbbwooooowbbo....',
  '....obbwwwwwwwbbwwwwwwwbbo....',
  '....obbbwwwwwbbbbwwwwwbbbo....',
  '....obkbbwwwbbbbbbwwwbbbbo....',
  '.....obbbbbbbbbbbbbbbbbbo.....',
  '.....obbbbbbbbbbbbbbbbbbo.....',
  '.....obbbobbbboobbbbobbbo.....',
  '....obbbbobbbboobbbbobbbbo....',
  '....obbbbobbbboobbbbobbbbo....',
  '...obbbbobbbbo..obbbbobbbbo...',
  '...obbbbobbbbo..obbbbobbbbo...',
  '...obgbbobbgbo..obgbbobbgbo...',
  '....obbbobbbo....obbbobbbo....',
  '....obbo.ooo......ooo.obbo....',
  '.....oo................oo.....',
];

/** Pupils one pixel left, and one pixel right. */
export const FRAME_LOOK_LEFT: Grid = [
  '...........oooooooo...........',
  '.........oobbbbbbbboo.........',
  '........obhHHhbbkbbbbo........',
  '.......obhHHhhbbbbbbbbo.......',
  '......obhhhhbbbbbbbbkbbo......',
  '.....obbbbbbbbbbbbbbbbbbo.....',
  '....obbbbwwwbbbbbbwwwbbbbo....',
  '....obbbwcccwbbbbwcccwbbbo....',
  '....obbwHppccwbbwHppccwbbo....',
  '....obbwpppccwbbwpppccwbbo....',
  '....obbwpppccwbbwpppccwbbo....',
  '....obbbwcccwbbbbwcccwbbbo....',
  '....obkbbwwwbbbbbbwwwbbbbo....',
  '.....obbbbbbbbbbbbbbbbbbo.....',
  '.....obbbbbbbbbbbbbbbbbbo.....',
  '.....obbbobbbboobbbbobbbo.....',
  '....obbbbobbbboobbbbobbbbo....',
  '....obbbbobbbboobbbbobbbbo....',
  '...obbbbobbbbo..obbbbobbbbo...',
  '...obbbbobbbbo..obbbbobbbbo...',
  '...obgbbobbgbo..obgbbobbgbo...',
  '....obbbobbbo....obbbobbbo....',
  '....obbo.ooo......ooo.obbo....',
  '.....oo................oo.....',
];
export const FRAME_LOOK_RIGHT: Grid = [
  '...........oooooooo...........',
  '.........oobbbbbbbboo.........',
  '........obhHHhbbkbbbbo........',
  '.......obhHHhhbbbbbbbbo.......',
  '......obhhhhbbbbbbbbkbbo......',
  '.....obbbbbbbbbbbbbbbbbbo.....',
  '....obbbbwwwbbbbbbwwwbbbbo....',
  '....obbbwcccwbbbbwcccwbbbo....',
  '....obbwccHppwbbwccHppwbbo....',
  '....obbwccpppwbbwccpppwbbo....',
  '....obbwccpppwbbwccpppwbbo....',
  '....obbbwcccwbbbbwcccwbbbo....',
  '....obkbbwwwbbbbbbwwwbbbbo....',
  '.....obbbbbbbbbbbbbbbbbbo.....',
  '.....obbbbbbbbbbbbbbbbbbo.....',
  '.....obbbobbbboobbbbobbbo.....',
  '....obbbbobbbboobbbbobbbbo....',
  '....obbbbobbbboobbbbobbbbo....',
  '...obbbbobbbbo..obbbbobbbbo...',
  '...obbbbobbbbo..obbbbobbbbo...',
  '...obgbbobbgbo..obgbbobbgbo...',
  '....obbbobbbo....obbbobbbo....',
  '....obbo.ooo......ooo.obbo....',
  '.....oo................oo.....',
];

export const SPRITE_WIDTH = 30;
export const SPRITE_HEIGHT = 24;

/**
 * Bubbles drift up past the animal's left side, from about mouth height.
 *
 * They are geometry rather than sprite characters, because they leave the box
 * the octopus is drawn in — but they stay on the pixel grid: whole units,
 * whole-pixel steps, so nothing lands between pixels.
 */
export interface Bubble {
  /** Column of the bubble's left edge. */
  x: number;
  /** Row it starts on, before it begins to rise. */
  y: number;
  /** Width and height, in sprite pixels. */
  size: number;
  /** How far it travels before it is gone. */
  rise: number;
  /** Seconds for one trip. */
  period: number;
  /** Seconds before its first trip, so the three never rise together. */
  delay: number;
}

export const BUBBLES: readonly Bubble[] = [
  { x: 2, y: 9, size: 2, rise: 14, period: 3.2, delay: 0 },
  { x: 0, y: 6, size: 1, rise: 11, period: 2.6, delay: 1.1 },
  { x: 3, y: 11, size: 1, rise: 16, period: 3.8, delay: 2.0 },
];

export type Palette = Readonly<Record<string, string | null>>;

/** The character as drawn: purple, gold suckers, cyan eyes. */
export const COLOR_PALETTE: Palette = {
  '.': null,
  o: '#241f3d',
  b: '#b27ed6',
  h: '#d3a9ec',
  H: '#f0e0fb',
  s: '#8a5bb0',
  w: '#ffffff',
  c: '#4cc9f0',
  p: '#101828',
  g: '#ffd166',
  k: '#ff9ed2',
  /** Not sprite characters — the bubbles (B) and the progress bar (T, F). */
  B: '#4cc9f0',
  T: '#e3d7f0',
  F: '#4cc9f0',
};

/**
 * Three tones, not two, and that is the whole trick.
 *
 * The obvious monochrome is one ink with the eyes punched out. It looks right
 * on a white page and turns into a skull on a black one: the body goes light,
 * the punched eyes go dark, and you are looking at sockets. Holding the eye
 * lighter than the body and the pupil darker than the eye keeps the face
 * reading the same way on either ground, so one sprite covers both.
 *
 * Only the body follows `currentColor`. The suckers are paper too — those
 * light dots are what stop the arms reading as a solid lump at 30px wide.
 */
export const MONO_PALETTE: Palette = {
  '.': null,
  o: 'currentColor',
  b: 'currentColor',
  h: 'currentColor',
  H: 'currentColor',
  s: 'currentColor',
  k: 'currentColor',
  w: 'var(--octo-paper, #f6f8fa)',
  c: 'var(--octo-paper, #f6f8fa)',
  g: 'var(--octo-paper, #f6f8fa)',
  p: 'var(--octo-pupil, #1b1f24)',
  B: 'currentColor',
  /** The bar is three tones for the same reason the face is. */
  T: 'var(--octo-paper, #f6f8fa)',
  F: 'var(--octo-pupil, #1b1f24)',
};
