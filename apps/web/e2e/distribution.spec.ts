import { test, expect } from '@playwright/test';
test('WA-09/DE-10 production resources stay under the configured base with no console or network failures', async ({
  page,
  baseURL,
}) => {
  const failures: string[] = [];
  const paths: string[] = [];
  page.on('pageerror', (error) => failures.push(error.message));
  page.on('console', (message) => {
    if (message.type() === 'error') failures.push(message.text());
  });
  page.on('requestfailed', (request) =>
    failures.push(`${request.url()}: ${request.failure()?.errorText}`),
  );
  page.on('response', (response) => {
    if (response.status() >= 400) failures.push(`${response.status()} ${response.url()}`);
    const url = new URL(response.url());
    if (url.origin === new URL(baseURL!).origin) paths.push(url.pathname);
  });
  await page.goto('./');
  await expect(page.getByText('Motor matemático listo')).toBeVisible();
  await page.getByRole('button', { name: 'Omitir introducción' }).click();
  await page.getByLabel('Mensaje', { exact: true }).fill('ABC');
  await page.getByRole('button', { name: 'Ejecutar' }).click();
  await expect(page.getByTestId('output')).toHaveText('IJK');
  const base = new URL(baseURL!).pathname;
  expect(paths.some((path) => path.endsWith('.wasm'))).toBe(true);
  expect(paths.some((path) => path.endsWith('.js'))).toBe(true);
  expect(paths.every((path) => path.startsWith(base))).toBe(true);
  expect(paths.some((path) => path.includes('/src/') || path.includes('/@vite'))).toBe(false);
  expect(failures).toEqual([]);
});
