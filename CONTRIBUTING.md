# Contributing

Small package, short rules.

Building it needs Node 20 or newer — vitest reaches for `node:util`'s
`styleText`. Using it needs nothing of the sort: the published output is
browser ESM and touches no Node API.

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

Then regenerate the pictures in the README:

```sh
npm run docs      # needs Python 3 and Pillow: pip install pillow
```

`scripts/render-docs.py` evaluates every clock exactly the way the stylesheet
does and draws straight from `dist`, so the GIFs cannot drift from the
component. Commit whatever it changes under `docs/` — a README showing last
month's octopus is worse than one showing none.

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
  same three on Node 20, 22 and 24.

## Releasing

Maintainers only. Nothing publishes from a laptop — push a tag and
`.github/workflows/release.yml` does it, authenticating to npm with a
short-lived OIDC token instead of a stored secret. That is also what earns the
provenance badge: npm can attest which commit and which workflow run built the
tarball.

```sh
# 1. Move the changes under the new number in CHANGELOG.md
# 2. Bump, tag and push
npm version <patch|minor|major>
git push --follow-tags
```

The workflow refuses to publish if the tag and `package.json` disagree — a
mismatch ships the wrong number under the right name, and npm will not let you
take it back.
