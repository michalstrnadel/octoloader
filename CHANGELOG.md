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

### The package

- React component and a framework-free `<octo-loader>` custom element. No
  runtime dependencies; React is an optional peer.
- 4.6 kB gzipped for the React entry, types included.
- `toPaths`, `stripPaths`, `diff`, `progressBar` and the layout constants are
  exported, for anyone who wants the sprite without the component.
- 77 tests that guard the drawing as much as the code: no frame may repeat in a
  cycle, the arms must sweep out and back, a pose keeps its height, the
  silhouette seals no background pixel, and both palettes hold their tones
  apart.
