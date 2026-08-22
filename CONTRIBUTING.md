# Contributing

Small package, short rules.

Building it needs Node 20 or newer — vitest reaches for `node:util`'s
`styleText`. Using it needs nothing of the sort: the published output is
browser ESM and touches no Node API.

```sh
npm install
npm test           # vitest, happy-dom, @testing-library/react
npm run test:e2e   # playwright, a real browser
npm run lint       # eslint, type-aware
npm run format     # prettier
npm run typecheck
npm run build      # tsup, ESM + .d.ts
npm run cem        # regenerate custom-elements.json (fetched by npx, not installed)
npx serve .        # then open /demo/
```

CI runs `lint`, `format:check`, `typecheck`, `test`, `build` and the manifest
check on Node 20, 22 and 24, plus the browser suite once on Chromium. Running
the same locally is the whole pre-flight.

**After adding or updating a dependency, run `npm run lock`, then check it
installs on Linux too:**

```sh
npm run lock
npm ci --dry-run --os=linux --cpu=x64
```

A plain `npm install` on macOS writes a lockfile that omits the transitive
dependencies of optional binaries it cannot install, and `npm ci` on the runner
then refuses it with `Missing: … from lock file`. `npm run lock` re-resolves
with `--os=linux`, which usually produces a lockfile both platforms accept.

Usually. The custom-elements analyzer defeated it outright — its resolver ships
a wasm fallback whose floating peer dependencies never landed in the lock at
all — so it is fetched by `npx` at a pinned version rather than installed. That
is why `cem` looks different from every other script here, and it took about
eighty packages out of the tree on the way.

## Three layers of test, and what each is for

- **Unit** (`npm test`) — the drawing, the geometry, the two entry points. Fast,
  runs on every save.
- **Snapshot** (`src/snapshot.test.ts`) — the sprite as characters, the path
  data, the stylesheet. These exist for the diff: a pull request that moves an
  eye shows the eye moving, in the review, with no screenshot to fetch. Run
  `npx vitest -u` to accept a deliberate change, and _look_ at what it accepted.
- **Browser** (`npm run test:e2e`) — the one question the others cannot answer:
  did the engine accept the stylesheet? happy-dom parses CSS as text, so a bad
  keyframe or an unresolvable custom property passes every unit test and ships
  a still octopus. These ask the browser what it is actually animating.

Deliberately no screenshot comparison. Baselines rendered on macOS do not match
a Linux runner's, and the drawing is already pinned character by character.

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
