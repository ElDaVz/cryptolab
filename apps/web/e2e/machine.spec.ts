import { test, expect } from '@playwright/test';
test('MI-01/02/05/06 real rendering, mapping isolation and desktop bounds', async ({ page }) => {
  for (const size of [
    { width: 1280, height: 720 },
    { width: 1920, height: 1080 },
  ]) {
    await page.setViewportSize(size);
    await page.goto('./');
    await page.getByRole('button', { name: 'Omitir introducción' }).click();
    await expect(page.getByText('Motor matemático listo')).toBeVisible();
    const canvas = page.locator('#machine canvas');
    await expect.poll(() => canvas.getAttribute('data-triangles')).toMatch(/^[1-9]\d*$/);
    await page.getByLabel('Algoritmo').selectOption('affine');
    await expect(page.getByTestId('mapping')).toHaveText('INSXCHMRWBGLQVAFKPUZEJOTYD');
    await page.getByLabel('Mensaje', { exact: true }).fill('ABA');
    await page.getByRole('button', { name: 'Ejecutar' }).click();
    await expect(page.getByTestId('output')).toHaveText('INI');
    await page.getByRole('button', { name: 'Siguiente carácter' }).click();
    await expect(page.getByTestId('equation')).toContainText('B=1');
    await page.getByRole('button', { name: 'Interceptor', exact: true }).click();
    await expect(page.getByTestId('mapping')).toHaveText('Configura una clave válida');
    await expect(canvas).toHaveAttribute('data-mapping', '');
    await expect(page.getByTestId('positions')).toContainText('sin posición');
    const bounds = await canvas.boundingBox();
    expect(bounds!.x).toBeGreaterThanOrEqual(300);
    expect(bounds!.x + bounds!.width).toBeLessThanOrEqual(size.width - 300);
    expect(
      await canvas.evaluate((c) => (c as HTMLCanvasElement).getContext('webgl2')!.getError()),
    ).toBe(0);
  }
});

test('MI-08 scene resources remain bounded across repeated label changes', async ({ page }) => {
  await page.goto('./');
  await page.getByRole('button', { name: 'Omitir introducción' }).click();
  await expect(page.getByText('Motor matemático listo')).toBeVisible();
  const canvas = page.locator('#machine canvas');
  await page.getByLabel('Algoritmo').selectOption('affine');
  await expect
    .poll(async () => Number(await canvas.getAttribute('data-textures')))
    .toBeGreaterThan(26);
  const textures = Number(await canvas.getAttribute('data-textures')),
    geometries = await canvas.getAttribute('data-geometries');
  for (const a of ['7', '9', '11', '15', '17', '19', '21', '23', '25', '5'])
    await page.getByLabel('a · Factor').fill(a);
  await expect.poll(() => canvas.getAttribute('data-textures')).toBe(String(textures));
  await expect(canvas).toHaveAttribute('data-geometries', geometries!);
});

test('AN-10/MI-08 destruction stops the renderer and removes delegated controls', async ({
  page,
}) => {
  await page.goto('./');
  await page.getByRole('button', { name: 'Omitir introducción' }).click();
  await expect(page.getByText('Motor matemático listo')).toBeVisible();
  const canvas = await page.locator('#machine canvas').elementHandle();
  await page.evaluate(() =>
    window.dispatchEvent(new PageTransitionEvent('pagehide', { persisted: false })),
  );
  const frames = await canvas!.getAttribute('data-frames');
  await page.waitForTimeout(150);
  expect(await canvas!.getAttribute('data-frames')).toBe(frames);
  await expect(page.locator('#app')).toBeEmpty();
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  let release!: () => void;
  const gate = new Promise<void>((resolve) => {
    release = resolve;
  });
  await page.route('**/*.wasm', async (route) => {
    await gate;
    await route.continue();
  });
  const requested = page.waitForRequest('**/*.wasm');
  await page.goto('./');
  await requested;
  await page.evaluate(() =>
    window.dispatchEvent(new PageTransitionEvent('pagehide', { persisted: false })),
  );
  const finished = page.waitForResponse('**/*.wasm');
  release();
  await (await finished).finished();
  await page.waitForTimeout(150);
  await expect(page.locator('#app')).toBeEmpty();
  expect(errors).toEqual([]);
});
