import { defineConfig, devices } from '@playwright/test';

/**
 * The one thing vitest cannot answer: does the stylesheet actually animate?
 *
 * happy-dom parses CSS as text. A keyframe percentage out of order, a bad
 * `steps()`, a custom property that never resolves — all of it survives the
 * unit tests intact and shows up as a still octopus in a browser. These run
 * against a real engine and ask the browser what it is doing.
 *
 * Deliberately no screenshots. Baselines rendered on macOS do not match the
 * ones a Linux runner produces, and chasing that costs more than it catches
 * when the drawing is already pinned character by character in the snapshot
 * tests.
 */
export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? 'github' : 'list',
  use: {
    baseURL: 'http://127.0.0.1:4173',
    trace: 'on-first-retry',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: {
    // The demo imports dist/element.js as a module, so it needs an origin.
    command: 'npx serve --no-clipboard --listen 4173 .',
    url: 'http://127.0.0.1:4173/demo/',
    reuseExistingServer: !process.env.CI,
    timeout: 60_000,
  },
});
