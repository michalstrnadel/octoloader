import { expect, test } from '@playwright/test';

const LOADER = 'octo-loader[variant="color"]';

test.beforeEach(async ({ page }) => {
  await page.goto('/demo/');
  await page.waitForFunction(() => !!customElements.get('octo-loader'));
});

test('the element upgrades and draws itself', async ({ page }) => {
  const shape = await page
    .locator(LOADER)
    .first()
    .evaluate((el) => ({
      hasShadow: !!el.shadowRoot,
      paths: el.shadowRoot?.querySelectorAll('path').length ?? 0,
      role: el.getAttribute('role'),
      name: el.getAttribute('aria-label'),
    }));

  expect(shape.hasShadow).toBe(true);
  expect(shape.paths).toBeGreaterThan(4);
  expect(shape.role).toBe('status');
  expect(shape.name).toBeTruthy();
});

test('every clock is actually running', async ({ page }) => {
  // getAnimations reports what the engine has accepted, not what the text said.
  const running = await page
    .locator(LOADER)
    .first()
    .evaluate((el) => {
      const found: Record<string, string> = {};
      for (const sel of ['.octo-strip', '.octo-bob', '.octo-lid', '.octo-bubble-0']) {
        const node = el.shadowRoot!.querySelector(sel)!;
        const [animation] = node.getAnimations();
        found[sel] = animation ? animation.playState : 'none';
      }
      return found;
    });

  expect(running).toEqual({
    '.octo-strip': 'running',
    '.octo-bob': 'running',
    '.octo-lid': 'running',
    '.octo-bubble-0': 'running',
  });
});

test('the strip really moves, one whole frame at a time', async ({ page }) => {
  const strip = page.locator(LOADER).first();

  // Sample the same animation at two points on its own timeline rather than
  // waiting on wall-clock, so a slow runner cannot make this flake.
  const offsets = await strip.evaluate((el) => {
    const node = el.shadowRoot!.querySelector('.octo-strip')!;
    const [animation] = node.getAnimations();
    const read = (t: number) => {
      animation.currentTime = t;
      const m = new DOMMatrix(getComputedStyle(node).transform);
      return m.m41;
    };
    return [0, 150, 300, 450, 600, 750].map(read);
  });

  // steps() means whole sprite widths and nothing between them. Compared on
  // the absolute value because -120 % 30 is -0 in JavaScript, and Object.is
  // says -0 is not 0 — which fails a test the code passes.
  for (const x of offsets) expect(Math.abs(x) % 30).toBe(0);
  expect(new Set(offsets).size).toBeGreaterThan(2);
});

test('speed scales the clock', async ({ page }) => {
  const durations = await page.evaluate(() => {
    const read = (el: Element) =>
      el.shadowRoot!.querySelector('.octo-strip')!.getAnimations()[0].effect!.getTiming()
        .duration as number;
    const slow = document.querySelector('octo-loader[speed="0.5"]')!;
    const fast = document.querySelector('octo-loader[speed="2"]')!;
    return { slow: read(slow), fast: read(fast) };
  });

  expect(durations.slow).toBeCloseTo(1800, 0);
  expect(durations.fast).toBeCloseTo(450, 0);
});

test('the panel resolves its tokens, and an override reaches it', async ({ page }) => {
  const panel = page.locator('octo-loader[panel]').first();

  const base = await panel.evaluate((el) => {
    const s = getComputedStyle(el);
    return { radius: s.borderRadius, border: s.borderTopWidth, minHeight: s.minHeight };
  });
  expect(base.radius).toBe('8px');
  expect(base.border).toBe('1px');
  expect(base.minHeight).toBe('208px');

  const overridden = await panel.evaluate((el) => {
    (el as HTMLElement).style.setProperty('--octo-panel-radius', '2px');
    return getComputedStyle(el).borderRadius;
  });
  expect(overridden).toBe('2px');
});

test.describe('with motion turned down', () => {
  // emulateMedia rather than a describe-level `test.use`: that one does not
  // reach a page the outer beforeEach already navigated, and the test then
  // quietly asserts against a page with motion still on.
  test.beforeEach(async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.reload();
    await page.waitForFunction(() => !!customElements.get('octo-loader'));
    await expect
      .poll(() => page.evaluate(() => matchMedia('(prefers-reduced-motion: reduce)').matches))
      .toBe(true);
  });

  test('the swim stops but the animal does not freeze', async ({ page }) => {
    const state = await page
      .locator(LOADER)
      .first()
      .evaluate((el) => ({
        strip: el.shadowRoot!.querySelector('.octo-strip')!.getAnimations().length,
        bubble: el.shadowRoot!.querySelector('.octo-bubble-0')!.getAnimations().length,
        // Primer asks for the indicator to stay subtly alive: a frozen one is
        // indistinguishable from a hung one.
        body: el.shadowRoot!.querySelector('.octo-body')!.getAnimations()[0]?.playState,
      }));

    expect(state.strip).toBe(0);
    expect(state.bubble).toBe(0);
    expect(state.body).toBe('running');
  });
});
