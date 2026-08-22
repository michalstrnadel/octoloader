/**
 * The machine-readable description of `<octo-loader>`.
 *
 * IDEs read `custom-elements.json` to offer completion and hover docs inside
 * plain HTML, and documentation tools read it to generate an API table. It is
 * generated from the class and its JSDoc rather than written, so it cannot
 * drift — `npm run cem` regenerates it and CI fails if the committed copy is
 * out of date.
 */
export default {
  globs: ['src/element.ts'],
  outdir: '.',
  litelement: false,
  dependencies: false,
};
