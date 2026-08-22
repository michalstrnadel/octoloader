# Changelog

Notable changes, newest first. This project follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and
[Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## Unreleased

### Added

- `delay` prop and attribute. The loader renders nothing until it elapses, so a
  request that comes back in 200ms never flashes an indicator. Primer's rule is
  that a wait under a second should show no loading state at all.
- `progress` prop and attribute, `0`–`1`. Turns the loader determinate and
  draws a 28-pixel bar under the animal, with `role="progressbar"` and
  `aria-valuenow/min/max` on the wrapper. Primer asks for a determinate
  indicator once a wait passes three seconds.
- `T` and `F` in both palettes — the progress track and fill. The bar is three
  tones for the same reason the face is: collapse any two and it stops carrying
  the number.
- `progressBar`, `BAR_ROOM`, `BAR_STEPS`, `BAR_TOP`, `BAR_HEIGHT`, `BAR_GAP`
  exported from the renderer.
- Repository scaffolding: CI on Node 18/20/22, issue and pull request
  templates, a contributing guide, a code of conduct and a label set.

### Changed

- **Breaking.** `announce` no longer defaults to `'Loading'`. The accessible
  name now comes from the visible label via `aria-labelledby`, which is what
  Primer prefers and what keeps the two from drifting apart. `announce` still
  overrides it, and a loader with no visible label still announces "Loading".
- **Breaking.** Default `size` is 60, not 56. The sprite is 30 pixels wide, so
  56 rendered uneven pixel widths — a leftover from when it was 28.
- README documents the four wait-time windows and what to reach for in each.

## 0.1.0

First cut.

- Five hand-drawn 30×24 arm poses played as an eight-frame swim, with the body
  lifting as the arms draw in.
- Blink, glance and three bubbles, each on a period sharing no factor with the
  others.
- Colour and monochrome variants. Monochrome is three tones, not two, so the
  face does not read as a skull on a dark ground.
- React component, `<octo-loader>` custom element, `prefers-reduced-motion`
  support, no runtime dependencies.
