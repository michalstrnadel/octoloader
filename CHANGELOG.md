# Changelog

Notable changes, newest first. This project follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and
[Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## 0.1.0

First release.

### The character

- Five hand-drawn 30×24 arm poses played as an eight-frame swim, with the body
  lifting as the arms draw in. The poses are drawn rather than interpolated:
  tweening between two a pixel apart collapses on rounding, and the swim
  twitches.
- Blink, glance and three bubbles, each on a period sharing no factor with the
  others, so the loop never resolves into a pattern you can watch repeat.
- The frames sit side by side in one strip that slides under the viewBox with
  `steps()`. Stacking them and cross-fading opacity costs one animation per
  frame per expression, and a page with several loaders drops frames.
- Colour and monochrome variants. Monochrome is three tones, not two: one ink
  with the eyes punched out reads as a skull on a dark ground.

### Matching the wait

Behaviour follows [Primer's loading pattern][primer].

- `delay` — the loader renders nothing until it elapses, so a request that
  comes back in 200ms never flashes an indicator. Primer's rule is that a wait
  under a second should show no loading state at all.
- `progress`, `0`–`1` — turns the loader determinate and draws a 28-pixel bar
  under the animal, with `role="progressbar"` and `aria-valuenow/min/max` on
  the wrapper. Primer asks for a determinate indicator past three seconds.
- The accessible name comes from the visible label through `aria-labelledby`,
  which keeps the two from drifting apart. `announce` overrides it; a loader
  with no visible label announces "Loading".
- Under `prefers-reduced-motion` the clocks stop but the octopus keeps fading
  in place — a frozen indicator is indistinguishable from a hung one.

[primer]: https://primer.style/product/ui-patterns/loading/

### In a page

- `panel` — wraps the loader in a box: a hairline border, a radius, room to
  breathe. Off by default. It spans its container rather than hugging the
  octopus, because the panel's job is to outline the region the content will
  land in; a box drawn tight around the animal reads as a badge instead. It is
  the same shape an empty state uses, on purpose — the same slot in the page
  should not change size depending on which state it is in.
- `description` — a quieter second line under the label, which turns the label
  into the heading of the pair and wires itself up as `aria-describedby`. It
  gives the panel the title-and-description hierarchy an empty state has;
  without one the label stays a plain caption.
- Four variables define that panel end to end: `--octo-panel`,
  `--octo-panel-radius`, `--octo-panel-min-height` and `--octo-panel-padding`.
  The height is a floor rather than a fixed value, so a panel holding a 30px
  sprite keeps the presence of one holding a 120px sprite.

### Fitting into a codebase

- Forwards a `ref` to the wrapper and spreads through anything else a `div`
  takes — `id`, `data-*`, event handlers, `title`. The attributes the component
  owns (`role`, `aria-label`, `aria-labelledby`, the `aria-value*` trio) are
  removed from the prop type rather than silently overwritten, so reaching for
  one is a type error pointing at `announce`.
- One stylesheet per page rather than one per loader. It renders as a hoisted
  `<style>`, which React 19 lifts into `<head>` and de-duplicates; SVG styles
  were always document-global, so the copies were pure waste.
- Wrapped in `memo`, so a loader inside a component that re-renders often does
  not re-reconcile its SVG each time.

### Without a framework

- Every option is a property on `<octo-loader>` as well as an attribute, since
  half the frameworks that consume a custom element bind properties and never
  call `setAttribute`. Each accessor reads and writes the attribute, so there
  is one piece of state and it lives in the DOM.
- `HTMLElementTagNameMap` is augmented, so `document.querySelector('octo-loader')`
  is typed as `OctoLoaderElement`.

### The package

- React component and a framework-free `<octo-loader>` custom element. No
  runtime dependencies; React is an optional peer.
- 5.2 kB gzipped for the React entry, types included.
- `toPaths`, `stripPaths`, `diff`, `progressBar` and the layout constants are
  exported, for anyone who wants the sprite without the component.
- 108 unit tests and 6 browser tests that guard the drawing as much as the code: no frame may repeat in a
  cycle, the arms must sweep out and back, a pose keeps its height, the
  silhouette seals no background pixel, and both palettes hold their tones
  apart. The React entry is exercised in a real document as well as on the
  server, so the delay's timer and its cleanup are covered.
- ESLint with type-aware rules and Prettier, both enforced in CI across Node
  20, 22 and 24, plus a Chromium suite that asserts the engine actually accepted
  the stylesheet — happy-dom parses CSS as text, so a bad keyframe passes every
  unit test and ships a still octopus.
- Snapshot tests that render the sprite as characters, so a pull request that
  moves an eye shows the eye moving in the diff.
- `custom-elements.json`, generated from the class and its JSDoc and checked in
  CI, so IDEs can complete and document `<octo-loader>` inside plain HTML.
