# Contributing

Small package, short rules.

```sh
npm install
npm test          # vitest, happy-dom
npm run typecheck
npm run build     # tsup, ESM + .d.ts
npx serve .       # then open /demo/
```

`demo/index.html` imports `dist/element.js` as a module, so it needs a server —
browsers refuse module imports over `file://`. Run `npm run build` first.

## Changing the drawing

`src/sprite.ts` is the octopus, one character per pixel. Edit the strings by
hand; that is the point of the format. There is no build step between a change
there and the pixels on screen.

The tests guard the drawing as much as the code, so a change that breaks the
silhouette fails CI rather than shipping:

- every frame is a full rectangle of the declared size
- only characters both palettes know
- no background pixel sealed inside the outline — the stray hole that is
  invisible at 12× and reads as dirt at 1×
- no frame repeats inside a cycle
- the arms sweep out and back rather than looping one way
- a pose keeps its height wherever it appears in the cycle
- the monochrome palette resolves to exactly three tones

That last one is the one to read before touching `MONO_PALETTE`. One ink with
the eyes punched out looks correct on white and turns into a skull on black.

Render before you judge. A frame that reads fine as text can read as a blob at
30 pixels wide — open the demo at `size="30"` as well as `size="120"`.

## Changing the animation

The frames sit side by side in one strip and the strip slides under the viewBox
with `steps()`. Do not replace this with stacked frames and cross-faded
opacity: that costs one animation per frame per expression, and a page with
several loaders drops frames. A test asserts the animation count does not grow
with the frame count.

Two more traps, both pinned by tests, both of which look like a twitch rather
than a bug:

- Interpolating between poses collapses on rounding. Draw them.
- Lift belongs to the pose, not the frame index.

## Pull requests

- Conventional Commits: `feat:`, `fix:`, `refactor:`, `docs:`, `test:`,
  `chore:`, `perf:`, `ci:`, `build:`, `style:`.
- One behaviour change per pull request.
- A bug fix comes with the test that would have caught it.
- Anything user-visible gets a line in `CHANGELOG.md` under `## Unreleased`.
- `npm test && npm run typecheck && npm run build` has to pass. CI runs the
  same three on Node 18, 20 and 22.

## Releasing

Maintainers only.

```sh
npm version <patch|minor|major>   # prepublishOnly reruns typecheck, tests, build
npm publish                       # publishConfig sets access and provenance
git push --follow-tags
```

Move the `## Unreleased` block in `CHANGELOG.md` under the new number first.
