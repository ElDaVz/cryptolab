import { test, expect, type Page } from '@playwright/test';
async function tabTo(page: Page, selector: string) {
  for (let i = 0; i < 100; i++) {
    if (await page.evaluate((s) => document.activeElement?.matches(s) ?? false, selector)) return;
    await page.keyboard.press('Tab');
  }
  throw Error(`Keyboard cannot reach ${selector}`);
}
async function activate(page: Page, selector: string) {
  await tabTo(page, selector);
  await page.keyboard.press('Enter');
}
test('DE-05 actual keyboard-only introduction, ciphers, candidate, submit and traces', async ({
  page,
}) => {
  await page.goto('./');
  await expect(page.getByText('Motor matemático listo')).toBeVisible();
  for (let i = 0; i < 3; i++) await activate(page, '[data-action="intro-next"]');
  await activate(page, '[data-action="intro-close"]');
  await tabTo(page, '#message');
  await page.keyboard.insertText('ABC');
  await activate(page, 'form[data-form="sender"] button[type="submit"]');
  await expect(page.getByTestId('output')).toHaveText('IJK');
  await tabTo(page, '#algorithm');
  await page.keyboard.press('End');
  await page.keyboard.press('Enter');
  await activate(page, 'form[data-form="sender"] button[type="submit"]');
  await expect(page.getByTestId('output')).toHaveText('INS');
  await activate(page, '#right [data-action="internal"]');
  await expect(page.getByRole('heading', { name: 'Mecanismo interno' })).toBeFocused();
  await activate(page, '[data-action="next"]');
  await expect(page.getByTestId('equation')).toContainText('B=1');
  await activate(page, '#navigation [data-action="interceptor"]');
  await tabTo(page, '#source');
  await page.keyboard.press('End');
  await page.keyboard.press('Enter');
  await tabTo(page, '#a');
  await page.keyboard.insertText('7');
  await tabTo(page, '#b');
  await page.keyboard.insertText('3');
  await activate(page, 'form[data-form="candidate"] button[type="submit"]');
  await expect(page.getByTestId('output')).toHaveText('LACLAVEESTAENLOSDISCOS');
  await activate(page, '[data-action="submit"]');
  await expect(page.getByText('Resuelto', { exact: true })).toBeVisible();
});
